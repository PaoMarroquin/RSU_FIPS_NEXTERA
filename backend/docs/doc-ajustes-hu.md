# Ajustes de HUs — "Requiere ajuste" y "Sin iniciar" completados (Backend)

Este documento describe los cambios de backend para las HUs que estaban en
estado **"Requiere ajuste"** o **"Sin iniciar"** y se completaron junto con
el Sprint 8. Cubre: HU-03, HU-05, HU-06, HU-09, HU-11, HU-16 y ajustes
generales de la reunión con el cliente.

El contrato de API detallado está en:
- `ajustes-reunion-contrato-frontend.md` (HU-03, HU-05, HU-06, HU-16, usuarios)
- `cierre-de-proyecto-contrato-frontend.md` (HU-09, HU-11, constancia)
- `doc-sprint-8.md` (Sprint 8 completo con ejemplos de request/response)

---

## HU-03 — Gestión de Documentación Guía institucional (`Requiere ajuste`)

**Problema:** Los documentos de apoyo aceptaban Excel y PowerPoint además de
PDF y Word. La descripción no era obligatoria. El admin de Planificación
mostraba tablas de catalogación que el cliente no necesita.

**Cambios en el backend:**

- `apps/planificacion/models.py`: `DOCUMENTO_EXTENSIONS = ['pdf', 'doc', 'docx']`.
  El validador `FileExtensionValidator` solo acepta esos tres.
- `apps/planificacion/serializers.py`: `MatrizOperativaSerializer.validate_descripcion`
  exige que el campo no esté vacío.
- `apps/planificacion/admin.py`: limpio — solo quedan Documentos de apoyo,
  Ejes RSU, Sub-ítems de ejes, ODS y Periodos académicos. Las tablas de líneas
  estratégicas, objetivos e indicadores siguen existiendo en la base de datos
  (ProyectoRSU las usa) pero se quitaron del admin.
- Migración `planificacion/0012_documentos_de_apoyo_pdf_word`: actualiza el
  validador de extensiones y el `verbose_name` del modelo.

**Resultado:** Subir un Excel o PowerPoint al endpoint `/matrices/` responde
`400`. `nombre`, `descripcion` y `archivo` son obligatorios.

---

## HU-05 — Gestión de actividades y cronograma (`Requiere ajuste`)

**Problema:** Cronograma y actividades no tenían relación entre sí. La actividad
tenía campos de responsable, fecha y evidencia esperada que duplicaban los de
las acciones del cronograma.

**Cambios en el backend:**

- `apps/proyectos/models.py`:
  - `ActividadProyecto` pierde los campos `responsable`, `fecha` y `evidencia_esperada`.
    Ordenamiento cambia de `['fecha', 'id']` a `['orden', 'id']`.
  - `CronogramaAccion` gana `actividad` (FK nullable a `ActividadProyecto`) y
    `evidencia_esperada` (CharField).
- `apps/proyectos/serializers.py`:
  - `ActividadProyectoSerializer` ahora anida `acciones` (lista de
    `AccionAnidadaSerializer`). El create y update guardan las acciones dentro
    del bloque de su actividad.
  - `CronogramaAccionSerializer`: valida que `fecha_fin >= fecha_inicio`.
- `apps/proyectos/views.py`: `_validar_actividades_y_cronograma` exige que cada
  actividad tenga al menos una acción completa al enviar a revisión.
- Migraciones de datos (`0033_mover_datos_de_actividades`): mueve responsable,
  fecha y evidencia esperada de las actividades existentes a una acción de su
  bloque, para no perder datos en producción.

**Formato del JSON (crear/editar proyecto):**
```json
"actividades": [
  {
    "nombre": "Taller de reciclaje",
    "descripcion": "Capacitación a vecinos de Cayma",
    "orden": 1,
    "acciones": [
      {
        "descripcion": "Convocatoria",
        "fecha_inicio": "2026-04-01",
        "fecha_fin": "2026-04-05",
        "responsable": "Docente responsable",
        "evidencia_esperada": "Lista de inscritos"
      }
    ]
  }
]
```

---

## HU-06 — Evaluación de propuestas de proyectos (`Requiere ajuste`)

**Problema:** El código del proyecto se generaba automáticamente (incremental).
Las observaciones no se podían asociar a secciones específicas del formulario.
El comentario técnico solo se validaba como no vacío.

**Cambios en el backend:**

- `apps/proyectos/models.py`: `RevisionProyecto` gana `etapa`
  (`planificacion` / `finalizacion`) y `observaciones_secciones` (JSONField
  con las 9 secciones del formulario).
- `apps/proyectos/views.py`:
  - `ProyectoAprobarView`: exige `codigo` en el body (único entre proyectos).
    Ya no se genera código automático.
  - `ProyectoObservarView`: valida mínimo 15 caracteres en `comentario_tecnico`
    (CA-02). Acepta `observaciones_secciones` con las claves:
    `datos_generales`, `fundamentacion`, `diagnostico`, `objetivos`,
    `resultados`, `actividades`, `cronograma`, `recursos`, `financiamiento`.
    Cualquier otra clave responde `400`.
- `apps/proyectos/serializers.py`: `RevisionProyectoSerializer` expone
  `etapa` y `observaciones_secciones`.

**Resultado:** El Departamento debe enviar `{"codigo": "RSU-FIPS-2026-015"}`
al aprobar. Al observar puede indicar qué sección del formulario tiene el
problema, para que el docente sepa exactamente dónde corregir.

---

## HU-09 — Revisión y aprobación de Finalización (`Requiere ajuste`)

**Problema anterior:** Departamento y Jefatura cerraban el proyecto
directamente en cuanto llegaba al 100%, sin informe del docente. Jefatura
podía finalizar proyectos.

**Flujo nuevo (ver `doc-sprint-8.md` para el contrato completo):**

1. Al llegar al 100%, se avisa **al docente** (antes se avisaba a Departamento
   y Jefatura).
2. El docente completa y envía el Informe de Finalización.
3. El Departamento lo aprueba (proyecto → `finalizado`) u observa.
4. **Jefatura RSU ya no puede finalizar** proyectos.

**Cambios clave en el código:**
- `apps/proyectos/views.py`: `_notificar_listo_para_cerrar` ahora notifica
  solo al docente responsable (antes notificaba a Departamento y Jefatura).
- `ProyectoFinalizarView` se movió a `views_finalizacion.py` y ahora exige
  que el `InformeFinalizacion` esté en estado `enviado`.
- `ProyectosParaFinalizarView` filtra por `informe_finalizacion__estado='enviado'`
  en vez de `estado='aprobado'` y porcentaje 100.
- Jefatura RSU pierde permiso sobre `ProyectoFinalizarView`.

---

## HU-11 — Consulta de Informes del Proyecto (`Sin iniciar`)

**Qué faltaba:** El docente no tenía endpoints para ver el Informe de
Finalización ni descargar la Constancia.

**Implementado:**

| Acción | Endpoint |
|---|---|
| Ver informe de planificación (PDF) | `GET /proyectos/<id>/informe/pdf/` (ya existía) |
| Ver informe de finalización | `GET /proyectos/<id>/informe-finalizacion/` |
| Descargar informe PDF | `GET /proyectos/<id>/informe-finalizacion/pdf/` |
| Descargar constancia PDF | `GET /proyectos/<id>/constancia/pdf/` (solo si `constancia_aprobada=true`) |

---

## HU-16 — Visualización de avance de actividades (`Requiere ajuste`)

**Problema:** No había un endpoint unificado que devolviera el avance por
actividad. El frontend tenía que encadenar llamadas: lista de actividades →
avances de cada actividad → evidencias de cada avance.

**Implementado:**

```
GET /proyectos/<id>/seguimiento/
Authorization: Bearer <token>
```

Respuesta (resumen):
```json
{
  "proyecto_id": 12,
  "titulo": "...",
  "porcentaje_ejecucion": 75.0,
  "actividades": [
    {
      "id": 4,
      "nombre": "Taller de reciclaje",
      "estado": "completada",
      "acciones": [...],
      "avances": [
        {
          "id": 10,
          "descripcion": "Se realizó el taller",
          "fecha_registro": "2026-05-10",
          "evidencias": [
            {
              "tipo": "archivo",
              "archivo": "https://.../media/evidencias/foto.jpg",
              "observacion": "Foto del taller"
            }
          ]
        }
      ]
    }
  ]
}
```

Acceso: docente (propio proyecto), Departamento (alcance), Jefatura RSU
(toda la facultad), Administrador (todo). Jefatura y Departamento: solo
lectura. Implementado en `apps/proyectos/services_finalizacion.py` →
`seguimiento_proyecto()`.

---

## Ajustes generales de la reunión con el cliente

### Mis actividades: evidencia en un solo paso

```
POST /proyectos/<id>/actividades/<actividad_id>/evidencia/
Content-Type: multipart/form-data
  archivo: <PDF/JPG/JPEG/PNG, máx 10 MB>    ← uno de los dos
  enlace_drive: https://drive.google.com/... ←
  observacion: texto opcional
```

En un solo paso: registra el avance, marca la actividad como `completada`,
pasa el proyecto a `en_ejecucion` si es la primera actividad completada, y
recalcula `porcentaje_ejecucion`. Responde `201` con el avance y el porcentaje
actualizado. Los botones "Iniciar" y "Reiniciar" ya no tienen función.

### Sin números negativos

`nro_docentes`, `nro_estudiantes`, los seis `rec_hum_*`, `linea_base`,
`valor_meta`, `valor_alcanzado`, `cantidad`, `costo_unitario`,
`monto_ejecutado` y `monto` responden `400` si son negativos.

### Docentes participantes por nombre

```json
{
  "nro_docentes": 2,
  "docentes_participantes": ["Ana Pérez", "Luis Quispe"],
  "observacion_estudiantes": "Estudiantes de 3er año de la EPIS."
}
```

Al enviar a revisión, `docentes_participantes` debe tener tantos nombres como
`nro_docentes`.

### Semestre académico → se deriva del periodo

`semestre_academico` es de solo lectura: se copia del nombre del periodo
seleccionado. El frontend solo envía `periodo` (id del select).

### Edición bloqueada en ejecución

Presupuesto, fuentes, metas, actividades y cronograma solo son editables
en estado `borrador` u `observado`. En `en_ejecucion` o `finalizado`
responden `400`.

### Validación completa al enviar a revisión

`POST /proyectos/<id>/revisar/` exige todos los campos del ANEXO 4,
incluyendo: periodo, diag_justificacion_intervencion, obj_mejora_curricular,
los cinco `rec_mat_*`, fecha_evaluacion_avance, tres fechas de encuesta,
nombres de docentes, al menos un recurso humano, al menos una fuente de
financiamiento, y cada actividad con al menos una acción completa.

### Usuarios

| Endpoint | Qué hace |
|---|---|
| `POST /usuarios/` | `password` opcional: si no se envía, la inicial es el correo institucional |
| `POST /usuarios/me/cambiar-password/` | `{"password_actual": "...", "password_nueva": "..."}` (mínimo 8 caracteres) |
| `GET /usuarios/estadisticas/` | Solo Administrador: total, activos, inactivos, por rol |

### Repositorio histórico

Quitado el filtro `anio` y la lista `anios` de `/repositorio/filtros/`.
Para filtrar por semestre se usa `periodo`.

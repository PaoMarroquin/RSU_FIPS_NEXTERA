# Sprint 8 — Informe de Finalización y Constancia (Backend)

Tareas: **T-137, T-138, T-139, T-141, T-142, T-143, T-144, T-145, T-146, T-147**
HUs involucradas: **HU-08** (Informe de Finalización del docente), **HU-09** (Revisión de finalización por Departamento), **HU-10** (Constancia de finalización)

---

## 1. Qué se implementó

### Modelo nuevo: `InformeFinalizacion`

Tabla `informe_finalizacion` (migración `proyectos/0032`). Guarda el estado del proceso de cierre de cada proyecto:

| Campo | Tipo | Descripción |
|---|---|---|
| `proyecto` | OneToOne → ProyectoRSU | Proyecto al que pertenece |
| `estado` | varchar | `borrador` / `enviado` / `observado` / `aprobado` |
| `fecha_envio` | datetime | Cuándo lo envió el docente |
| `fecha_aprobacion` | datetime | Cuándo lo aprobó el Departamento |
| `constancia_aprobada` | boolean | Si el Departamento aprobó la constancia |
| `constancia_aprobada_en` | datetime | Fecha de aprobación de la constancia |
| `constancia_aprobada_por` | FK → Usuario | Quién aprobó la constancia |

Los textos del informe (`conclusiones`, `recomendaciones`, `lecciones_aprendidas`, `medio_difusion`) siguen en `ProyectoRSU` porque el Repositorio Histórico ya los usa.

### Archivos nuevos

| Archivo | Rol |
|---|---|
| `apps/proyectos/views_finalizacion.py` | Todas las vistas del flujo de cierre |
| `apps/proyectos/services_finalizacion.py` | Consultas: seguimiento, datos del informe, campos pendientes |
| `apps/proyectos/exports_finalizacion.py` | Generación de PDF (informe y constancia con ReportLab) |
| `apps/proyectos/migrations/0032_...` | Schema: InformeFinalizacion, acciones por actividad, notificaciones |
| `apps/proyectos/migrations/0033_...` | Datos: migra evidencias/responsables/fechas antiguas |
| `apps/proyectos/migrations/0034_...` | Quita campos obsoletos de ActividadProyecto |

### Flujo de cierre (máquina de estados)

```
Proyecto en_ejecucion → 100% actividades completadas
    → Notificación al docente: "puedes completar tu Informe de Finalización"

Docente:
    PATCH /proyectos/<id>/informe-finalizacion/   ← completa textos, valores alcanzados, montos ejecutados
    POST  /proyectos/<id>/informe-finalizacion/enviar/   ← lo envía al Departamento

Departamento:
    GET   /proyectos/para-finalizar/              ← lista informes enviados
    GET   /proyectos/<id>/informe-finalizacion/   ← lee el informe
    GET   /proyectos/<id>/informe-finalizacion/pdf/   ← descarga PDF

    [opción A] POST /proyectos/<id>/finalizar/    ← aprueba → proyecto = "finalizado", genera constancia
    [opción B] POST /proyectos/<id>/informe-finalizacion/observar/   ← observa → docente corrige y reenvía

Departamento (constancia):
    GET   /constancias/                           ← lista proyectos finalizados con estado de constancia
    GET   /proyectos/<id>/constancia/pdf/         ← ve la constancia
    POST  /proyectos/<id>/constancia/aprobar/     ← la deja disponible para el docente

Docente (constancia):
    GET   /proyectos/<id>/constancia/pdf/         ← solo disponible después de que el Departamento la apruebe
```

**Jefatura RSU ya no puede finalizar** proyectos (pedido del cliente). Solo hace seguimiento de lectura.

---

## 2. Contrato de API — Sprint 8

### T-137 / T-138: Consulta del informe

```
GET /proyectos/<id>/informe-finalizacion/
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "proyecto_id": 12,
  "codigo": "RSU-FIPS-2026-015",
  "titulo": "Proyecto de reciclaje Cayma",
  "estado": "en_ejecucion",
  "porcentaje_ejecucion": 100.0,
  "finalizacion": {
    "habilitado": true,
    "estado": "borrador",
    "campos_pendientes": ["conclusiones", "recomendaciones"]
  },
  "datos_proyecto": {
    "periodo": "2026-I",
    "fecha_inicio": "2026-03-01",
    "fecha_termino": "2026-07-31",
    "lugar_ejecucion": "...",
    "nro_beneficiarios": 80,
    "eje_rsu": "Compromiso Social"
  },
  "docentes_participantes": ["Ana Pérez", "Luis Quispe"],
  "actividades": [
    {
      "id": 4,
      "nombre": "Taller de reciclaje",
      "estado": "completada",
      "avances": [
        {
          "id": 10,
          "descripcion": "Se realizó el taller",
          "fecha_registro": "2026-05-10",
          "evidencias": [
            {"tipo": "archivo", "archivo": "https://.../media/evidencias/foto.jpg"}
          ]
        }
      ]
    }
  ],
  "metas_indicadores": [
    {"id": 1, "descripcion": "Reducir residuos", "linea_base": 100, "valor_meta": 60, "valor_alcanzado": null}
  ],
  "partidas_presupuesto": [
    {"id": 3, "partida": "Materiales", "monto": "500.00", "monto_ejecutado": null}
  ],
  "textos": {
    "conclusiones": "",
    "recomendaciones": "",
    "lecciones_aprendidas": "",
    "medio_difusion": ""
  },
  "revisiones_finalizacion": []
}
```

`finalizacion.habilitado = true` cuando el proyecto está en ejecución al 100%.
`campos_pendientes` lista los textos que faltan completar.

---

### T-139: Elaboración del informe (docente)

```
PATCH /proyectos/<id>/informe-finalizacion/
Authorization: Bearer <token>
Content-Type: application/json

{
  "conclusiones": "Se logró reducir el 40% de residuos sólidos.",
  "recomendaciones": "Ampliar el programa a otros distritos.",
  "lecciones_aprendidas": "La participación vecinal fue clave.",
  "medio_difusion": "Redes sociales y boletín de la UNSA.",
  "metas": [
    {"id": 1, "valor_alcanzado": 60}
  ],
  "partidas": [
    {"id": 3, "monto_ejecutado": 480.50}
  ]
}
```

Todos los campos son opcionales en cada PATCH; se puede guardar parcialmente. Responde el informe completo actualizado (mismo formato que el GET).

```
POST /proyectos/<id>/informe-finalizacion/enviar/
Authorization: Bearer <token>
```

Si hay `campos_pendientes` responde `400` con la lista. Si está completo, cambia estado a `enviado` y notifica al Departamento.

---

### T-141: Visualización y gestión (Departamento)

**Bandeja de informes enviados:**
```
GET /proyectos/para-finalizar/
Authorization: Bearer <token>   (rol Departamento)
```
Devuelve lista de proyectos con `informe_finalizacion__estado = 'enviado'`, en el alcance del Departamento.

**Aprobar informe → finaliza el proyecto:**
```
POST /proyectos/<id>/finalizar/
Authorization: Bearer <token>   (rol Departamento)
Content-Type: application/json

{ "comentario": "Informe aprobado." }   (comentario opcional)
```
Responde `{"detail": "Proyecto finalizado exitosamente."}`.
El proyecto pasa a `finalizado`, se crea la constancia pendiente de aprobación.

**Observar informe → devuelve al docente:**
```
POST /proyectos/<id>/informe-finalizacion/observar/
Authorization: Bearer <token>   (rol Departamento)
Content-Type: application/json

{ "comentario": "Falta completar las lecciones aprendidas con más detalle." }
```
El comentario es **obligatorio** (mínimo 15 caracteres). El informe vuelve a `observado` y el docente recibe notificación.

**PDF del informe:**
```
GET /proyectos/<id>/informe-finalizacion/pdf/
Authorization: Bearer <token>
```
Descarga `informe-finalizacion-<codigo>.pdf`.

---

### HU-10: Constancia

**Lista de constancias (Departamento):**
```
GET /constancias/
Authorization: Bearer <token>   (rol Departamento)
```
```json
[
  {
    "proyecto_id": 12,
    "codigo": "RSU-FIPS-2026-015",
    "titulo": "Proyecto de reciclaje Cayma",
    "docente": "Ana Pérez",
    "fecha_cierre": "2026-07-15T10:30:00Z",
    "constancia_aprobada": false,
    "constancia_aprobada_en": null
  }
]
```

**Ver PDF de la constancia:**
```
GET /proyectos/<id>/constancia/pdf/
Authorization: Bearer <token>
```
Departamento y Administrador: siempre disponible después de finalizar.
Docente: solo si `constancia_aprobada = true`.

**Aprobar constancia:**
```
POST /proyectos/<id>/constancia/aprobar/
Authorization: Bearer <token>   (rol Departamento)
```
Responde `{"detail": "Constancia aprobada."}` y notifica al docente.

---

## 3. Acceso por rol

| Endpoint | Docente | Departamento | Jefatura | Admin |
|---|---|---|---|---|
| GET informe-finalizacion | ✓ (propio) | ✓ (alcance) | ✓ lectura | ✓ |
| PATCH informe-finalizacion | ✓ (propio) | ✗ | ✗ | ✗ |
| POST enviar | ✓ (propio) | ✗ | ✗ | ✗ |
| GET para-finalizar | ✗ | ✓ | ✗ | ✓ |
| POST finalizar | ✗ | ✓ | ✗ | ✓ |
| POST observar | ✗ | ✓ | ✗ | ✓ |
| GET/POST constancia | ✓ (solo si aprobada) | ✓ | ✗ | ✓ |
| GET seguimiento | ✓ (propio) | ✓ | ✓ | ✓ |

---

## 4. Cambios en la base de datos (migraciones Sprint 8)

```
python manage.py migrate
```

| Migración | Qué hace |
|---|---|
| `proyectos/0032_cronograma_por_actividad_y_finalizacion` | Tabla `informe_finalizacion`; `CronogramaAccion.actividad` y `evidencia_esperada`; campos `docentes_participantes`, `observacion_estudiantes` en ProyectoRSU; `etapa` y `observaciones_secciones` en RevisionProyecto; tipos de notificación nuevos |
| `proyectos/0033_mover_datos_de_actividades` | Migración de datos: mueve responsable/fecha/evidencia de actividades a acciones; evidencias antiguas a AvanceActividad+EvidenciaAvance |
| `proyectos/0034_quitar_campos_movidos_de_actividad` | Elimina campos ya migrados de ActividadProyecto |
| `planificacion/0012_documentos_de_apoyo_pdf_word` | Documentos de apoyo: solo PDF/Word |

---

## 5. Notas para el despliegue

- El PDF de constancia es **formato provisional**; el cliente definirá el oficial.
- Backend y frontend deben subir juntos: con backend nuevo y frontend actual, el docente no podría enviar a revisión ni completar actividades.
- Ejecutar `migrate` antes de arrancar el servidor.
- Pruebas: **151 tests pasan en SQLite**. Pendiente: correr en PostgreSQL (Docker no respondió en esta sesión).

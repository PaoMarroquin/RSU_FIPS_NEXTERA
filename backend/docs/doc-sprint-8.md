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

**Respuesta (200)** (resumida: en las listas se muestra un solo elemento):
```json
{
  "id": 12,
  "codigo": "RSU-FIPS-2026-015",
  "titulo": "Proyecto de reciclaje Cayma",
  "estado": "en_ejecucion",
  "estado_display": "En Ejecución",
  "semestre_academico": "2026-I",
  "periodo": {"id": 1, "nombre": "2026-I"},
  "facultad": {"id": 1, "nombre": "Ingeniería de Producción y Servicios"},
  "departamento": {"id": 1, "nombre": "..."},
  "ejes_rsu": [{"id": 4, "nombre": "Extensión"}],
  "docente_responsable": "Ana Pérez",
  "fecha_inicio": "2026-03-01",
  "fecha_termino": "2026-07-31",
  "fecha_cierre": null,

  "finalizacion": {
    "estado": "borrador",
    "estado_display": "Borrador",
    "habilitado": true,
    "editable": true,
    "campos_pendientes": ["conclusiones", "metas_valor_alcanzado"],
    "metas_sin_valor_alcanzado": [1],
    "fecha_envio": null,
    "fecha_aprobacion": null,
    "constancia_aprobada": false
  },

  "informe_final": {
    "conclusiones": "",
    "recomendaciones": "",
    "lecciones_aprendidas": "",
    "medio_difusion": "",
    "completo": false,
    "campos_pendientes": ["conclusiones"]
  },

  "resultados_esperados": {"en_beneficiarios": "...", "en_curriculo": "...", "impacto_esperado": "..."},

  "resultados_alcanzados": {
    "avance": {"porcentaje_ejecucion": 100.0, "actividades_total": 2, "actividades_completadas": 2, "...": "..."},
    "metas": {"total": 1, "cumplidas": 0, "sin_medir": 1, "porcentaje_cumplimiento": 0.0},
    "presupuesto": {"monto_presupuestado": 800.0, "monto_ejecutado": 0.0, "saldo_por_ejecutar": 800.0, "...": "..."},
    "detalle_metas": [
      {"id": 1, "meta": "Reducir residuos", "indicador": "Kg separados", "linea_base": 100.0,
       "valor_meta": 60.0, "valor_alcanzado": null, "porcentaje_avance": null}
    ]
  },

  "presupuesto_detalle": [
    {"id": 3, "descripcion": "Materiales", "categoria": "Otros", "cantidad": 1,
     "costo_unitario": 800.0, "monto_presupuestado": 800.0, "monto_ejecutado": 0.0}
  ],

  "observaciones": [
    {"id": 2, "decision": "observado", "comentario": "...", "revisor": "...", "created_at": "..."}
  ],

  "ejecucion": {
    "porcentaje_ejecucion": 100.0,
    "actividades_total": 2,
    "actividades_completadas": 2,
    "actividades": [
      {
        "id": 4, "nombre": "Taller de reciclaje", "estado": "completada", "completada": true,
        "acciones": [{"id": 7, "descripcion": "...", "fecha_inicio": "...", "fecha_fin": "...",
                      "responsable": "...", "evidencia_esperada": "..."}],
        "avances": [{"id": 10, "descripcion": "Se realizó el taller", "autor": "...", "created_at": "..."}],
        "evidencias": [{"id": 5, "tipo": "archivo", "nombre": "foto.jpg", "url": "https://.../media/...", "uploaded_at": "..."}]
      }
    ]
  }
}
```

Dónde está cada dato:

| Dato | Clave |
|---|---|
| Estado del informe y si se puede editar | `finalizacion.estado`, `finalizacion.habilitado`, `finalizacion.editable` |
| Textos (conclusiones, etc.) | `informe_final.conclusiones`, `.recomendaciones`, `.lecciones_aprendidas`, `.medio_difusion` |
| Metas (y su `id` para el PATCH) | `resultados_alcanzados.detalle_metas[]` |
| Partidas (y su `id` para el PATCH) | `presupuesto_detalle[]` |
| Actividades, avances y evidencias | `ejecucion.actividades[]` |
| Comentarios del Departamento | `observaciones[]` |

- `finalizacion.habilitado = true` cuando el proyecto está en ejecución (o aprobado) y **todas sus actividades están completadas**; se cuenta con las actividades reales.
- `finalizacion.editable = true` solo si además el informe está en `borrador` u `observado`. La pantalla debe usar este valor para habilitar o bloquear el formulario.
- `campos_pendientes` lista lo que falta para poder enviar.
- Si la pantalla necesita datos del proyecto que no están aquí (docentes adicionales, fuentes de financiamiento, etc.), los toma de `GET /proyectos/<id>/`, que además trae `informe_finalizacion_estado`.

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

El body es opcional. Si se envía, acepta lo mismo que el PATCH (textos, `metas`, `partidas`): se guarda y se envía en una sola operación, y si algo falla no queda nada guardado.

Si hay `campos_pendientes` responde `400` con la lista. Si está completo, cambia estado a `enviado` y notifica al Departamento.

Si el proyecto ya está finalizado, el PATCH y el envío responden `400`: "El proyecto ya está finalizado: su Informe de Finalización ya no se puede modificar".

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
- Pruebas: los tests del backend pasan en SQLite y en PostgreSQL (Docker).

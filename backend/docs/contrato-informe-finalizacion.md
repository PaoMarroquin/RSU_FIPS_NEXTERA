# Contrato — Informe de Finalización (formato OURS DS-PM03.02-01)

Base: `/api/v1`. Todas las rutas requieren `Authorization: Bearer <token>`.
Errores con el formato de toda la API: `{"error", "detail", "errors"}`.

## 1. Rutas

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/proyectos/<id>/informe-finalizacion/` | Docente, Departamento, Jefatura, Admin | Leer el informe (datos del sistema + lo que llena el docente) |
| PATCH | `/proyectos/<id>/informe-finalizacion/` | Docente responsable | Guardar (parcial) |
| POST | `/proyectos/<id>/informe-finalizacion/enviar/` | Docente responsable | Enviar al Departamento (body opcional = guardar y enviar en un paso) |
| POST | `/proyectos/<id>/informe-finalizacion/observar/` | Departamento | Devolver con comentario (mín. 15 caracteres) |
| POST | `/proyectos/<id>/finalizar/` | Departamento | Aprobar: el proyecto pasa a `finalizado` |
| GET | `/proyectos/<id>/informe-finalizacion/pdf/` | Todos los que ven el proyecto | PDF con el formato oficial |

## 2. Campos que llena el docente (PATCH y enviar)

| Sección del formato | Campo | Tipo |
|---|---|---|
| II. Fortalezas y limitaciones | `fortalezas` | texto |
| | `oportunidades` | texto |
| | `aliados` (principales aliados) | texto |
| | `debilidades` | texto |
| | `amenazas` | texto |
| | `estrategias` (estrategias empleadas para superar limitaciones) | texto |
| III. Resultados | `resultado_grupo_destinatario` | texto |
| | `resultado_desarrollo_curricular` | texto |
| IV. Lecciones aprendidas | `lecciones_analisis` | texto |
| | `lecciones_reflexiones` | texto |
| V. Conclusiones | `conclusiones` | texto |
| VI. Recomendaciones | `recomendaciones` | texto |
| X. Medio de difusión | `medio_difusion` | texto (máx. 200) |
| Metas | `metas: [{"id": <meta_id>, "valor_alcanzado": <número>}]` | lista |
| IX. Financiamiento | `partidas: [{"id": <partida_id>, "monto_ejecutado": <número>}]` | lista (opcional) |

- Todos los textos son **obligatorios para enviar** (se acepta `"n/a"`), igual que el `valor_alcanzado` de cada meta.
- En el PATCH todo es opcional: se puede guardar por partes.
- No se aceptan valores negativos en metas ni partidas.
- `lecciones_aprendidas` no se envía: el backend lo arma con `lecciones_analisis` + `lecciones_reflexiones` (lo usa el repositorio histórico).

Ejemplo de PATCH:
```json
{
  "fortalezas": "Docentes y estudiantes comprometidos.",
  "oportunidades": "Interés de la municipalidad.",
  "aliados": "Municipalidad de Cayma.",
  "debilidades": "Poco tiempo de los estudiantes.",
  "amenazas": "Feriados no previstos.",
  "estrategias": "Se reprogramaron los talleres.",
  "resultado_grupo_destinatario": "312 escolares capacitados.",
  "resultado_desarrollo_curricular": "Casos reales en Gestión de Proyectos.",
  "lecciones_analisis": "La coordinación temprana superó los cambios de horario.",
  "lecciones_reflexiones": "Experiencia valiosa para todos.",
  "conclusiones": "Se cumplió el objetivo.",
  "recomendaciones": "Ampliar a otros colegios.",
  "medio_difusion": "Facebook de la FIPS y boletín RSU.",
  "metas": [{"id": 17, "valor_alcanzado": 312}],
  "partidas": [{"id": 15, "monto_ejecutado": 430}]
}
```
Responde `200` con el informe completo (mismo formato que el GET).

## 3. Respuesta del GET (claves principales)

```json
{
  "id": 39, "codigo": "RSU-FIPS-2026-021", "titulo": "...", "estado": "en_ejecucion",
  "docente_responsable": "Rosa Elena Pacheco Valdivia",
  "periodo": {"id": 1, "nombre": "Anual 2026"},
  "facultad": {"id": 1, "nombre": "..."}, "departamento": {"id": 1, "nombre": "..."},
  "ejes_rsu": [{"id": 4, "nombre": "Extensión"}], "ods": [...],
  "fecha_inicio": "2026-04-01", "fecha_termino": "2026-11-30",

  "finalizacion": {
    "estado": "borrador",
    "habilitado": true,
    "editable": true,
    "campos_pendientes": ["fortalezas", "conclusiones", "metas_valor_alcanzado"],
    "metas_sin_valor_alcanzado": [17],
    "fecha_envio": null, "fecha_aprobacion": null, "constancia_aprobada": false
  },

  "informe_final": {
    "fortalezas": "", "oportunidades": "", "aliados": "",
    "debilidades": "", "amenazas": "", "estrategias": "",
    "resultado_grupo_destinatario": "", "resultado_desarrollo_curricular": "",
    "lecciones_analisis": "", "lecciones_reflexiones": "",
    "conclusiones": "", "recomendaciones": "", "medio_difusion": "",
    "lecciones_aprendidas": "",
    "completo": false, "campos_pendientes": [...]
  },

  "resultados_esperados": {"en_beneficiarios": "...", "en_curriculo": "..."},
  "resultados_alcanzados": {
    "avance": {"porcentaje_ejecucion": 100.0, "actividades_total": 3, "actividades_completadas": 3},
    "detalle_metas": [{"id": 17, "meta": "...", "indicador": "...", "valor_meta": 300.0, "valor_alcanzado": null}]
  },
  "presupuesto_detalle": [
    {"id": 15, "descripcion": "...", "monto_presupuestado": 450.0, "monto_ejecutado": 430.0}
  ],
  "recursos": {
    "humanos": {"docentes": 2, "administrativos": 0, "estudiantes": 18, "egresados": 0, "voluntarios": 4, "otros": 0},
    "materiales": {"material_didactico": "...", "afiches": "...", "equipos": "...", "utiles": "...", "otros": "..."}
  },
  "ejecucion": {
    "actividades": [
      {"id": 4, "nombre": "...", "estado": "completada",
       "acciones": [{"id": 7, "descripcion": "...", "fecha_inicio": "...", "fecha_fin": "..."}],
       "evidencias": [{"id": 5, "tipo": "archivo", "nombre": "...", "url": "https://..."}]}
    ]
  },
  "observaciones": [{"id": 2, "decision": "observado", "comentario": "...", "revisor": "...", "created_at": "..."}]
}
```

Dónde está cada dato:

| En la pantalla | Clave |
|---|---|
| Si se puede editar el formulario | `finalizacion.editable` |
| Qué falta para enviar | `finalizacion.campos_pendientes` |
| Textos que llena el docente (II a VI y X) | `informe_final.*` |
| Metas e `id` para el PATCH | `resultados_alcanzados.detalle_metas[]` |
| Partidas e `id` para el PATCH | `presupuesto_detalle[]` |
| Recursos (VIII) | `recursos` |
| Cronología (VII) y evidencias (XI) | `ejecucion.actividades[]` (`acciones`, `evidencias`) |
| Comentarios del Departamento | `observaciones[]` |

## 4. Reglas

- `habilitado = true` cuando el proyecto está aprobado o en ejecución y **todas sus actividades están completadas**.
- `editable = true` solo si además el informe está en `borrador` u `observado`. Usar este valor para habilitar o bloquear el formulario.
- Flujo: `borrador` → `enviado` → (`observado` → `enviado`) → `aprobado` (el proyecto pasa a `finalizado`).
- Errores frecuentes (`400`):
  - Enviar con datos faltantes: `errors.campos_pendientes` con la lista de campos.
  - Editar un informe enviado o aprobado: "El informe está \"…\" y no se puede modificar."
  - Editar un proyecto finalizado: "El proyecto ya está finalizado: su Informe de Finalización ya no se puede modificar."
  - Proyecto que aún no llega al 100 %: "El Informe de Finalización se habilita cuando…".

## 5. PDF

`GET /proyectos/<id>/informe-finalizacion/pdf/` devuelve el Informe de Ejecución con el formato oficial: encabezado DS-PM03.02-01 (logo, código, versión, página N de M), A / DE / ASUNTO / FECHA, secciones I a XI y la firma digital del docente. Los datos generales (I), la cronología (VII), los recursos (VIII), el financiamiento (IX) y las evidencias (XI) salen solos de la planificación y la ejecución.

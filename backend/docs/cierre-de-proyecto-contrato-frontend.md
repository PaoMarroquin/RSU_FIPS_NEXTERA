# Finalización de proyecto - contrato para el frontend

HU-09 (Revisión y aprobación de Finalización), Sprint 8 (T-137 a T-141:
Informe de Finalización) y la Constancia de Finalización.

> **Cambio respecto a la versión anterior de este documento:** el cierre ya no
> lo hace Departamento/Jefatura directamente con el informe en el body de
> `/finalizar/`. Ahora el **docente** completa y envía el Informe de
> Finalización, y el **Departamento** lo aprueba (marca Finalizado) u observa.
> **Jefatura RSU ya no finaliza proyectos ni aprueba constancias** (pedido del
> cliente); solo hace seguimiento en lectura.

Base: `/api/v1/` · Autenticación: `Authorization: Bearer <token>`.

## 1. El flujo completo

```
Docente sube la última evidencia  ->  porcentaje_ejecucion = 100
        │  (notificación al docente, tipo "listo_para_cerrar")
        ▼
Docente abre su Informe de Finalización (GET), completa lo que falta (PATCH)
y lo envía (POST .../enviar/)
        │  (notificación al Departamento, tipo "informe_finalizacion_enviado")
        ▼
Departamento lo ve en "Proyectos por finalizar" (GET /proyectos/para-finalizar/)
        │
        ├── Observa con comentario (POST .../observar/)
        │       (notificación al docente, "informe_finalizacion_observado")
        │       → el docente corrige (PATCH) y vuelve a enviar
        │
        └── Aprueba (POST /proyectos/<id>/finalizar/)
                → proyecto 'finalizado', entra al Repositorio Histórico
                → se genera la constancia (solo la ve el Departamento)
                        │
                        ▼
                Departamento aprueba la constancia (POST .../constancia/aprobar/)
                        (notificación al docente, "constancia_disponible")
                        → el docente la descarga desde Informes
```

Estados del informe (`finalizacion.estado`): `null` (no iniciado) ·
`borrador` · `enviado` · `observado` · `aprobado`. El estado del proyecto sigue
siendo `en_ejecucion` hasta que el Departamento aprueba; ahí pasa a
`finalizado`. En los listados de proyectos vienen dos campos nuevos para pintar
esto sin pedir el informe: `informe_finalizacion_estado` y `constancia_aprobada`.

## 2. Informe de Finalización (docente)

### `GET /proyectos/<id>/informe-finalizacion/`

Lo pueden ver el docente y, en lectura, Departamento, Jefatura y Administrador
(cada uno en su alcance). Trae los datos de la planificación ya cargados:

```jsonc
{
  "id": 7, "codigo": "RSU-FIPS-2026-015", "titulo": "...",   // cabecera
  "resultados_esperados": {"en_beneficiarios": "...", "en_curriculo": "..."},
  "resultados_alcanzados": {
    "avance": {...}, "metas": {...}, "presupuesto": {...},
    "detalle_metas": [{"id": 3, "meta": "...", "indicador": "...",
                       "linea_base": 0, "valor_meta": 50, "valor_alcanzado": null, ...}]
  },
  "informe_final": {"conclusiones": null, "recomendaciones": null,
                    "lecciones_aprendidas": null, "medio_difusion": null, ...},
  "presupuesto_detalle": [{"id": 9, "descripcion": "...", "monto_presupuestado": 50.0,
                           "monto_ejecutado": 0.0, ...}],
  "ejecucion": { ... mismo formato que /seguimiento/ ... },
  "observaciones": [{"decision": "observado", "comentario": "...", "revisor": "...",
                     "created_at": "..."}],
  "finalizacion": {
    "estado": null, "estado_display": null,
    "habilitado": true,          // en ejecución y al 100%
    "editable": true,            // habilitado y en null/borrador/observado
    "campos_pendientes": ["conclusiones", "recomendaciones",
                          "lecciones_aprendidas", "medio_difusion",
                          "metas_valor_alcanzado"],
    "metas_sin_valor_alcanzado": [3],
    "fecha_envio": null, "fecha_aprobacion": null, "constancia_aprobada": false
  }
}
```

Mostrar la sección "Finalización de proyecto" solo cuando
`finalizacion.habilitado` sea `true`, y los campos editables solo si
`finalizacion.editable` es `true`.

### `PATCH /proyectos/<id>/informe-finalizacion/`

Solo el docente responsable, con el proyecto en ejecución al 100% y el informe
en borrador u observado. Todo es opcional; se guarda solo lo que llega.

```json
{
  "conclusiones": "Se cumplieron los objetivos.",
  "recomendaciones": "Replicar en otro distrito.",
  "lecciones_aprendidas": "Coordinar antes con la comunidad.",
  "medio_difusion": "n/a",
  "metas":    [{"id": 3, "valor_alcanzado": 45}],
  "partidas": [{"id": 9, "monto_ejecutado": 48.5}]
}
```

- Los textos admiten "n/a" si no aplican, pero no pueden quedar vacíos al enviar.
- `medio_difusion` admite hasta 200 caracteres.
- `metas[].id` y `partidas[].id` salen del GET; deben ser del mismo proyecto.
- No se aceptan valores negativos (400).
- Responde el informe completo actualizado (mismo formato del GET).

### `POST /proyectos/<id>/informe-finalizacion/enviar/`

Sin body. Si falta algo responde `400` con
`errors.campos_pendientes`. Si todo está completo, pasa a `enviado` y avisa al
Departamento del proyecto.

### `GET /proyectos/<id>/informe-finalizacion/pdf/`

Descarga el informe en PDF (para la pantalla Informes del docente y para el
"ojito" del Departamento en Proyectos por finalizar).

## 3. Revisión del Departamento

| Endpoint | Quién | Qué hace |
|---|---|---|
| `GET /proyectos/para-finalizar/` | Departamento, Admin | Proyectos con informe **enviado** de su departamento (paginado, ficha estándar de proyecto) |
| `POST /proyectos/<id>/informe-finalizacion/observar/` | Departamento, Admin | Body `{"comentario": "..."}` (mínimo 15 caracteres). Vuelve al docente |
| `POST /proyectos/<id>/finalizar/` | Departamento, Admin | Aprueba el informe. Body opcional `{"comentario": "..."}`. Proyecto → `finalizado` |

En "Proyectos por finalizar", el "ojito" debe abrir el **Informe de
Finalización** (GET o PDF de arriba), ya no el informe de planificación.

Jefatura RSU recibe `403` en estos tres endpoints. El menú "Proyectos por
finalizar" debe quitarse del rol Jefatura RSU en `navConfig.js`.

## 4. Constancia de Finalización

| Endpoint | Quién | Qué hace |
|---|---|---|
| `GET /constancias/` | Departamento, Admin | Proyectos finalizados de su alcance con `constancia_aprobada` (sección nueva "Constancias") |
| `GET /proyectos/<id>/constancia/pdf/` | Departamento y Admin siempre; el docente solo cuando está aprobada | Descarga el PDF |
| `POST /proyectos/<id>/constancia/aprobar/` | Departamento, Admin | Botón "Aprobar constancia". Una sola vez (la segunda da 400) |

El PDF sigue el formato oficial entregado por el cliente y lleva el nombre y la firma digital del usuario de Departamento que aprobó la constancia.

## 5. Errores

Mismo formato que el resto de la API: `{"error", "detail", "errors"}`.
`400` reglas de negocio · `403` rol sin permiso · `404` proyecto fuera de alcance.

## Conecta con

- `apps/proyectos/views_finalizacion.py`, `services_finalizacion.py`,
  `exports_finalizacion.py`.
- `apps/proyectos/models.py`: `InformeFinalizacion`; los dictámenes quedan en
  `RevisionProyecto` con `etapa='finalizacion'`.
- `apps/proyectos/tests.py`: `FinalizacionAPITests`, `NotificarListoParaCerrarAPITests`.

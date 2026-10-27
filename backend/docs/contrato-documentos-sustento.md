# Contrato — Documentos de sustento (paso IX, F10 / CP-D-11)

Los archivos no viajan en el JSON de `POST/PATCH /api/v1/proyectos/`. Se suben aparte, en su propia ruta,
con `multipart/form-data`, una vez que el proyecto existe (tiene `id`).

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/api/v1/proyectos/<id>/documentos-sustento/` | Listar los documentos del proyecto |
| POST | `/api/v1/proyectos/<id>/documentos-sustento/` | Subir un documento (`multipart/form-data`) |
| GET | `/api/v1/proyectos/<id>/documentos-sustento/<doc_id>/` | Ver uno |
| DELETE | `/api/v1/proyectos/<id>/documentos-sustento/<doc_id>/` | Borrarlo |

**POST** (campos del formulario):
- `archivo` (obligatorio): PDF, Word (`doc`, `docx`) o Excel (`xls`, `xlsx`), hasta 10 MB.
- `nombre` (opcional): si no se envía, se usa el nombre del archivo.

Respuesta `201`:
```json
{"id": 1, "nombre": "Cotización de contenedores",
 "archivo": "https://.../media/proyectos/sustento/cotizacion.pdf?t=...", "uploaded_at": "2026-10-26T..."}
```

Reglas:
- Solo el docente responsable, y solo con el proyecto en `borrador` u `observado`.
  Otro docente: `403`. Proyecto en revisión o aprobado: `400`.
- Formato no permitido o mayor a 10 MB: `400` con el motivo en `errors.archivo`.
- `documentos_sustento` del proyecto ahora es **solo lectura**: viene en el GET del proyecto para mostrarlos,
  y si se manda en el POST/PATCH del proyecto se ignora (ya no borra lo subido).
- La URL de `archivo` es firmada y vence en 2 horas: usarla tal cual y no guardarla.

Ejemplo (axios):
```js
const fd = new FormData();
fd.append('archivo', file);
fd.append('nombre', file.name);
await api.post(`/api/v1/proyectos/${proyectoId}/documentos-sustento/`, fd);
```

Flujo sugerido en el paso IX: guardar el proyecto (para tener `id`) y luego subir cada archivo con el POST,
igual que hoy se guardan las fuentes de financiamiento y las partidas.

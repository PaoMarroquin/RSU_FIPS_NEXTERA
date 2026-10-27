# Formulario de proyecto — documentos de sustento, beneficiarios y campos que se borran

Para el frontend. Responde al reporte F10 (CP-D-11) y a otros datos que hoy se pierden al guardar el proyecto.

## 1. Documentos de sustento (paso IX) — F10

Los archivos **no** van en el JSON de `POST/PATCH /api/v1/proyectos/`: por JSON no viajan archivos. Se suben
aparte, en `multipart/form-data`, cuando el proyecto ya tiene `id` (igual que las fuentes y las partidas).

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/api/v1/proyectos/<id>/documentos-sustento/` | Listar |
| POST | `/api/v1/proyectos/<id>/documentos-sustento/` | Subir (`archivo` obligatorio, `nombre` opcional) |
| DELETE | `/api/v1/proyectos/<id>/documentos-sustento/<doc_id>/` | Borrar |

- `archivo`: PDF, Word (`doc`, `docx`) o Excel (`xls`, `xlsx`), hasta 10 MB.
- Solo el docente responsable, con el proyecto en `borrador` u `observado`.
- Errores: otro docente `403`; proyecto en revisión `400`; formato o tamaño no permitido `400` (motivo en `errors.archivo`).
- `documentos_sustento` dentro del proyecto ahora es **solo lectura** (viene en el GET para mostrarlos).

```js
const fd = new FormData();
fd.append('archivo', file);
fd.append('nombre', file.name);
await api.post(`/api/v1/proyectos/${proyectoId}/documentos-sustento/`, fd);
```

Respuesta `201`:
```json
{"id": 1, "nombre": "Cotización", "archivo": "https://.../media/proyectos/sustento/cotizacion.pdf?t=...",
 "uploaded_at": "2026-10-26T..."}
```
La URL de `archivo` vence en 2 horas: usarla tal cual y no guardarla.

## 2. Beneficiarios (punto 1.9 del formato)

El formulario no permite marcar los tipos de beneficiario, por eso el punto 1.9 del informe sale sin marcar.

- Catálogo nuevo: `GET /api/v1/tipos-beneficiario/` →
  `[{"id": 1, "codigo": "comunidad_universitaria", "label": "Comunidad universitaria - interna", "orden": 1}, ...]`
  (12 tipos, incluido `otro`).
- En el paso I, mostrarlos como checkboxes y enviar los `id` marcados: `"beneficiarios": [2, 4]`.
- El texto libre sigue en `benef_otro_detalle` (detalle cuando se marca "Otro", o descripción de los beneficiarios).

## 3. Campos que hoy se borran en cada guardado

`construirPayload` (`useFormRSU.js`) manda valores fijos en campos que el formulario no maneja, y el backend los
guarda tal cual, borrando lo que había. Comprobado: un proyecto con 1 docente adicional y 1 beneficiario quedó en
0 y 0 tras un guardado normal.

| Quitar de `construirPayload` | Qué borra hoy |
|---|---|
| `docentes_adicionales: []` | Los docentes adicionales (se asignan al continuar un proyecto) y su acceso al proyecto |
| `beneficiarios: []` | Los tipos de beneficiario marcados (enviar los `id` reales, ver punto 2) |
| `objetivo_institucional: null` | El objetivo institucional, si había |
| `impacto_esperado: ''` | El impacto esperado |
| `presentado_con_anticipacion: true` | Siempre lo deja en "sí" |
| `conclusiones`, `recomendaciones`, `lecciones_aprendidas`, `medio_difusion: ''` | Los textos del informe de finalización |
| `documentos_sustento: []` | Ya no borra nada (es solo lectura), pero sobra |

Regla: **si el formulario no edita un campo, no lo mandes**. El backend solo cambia los campos que llegan en el PATCH.

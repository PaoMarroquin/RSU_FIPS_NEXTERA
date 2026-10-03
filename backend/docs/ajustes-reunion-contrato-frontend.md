# Ajustes de la reunión con el cliente - contrato para el frontend

Cambios de API que acompañan las observaciones de la reunión (HU con estado
"Requiere ajuste": HU-03, HU-05, HU-06, HU-09 y HU-16). La finalización y la
constancia están en `cierre-de-proyecto-contrato-frontend.md`.

> **Importante para el despliegue:** el backend y el frontend de estos cambios
> deben subir juntos a producción. Con el backend nuevo y el frontend actual,
> el docente no podría enviar proyectos a revisión (falta el cronograma por
> actividad y los nombres de docentes) ni completar actividades en "Mis
> actividades" (el estado de la actividad ya no se cambia con PATCH).

## 1. Formulación del proyecto (docente)

### Periodo académico en vez de semestre libre

- Se envía solo `periodo` (id de `GET /periodos/`). `semestre_academico` pasa
  a ser **de solo lectura**: el backend lo copia del nombre del periodo. Lo que
  se mande en `semestre_academico` se ignora.
- Al enviar a revisión se exige `periodo` (antes se exigía el texto del semestre).

### Docentes y estudiantes

```json
{
  "nro_docentes": 2,
  "docentes_participantes": ["Ana Pérez", "Luis Quispe"],
  "nro_estudiantes": 25,
  "observacion_estudiantes": "Estudiantes de 3er año de la EPIS."
}
```

- `docentes_participantes`: lista de nombres, uno por línea (sin rol ni cuenta).
  Al enviar a revisión debe tener **tantos nombres como `nro_docentes`**.
- `observacion_estudiantes`: texto libre opcional.

### Sin números negativos

`nro_docentes`, `nro_estudiantes`, los seis `rec_hum_*`, `linea_base`,
`valor_meta`, `valor_alcanzado`, `cantidad`, `costo_unitario`,
`monto_ejecutado` y el `monto` de cada fuente responden `400` si son negativos.
(Antes un negativo en estudiantes o docentes llegaba a la base de datos y
respondía `500`.) Igual conviene bloquearlo en el input (`min="0"`).

### Actividades (VI) y cronograma por actividad (VII)

La actividad queda solo con **nombre y descripción**. El responsable, las
fechas y la evidencia esperada pasan a las **acciones** de su bloque en el
cronograma. Se envían anidadas:

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

- Los campos `responsable`, `fecha` y `evidencia_esperada` de la actividad ya
  **no existen** (si llegan se ignoran). Los datos que ya estaban cargados en
  producción se movieron automáticamente a una acción de su actividad.
- En la lectura, cada actividad trae su lista `acciones`. La lista plana
  `cronograma` sigue existiendo (cada acción trae `actividad` con su id);
  las acciones antiguas sin actividad vienen con `actividad: null`.
- `fecha_fin` anterior a `fecha_inicio` responde `400`.
- El `estado` de la actividad es **de solo lectura** (ver sección 2).

### Enviar a revisión (`POST /proyectos/<id>/revisar/`)

Exige todo el ANEXO 4. En los campos de texto que no apliquen el docente puede
escribir "n/a", pero no dejarlos vacíos. Además de lo que ya se pedía, ahora se
exige: `periodo`, `diag_justificacion_intervencion`, `obj_mejora_curricular`,
los cinco `rec_mat_*`, `fecha_evaluacion_avance` y las tres fechas de encuesta,
`tipo_actividad_otro` si se marcó "otro", los nombres de docentes, al menos un
recurso humano, al menos una fuente de financiamiento, y **cada actividad con
nombre, descripción y al menos una acción completa** (descripción, fechas,
responsable y evidencia esperada).

El error trae una clave por cada problema en `errors` (`cronograma`,
`docentes_participantes`, `fecha_evaluacion_avance`, etc.).

### Guardar borrador

Sin cambios: un borrador se guarda con lo mínimo (facultad y título); la
validación completa es solo al enviar a revisión.

### Editar / eliminar

- Solo se editan proyectos en **Borrador u Observado**. Ahora también
  presupuesto, fuentes de financiamiento, metas y actividades responden `400`
  si el proyecto está en ejecución (antes presupuesto y fuentes se podían
  cambiar en cualquier estado). Los valores alcanzados y montos ejecutados se
  completan en el Informe de Finalización.
- Eliminar sigue permitido solo en Borrador (`DELETE /proyectos/<id>/`).

### Número de proyecto

Ya **no se genera** un código al crear el proyecto (`codigo` llega `null`
hasta la aprobación). Lo asigna el Departamento al aprobar (sección 3).

## 2. Mis actividades: evidencia en un solo paso

```
POST /proyectos/<id>/actividades/<actividad_id>/evidencia/   (multipart/form-data)
  archivo        PDF/JPG/JPEG/PNG, máx. 10 MB   ┐ uno de los dos
  enlace_drive   https://drive.google.com/...  ┘
  observacion    texto opcional
```

En una sola operación: registra el avance con la evidencia, marca la actividad
como **completada**, pasa el proyecto de aprobado a en ejecución si es la
primera, y recalcula el porcentaje. Respuesta `201`:

```json
{
  "actividad": {"id": 4, "nombre": "...", "estado": "completada", "acciones": [...]},
  "avance": {"id": 12, "evidencias": [{"tipo": "archivo", "archivo": "https://.../media/..."}], ...},
  "porcentaje_ejecucion": 50.0,
  "estado_proyecto": "en_ejecucion"
}
```

- Solo el docente responsable, con el proyecto aprobado o en ejecución.
- Archivo y enlace a la vez, o ninguno, responde `400`; formato no permitido, `400`.
- Reemplaza el flujo actual de PATCH de estado + crear avance. Los botones de
  "Iniciar" y "Reiniciar" ya no tienen sentido: el estado solo cambia al subir
  evidencia.

## 3. Revisión de la planificación (Departamento)

### Aprobar: `POST /proyectos/<id>/aprobar/`

```json
{ "codigo": "RSU-FIPS-2026-015", "comentario_tecnico": "opcional",
  "observaciones_secciones": {"financiamiento": "opcional"} }
```

`codigo` (el número del proyecto) es **obligatorio** y único; si falta o está
repetido responde `400` en `errors.codigo`.

### Observar: `POST /proyectos/<id>/observar/`

```json
{ "comentario_tecnico": "Comentario general de al menos 15 caracteres",
  "observaciones_secciones": {
    "datos_generales": "...", "fundamentacion": "...", "diagnostico": "...",
    "objetivos": "...", "resultados": "...", "actividades": "...",
    "cronograma": "...", "recursos": "...", "financiamiento": "..." } }
```

- Las claves de `observaciones_secciones` son las **mismas nueve secciones
  del formulario del docente**; cualquier otra clave responde `400`. Las
  vacías se descartan.
- El comentario general sigue siendo obligatorio (mínimo 15 caracteres, CA-02).
- Cada revisión de `revisiones` trae ahora `etapa` (`planificacion` o
  `finalizacion`) y `observaciones_secciones`, para mostrarlas por sección al
  docente cuando edita el proyecto observado.

## 4. Seguimiento en solo lectura (HU-16)

```
GET /proyectos/<id>/seguimiento/
```

Para Departamento y Jefatura RSU (también el docente). Trae cada actividad con
su estado, su bloque de acciones, sus avances y sus evidencias con el enlace
listo para abrir, más `porcentaje_ejecucion`. Sirve para "Proyectos
Departamento" y "Proyectos RSU" (ver avances del docente) y evita pedir
avances y evidencias por separado.

## 5. Documentos de apoyo (HU-03, Jefatura RSU)

Mismas rutas `/matrices/` y `/matrices/<id>/` (el nombre de la ruta se
conserva). Ahora:
- Solo **PDF o Word** (`pdf`, `doc`, `docx`).
- `nombre`, `descripcion` y `archivo` obligatorios.
- En la interfaz y en el admin se llama "Documento de apoyo".

## 6. Usuarios (Administrador y Configuración)

| Endpoint | Qué hace |
|---|---|
| `POST /usuarios/` | `password` ahora es **opcional**: si no se envía, la contraseña inicial es el correo institucional. Sirve también para la importación desde Excel. |
| `POST /usuarios/me/cambiar-password/` | Body `{"password_actual", "password_nueva"}` (mínimo 8). Para "Configuración de cuenta". |
| `GET /usuarios/estadisticas/` | Solo Administrador. `{"total", "activos", "inactivos", "por_rol": [{"rol", "total"}]}` para su dashboard (sin datos de proyectos). |

## 7. Repositorio: filtro de año

Se quitó el filtro `anio` y la lista `anios` de `/repositorio/filtros/`,
como pidió el cliente. Para filtrar por semestre se usa `periodo`.

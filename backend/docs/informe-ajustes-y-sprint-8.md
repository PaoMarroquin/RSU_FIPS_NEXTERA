# Informe de cambios del backend - Ajustes de la reunión y Sprint 8

Alcance: **solo backend** (`backend/`). Lo que corresponde al frontend queda
listado en la sección 5 con el contrato de API que debe usar.

Documentos relacionados:
- `ajustes-reunion-contrato-frontend.md`: contrato de los cambios de API.
- `cierre-de-proyecto-contrato-frontend.md`: finalización y constancia (reescrito).
- `esquema_rsu.dbml`: esquema regenerado con los cambios.

> Numeración: este informe usa la numeración del backlog actual (HU-03
> Documentación guía, HU-05 Actividades y cronograma, HU-06 Evaluación, HU-07
> Registro de avances, HU-09 Revisión de finalización, HU-16 Visualización de
> avance). Parte del código antiguo conserva la numeración anterior en sus
> comentarios (por ejemplo, "HU-06 informes consolidados", "HU-07 repositorio").

## 1. Resumen

| HU / tarea | Estado anterior | Qué se hizo en el backend |
|---|---|---|
| HU-03 Documentación guía | Requiere ajuste | Documentos de apoyo solo PDF/Word, descripción obligatoria, admin limpio |
| HU-05 Actividades y cronograma | Requiere ajuste | Cronograma por actividad (bloques), actividad solo nombre y descripción, validación completa al enviar |
| HU-06 Evaluación de propuestas | Requiere ajuste | Número de proyecto al aprobar, observaciones por las mismas secciones del formulario, mínimo 15 caracteres |
| HU-09 Revisión y aprobación de finalización | Requiere ajuste | Flujo nuevo: docente envía informe, Departamento aprueba u observa; Jefatura ya no finaliza; constancia |
| HU-16 Visualización de avance | Requiere ajuste | Endpoint de seguimiento en solo lectura por actividad, con evidencias |
| Sprint 8: T-137, T-138, T-139, T-141 | Sin iniciar | Informe de Finalización: consultas, API, elaboración, visualización y gestión (incluye PDF) |
| Observaciones generales | — | Evidencia en un solo paso, sin negativos, docentes por nombre, periodo único, sin edición en ejecución, contraseña inicial y cambio de contraseña, estadísticas de usuarios, sin filtro de año |

Pruebas: **151 tests pasan** (27 más que antes; se reescribieron los de
finalización para el flujo nuevo). Ver sección 7.

## 2. Ajustes por HU ("Requiere ajuste")

### HU-03 Gestión de Documentación Guía institucional

- Los documentos de apoyo (modelo `MatrizOperativa`, ruta `/matrices/`)
  aceptan solo **PDF o Word** (antes también Excel y PowerPoint).
- `nombre`, `descripcion` y `archivo` son obligatorios ("validan campos obligatorios").
- En el admin y en la API se muestran como **"Documento de apoyo"**.
- Admin de Django de Planificación: solo quedan **Documentos de apoyo, Ejes
  RSU, Sub-ítems de ejes, ODS y Periodos académicos**, como pidió el cliente.
  Líneas estratégicas, objetivos institucionales/regionales/nacionales,
  indicadores y actividades sugeridas se quitaron del admin, **pero sus tablas
  se conservan**: `ProyectoRSU` todavía tiene relaciones con ellas y borrarlas
  eliminaría datos. Si se decide eliminarlas del todo, es un cambio aparte.

### HU-05 Gestión de actividades y cronograma

- **Actividad (sección VI):** solo nombre y descripción. Se quitaron los campos
  responsable, fecha y evidencia esperada.
- **Cronograma (sección VII):** cada acción pertenece a una actividad
  (`CronogramaAccion.actividad`) y tiene fechas de inicio y fin, responsable y
  la nueva **evidencia esperada**. Se guardan anidadas dentro de cada actividad
  (`actividades[].acciones`). Esto resuelve que antes cronograma y actividades
  no tenían ninguna relación.
- Fecha de fin anterior a la de inicio: `400`.
- **Datos existentes:** una migración movió el responsable, la fecha y la
  evidencia esperada de cada actividad a una acción de su bloque, para no
  perder información de proyectos ya cargados.

### HU-06 Evaluación de propuestas de proyectos

- **Aprobar exige el número del proyecto** (`codigo`), único. Ya no se genera
  un código automático al crear el proyecto ni al crear una continuación.
- **Observaciones por sección:** `observaciones_secciones` con las mismas nueve
  secciones del formulario del docente (datos generales, fundamentación,
  diagnóstico, objetivos, resultados, actividades, cronograma, recursos,
  financiamiento), además del comentario general.
- Comentario general obligatorio de **mínimo 15 caracteres** (CA-02, antes
  solo se validaba que no estuviera vacío).
- La aprobación también admite comentario y observaciones por sección.

### HU-09 Revisión y aprobación de Finalización

Antes, Departamento **y Jefatura** cerraban el proyecto directamente en
cuanto llegaba al 100%, sin informe del docente. Ahora:

1. Al llegar al 100% se avisa **al docente** (antes se avisaba a
   Departamento y Jefatura).
2. El docente completa y envía el Informe de Finalización.
3. El Departamento lo **aprueba** (proyecto → Finalizado) u **observa** con
   comentario obligatorio de mínimo 15 caracteres; el docente corrige y reenvía.
4. **Jefatura RSU ya no puede finalizar** (pedido del cliente).
5. "Proyectos por finalizar" lista solo informes **enviados** del departamento.
6. **Constancia de finalización:** al aprobar se genera; el Departamento la ve,
   la aprueba, y desde ahí el docente la descarga. Formato PDF **provisional**
   hasta que el cliente defina el oficial.

### HU-16 Visualización de avance de actividades (lectura)

- Nuevo `GET /proyectos/<id>/seguimiento/`: cada actividad con su estado, su
  bloque de acciones, sus avances y sus evidencias con el enlace para abrirlas,
  y el porcentaje de ejecución. Departamento y Jefatura RSU lo ven en solo
  lectura, cada uno en su alcance.
- Antes el frontend tenía que pedir los avances y luego las evidencias de cada
  avance por separado (una petición por avance).

## 3. Sprint 8: Informe de Finalización

| Tarea | Implementación |
|---|---|
| T-137 Consultas de la información de ejecución | `services_finalizacion.py`: reutiliza `informe_final()` del repositorio (mismas cifras de metas, presupuesto y avance) y suma actividades, acciones, avances, evidencias y observaciones |
| T-138 API REST de la información del informe | `GET /proyectos/<id>/informe-finalizacion/` con los datos de planificación ya cargados y lo pendiente |
| T-139 Elaboración del informe | `PATCH` del mismo endpoint (textos, valores alcanzados de metas, montos ejecutados) y `POST .../enviar/` |
| T-141 Visualización y gestión | Revisión del Departamento (`.../observar/`, `/finalizar/`), bandeja `/proyectos/para-finalizar/` y PDF `.../pdf/` |

Nuevo modelo `InformeFinalizacion` (estado del informe y de la constancia). Los
textos del informe siguen en `ProyectoRSU` (conclusiones, recomendaciones,
lecciones aprendidas, medio de difusión) porque el Repositorio Histórico ya los
lee de ahí. Los dictámenes quedan en `RevisionProyecto` con `etapa='finalizacion'`.

## 4. Otras observaciones de la reunión resueltas en el backend

| Observación | Cambio |
|---|---|
| Permite números negativos en estudiantes/docentes, línea base, meta, cantidad | Validación en todos los campos de cantidad. **Bug encontrado:** un negativo en estudiantes o docentes llegaba a la base de datos y respondía error 500 |
| Docentes participantes por nombre, estudiantes con observación | `docentes_participantes` (lista de nombres; al enviar deben ser tantos como `nro_docentes`) y `observacion_estudiantes` |
| Semestre y periodo: quedarse con uno | El periodo académico es la única fuente; `semestre_academico` se deriva solo y es de solo lectura |
| Al enviar, todo lleno (se acepta "n/a") | La validación de envío ahora exige todos los campos del ANEXO 4, incluidos los que antes faltaban (justificación, mejora curricular, recursos materiales, fechas de evaluación y encuestas, fuentes de financiamiento, recursos humanos) |
| Proyectos en ejecución no deben poder editarse | Presupuesto y fuentes se podían editar en **cualquier** estado (incluso finalizado), y metas también en ejecución. Ahora todo solo en Borrador u Observado |
| Mis actividades: flujo claro, subir evidencia y se actualiza el % | Nuevo `POST .../actividades/<id>/evidencia/`: archivo o enlace + observación, en un solo paso completa la actividad y recalcula el %. El estado de la actividad ya no se cambia a mano |
| Evidencias del docente que otros no podían ver | Ya corregido antes (ruta `/media/` en producción). Además, las evidencias del flujo antiguo (guardadas en la actividad) se migraron al modelo actual para que se vean en el seguimiento |
| Contraseña al crear usuario | Opcional: si no se indica, la inicial es el correo institucional |
| Cambiar contraseña en Configuración | `POST /usuarios/me/cambiar-password/` |
| Dashboard del Administrador con datos de usuarios | `GET /usuarios/estadisticas/` (por rol y estado) |
| Quitar filtro de año | Quitado del repositorio histórico |

## 5. Pendiente en el frontend

**Necesario para usar los cambios** (contrato en los documentos citados):

- Formulario: cronograma en bloques por actividad (`actividades[].acciones`);
  actividad solo con nombre y descripción; sección de nombres de docentes
  según la cantidad; casilla de observación de estudiantes; usar solo el
  select de periodo; no permitir negativos en los inputs; textareas que crezcan
  en indicador y meta.
- Mis actividades: un botón "Subir evidencia" por actividad → archivo o enlace
  de Drive + observación → Guardar, con el endpoint nuevo. Quitar "Iniciar" y
  "Reiniciar".
- Docente: sección "Finalización de proyecto" (cuando `finalizacion.habilitado`);
  en Informes, elegir proyecto y ver/descargar planificación, informe de
  finalización y constancia.
- Departamento: campo "Número de proyecto" al aprobar; observaciones con las
  nueve secciones del formulario; en "Proyectos por finalizar" el ojito abre el
  informe de finalización con botones Aprobar/Observar; sección "Constancias".
- Departamento y Jefatura: ver el avance de los docentes con `/seguimiento/`.
- Jefatura RSU: quitar "Proyectos por finalizar" de su menú; la pantalla de
  matriz operativa pasa a ser subir/ver documentos de apoyo (PDF o Word).
- Administrador: dashboard con `/usuarios/estadisticas/`; alta de usuario sin
  contraseña obligatoria.
- Configuración: formulario de cambio de contraseña.

**Solo frontend** (no requieren backend): quitar emojis del dashboard y
pantallas, estilo de Mis actividades, y que los filtros carguen bien sus
opciones.

**Ya hecho por el equipo en frontend** (según los últimos commits): semestre
como select de periodos y la redirección de "Importar desde Excel".

## 6. Cambios en la base de datos

Migraciones nuevas (se aplican con `python manage.py migrate`):

| Migración | Tipo | Qué hace |
|---|---|---|
| `proyectos/0032_cronograma_por_actividad_y_finalizacion` | Esquema | `CronogramaAccion.actividad` y `evidencia_esperada`; `ProyectoRSU.docentes_participantes` y `observacion_estudiantes`; `RevisionProyecto.etapa` y `observaciones_secciones`; tabla `informe_finalizacion`; enlace de evidencias ampliado a 500 caracteres; tipos de notificación nuevos |
| `proyectos/0033_mover_datos_de_actividades` | Datos | Mueve responsable/fecha/evidencia esperada de cada actividad a una acción de su bloque, y las evidencias del flujo antiguo a avances y evidencias. No borra archivos |
| `proyectos/0034_quitar_campos_movidos_de_actividad` | Esquema | Quita de la actividad los campos ya movidos |
| `planificacion/0012_documentos_de_apoyo_pdf_word` | Esquema | Documentos de apoyo: solo PDF/Word y nombre "Documento de apoyo" |

La migración de datos se probó llevando una base al estado anterior con datos
del modelo viejo (actividad con responsable y fecha, foto y enlace largo de
Drive) y migrando hacia adelante: todo quedó en su nuevo lugar.

## 7. Riesgos y decisiones a confirmar

1. **Despliegue coordinado.** Backend y frontend deben subir juntos: con el
   backend nuevo y el frontend actual, los docentes no podrían enviar a
   revisión (falta el cronograma por actividad y los nombres de docentes) ni
   completar actividades en Mis actividades.
2. **Contraseña inicial = correo.** Lo pidió el cliente, pero es una clave
   predecible. Recomendación: obligar a cambiarla en el primer ingreso.
3. **Formato de la constancia:** provisional.
4. **Tablas de la matriz operativa anterior:** ocultas del admin, no borradas.
5. **Pruebas en PostgreSQL pendientes.** Los 151 tests y la prueba de la
   migración de datos se corrieron en SQLite porque Docker no respondió en
   esta sesión. Antes de desplegar, correr `python manage.py test apps` y
   `python manage.py migrate` en el contenedor con PostgreSQL.

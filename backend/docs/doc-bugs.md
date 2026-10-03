# Reporte de Bugs — Backend (Sprint 8)

Fecha: 03/10/2026  
Bugs revisados: 9 (reportes PIS anotaciones + Bug_006 Financiamiento y Recursos)

---

## 1. Periodo académico con fechas invertidas

**Código interno:** BUG-002  
**Descripción:** Se podía guardar un periodo académico donde la fecha de fin
era anterior a la de inicio, sin que el sistema lo rechazara.  
**Causa:** El serializer `PeriodoAcademicoSerializer` no tenía validación de
orden de fechas.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `validate()` en `PeriodoAcademicoSerializer`
(`apps/planificacion/serializers.py`). Ahora si `fecha_fin < fecha_inicio` el
sistema responde `400` con el mensaje:
`"La fecha de fin no puede ser anterior a la fecha de inicio."`

---

## 2. Campo presupuesto_global no existía en el modelo

**Código interno:** BUG-003  
**Descripción:** El reporte indicaba un error al acceder al campo
`presupuesto_global` en `MatrizOperativa`.  
**Causa:** El campo ya había sido eliminado en una migración anterior
(`planificacion/0010_matriz_como_documento`) como parte de la refactorización
que convirtió la MatrizOperativa en Documento de apoyo.  
**Responsable:** No aplica.  
**¿Se solucionó?** Estaba cerrado antes de este sprint. El campo no existe en
el modelo actual ni en ningún serializer o vista.  
**Cómo:** No se hizo ningún cambio. Se verificó que el campo no existe y se
cerró el reporte.

---

## 3. Actividad sugerida con objetivo de otro eje RSU

**Código interno:** BUG-004  
**Descripción:** Se podía crear una `ActividadSugerida` donde el `objetivo`
seleccionado pertenecía a un eje RSU diferente al `eje_rsu` indicado, lo que
dejaba datos inconsistentes.  
**Causa:** `ActividadSugeridaSerializer` no validaba que el objetivo y el eje
correspondieran entre sí.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `validate()` en `ActividadSugeridaSerializer`
(`apps/planificacion/serializers.py`). Si el objetivo no pertenece al eje RSU
indicado, el sistema responde `400`:
`"El objetivo seleccionado no pertenece al eje RSU indicado."`

---

## 4. Proyecto con fecha de término anterior a fecha de inicio

**Código interno:** BUG-005  
**Descripción:** Se podía guardar un proyecto borrador con `fecha_termino`
anterior a `fecha_inicio`, o con `fecha_evaluacion_avance` fuera del rango
válido.  
**Causa:** La validación de fechas solo existía al enviar a revisión
(`_validar_campos_obligatorios`), no al guardar el borrador.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `_validate_fechas_proyecto()` llamado desde
`ProyectoRSUSerializer.validate()` (`apps/proyectos/serializers.py`). Ahora
cualquier guardado (borrador o envío) valida:
- `fecha_termino >= fecha_inicio`
- `fecha_evaluacion_avance >= fecha_inicio`
- `fecha_termino >= fecha_evaluacion_avance`

Cada error indica exactamente qué campo tiene el problema.

---

## 5. Celular acepta letras y formatos inválidos

**Código interno:** BUG-007  
**Descripción:** El campo celular del perfil de usuario aceptaba texto
arbitrario: letras, guiones, espacios, números de cualquier longitud.  
**Causa:** `MiPerfilUpdateSerializer` no tenía ningún validador para el
campo `celular`.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `validate_celular()` en `MiPerfilUpdateSerializer`
(`apps/usuarios/serializers.py`). Ahora el celular debe tener exactamente
9 dígitos numéricos (formato Perú). Si no cumple, responde `400`:
`"El celular debe tener exactamente 9 dígitos numéricos."`
El campo sigue siendo opcional: si se envía vacío o nulo, no se valida.

---

## 6. Guardar presupuesto con cantidad negativa en partidas

**Código interno:** FI-01 (Bug_006 — Financiamiento)  
**Descripción:** Al ingresar cantidad `-2` y precio `S/10` en una partida
presupuestaria, la pantalla mostraba `Monto Ejecutado: S/ -20.00`. No se
advertía la cantidad negativa, solo la diferencia con el monto asignado.  
**Causa (backend):** `PartidaPresupuestariaSerializer` no validaba que
`cantidad` y `costo_unitario` fueran mayores o iguales a cero.  
**Causa (frontend):** El input no tenía `min="0"` por lo que permitía ingresar
negativos y calculaba el total localmente sin advertencia.  
**Responsable:** Backend + Frontend.  
**¿Se solucionó?** Backend sí. Frontend pendiente.  
**Cómo (backend):** Se agregaron `validate_cantidad` y `validate_costo_unitario`
en `PartidaPresupuestariaSerializer` (`apps/proyectos/serializers.py`).
Intentar guardar con cantidad negativa responde `400`. El valor no persiste.  
**Pendiente (frontend):** Agregar `min="0"` al input de cantidad para bloquear
el ingreso de negativos antes de guardar y evitar mostrar el cálculo erróneo.

---

## 7. El total de integrantes muestra un número incorrecto con decimales

**Código interno:** RC-01 (Bug_006 — Recursos)  
**Descripción:** Al ingresar `1.5` en el campo de estudiantes, el total
visible mostraba `2` sin ningún aviso de que el decimal no es válido.  
**Causa (frontend):** El input de tipo `number` no tenía `step="1"`, por lo que
el navegador aceptaba `1.5` visualmente y el cálculo del total en pantalla
lo sumaba como si fuera un entero.  
**Causa (backend):** Ninguna. Los campos `nro_docentes` y `nro_estudiantes`
son `PositiveIntegerField` en Django. Si llega `1.5` al servidor, DRF responde
`400 "A valid integer is required."` El backend ya lo rechazaba.  
**Responsable:** Solo Frontend.  
**¿Se solucionó?** Backend: ya estaba resuelto sin cambios. Frontend: pendiente.  
**Pendiente (frontend):** Agregar `step="1"` al input numérico y corregir el
cálculo visual del total para que no use fracciones.

---

## 8. Al enviar sin completar el formulario no se explica qué falta

**Código interno:** VF-01 (Bug_006 — Financiamiento)  
**Descripción:** Al pulsar "Finalizar y Guardar" con el proyecto incompleto,
el servidor rechaza el envío a revisión pero la pantalla vuelve a mostrar el
formulario sin ningún mensaje visible sobre qué campos faltan.  
**Causa (backend):** Ninguna. El backend retorna `400` con un JSON detallado:
```json
{
  "errors": {
    "periodo": "Este campo es obligatorio.",
    "cronograma": "Cada actividad debe tener al menos una acción completa.",
    "docentes_participantes": "Debe indicar 2 nombres de docentes."
  }
}
```
**Causa (frontend):** El frontend no lee ni muestra el contenido de
`response.data.errors` al recibir el `400`. Solo detecta que hubo error y
re-renderiza el formulario vacío de mensajes.  
**Responsable:** Solo Frontend.  
**¿Se solucionó?** Backend: ya estaba correcto. Frontend: pendiente.  
**Pendiente (frontend):** Leer `response.data.errors` y mostrar cada mensaje
junto al campo correspondiente o en un resumen visible arriba del formulario.

---

## 9. Reintentar el envío crea un proyecto duplicado en borrador

**Código interno:** VF-02 (Bug_006 — Financiamiento)  
**Descripción:** Al enviar el formulario con el proyecto incompleto, el servidor
lo rechaza. Al volver a pulsar guardar sin salir del formulario, se creaba un
segundo proyecto borrador con el mismo título. Los borradores duplicados
quedaban en "Mis proyectos".  
**Causa:** Cada llamada `POST /proyectos/` creaba un nuevo registro sin
verificar si ya existía uno igual del mismo docente.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se sobreescribió `perform_create()` en `ProyectoListCreateView`
(`apps/proyectos/views.py`). Antes de crear el proyecto, busca si ya existe un
borrador del mismo docente con el mismo título y facultad. Si existe, retorna
el borrador existente en vez de crear uno nuevo. El comportamiento es
idempotente: reintentar el envío nunca duplica el borrador.

---

## Resumen de los 9 bugs

| # | Nombre | Responsable | ¿Solucionado? |
|---|---|---|---|
| 1 | Periodo con fechas invertidas | Backend | ✅ Corregido |
| 2 | Campo presupuesto_global inexistente | — | ✅ Cerrado (ya no existía) |
| 3 | Actividad sugerida con objetivo de otro eje | Backend | ✅ Corregido |
| 4 | Proyecto con fechas de ciclo invertidas | Backend | ✅ Corregido |
| 5 | Celular acepta formatos inválidos | Backend | ✅ Corregido |
| 6 | Cantidad negativa en partidas presupuestarias | Backend + Frontend | ✅ Backend / ⏳ Frontend (UI) |
| 7 | Total de integrantes incorrecto con decimales | Frontend | ✅ Backend ya validaba / ⏳ Frontend (UI) |
| 8 | Envío rechazado sin explicar qué falta | Frontend | ✅ Backend ya retorna errors / ⏳ Frontend (mostrar errors) |
| 9 | Reintentar crea borrador duplicado | Backend | ✅ Corregido |

**Tests:** 151 tests pasan en SQLite tras aplicar todas las correcciones de backend.

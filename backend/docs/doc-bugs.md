# Reporte de Bugs — Correcciones de Backend

Fecha: 03/10/2026

Fuentes:
- **PIS anotaciones**: BUG-002, BUG-003, BUG-004, BUG-005, BUG-007
- **Bug_006** (9 secciones del formulario de proyecto): VF-03, DG-01 a DG-05,
  FU-01, DI-01, OB-01, RE-01, AC-01, VF-01, VF-02, FI-01, RC-01

---

# PARTE 1 — Bugs de los reportes PIS (BUG-002 a BUG-007)

## BUG-002 — Periodo académico con fechas invertidas

**Descripción:** Se podía guardar un periodo académico con `fecha_fin` anterior
a `fecha_inicio` sin que el sistema lo rechazara.  
**Causa:** `PeriodoAcademicoSerializer` no tenía validación de orden de fechas.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `validate()` en `PeriodoAcademicoSerializer`
(`apps/planificacion/serializers.py`). Responde `400`:
`"La fecha de fin no puede ser anterior a la fecha de inicio."`

---

## BUG-003 — Campo presupuesto_global inexistente

**Descripción:** Error al acceder al campo `presupuesto_global` en `MatrizOperativa`.  
**Causa:** El campo ya había sido eliminado en `planificacion/0010_matriz_como_documento`.  
**Responsable:** No aplica.  
**¿Se solucionó?** Cerrado antes de este sprint. Se verificó que el campo no existe.  
**Cómo:** Sin cambios; el reporte se cerró.

---

## BUG-004 — Actividad sugerida con objetivo de otro eje RSU

**Descripción:** Se podía crear una `ActividadSugerida` con un `objetivo` de
un eje RSU distinto al `eje_rsu` seleccionado.  
**Causa:** `ActividadSugeridaSerializer` no validaba la consistencia entre
`objetivo` y `eje_rsu`.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `validate()` en `ActividadSugeridaSerializer`
(`apps/planificacion/serializers.py`). Responde `400`:
`"El objetivo seleccionado no pertenece al eje RSU indicado."`

---

## BUG-005 — Proyecto con fechas de ciclo invertidas

**Descripción:** Se podía guardar un borrador con `fecha_termino < fecha_inicio`
o `fecha_evaluacion_avance` fuera del rango válido.  
**Causa:** La validación de fechas solo existía al enviar a revisión, no al
guardar borrador.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `_validate_fechas_proyecto()` en `ProyectoRSUSerializer`
(`apps/proyectos/serializers.py`). Valida en cualquier guardado:
`fecha_inicio ≤ fecha_evaluacion_avance ≤ fecha_termino`.

---

## BUG-007 — Celular acepta letras y formatos inválidos

**Descripción:** El campo celular del perfil aceptaba texto arbitrario.  
**Causa:** `MiPerfilUpdateSerializer` no tenía validador para `celular`.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se agregó `validate_celular()` en `MiPerfilUpdateSerializer`
(`apps/usuarios/serializers.py`). Exige exactamente 9 dígitos numéricos.

---

# PARTE 2 — Bug_006: validación del formulario de proyecto (9 secciones)

---

## Sección 1 — Datos Generales

### VF-03: Las cantidades cambian al guardar sin avisar

**Tipo:** Fallo confirmado al guardar.  
**Descripción:** Al ingresar `-1` docentes y `1.5` estudiantes y guardar el
borrador, al reabrir aparecen `1` y `1` sin que el sistema haya avisado el
cambio. Los valores inválidos se "corrigen" en silencio.  
**Causa backend:** `PositiveIntegerField` en Django hace que DRF convierta `1.5`
a `1` con `int(1.5)` sin devolver error, y rechaza `-1` con `min_value`, pero
el mensaje de rechazo no llega visible al usuario.  
**Causa frontend:** El input no bloquea decimales ni negativos antes de enviar.  
**Responsable:** Backend + Frontend.  
**¿Se solucionó?** Sí en backend.  
- El `-1` se rechaza con `400` gracias a `min_value=0` en `extra_kwargs`.  
- El `1.5` ahora también se rechaza con `400`: se agregaron `validate_nro_docentes`,
  `validate_nro_estudiantes` y los seis `validate_rec_hum_*` en `ProyectoRSUSerializer`
  (`apps/proyectos/serializers.py`). Si el valor es un decimal no entero (`1.5`, `2.3`, etc.)
  responde `400`: `"El campo nro_docentes debe ser un número entero."`.  
**Pendiente en frontend:** Agregar `step="1"` al input para bloquear el ingreso de decimales antes de enviar.

---

### DG-01: El semestre muestra opciones de datos de prueba

**Tipo:** Observación de datos, no de código.  
**Descripción:** El catálogo de semestres incluye entradas como `"a"` o
periodos QA creados durante pruebas, junto a los periodos reales.  
**Causa:** Los periodos de prueba no fueron eliminados del entorno de
producción.  
**Responsable:** Administrador del sistema (datos).  
**¿Se solucionó?** No corresponde a un fix de código. Se deben eliminar los
periodos de prueba desde el admin de Django (`/admin/`) antes de publicar.

---

### DG-02: No hay aviso junto al campo cuando la cantidad es inválida

**Tipo:** Observación de UX durante la edición.  
**Descripción:** Al ingresar `-1` docentes o `1.5` estudiantes, el navegador
marca el campo como inválido pero no aparece un mensaje explicativo junto a él.  
**Responsable:** Frontend.  
**¿Se solucionó?** No (frontend pendiente). El backend rechaza al guardar, pero
la pantalla no muestra el mensaje junto al campo durante la edición.

---

### DG-03: El valor meta admite negativos sin aviso

**Tipo:** Observación de validación.  
**Descripción:** La línea base tiene restricción mínima de `0`, pero el campo
`valor_meta` aceptaba `-10` sin advertencia visible.  
**Causa backend:** `valor_meta` no tenía `min_value=0` en el serializer.  
**Responsable:** Backend + Frontend.  
**¿Se solucionó?** Sí en backend. `MetaIndicadorProyectoSerializer.validate()`
ya rechaza `linea_base`, `valor_meta` y `valor_alcanzado` negativos con `400`.  
**Pendiente en frontend:** Agregar `min="0"` en el input de `valor_meta` para
consistencia visual con la línea base.

---

### DG-04: No se avisa cuando la fecha de término es anterior a la de inicio

**Tipo:** Observación de validación (fechas del proyecto).  
**Descripción:** Al ingresar `fecha_inicio = 20/11/2026` y `fecha_termino =
10/10/2026`, la pantalla no mostraba ningún aviso durante la edición.  
**Causa backend:** La validación de orden de fechas solo existía al enviar a
revisión (corregido como BUG-005).  
**Responsable:** Backend + Frontend.  
**¿Se solucionó?** Sí en backend (BUG-005). Ahora cualquier guardado rechaza
fechas invertidas con `400`.  
**Pendiente en frontend:** Mostrar el aviso junto al campo de fecha de término
mientras el usuario edita, sin esperar a guardar.

---

### DG-05: No se aclara si las fechas de evaluación/encuesta pueden salir del periodo

**Tipo:** Observación; requiere confirmación de regla de negocio.  
**Descripción:** Se pudieron ingresar una evaluación de avance anterior al
inicio del proyecto y encuestas fuera del periodo, sin ningún aviso.  
**Causa:** No estaba definida ni documentada la regla sobre si esas fechas deben
estar dentro del periodo del proyecto.  
**Responsable:** Requiere decisión del cliente.  
**¿Se solucionó?** Parcialmente. El backend ya valida que `fecha_evaluacion_avance >= fecha_inicio`
(BUG-005). Las fechas de encuestas no tienen validación de rango actualmente.  
**Pendiente:** Confirmar con el cliente si las encuestas deben caer dentro del
periodo del proyecto y, si es así, agregar la validación en backend.

---

## Sección 2 — Fundamentación

### FU-01: No hay aviso al avanzar con campos obligatorios vacíos

**Tipo:** Observación de UX de navegación.  
**Descripción:** Se puede pasar de Fundamentación a Diagnóstico dejando los
tres campos vacíos o con solo espacios, sin que aparezca ningún aviso.  
**Causa:** El formulario permite navegación libre entre secciones. La validación
de obligatorios solo ocurre al enviar a revisión.  
**Responsable:** Frontend.  
**¿Se solucionó?** No en esta sesión. El backend rechaza los campos vacíos al
enviar (`POST /revisar/`). El frontend debe mostrar los avisos al intentar
avanzar o al detectar espacios como valor inválido.

---

## Sección 3 — Diagnóstico

### DI-01: No hay aviso al avanzar con campos obligatorios vacíos

**Tipo:** Observación de UX de navegación.  
**Descripción:** Los cuatro campos (estado actual, problemas, aportes,
justificación) se pueden dejar vacíos o con solo espacios y avanzar a
Objetivos sin ningún aviso.  
**Causa:** Igual que FU-01: navegación libre; validación solo al enviar.  
**Responsable:** Frontend.  
**¿Se solucionó?** No. El backend valida `diag_justificacion_intervencion` al
enviar. Frontend debe mostrar aviso al intentar avanzar.

---

## Sección 4 — Objetivos

### OB-01: No hay aviso al avanzar sin respuestas ni ODS seleccionado

**Tipo:** Observación de UX de navegación.  
**Descripción:** Se puede avanzar a Resultados con los dos textos vacíos y sin
ningún ODS marcado, sin recibir aviso.  
**Causa:** Misma causa que FU-01 y DI-01.  
**Responsable:** Frontend.  
**¿Se solucionó?** No. El backend exige al menos un ODS y los textos al enviar.
Frontend debe avisar al intentar avanzar.

---

## Sección 5 — Resultados

### RE-01: No hay aviso al avanzar con campos de logros vacíos

**Tipo:** Observación de UX de navegación.  
**Descripción:** Los dos campos de logros esperados se pueden dejar vacíos o
con solo espacios y avanzar a Actividades sin ningún aviso.  
**Causa:** Misma causa que FU-01.  
**Responsable:** Frontend.  
**¿Se solucionó?** No. El backend valida estos campos al enviar. Frontend debe
avisar al intentar avanzar.

---

## Sección 6 — Actividades

### AC-01: No hay aviso para el campo responsable obligatorio

**Tipo:** Observación de UX — parcialmente obsoleta por cambio de modelo.  
**Descripción:** Al completar nombre y descripción pero dejar el responsable
vacío, se permitía avanzar a Cronograma sin aviso.  
**Causa original:** El campo `responsable` estaba en la actividad sin validación
en el frontend.  
**Estado actual:** El campo `responsable` **ya no existe en la actividad**.
Se movió a las acciones del cronograma (`acciones[].responsable`) como parte
del Sprint 8. El frontend deberá actualizarse para reflejar el nuevo modelo:
la actividad solo tiene nombre y descripción; el responsable se ingresa en
cada acción del cronograma.  
**¿Se solucionó?** La observación es obsoleta con el nuevo modelo. El
`responsable` ahora vive en las acciones y el backend ya valida que cada
acción tenga sus campos completos al enviar a revisión.

---

## Sección 7 — Cronograma

**Sin fallos ni observaciones pendientes.**  
Las pruebas confirmaron que:
- Campos vacíos muestran aviso de descripción y fechas obligatorias.
- Fechas invertidas muestran aviso "Fin menor a Inicio".
- Descripción con solo espacios muestra aviso de campo vacío.
- La sección funciona correctamente tanto en edición como en validación.

---

## Sección 8 — Recursos

### RC-01: El total de integrantes no coincide con cantidades decimales

**Tipo:** Observación de UX.  
**Descripción:** Al ingresar `1.5` estudiantes, el total visible muestra `2`
sin ningún aviso de que el decimal no es válido.  
**Causa frontend:** El input no tiene `step="1"`, por lo que el navegador
permite el decimal y el cálculo visual del total usa la fracción sin avisar.  
**Causa backend:** Ninguna. Los campos son `PositiveIntegerField`; DRF convierte
`int(1.5) = 1` silenciosamente (ver también VF-03). El servidor no retorna
error específico para esta conversión.  
**Responsable:** Frontend principalmente. Backend tiene la misma limitación que VF-03.  
**¿Se solucionó?** No en esta sesión. Frontend debe agregar `step="1"` al
input y corregir el cálculo visual.

---

## Sección 9 — Financiamiento

### Reintentar el envío crea un proyecto duplicado en borrador

**Tipo:** Fallo confirmado.  
**Descripción:** Al enviar el formulario incompleto y volver a pulsar guardar,
se creaba un segundo borrador con el mismo título. Quedaron evidencia los
borradores PROY-FIPS-0157 y PROY-FIPS-0158.  
**Causa:** Cada `POST /proyectos/` creaba un nuevo registro sin verificar si
ya existía uno igual del mismo docente.  
**Responsable:** Backend.  
**¿Se solucionó?** Sí.  
**Cómo:** Se sobreescribió `perform_create()` en `ProyectoListCreateView`
(`apps/proyectos/views.py`). Si ya existe un borrador del mismo docente con
el mismo título y facultad, retorna el existente sin duplicar.

---

### Al enviar incompleto el sistema no explica qué falta

**Tipo:** Fallo de comunicación de errores.  
**Descripción:** Al pulsar "Finalizar y Guardar" con el proyecto incompleto,
el servidor rechaza el envío pero la pantalla vuelve a mostrar el formulario
sin ningún mensaje explicativo.  
**Causa backend:** Ninguna. El backend retorna `400` con detalle:
```json
{
  "errors": {
    "periodo": "Este campo es obligatorio.",
    "cronograma": "Cada actividad debe tener al menos una acción completa.",
    "docentes_participantes": "Debe indicar 2 nombres de docentes."
  }
}
```
**Causa frontend:** El frontend no lee ni muestra el contenido de
`response.data.errors`.  
**Responsable:** Solo Frontend.  
**¿Se solucionó?** Backend ya correcto. Frontend pendiente: debe leer `errors`
y mostrar los mensajes junto a los campos o en un resumen visible.

---

### La cantidad negativa en partidas calcula un monto incorrecto

**Tipo:** Observación de edición.  
**Descripción:** Al ingresar cantidad `-2` y precio `S/10`, la pantalla mostraba
`Monto Ejecutado: S/ -20.00`. Solo avisaba la diferencia con el monto asignado,
no que la cantidad fuera negativa.  
**Causa backend:** `validate_cantidad` no existía en `PartidaPresupuestariaSerializer`.  
**Causa frontend:** El input no tenía `min="0"`.  
**Responsable:** Backend + Frontend.  
**¿Se solucionó?** Sí en backend. `validate_cantidad` y `validate_costo_unitario`
en `PartidaPresupuestariaSerializer` (`apps/proyectos/serializers.py`) rechazan
negativos con `400`. El valor no persiste.  
**Pendiente en frontend:** Agregar `min="0"` al input de cantidad para bloquear
el ingreso de negativos en pantalla.

---

# Resumen general

## Bugs del PIS (BUG-002 a BUG-007)

| Bug | Descripción | Estado |
|---|---|---|
| BUG-002 | Periodo con fechas invertidas | ✅ Corregido en backend |
| BUG-003 | Campo presupuesto_global inexistente | ✅ Cerrado (ya no existía) |
| BUG-004 | Actividad sugerida con objetivo de otro eje | ✅ Corregido en backend |
| BUG-005 | Proyecto con fechas invertidas | ✅ Corregido en backend |
| BUG-007 | Celular acepta formatos inválidos | ✅ Corregido en backend |

## Bugs y observaciones del Bug_006 (9 secciones)

| Sección | Código | Descripción | Responsable | Estado |
|---|---|---|---|---|
| 1 Datos generales | VF-03 | Cantidades cambian al guardar sin avisar | Backend + Frontend | ✅ Backend corregido / ⏳ UI frontend (step="1") |
| 1 Datos generales | DG-01 | Semestre muestra datos de prueba | Datos (admin) | ⏳ Eliminar periodos QA del admin |
| 1 Datos generales | DG-02 | Sin aviso junto al campo cuando cantidad es inválida | Frontend | ⏳ Pendiente frontend |
| 1 Datos generales | DG-03 | Valor meta admite negativos sin aviso | Backend + Frontend | ✅ Backend corregido / ⏳ UI frontend |
| 1 Datos generales | DG-04 | Sin aviso con fechas de ciclo invertidas | Backend + Frontend | ✅ Backend corregido (BUG-005) / ⏳ UI frontend |
| 1 Datos generales | DG-05 | Fechas de encuesta fuera del periodo sin aviso | Requiere decisión cliente | ⏳ Confirmar regla con cliente |
| 2 Fundamentación | FU-01 | Sin aviso al avanzar con campos vacíos | Frontend | ⏳ Pendiente frontend |
| 3 Diagnóstico | DI-01 | Sin aviso al avanzar con campos vacíos | Frontend | ⏳ Pendiente frontend |
| 4 Objetivos | OB-01 | Sin aviso al avanzar sin respuestas ni ODS | Frontend | ⏳ Pendiente frontend |
| 5 Resultados | RE-01 | Sin aviso al avanzar con campos de logros vacíos | Frontend | ⏳ Pendiente frontend |
| 6 Actividades | AC-01 | Sin aviso para responsable (campo obsoleto) | — | ✅ Obsoleto: responsable movido a acciones del cronograma |
| 7 Cronograma | — | Sin fallos | — | ✅ Sin problemas |
| 8 Recursos | RC-01 | Total incorrecto con cantidades decimales | Frontend | ✅ Backend valida / ⏳ UI frontend |
| 9 Financiamiento | VF-02 | Reintentar crea borrador duplicado | Backend | ✅ Corregido en backend |
| 9 Financiamiento | VF-01 | Envío rechazado sin explicar qué falta | Frontend | ✅ Backend retorna errors / ⏳ Mostrar en frontend |
| 9 Financiamiento | FI-01 | Cantidad negativa calcula monto incorrecto | Backend + Frontend | ✅ Backend corregido / ⏳ UI frontend |

**Tests:** 151 tests pasan en SQLite tras aplicar todas las correcciones de backend.

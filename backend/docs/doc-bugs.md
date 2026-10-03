# Reporte de Bugs — Correcciones de Backend

Estado al **03/10/2026**. Todos los bugs listados en el PIS de anotaciones
(BUG-002 a BUG-007 y VF-02) fueron revisados; los corregibles en backend
están resueltos.

---

## BUG-002 — Periodo académico: fecha de fin anterior a fecha de inicio

**Síntoma:** Se podía guardar un periodo con `fecha_fin < fecha_inicio` sin
que el sistema lo rechazara.

**Causa:** `PeriodoAcademicoSerializer` no tenía validación de orden de fechas.

**Corrección (`apps/planificacion/serializers.py`):**

Se agregó `validate()` a `PeriodoAcademicoSerializer`:
```python
def validate(self, attrs):
    inicio = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
    fin = attrs.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))
    if inicio and fin and fin < inicio:
        raise serializers.ValidationError(
            {'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'})
    return attrs
```

**Resultado:** Intentar crear o editar un periodo con fechas invertidas responde
`400` con el mensaje descriptivo en `fecha_fin`.

---

## BUG-003 — `presupuesto_global` en MatrizOperativa

**Síntoma reportado:** Error al acceder al campo `presupuesto_global` de
`MatrizOperativa`.

**Verificación:** El campo ya fue eliminado en la migración
`planificacion/0010_matriz_como_documento` (parte de la refactorización del
modelo que convirtió la MatrizOperativa en Documento de apoyo). No existe en
el modelo actual ni en los serializers ni en las vistas.

**Estado: CERRADO — ya no existe el campo.**

---

## BUG-004 — ActividadSugerida: objetivo no pertenece al eje RSU seleccionado

**Síntoma:** Se podía crear una `ActividadSugerida` donde `objetivo` pertenecía
a un eje RSU diferente al `eje_rsu` indicado, generando inconsistencia.

**Causa:** `ActividadSugeridaSerializer` no validaba la consistencia entre
`objetivo` y `eje_rsu`.

**Corrección (`apps/planificacion/serializers.py`):**

Se agregó `validate()` a `ActividadSugeridaSerializer`:
```python
def validate(self, attrs):
    eje_rsu = attrs.get('eje_rsu', getattr(self.instance, 'eje_rsu', None))
    objetivo = attrs.get('objetivo', getattr(self.instance, 'objetivo', None))
    if eje_rsu and objetivo and objetivo.eje_rsu_id != eje_rsu.id:
        raise serializers.ValidationError(
            {'objetivo': 'El objetivo seleccionado no pertenece al eje RSU indicado.'})
    return attrs
```

**Resultado:** Si el `objetivo` no pertenece al `eje_rsu` enviado, responde
`400` en `errors.objetivo`.

---

## BUG-005 — Proyecto: `fecha_termino` anterior a `fecha_inicio`

**Síntoma:** Se podía guardar un proyecto con fechas de ciclo invertidas
(`fecha_termino < fecha_inicio`).

**Causa:** La validación de fechas existía en `_validar_campos_obligatorios`
(solo al enviar a revisión), pero no en `ProyectoRSUSerializer.validate()`,
por lo que al guardar un borrador las fechas no se validaban.

**Corrección (`apps/proyectos/serializers.py`):**

Se agregó `_validate_fechas_proyecto()` llamado desde `validate()`:
```python
def _validate_fechas_proyecto(self, attrs):
    inst = self.instance
    inicio = attrs.get('fecha_inicio', getattr(inst, 'fecha_inicio', None))
    termino = attrs.get('fecha_termino', getattr(inst, 'fecha_termino', None))
    if inicio and termino and termino < inicio:
        raise serializers.ValidationError(
            {'fecha_termino': 'La fecha de término no puede ser anterior a la fecha de inicio.'})
    evaluacion = attrs.get('fecha_evaluacion_avance', getattr(inst, 'fecha_evaluacion_avance', None))
    if inicio and evaluacion and evaluacion < inicio:
        raise serializers.ValidationError(
            {'fecha_evaluacion_avance': 'La fecha de evaluación no puede ser anterior a la fecha de inicio.'})
    if evaluacion and termino and termino < evaluacion:
        raise serializers.ValidationError(
            {'fecha_termino': 'La fecha de término no puede ser anterior a la fecha de evaluación de avance.'})
```

**Resultado:** Cualquier operación de creación o edición de proyecto con fechas
invertidas responde `400` con la clave específica que tiene el problema.

---

## BUG-007 — Celular: se aceptan letras y formatos inválidos

**Síntoma:** El campo `celular` aceptaba texto arbitrario (letras, guiones,
espacios). No se validaba el formato peruano (9 dígitos numéricos).

**Causa:** `MiPerfilUpdateSerializer` no tenía validador para `celular`.

**Corrección (`apps/usuarios/serializers.py`):**

Se agregó `validate_celular()` a `MiPerfilUpdateSerializer`:
```python
def validate_celular(self, value):
    if value:
        digitos = value.strip()
        if not digitos.isdigit() or len(digitos) != 9:
            raise serializers.ValidationError(
                'El celular debe tener exactamente 9 dígitos numéricos.')
    return value
```

**Resultado:** Ingresar un celular con letras, guiones o longitud diferente a 9
responde `400` en `errors.celular`. El campo es opcional: si se envía vacío o
nulo, no se valida.

---

## VF-02 — Borradores duplicados al reintentar la creación

**Síntoma:** Al hacer `POST /proyectos/` y la operación fallaba por error de
red o timeout, y el usuario volvía a enviar el formulario, se creaba un
proyecto duplicado en estado borrador.

**Causa:** Cada llamada a `POST /proyectos/` creaba un nuevo registro
independientemente de si ya existía uno igual del mismo docente.

**Corrección (`apps/proyectos/views.py`):**

Se sobreescribió `perform_create()` en `ProyectoListCreateView` para detectar
un borrador existente con el mismo docente + facultad + título antes de crear
uno nuevo:

```python
def perform_create(self, serializer):
    docente = self.request.user
    facultad_id = ...  # extrae de validated_data
    titulo = (serializer.validated_data.get('titulo') or '').strip()
    existente = ProyectoRSU.objects.filter(
        docente_responsable=docente,
        facultad_id=facultad_id,
        titulo=titulo,
        estado='borrador',
    ).first()
    if existente:
        serializer.instance = existente  # retorna el existente sin duplicar
        return
    serializer.save(docente_responsable=docente)
```

**Resultado:** Si el docente envía el mismo formulario dos veces (reintento),
la respuesta retorna el borrador que ya existe en vez de crear uno nuevo.
El comportamiento es idempotente para borradores con el mismo título y facultad.

---

## VF-01 — El rechazo al enviar no explica qué debe corregirse

**Reporte:** Bug_006 — Financiamiento. Al pulsar "Finalizar y Guardar" con
secciones incompletas, el servidor rechaza el envío pero la pantalla vuelve a
mostrar el formulario sin ningún mensaje visible que explique qué falta.

**Análisis:** El backend **ya retorna los errores** en la respuesta `400`:

```json
{
  "errors": {
    "periodo": "Este campo es obligatorio.",
    "cronograma": "Cada actividad debe tener al menos una acción completa.",
    "docentes_participantes": "Debe indicar 2 nombres de docentes.",
    "fecha_evaluacion_avance": "Este campo es obligatorio al enviar a revisión."
  }
}
```

El backend no tiene nada que corregir. El fallo es que el **frontend no lee
ni muestra** el contenido de `response.data.errors` al recibir el `400`.

**Estado: pendiente en frontend.** El frontend debe leer `errors` y mostrar
cada mensaje junto al campo correspondiente o en un resumen visible.

---

## FI-01 — El cálculo acepta cantidades negativas en partidas

**Reporte:** Bug_006 — Financiamiento. Al ingresar cantidad `-2` y precio
`S/10`, el sistema muestra `Monto Ejecutado: S/ -20.00` sin rechazarlo.

**Corrección en backend:** `validate_cantidad` en `PartidaPresupuestariaSerializer`
(ya aplicado en la sesión anterior) rechaza cualquier valor negativo:

```python
def validate_cantidad(self, value):
    if value is not None and value < 0:
        raise serializers.ValidationError('La cantidad no puede ser negativa.')
    return value
```

Al intentar guardar con cantidad negativa el backend responde `400`. El valor
no persiste en la base de datos.

**Pendiente en frontend:** La UI aún muestra el cálculo `S/ -20.00` localmente
antes de guardar. La corrección de frontend es agregar `min="0"` al input de
cantidad para bloquear el ingreso de negativos en pantalla.

**Estado backend: Corregido.** Pendiente de mejora visual en frontend.

---

## RC-01 — El total de integrantes no coincide con cantidades decimales

**Reporte:** Bug_006 — Recursos. Al ingresar `1.5` en el campo de estudiantes,
el total muestra `2` sin avisar que el valor decimal no es válido.

**Análisis:** Los campos `nro_docentes`, `nro_estudiantes` y los seis
`rec_hum_*` son `PositiveIntegerField` en Django. DRF los valida y responde
`400 "A valid integer is required."` si llega `1.5`. El backend **ya rechaza
decimales** en estos campos.

Lo que ocurre es que el navegador (con `<input type="number">`) redondea
internamente el valor o lo marca como inválido antes de enviarlo, pero el
frontend muestra el total visual calculado con el decimal (`1 + 1.5 = 2`)
sin advertirlo.

**Estado backend: Sin cambio necesario** — ya validado por el tipo de campo.
**Pendiente en frontend:** Agregar `step="1"` al input para forzar enteros y
corregir el cálculo visual del total.

---

## Resumen

| Bug | Reporte | Archivo modificado | Estado |
|---|---|---|---|
| BUG-002 Periodo fechas invertidas | PIS BUG-002 | `apps/planificacion/serializers.py` | **Corregido backend** |
| BUG-003 presupuesto_global | PIS BUG-003 | — | **Cerrado** (campo ya eliminado) |
| BUG-004 ActividadSugerida eje vs objetivo | PIS BUG-004 | `apps/planificacion/serializers.py` | **Corregido backend** |
| BUG-005 Proyecto fechas invertidas | PIS BUG-005 | `apps/proyectos/serializers.py` | **Corregido backend** |
| BUG-007 Celular formato inválido | PIS BUG-007 | `apps/usuarios/serializers.py` | **Corregido backend** |
| VF-02 Borradores duplicados | Bug_006 Financiamiento | `apps/proyectos/views.py` | **Corregido backend** |
| VF-01 Rechazo sin explicación | Bug_006 Financiamiento | — | **Pendiente frontend** |
| FI-01 Cantidad negativa en partidas | Bug_006 Financiamiento | `apps/proyectos/serializers.py` | **Corregido backend** / pendiente UI frontend |
| RC-01 Decimales en integrantes | Bug_006 Recursos | — | **Ya validado backend** / pendiente UI frontend |

Pruebas: **151 tests pasan** después de aplicar todas las correcciones de backend.

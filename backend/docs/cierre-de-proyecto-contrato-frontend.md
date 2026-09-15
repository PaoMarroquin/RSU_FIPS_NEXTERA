# Cierre de proyecto (marcar como "Finalizado") - contrato para el frontend

## Por que existe esto

Hasta ahora no habia ningun camino para que un proyecto llegara a estado
`finalizado`. El `porcentaje_ejecucion` se calcula solo (sube cada vez que
se completa una actividad), pero nada revisaba ese numero para cambiar el
estado del proyecto: aunque llegara a 100%, el proyecto se quedaba en
`en_ejecucion` para siempre. Por eso nunca aparecia como "Finalizado" en el
informe consolidado de HU-06 (que solo cuenta proyectos `aprobado` o
`finalizado`).

Este endpoint es el paso que faltaba, y necesita este mismo sprint (HU-06)
para que la pantalla de "proyectos aprobados y finalizados" tenga datos
reales de proyectos finalizados que mostrar.

## Quien lo hace

**No lo hace el docente.** El 100% de actividades es solo la senal de "listo
para cerrar"; quien confirma que el proyecto realmente cumplio es una
autoridad institucional, igual que ya pasa con Aprobar/Observar:

| Rol | Puede finalizar |
|---|---|
| Administrador | Cualquier proyecto |
| Jefatura RSU | Solo proyectos de su propia facultad |
| Departamento | Solo proyectos de su propio departamento academico |
| Docente | No (403) |

## El flujo completo (probado de punta a punta)

```
1. Docente completa la ultima actividad pendiente
   POST /proyectos/<id>/avances/
   { "actividad": <id>, "descripcion": "...", "estado_actividad": "completada" }
        │
        ▼
2. El backend recalcula el % del proyecto (automatico, sin pedir nada)
   porcentaje_ejecucion = actividades completadas / total * 100
        │
        │  Si el porcentaje ACABA de llegar a 100% (no si ya estaba en 100%)
        ▼
3. Se notifica solo, sin que nadie lo pida, a:
   - el/los usuario(s) con rol Departamento del mismo departamento_id
   - el/los usuario(s) con rol Jefatura RSU de la misma facultad_id
   GET /notificaciones/  ->  tipo: "listo_para_cerrar"
        │
        ▼
4. Esa misma persona (o cualquier otra con el mismo alcance) puede
   consultar la bandeja de pendientes en cualquier momento, no solo por
   la notificacion:
   GET /proyectos/para-finalizar/
        │
        ▼
5. Confirma el cierre
   POST /proyectos/<id>/finalizar/
        │
        ▼
6. El proyecto pasa a 'finalizado', y el docente recibe su propia
   notificacion (tipo "finalizacion") avisandole que ya cerro.
```

Los pasos 1, 2 y 6 ya existian antes de esto (avances de HU-05, notificaciones
de HU-04). Lo nuevo son los pasos 3, 4 y 5.

## Endpoint para confirmar el cierre

```
POST /api/v1/proyectos/<id>/finalizar/
```

No requiere body.

### Reglas (en este orden)

1. El proyecto debe existir y estar dentro del alcance del usuario (mismo
   criterio de visibilidad que el resto del sistema) - si no, `404`.
2. El proyecto debe estar en estado `en_ejecucion` - si no, `400`.
3. `porcentaje_ejecucion` debe ser exactamente `100.00` - si no, `400` con
   el porcentaje actual en el mensaje, para que la UI pueda mostrarlo.

### Respuesta exitosa - `200 OK`

```json
{
  "detail": "Proyecto finalizado exitosamente."
}
```

Efectos en el backend (automaticos, no hace falta pedir nada mas):
- `estado` pasa a `finalizado`.
- `fecha_cierre` se guarda con la fecha/hora actual.
- Se registra una entrada en el historial de estados del proyecto (mismo
  bloque `historial_estados` que ya trae el detalle del proyecto).
- Se crea una notificacion para el docente responsable (tipo
  `finalizacion`), visible en `GET /notificaciones/`.

### Respuestas de error

**400 - porcentaje incompleto:**
```json
{
  "error": "Bad Request",
  "detail": "Errores de validación.",
  "errors": {
    "non_field_errors": [
      "El proyecto tiene 80.00% de actividades completadas. Debe llegar al 100% antes de poder finalizarlo."
    ]
  }
}
```

**400 - estado invalido** (ej. todavia en `aprobado`, o ya `finalizado`):
```json
{
  "error": "Bad Request",
  "detail": "Errores de validación.",
  "errors": {
    "non_field_errors": [
      "Solo se pueden finalizar proyectos en ejecucion (estado actual: 'aprobado')."
    ]
  }
}
```

**403 - rol sin permiso** (ej. Docente):
```json
{
  "error": "Forbidden",
  "detail": "You do not have permission to perform this action.",
  "errors": null
}
```

**404 - fuera de alcance** (ej. Jefatura de otra facultad, o el proyecto no
existe):
```json
{
  "error": "Not Found",
  "detail": "No ProyectoRSU matches the given query.",
  "errors": null
}
```

## Bandeja de pendientes

```
GET /api/v1/proyectos/para-finalizar/
```

Lista, paginada igual que el resto de listados de proyectos, los proyectos
`en_ejecucion` con `porcentaje_ejecucion = 100` dentro del alcance del
usuario (misma logica de facultad/departamento que ya usan `para-revisar` y
el resto del sistema). Devuelve el mismo objeto de proyecto que ya usan las
demas pantallas (`ProyectoRSUSerializer`), no hace falta un componente
nuevo para pintarlo - es la misma ficha que ya conocen, solo que filtrada.

Mismos codigos de acceso que el endpoint de arriba: `403` para Docente,
lista vacia (no error) si el usuario no tiene proyectos en ese estado dentro
de su alcance.

## Sugerencia de UI

- Un item en el menu de Departamento/Jefatura tipo "Proyectos por finalizar",
  alimentado por `GET /proyectos/para-finalizar/` - mismo patron que la
  bandeja de revision que ya existe.
- Dentro de la ficha de cada proyecto ahi, un boton "Marcar como finalizado"
  que llama a `POST /proyectos/<id>/finalizar/`.
- Las notificaciones tipo `listo_para_cerrar` (ya las trae `GET
  /notificaciones/`) pueden linkear directo a esa ficha - no dependen de la
  bandeja, llegan solas apenas el proyecto pasa el 100%.

Si el usuario intenta finalizar con menos de 100%, el backend ya rechaza y
devuelve el mensaje con el porcentaje actual - basta con mostrar
`error.response.data.errors.non_field_errors[0]` en un toast, mismo patron
que ya se usa para los errores de Aprobar/Observar.

## Conecta con

- `backend/apps/proyectos/views.py` - clases `ProyectoFinalizarView`,
  `ProyectosParaFinalizarView`, y el helper `_notificar_listo_para_cerrar`
  (colgado de `_recalcular_porcentaje_ejecucion`, que es donde ya se
  recalculaba el % en cada avance).
- `backend/apps/proyectos/urls.py` - rutas `proyecto-finalizar` y
  `proyecto-para-finalizar`.
- `backend/apps/proyectos/models.py` - tipos de notificacion `finalizacion`
  y `listo_para_cerrar` en `Notificacion.TIPOS`.
- `backend/apps/proyectos/tests.py` - clases `ProyectoFinalizarAPITests` (9
  casos: permisos, porcentaje incompleto, estado invalido, alcance por
  facultad, exito, doble finalizacion, bandeja) y
  `NotificarListoParaCerrarAPITests` (2 casos: se notifica al llegar a 100%,
  no se re-notifica si ya estaba en 100%).
- HU-06 (`backend/docs/HU-06-contrato-frontend.md`) - una vez que existan
  proyectos `finalizado` de verdad, el informe consolidado y el repositorio
  historico van a empezar a mostrar datos ahi.

# HU-07 - Repositorio Historico: contrato para el frontend

Sprint 7 (T-120 a T-124). Lo que el frontend necesita para construir la
pantalla del Repositorio Historico: listado con filtros, ficha tecnica,
informe final y lecciones aprendidas.

Base de la API: `/api/v1/`
Autenticacion: `Authorization: Bearer <access_token>` (JWT, igual que el resto).

---

## 1. Reglas generales

- **Solo proyectos `finalizado`.** Ningun parametro permite ver proyectos en
  otro estado. Pedir la ficha de un proyecto no finalizado responde `404`.
- **Acceso institucional.** Entran los cuatro roles (Administrador, Docente,
  Departamento y Jefatura RSU) y todos ven los proyectos finalizados de toda
  la universidad, sin recorte por facultad. Sin autenticar: `401`. Usuario
  sin rol: `403`.
- **Solo lectura.** Todos los endpoints aceptan solo `GET`; el resto
  responde `405`. Toda respuesta trae `"solo_lectura": true`.

## 2. Endpoints

| Metodo y ruta | Tarea | Que devuelve |
|---|---|---|
| `GET /repositorio/filtros/` | T-120 | Catalogos para los combos |
| `GET /repositorio/proyectos/` | T-121, T-122 | Listado paginado y filtrado |
| `GET /repositorio/proyectos/<id>/` | T-123 | Ficha tecnica completa |
| `GET /repositorio/proyectos/<id>/informe-final/` | T-124 | Informe final y resultados |
| `GET /repositorio/lecciones-aprendidas/` | T-124 | Lecciones de todos los proyectos |

## 3. Filtros

Aplican a `/repositorio/proyectos/` y a `/repositorio/lecciones-aprendidas/`.
Todos son opcionales y combinables.

| Parametro | Tipo | Origen del valor |
|---|---|---|
| `semestre` | texto, p. ej. `2025-A` | `filtros.semestres[]` |
| `facultad` | id | `filtros.facultades[].id` |
| `escuela` | id | `filtros.escuelas[].id` |
| `departamento` | id | `filtros.departamentos[].id` |
| `eje_rsu` | id | `filtros.ejes_rsu[].id` |
| `ods` | id (no el numero) | `filtros.ods[].id` |
| `periodo` | id | `filtros.periodos[].id` |
| `anio` | numero | `filtros.anios[]` |
| `fecha_cierre_desde` / `fecha_cierre_hasta` | `AAAA-MM-DD`, inclusive | - |
| `q` | texto | Busca en titulo, codigo, docente, lugar y lecciones |

**Varios valores por filtro:** separados por coma o repitiendo el parametro
(`?ods=3,7` o `?ods=3&ods=7`).

**Como se combinan:** dentro de un mismo filtro, con **O**; entre filtros
distintos, con **Y**.

```
GET /repositorio/proyectos/?facultad=1&semestre=2025-A,2025-B&ods=3,7
=> proyectos de la facultad 1, del semestre 2025-A o 2025-B,
   alineados al ODS con id 3 o 7
```

Un proyecto con varios ODS o ejes que coinciden sale una sola vez.

Los valores vacios o invalidos se ignoran en lugar de dar error. La respuesta
trae `filtros_aplicados` con lo que el backend acepto realmente; conviene
pintar los chips de filtros activos a partir de ese campo.

**Orden:** `?ordering=` con `fecha_cierre`, `titulo`, `codigo`, `semestre` o
`facultad`; con `-` delante es descendente. Por defecto `-fecha_cierre`.

**Paginacion:** `?page=` y `?page_size=` (20 por defecto, maximo 100).

## 4. `GET /repositorio/filtros/`

Solo trae valores que aparecen en al menos un proyecto finalizado.
`escuelas` y `departamentos` traen `facultad_id` para armar combos en cascada.

```json
{
  "solo_lectura": true,
  "semestres": ["2025-B", "2025-A"],
  "anios": [2025],
  "periodos": [{"id": 4, "nombre": "2025-B", "anio": 2025, "semestre": "II"}],
  "facultades": [{"id": 1, "nombre": "Ingenieria de Produccion y Servicios"}],
  "escuelas": [{"id": 2, "nombre": "Ingenieria de Sistemas", "facultad_id": 1}],
  "departamentos": [{"id": 3, "nombre": "...", "facultad_id": 1}],
  "ejes_rsu": [{"id": 1, "nombre": "Gestión"}],
  "ods": [{"id": 4, "numero": 4, "nombre": "Educación de calidad", "icono_url": "..."}],
  "ordenamientos": ["codigo", "facultad", "fecha_cierre", "semestre", "titulo"]
}
```

## 5. `GET /repositorio/proyectos/`

```json
{
  "count": 3, "next": null, "previous": null,
  "solo_lectura": true,
  "filtros_aplicados": {"facultad": [1], "semestre": ["2025-A"]},
  "ordering": "-fecha_cierre",
  "results": [
    {
      "id": 12, "codigo": "RSU-2025-012", "titulo": "Reciclaje en colegios",
      "estado": "finalizado", "estado_display": "Finalizado",
      "semestre_academico": "2025-A",
      "periodo": {"id": 3, "nombre": "2025-A"},
      "facultad": {"id": 1, "nombre": "..."},
      "escuela": {"id": 2, "nombre": "..."},
      "departamento": {"id": 3, "nombre": "..."},
      "ejes_rsu": [{"id": 1, "nombre": "Gestión"}],
      "ods": [{"id": 4, "numero": 4, "nombre": "...", "icono_url": "..."}],
      "docente_responsable": "Ana Quispe",
      "fecha_inicio": "2025-03-10", "fecha_termino": "2025-07-15",
      "fecha_cierre": "2025-07-20T15:02:11-05:00",
      "nro_docentes": 2, "nro_estudiantes": 30,
      "lugar_ejecucion": "Cayma, Arequipa",
      "tiene_informe_final": true,
      "tiene_lecciones_aprendidas": true
    }
  ]
}
```

`periodo`, `escuela` y `departamento` pueden venir en `null`.

## 6. `GET /repositorio/proyectos/<id>/` - ficha tecnica

Trae la misma cabecera que el listado y, ademas, una clave por seccion del
ANEXO 4:

| Clave | Contenido |
|---|---|
| `datos_generales` | asignaturas, participantes, docentes adicionales, beneficiarios, sub-items de eje, tipo de actividad (ya con etiqueta), año de carrera, fechas de evaluacion y encuestas, lugar |
| `alineamiento` | linea estrategica, objetivo institucional, objetivos regionales y nacionales |
| `fundamentacion` | `por_que_grupo`, `para_que_proyecto`, `mecanismo_ensenanza` |
| `diagnostico` | `estado_grupo`, `problemas_detectados`, `aportes_formacion`, `justificacion_intervencion` |
| `objetivos` | `logro_intervencion`, `mejora_curricular` |
| `resultados_esperados` | `en_beneficiarios`, `en_curriculo`, `impacto_esperado` |
| `actividades` | lista con nombre, descripcion, responsable, fecha, estado |
| `cronograma` | lista con descripcion, fechas, responsable, estado de avance |
| `recursos` | `humanos` (cantidades) y `materiales` (textos) |
| `financiamiento` | monto total, fuente principal, `fuentes[]` y `partidas[]` |
| `metas_indicadores` | meta, indicador, linea base, valor meta y alcanzado |
| `documentos_sustento` | `id`, `nombre`, `url` del archivo |
| `trazabilidad` | fechas de creacion, envio, aprobacion, inicio de ejecucion y cierre |

Los campos de texto pueden venir en `null` si el docente no los lleno. No
incluye el historial de revisiones ni de estados: el repositorio muestra el
proyecto, no su tramite de aprobacion.

## 7. `GET /repositorio/proyectos/<id>/informe-final/`

Cabecera del proyecto mas:

```json
{
  "informe_final": {
    "conclusiones": "...",
    "recomendaciones": "...",
    "lecciones_aprendidas": "...",
    "medio_difusion": "Facebook de la escuela",
    "completo": false,
    "campos_pendientes": ["recomendaciones"]
  },
  "resultados_esperados": {
    "en_beneficiarios": "...", "en_curriculo": "...", "impacto_esperado": "..."
  },
  "resultados_alcanzados": {
    "avance": {"porcentaje_ejecucion": 100.0, "actividades_total": 4, "actividades_completadas": 4, "...": "..."},
    "metas": {"total": 2, "cumplidas": 1, "medidas": 2, "sin_medir": 0, "porcentaje_cumplimiento": 50.0},
    "presupuesto": {"monto_presupuestado": 350.0, "monto_ejecutado": 200.0, "...": "..."},
    "detalle_metas": [{"meta": "...", "valor_meta": 10.0, "valor_alcanzado": 12.0, "porcentaje_avance": 120.0, "...": "..."}]
  }
}
```

`avance`, `metas` y `presupuesto` tienen exactamente la misma forma que en la
ficha del informe consolidado de HU-06, asi que se pueden reutilizar esos
componentes. Si `completo` es `false`, conviene mostrar un aviso con los
`campos_pendientes` en vez de secciones vacias.

Los textos del informe final se registran al cerrar el proyecto, en el body
de `POST /proyectos/<id>/finalizar/` (ver
`cierre-de-proyecto-contrato-frontend.md`).

## 8. `GET /repositorio/lecciones-aprendidas/`

Mismo formato paginado, filtros y orden que `/repositorio/proyectos/`, pero
solo incluye proyectos que registraron lecciones aprendidas. Cada item trae
la cabecera del proyecto mas `lecciones_aprendidas` y `recomendaciones`.
Sirve para una vista del tipo "que aprendimos en los proyectos del eje X".

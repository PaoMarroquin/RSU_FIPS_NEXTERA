# HU-06 - Informes consolidados: contrato para el frontend

Sprint 6. Todo lo que el frontend necesita para construir el modulo de
informes consolidados y el perfil de Autoridad Universitaria.

Base de la API: `/api/v1/`
Autenticacion: `Authorization: Bearer <access_token>` (JWT, igual que el resto).

---

## 1. Quien accede

| Rol | Acceso | Alcance de los datos |
|---|---|---|
| Administrador | Si | Toda la universidad |
| Jefatura RSU (Coordinador RSU) | Si | Solo su facultad |
| Departamento | Si | Solo su departamento academico |
| Docente | No, responde 403 | - |
| Sin autenticar | No, responde 401 | - |

El recorte por rol lo hace el backend. El frontend no tiene que filtrar nada:
pida el informe y muestre lo que llegue.

## 2. Solo lectura (CA-02)

Los seis endpoints solo aceptan `GET`. Un `POST`, `PUT`, `PATCH` o `DELETE`
responde `405 Method Not Allowed`.

Toda respuesta trae `"solo_lectura": true`. Uselo como interruptor para
esconder o deshabilitar cualquier boton de editar, aprobar, observar o
eliminar cuando se este dentro del modulo de informes.

## 3. Alcance de los datos (CA-01)

El informe solo ve proyectos en estado `aprobado` o `finalizado`. No hay
parametro que amplie eso: enviar `estado=borrador` se ignora, y el campo
`filtros_aplicados` de la respuesta devuelve solo los filtros que el backend
acepto, para que la interfaz muestre exactamente lo que se aplico.

## 4. Filtros (CA-03)

Se envian como query params en cualquiera de los seis endpoints. Todos son
opcionales y combinables.

| Parametro | Tipo | Origen del valor |
|---|---|---|
| `facultad` | id | `filtros.facultades[].id` |
| `eje_rsu` | id | `filtros.ejes_rsu[].id` |
| `ods` | id | `filtros.ods[].id` |
| `periodo` | id | `filtros.periodos[].id` |
| `escuela` | id | `filtros.escuelas[].id` |
| `departamento` | id | `filtros.departamentos[].id` |
| `estado` | `aprobado` o `finalizado` | `filtros.estados[].valor` |

Un valor vacio o no numerico se ignora en lugar de dar error, asi que el
frontend puede mandar siempre el formulario completo.

Extra de `/informes/consolidado/`: `incluir_proyectos=false` devuelve solo los
agregados, sin la lista de proyectos. Util cuando la pantalla solo pinta
graficos.

## 5. Endpoints

### 5.1 `GET /api/v1/informes/consolidado/`

Respuesta completa para el dashboard.

```json
{
  "generado_en": "2026-09-11T05:57:19.295294+00:00",
  "solo_lectura": true,
  "estados_incluidos": ["aprobado", "finalizado"],
  "filtros_aplicados": {},
  "resumen": {
    "total_proyectos": 1,
    "aprobados": 0,
    "finalizados": 1,
    "docentes_responsables": 1,
    "total_docentes_declarados": 3,
    "total_estudiantes_declarados": 42,
    "avance_promedio": 100.0,
    "actividades_total": 1,
    "actividades_completadas": 1,
    "porcentaje_actividades_completadas": 100.0
  },
  "presupuesto": {
    "monto_financiado": 2500.0,
    "monto_presupuestado": 500.0,
    "monto_ejecutado": 480.0,
    "saldo_por_ejecutar": 20.0,
    "porcentaje_ejecucion_presupuestal": 96.0
  },
  "metas": {
    "total": 1,
    "cumplidas": 1,
    "porcentaje_cumplimiento": 100.0
  },
  "distribuciones": {
    "por_facultad": [{"etiqueta": "Ingenieria de Produccion y Servicios", "total": 1, "campo": "facultad"}],
    "por_escuela": [{"etiqueta": "Escuela Profesional de Ingenieria de Sistemas", "total": 1, "campo": "escuela"}],
    "por_eje_rsu": [{"etiqueta": "Gestion", "total": 1, "campo": "eje_rsu"}],
    "por_periodo": [{"etiqueta": "2026-I", "total": 1, "campo": "periodo"}],
    "por_estado": [{"etiqueta": "finalizado", "total": 1, "campo": "estado"}],
    "por_ods": [{"numero": 4, "etiqueta": "ODS 4: Educacion de calidad", "total": 1}]
  },
  "proyectos": [ /* ver 5.3 */ ]
}
```

Notas de uso:

- `resumen`, `presupuesto` y `metas` son las tarjetas de indicadores.
- Cada lista de `distribuciones` viene lista para un grafico de barras o
  torta: `etiqueta` en el eje y `total` como valor. Ya vienen ordenadas de
  mayor a menor, salvo `por_ods`, que va por numero de ODS.
- Los montos son numeros en soles con dos decimales. Los porcentajes ya
  vienen calculados de 0 a 100: no los vuelva a multiplicar.
- `docentes_responsables` cuenta personas distintas;
  `total_docentes_declarados` suma el campo que cada proyecto declaro. Son
  dos cifras distintas a proposito.

### 5.2 `GET /api/v1/informes/consolidado/filtros/`

Catalogos para poblar los combos. Solo trae valores que aparecen en al menos
un proyecto visible para ese usuario, de modo que no se ofrezcan opciones que
llevarian a un resultado vacio.

```json
{
  "solo_lectura": true,
  "estados": [{"valor": "aprobado", "nombre": "Aprobado"},
              {"valor": "finalizado", "nombre": "Finalizado"}],
  "facultades": [{"id": 1, "nombre": "Ingenieria de Produccion y Servicios"}],
  "escuelas": [{"id": 1, "nombre": "Escuela Profesional de Ingenieria de Sistemas"}],
  "departamentos": [{"id": 1, "nombre": "Departamento Academico de Ingenieria de Sistemas e Informatica"}],
  "ejes_rsu": [{"id": 1, "nombre": "Gestion"}],
  "periodos": [{"id": 1, "nombre": "2026-I"}],
  "ods": [{"id": 4, "numero": 4, "nombre": "Educacion de calidad"}]
}
```

Llamelo una vez al entrar a la pantalla. Si el usuario cambia de facultad,
no hace falta recargarlo: los catalogos no dependen de los filtros.

### 5.3 `GET /api/v1/informes/consolidado/proyectos/`

Listado paginado de fichas, con los mismos filtros. Parametros de paginacion:
`page` y `page_size` (20 por defecto, 200 como maximo).

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "PROY-FIPS-0001",
      "titulo": "Alfabetizacion digital en Characato",
      "estado": "finalizado",
      "estado_display": "Finalizado",
      "facultad": "Ingenieria de Produccion y Servicios",
      "facultad_id": 1,
      "escuela": "Escuela Profesional de Ingenieria de Sistemas",
      "escuela_id": 1,
      "departamento": "Departamento Academico de Ingenieria de Sistemas e Informatica",
      "departamento_id": 1,
      "periodo": "2026-I",
      "periodo_id": 1,
      "semestre_academico": "2026-I",
      "eje_rsu": "Gestion",
      "eje_rsu_id": 1,
      "linea_estrategica": null,
      "objetivo_institucional": null,
      "ods": [{"numero": 4, "nombre": "Educacion de calidad"}],
      "beneficiarios": ["Comunidad universitaria - interna"],
      "docente_responsable": "Luis Mamani",
      "docente_responsable_id": 2,
      "nro_docentes": 3,
      "nro_estudiantes": 42,
      "fecha_inicio": "2026-03-15",
      "fecha_termino": "2026-07-15",
      "fecha_aprobacion": null,
      "fecha_cierre": null,
      "presupuesto": {
        "monto_declarado": 2500.0,
        "monto_financiado": 2500.0,
        "monto_presupuestado": 500.0,
        "monto_ejecutado": 480.0,
        "saldo_por_ejecutar": 20.0,
        "porcentaje_ejecucion_presupuestal": 96.0,
        "nro_partidas": 1,
        "nro_fuentes": 1,
        "financiamiento_confirmado": false
      },
      "metas": {
        "total": 1, "cumplidas": 1, "medidas": 1, "sin_medir": 0,
        "porcentaje_cumplimiento": 100.0
      },
      "avance": {
        "porcentaje_ejecucion": 100.0,
        "actividades_total": 1,
        "actividades_completadas": 1,
        "actividades_en_ejecucion": 0,
        "actividades_pendientes": 0,
        "avances_registrados": 1,
        "avances_observados": 0,
        "evidencias_vigentes": 1,
        "ultimo_avance": "2026-09-11T05:57:19.248095+00:00"
      }
    }
  ],
  "solo_lectura": true,
  "filtros_aplicados": {},
  "resumen": { /* mismo bloque de 5.1 */ }
}
```

La ficha que va en `results` es la misma que aparece dentro de `proyectos` en
el endpoint 5.1: un solo componente de tabla sirve para los dos.

### 5.4 `GET /api/v1/informes/consolidado/proyectos/<id>/`

Ficha detallada de un proyecto. Trae todo lo de 5.3 mas cuatro listas para
las pestanas de la pantalla de detalle:

- `detalle_presupuesto[]`: `categoria`, `tipo_recurso`, `descripcion`,
  `unidad`, `cantidad`, `costo_unitario`, `monto_presupuestado`,
  `monto_ejecutado`, `fuente`.
- `detalle_fuentes[]`: `fuente`, `monto`, `descripcion`.
- `detalle_metas[]`: `meta`, `indicador`, `unidad_medida`, `linea_base`,
  `valor_meta`, `valor_alcanzado`, `porcentaje_avance`,
  `metodo_verificacion`, `fuente_verificacion`.
- `detalle_avances[]`: `id`, `actividad`, `descripcion`, `estado_actividad`,
  `estado_revision`, `autor`, `created_at`, `evidencias`.

Responde `404` si el proyecto no esta aprobado ni finalizado, o si queda
fuera del alcance del rol. Es deliberado: no se distingue "no existe" de "no
puede verlo".

### 5.5 `GET /api/v1/informes/consolidado/export/pdf/`

Descarga el informe en PDF con los filtros que se le pasen.

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="informe-consolidado-rsu-AAAAMMDD-HHMM.pdf"`

### 5.6 `GET /api/v1/informes/consolidado/export/excel/`

Igual, en Excel. Tres hojas: `Resumen`, `Proyectos` (con autofiltro) y
`Distribuciones`.

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="informe-consolidado-rsu-AAAAMMDD-HHMM.xlsx"`

Como son descargas autenticadas, no sirve apuntar un `<a href>` directo: el
navegador no manda el token. Pidalas con fetch y abra el blob.

```js
async function descargarInforme(formato, filtros) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== '' && v != null)
  );
  const res = await fetch(
    `/api/v1/informes/consolidado/export/${formato}/?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`No se pudo generar el informe (${res.status})`);

  const blob = await res.blob();
  const nombre = (res.headers.get('Content-Disposition') || '')
    .match(/filename="?([^"]+)"?/)?.[1]
    ?? `informe-consolidado.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
```

`Content-Disposition` ya viene expuesto en CORS
(`CORS_EXPOSE_HEADERS = ['Content-Disposition']` en `config/settings.py`), asi
que el nombre del archivo que propone el backend se puede leer desde el
navegador.

## 6. Errores

Todos los errores llegan con el formato unico del backend:

```json
{
  "error": "Forbidden",
  "detail": "You do not have permission to perform this action.",
  "errors": null
}
```

| Codigo | Cuando | Que mostrar |
|---|---|---|
| 401 | Sin token o token vencido | Redirigir al login |
| 403 | Rol sin acceso, por ejemplo Docente | Pantalla de acceso restringido |
| 404 | Proyecto fuera de alcance o no consolidable | "El proyecto no esta disponible en el informe" |
| 405 | Se intento escribir en un endpoint de solo lectura | No deberia ocurrir: revisar el codigo del frontend |

## 7. Rendimiento

Medido con 300 proyectos, 900 partidas, 1200 actividades y 1200 avances:
0.11 s la consolidacion, 0.29 s el PDF y 0.46 s el Excel. El limite de CA-03
son 30 segundos, asi que no hace falta indicador de progreso mas alla de un
spinner normal.

## 8. Pendiente de decidir

El rol "Autoridad Universitaria" que menciona HU-06 no existe en el sistema:
los roles son Administrador, Docente, Departamento y Jefatura RSU. Hoy el
perfil de autoridad se cubre con Administrador o Jefatura RSU entrando a este
modulo, que es de solo lectura por construccion.

Si mas adelante se decide crear el rol, el unico cambio en el backend es
agregarlo a la lista de `PuedeVerInformesConsolidados` y decidir su alcance
en `queryset_consolidable()`. El contrato de la API no cambia.

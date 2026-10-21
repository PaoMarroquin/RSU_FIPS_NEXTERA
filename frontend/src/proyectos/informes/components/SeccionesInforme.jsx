import React from "react";
import {
  FiUsers,
  FiActivity,
  FiCheckCircle,
  FiTarget,
  FiPackage,
} from "react-icons/fi";
import { CampoLectura, CampoTexto, Indicador } from "./ComponentesUI";

// =====================================================
// CONTENEDOR GENERAL DE CADA PASO
// =====================================================
const ContenedorPaso = ({ titulo, descripcion, children }) => (
  <div className="animate-fade-in w-full">
    <div className="mb-6">
      <h3 className="text-xl font-bold text-slate-800">{titulo}</h3>
      <p className="text-xs text-slate-500 mt-1">{descripcion}</p>
    </div>
    <div className="w-full">{children}</div>
  </div>
);

// =====================================================
// COMPONENTE AUXILIAR: MOSTRAR DATOS
// =====================================================
const mostrarValor = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return "No especificado";
  }

  if (typeof valor === "boolean") {
    return valor ? "Sí" : "No";
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) return "No especificado";

    return valor
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }

        return (
          item?.nombre ??
          item?.nombre_completo ??
          item?.titulo ??
          "Sin nombre"
        );
      })
      .join(", ");
  }

  return String(valor);
};

const CampoGeneral = ({ label, value }) => (
  <CampoLectura label={label} value={mostrarValor(value)} />
);

// =====================================================
// PASO 1: DATOS GENERALES
// =====================================================
export const SeccionDatosGenerales = ({ informe }) => {
  // Los datos complementarios vienen anidados en datos_generales.
  const datos = informe?.datos_generales ?? {};

  return (
    <ContenedorPaso
      titulo="Datos Generales"
      descripcion="Información heredada del plan de proyecto inicial."
    >
      {/* INFORMACIÓN DEL PROYECTO */}
      <h4 className="text-sm font-bold text-slate-800 mb-3">
        Información del proyecto
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        <CampoGeneral label="Código" value={informe?.codigo} />
        <CampoGeneral label="Título" value={informe?.titulo} />

        <CampoGeneral
          label="Semestre académico"
          value={informe?.semestre_academico}
        />

        <CampoGeneral
          label="Facultad"
          value={informe?.facultad?.nombre}
        />

        <CampoGeneral
          label="Escuela profesional"
          value={informe?.escuela?.nombre}
        />

        <CampoGeneral
          label="Departamento"
          value={informe?.departamento?.nombre}
        />

        <CampoGeneral
          label="Fecha de inicio"
          value={informe?.fecha_inicio}
        />

        <CampoGeneral
          label="Fecha de término"
          value={informe?.fecha_termino}
        />

        <CampoGeneral
          label="Lugar de ejecución"
          value={datos.lugar_ejecucion}
        />

        <CampoGeneral
          label="Número de docentes"
          value={datos.nro_docentes}
        />

        <CampoGeneral
          label="Número de estudiantes"
          value={datos.nro_estudiantes}
        />

        <CampoGeneral
          label="Año de carrera"
          value={datos.anio_carrera}
        />

      </div>


      {/* DOCENTES PARTICIPANTES */}
      <h4 className="text-sm font-bold text-slate-800 mb-3">
        Docentes participantes
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        <CampoGeneral
          label="Cantidad de docentes"
          value={datos.nro_docentes}
        />

        <CampoGeneral
          label="Docentes participantes"
          value={datos.docentes_participantes}
        />

        <CampoGeneral
          label="Docentes adicionales"
          value={datos.docentes_adicionales}
        />
      </div>

    
      
      {/* EJES RSU Y ODS */}
      <h4 className="text-sm font-bold text-slate-800 mb-3">
        Ejes RSU y Objetivos de Desarrollo Sostenible
      </h4>

      <div className="flex flex-wrap gap-2 mb-6">
        {(informe?.ejes_rsu ?? []).map((eje) => (
          <span
            key={eje.id}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100"
          >
            {eje.nombre}
          </span>
        ))}

        {(informe?.ods ?? []).map((ods) => (
          <span
            key={ods.id}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100"
          >
            ODS {ods.numero}: {ods.nombre}
          </span>
        ))}

        {(!informe?.ejes_rsu || informe.ejes_rsu.length === 0) &&
          (!informe?.ods || informe.ods.length === 0) && (
            <p className="text-xs text-slate-400">
              No hay ejes RSU ni ODS registrados.
            </p>
          )}
      </div>

      {/* FECHAS DE EVALUACIÓN */}
      <h4 className="text-sm font-bold text-slate-800 mb-3">
        Fechas de evaluación y encuestas
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        <CampoGeneral
          label="Evaluación de avance"
          value={datos.fecha_evaluacion_avance}
        />

        <CampoGeneral
          label="Encuesta a docentes"
          value={datos.fecha_encuesta_docentes}
        />

        <CampoGeneral
          label="Encuesta a estudiantes"
          value={datos.fecha_encuesta_alumnos}
        />

        <CampoGeneral
          label="Encuesta al grupo destinatario"
          value={datos.fecha_encuesta_grupo_destinatario}
        />
      </div>

      {/* DOCENTE RESPONSABLE */}
      <h4 className="text-sm font-bold text-slate-800 mb-3">
        Docente responsable
      </h4>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 w-fit">
        <FiUsers className="text-[#b1122b]" />
        <span className="text-sm font-semibold text-slate-700">
          {mostrarValor(informe?.docente_responsable)}
        </span>
      </div>
    </ContenedorPaso>
  );
};

// =====================================================
// PASO 2: FORTALEZAS Y LIMITACIONES
// =====================================================
const CAMPOS_FORTALEZAS = [
  ["fortalezas", "Fortalezas"],
  ["oportunidades", "Oportunidades"],
  ["aliados", "Principales aliados"],
  ["debilidades", "Debilidades"],
  ["amenazas", "Amenazas"],
];

export const SeccionFortalezas = ({ textos, onChange, puedeEditar }) => (
  <ContenedorPaso
    titulo="Fortalezas y limitaciones"
    descripcion='Todos los campos son obligatorios para enviar. Si no aplica, escribe "n/a".'
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {CAMPOS_FORTALEZAS.map(([campo, label]) => (
        <CampoTexto
          key={campo}
          label={label}
          obligatorio
          altura="min-h-[110px]"
          disabled={!puedeEditar}
          value={textos[campo] ?? ""}
          onChange={(v) => onChange(campo, v)}
        />
      ))}

      <div className="md:col-span-2">
        <CampoTexto
          label="Estrategias empleadas para superar las limitaciones"
          obligatorio
          altura="min-h-[110px]"
          disabled={!puedeEditar}
          value={textos.estrategias ?? ""}
          onChange={(v) => onChange("estrategias", v)}
        />
      </div>
    </div>
  </ContenedorPaso>
);

// =====================================================
// PASO 3: RESULTADOS
// =====================================================
export const SeccionResultados = ({
  avance,
  esperados,
  textos,
  onChange,
  puedeEditar,
}) => (
  <ContenedorPaso
    titulo="Resultados"
    descripcion="Progreso actual de ejecución."
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Indicador
        icon={<FiActivity />}
        titulo="Ejecución"
        valor={`${avance?.porcentaje_ejecucion ?? 0}%`}
      />

      <Indicador
        icon={<FiCheckCircle />}
        titulo="Completadas"
        valor={`${avance?.actividades_completadas ?? 0}/${avance?.actividades_total ?? 1}`}
      />

      <Indicador
        icon={<FiTarget />}
        titulo="Actividades"
        valor={avance?.actividades_total ?? 0}
      />

      <Indicador
        icon={<FiCheckCircle />}
        titulo="Pendientes"
        valor={Math.max(
          (avance?.actividades_total ?? 0) -
            (avance?.actividades_completadas ?? 0),
          0
        )}
      />
    </div>

    <h4 className="text-sm font-bold text-slate-800 mb-4">
      Resultados esperados
    </h4>

    <div className="space-y-4">
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
        <p className="text-[10px] font-bold text-slate-500 uppercase">
          En beneficiarios
        </p>
        <p className="text-xs text-slate-700 mt-2">
          {esperados?.en_beneficiarios || "—"}
        </p>
      </div>

      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
        <p className="text-[10px] font-bold text-slate-500 uppercase">
          En currículo
        </p>
        <p className="text-xs text-slate-700 mt-2">
          {esperados?.en_curriculo || "—"}
        </p>
      </div>
    </div>

    <h4 className="text-sm font-bold text-slate-800 mt-8 mb-4">
      Resultados alcanzados
    </h4>

    <div className="space-y-5">
      <CampoTexto
        label="Resultados en el grupo destinatario"
        obligatorio
        altura="min-h-[110px]"
        disabled={!puedeEditar}
        value={textos.resultado_grupo_destinatario ?? ""}
        onChange={(v) => onChange("resultado_grupo_destinatario", v)}
      />

      <CampoTexto
        label="Resultados en el desarrollo curricular"
        obligatorio
        altura="min-h-[110px]"
        disabled={!puedeEditar}
        value={textos.resultado_desarrollo_curricular ?? ""}
        onChange={(v) => onChange("resultado_desarrollo_curricular", v)}
      />
    </div>
  </ContenedorPaso>
);

// =====================================================
// PASO 4: LECCIONES APRENDIDAS
// =====================================================
export const SeccionLecciones = ({ textos, onChange, puedeEditar }) => (
  <ContenedorPaso
    titulo="Lecciones aprendidas"
    descripcion='Ambos campos son obligatorios para enviar. Si no aplica, escribe "n/a".'
  >
    <div className="space-y-5">
      <CampoTexto
        label="Análisis"
        obligatorio
        disabled={!puedeEditar}
        value={textos.lecciones_analisis ?? ""}
        onChange={(v) => onChange("lecciones_analisis", v)}
      />

      <CampoTexto
        label="Reflexiones"
        obligatorio
        disabled={!puedeEditar}
        value={textos.lecciones_reflexiones ?? ""}
        onChange={(v) => onChange("lecciones_reflexiones", v)}
      />
    </div>
  </ContenedorPaso>
);

// =====================================================
// PASOS 5 Y 6: CAMPOS DE TEXTO
// =====================================================
export const SeccionTextosSimple = ({
  titulo,
  descripcion,
  label,
  valor,
  onChange,
  puedeEditar,
  maxLength,
}) => (
  <ContenedorPaso titulo={titulo} descripcion={descripcion}>
    <CampoTexto
      label={label}
      obligatorio
      maxLength={maxLength}
      disabled={!puedeEditar}
      value={valor}
      onChange={onChange}
    />
  </ContenedorPaso>
);

// =====================================================
// PASO 7: CRONOLOGÍA
// =====================================================
export const SeccionCronologia = ({ actividades }) => (
  <ContenedorPaso
    titulo="Cronología"
    descripcion="Actividades y acciones realizadas durante el proyecto."
  >
    <div className="space-y-4">
      {!actividades || actividades.length === 0 ? (
        <p className="text-xs text-slate-400">
          No hay actividades registradas.
        </p>
      ) : (
        actividades.map((act) => (
          <div
            key={act.id}
            className="border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center gap-3">
              <h4 className="text-sm font-bold text-slate-700">
                {act.nombre}
              </h4>

              <span className="text-[9px] uppercase px-2 py-1 rounded-full bg-slate-200 font-bold text-slate-600 shrink-0">
                {act.estado_display || act.estado}
              </span>
            </div>

            <div className="p-4">
              {act.descripcion && (
                <p className="text-xs text-slate-600 mb-3">
                  {act.descripcion}
                </p>
              )}

              {act.acciones && act.acciones.length > 0 ? (
                <div className="space-y-2 border-l-2 border-[#b1122b]/30 pl-4 mt-2">
                  {act.acciones.map((accion) => (
                    <div key={accion.id}>
                      <p className="text-xs font-semibold text-slate-700">
                        {accion.descripcion}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {accion.fecha_inicio || "—"} a{" "}
                        {accion.fecha_fin || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">
                  Sin acciones registradas.
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </ContenedorPaso>
);

// =====================================================
// PASO 8: RECURSOS HUMANOS Y MATERIALES
// =====================================================
const CampoRecurso = ({ label, value }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-white">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-800 break-words">
      {value === null || value === undefined || value === ""
        ? "No especificado"
        : value}
    </p>
  </div>
);

export const SeccionRecursos = ({ recursos }) => {
  const humanos = recursos?.humanos ?? {};
  const materiales = recursos?.materiales ?? {};

  const listaHumanos = [
    ["Docentes", humanos.docentes ?? 0],
    ["Administrativos", humanos.administrativos ?? 0],
    ["Estudiantes", humanos.estudiantes ?? 0],
    ["Egresados", humanos.egresados ?? 0],
    ["Voluntarios", humanos.voluntarios ?? 0],
    ["Otros", humanos.otros ?? 0],
  ];

  const listaMateriales = [
    ["Material didáctico", materiales.material_didactico],
    ["Afiches", materiales.afiches],
    ["Equipos", materiales.equipos],
    ["Útiles", materiales.utiles],
    ["Otros materiales", materiales.otros],
  ];

  return (
    <ContenedorPaso
      titulo="Recursos humanos y materiales"
      descripcion="Recursos registrados en el proyecto."
    >
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="text-[#b1122b] text-lg" />
          <h4 className="text-sm font-bold text-slate-800">
            Recursos humanos
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaHumanos.map(([label, value]) => (
            <CampoRecurso key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <FiPackage className="text-[#b1122b] text-lg" />
          <h4 className="text-sm font-bold text-slate-800">
            Recursos materiales
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listaMateriales.map(([label, value]) => (
            <CampoRecurso key={label} label={label} value={value} />
          ))}
        </div>
      </section>
    </ContenedorPaso>
  );
};

// =====================================================
// PASO 9: METAS E INDICADORES
// =====================================================
export const SeccionMetas = ({ metas, cambiarMeta, puedeEditar }) => (
  <ContenedorPaso
    titulo="Metas e indicadores"
    descripcion="Ingresa los valores alcanzados. No se permiten valores negativos."
  >
    <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Descripción
            </th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Línea base
            </th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Meta
            </th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Alcanzado
            </th>
          </tr>
        </thead>

        <tbody>
          {(metas ?? []).map((meta) => (
            <tr key={meta.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs text-slate-700">
                {meta.meta} -{" "}
                <span className="text-slate-500 italic">
                  {meta.indicador}
                </span>
              </td>

              <td className="px-4 py-3 text-xs">{meta.linea_base}</td>

              <td className="px-4 py-3 text-xs text-[#b1122b] font-bold">
                {meta.valor_meta}
              </td>

              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={!puedeEditar}
                  value={meta.valor_alcanzado ?? ""}
                  onChange={(e) => {
                    const valor = e.target.value;

                    if (
                      valor === "" ||
                      (Number.isFinite(Number(valor)) &&
                        Number(valor) >= 0)
                    ) {
                      cambiarMeta(meta.id, valor);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (["-", "e", "E"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const texto = e.clipboardData.getData("text");
                    if (Number(texto) < 0) e.preventDefault();
                  }}
                  className="w-full max-w-[120px] border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-[#b1122b] transition-colors disabled:bg-slate-100"
                  placeholder="Ej. 10"
                />
              </td>
            </tr>
          ))}

          {(!metas || metas.length === 0) && (
            <tr>
              <td
                colSpan="4"
                className="text-center p-6 text-xs text-slate-400"
              >
                Sin metas registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </ContenedorPaso>
);

// =====================================================
// PASO 10: EJECUCIÓN PRESUPUESTAL
// =====================================================
export const SeccionPresupuesto = ({
  partidas,
  cambiarPartida,
  puedeEditar,
}) => (
  <ContenedorPaso
    titulo="Ejecución presupuestal"
    descripcion="Completa los montos ejecutados. No se permiten valores negativos."
  >
    <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
      <table className="w-full text-left min-w-[500px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Partida
            </th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Presupuestado
            </th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
              Ejecutado (S/)
            </th>
          </tr>
        </thead>

        <tbody>
          {(partidas ?? []).map((partida) => (
            <tr key={partida.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                {partida.descripcion}
                <span className="block text-[10px] text-slate-400 font-normal">
                  {partida.categoria}
                </span>
              </td>

              <td className="px-4 py-3 text-xs text-slate-600">
                S/ {(Number(partida.monto_presupuestado) || 0).toFixed(2)}
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">S/</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!puedeEditar}
                    value={partida.monto_ejecutado ?? ""}
                    onChange={(e) => {
                      const valor = e.target.value;

                      if (
                        valor === "" ||
                        (Number.isFinite(Number(valor)) &&
                          Number(valor) >= 0)
                      ) {
                        cambiarPartida(partida.id, valor);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["-", "e", "E"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const texto = e.clipboardData.getData("text");
                      if (Number(texto) < 0) e.preventDefault();
                    }}
                    className="w-full max-w-[120px] border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-[#b1122b] transition-colors disabled:bg-slate-100"
                    placeholder="0.00"
                  />
                </div>
              </td>
            </tr>
          ))}

          {(!partidas || partidas.length === 0) && (
            <tr>
              <td
                colSpan="3"
                className="text-center p-6 text-xs text-slate-400"
              >
                Sin presupuesto registrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </ContenedorPaso>
);

// =====================================================
// PASO 11: EVIDENCIAS
// =====================================================
export const SeccionEvidencias = ({ actividades }) => {
  const evidencias = (actividades || []).flatMap((act) =>
    (act.evidencias || []).map((ev) => ({
      ...ev,
      actividad: act.nombre,
    }))
  );

  return (
    <ContenedorPaso
      titulo="Evidencias y anexos"
      descripcion="Evidencias registradas en las actividades del proyecto."
    >
      {evidencias.length === 0 ? (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            El proyecto no tiene evidencias registradas.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {evidencias.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {ev.nombre}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {ev.actividad} · {ev.tipo}
                </p>
              </div>

              {ev.url && (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#b1122b] hover:underline shrink-0"
                >
                  Abrir
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </ContenedorPaso>
  );
};

// =====================================================
// COMENTARIOS DEL DEPARTAMENTO
// =====================================================
export const PanelObservaciones = ({ observaciones }) => {
  if (!observaciones || observaciones.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-bold text-amber-900 m-0">
        Comentarios del Departamento
      </p>

      <div className="mt-3 space-y-3">
        {observaciones.map((obs) => (
          <div key={obs.id} className="border-l-2 border-amber-400 pl-3">
            <p className="text-sm text-amber-950 m-0 whitespace-pre-line">
              {obs.comentario}
            </p>
            <p className="text-[10px] text-amber-700 m-0 mt-1">
              {obs.revisor}
              {obs.created_at
                ? ` · ${new Date(obs.created_at).toLocaleDateString()}`
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

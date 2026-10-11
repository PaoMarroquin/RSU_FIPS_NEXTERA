import React, { useMemo, useState } from "react";
import {
  FiInbox,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiFilter,
  FiLoader,
} from "react-icons/fi";

export default function ListaProyectos({
  proyectos = [],
  loading = false,
  onSelect,
}) {
  const [filtro, setFiltro] = useState("todos");

  const listaProyectos = Array.isArray(proyectos) ? proyectos : [];

  const calcularInformacion = (proy) => {
    const actividades = Array.isArray(proy.actividades)
      ? proy.actividades
      : [];

    const total = actividades.length;

    const completadas = actividades.filter(
      (actividad) => actividad.estado === "completada"
    ).length;

    const enEjecucion = actividades.filter(
      (actividad) => actividad.estado === "en_ejecucion"
    ).length;

    const pendientes = actividades.filter(
      (actividad) => actividad.estado === "pendiente"
    ).length;

    const avance =
      proy.porcentaje_ejecucion != null
        ? Number(proy.porcentaje_ejecucion)
        : total > 0
          ? Math.round((completadas / total) * 100)
          : 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const actividadesOrdenadas = [...actividades]
      .filter(
        (actividad) =>
          actividad.fecha && actividad.estado !== "completada"
      )
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const proximaActividad = actividadesOrdenadas[0];

    let prioridad = "Sin prioridad";
    let prioridadClase = "bg-slate-100 text-slate-500";
    let prioridadIcono = <FiClock className="text-slate-400 text-xs" />;

    if (proximaActividad) {
      const fechaActividad = new Date(proximaActividad.fecha);
      fechaActividad.setHours(0, 0, 0, 0);

      const diferencia = Math.ceil(
        (fechaActividad - hoy) / (1000 * 60 * 60 * 24)
      );

      if (diferencia < 0) {
        prioridad = "Urgente";
        prioridadClase = "bg-red-100 text-red-700";
        prioridadIcono = (
          <FiAlertCircle className="text-red-500 text-xs" />
        );
      } else if (diferencia <= 3) {
        prioridad = "Alta";
        prioridadClase = "bg-red-100 text-red-600";
        prioridadIcono = (
          <FiAlertCircle className="text-red-500 text-xs" />
        );
      } else if (diferencia <= 7) {
        prioridad = "Media";
        prioridadClase = "bg-amber-100 text-amber-600";
      } else {
        prioridad = "Baja";
        prioridadClase = "bg-emerald-100 text-emerald-600";
      }
    }

    return {
      total,
      completadas,
      enEjecucion,
      pendientes,
      avance,
      proximaActividad,
      prioridad,
      prioridadClase,
      prioridadIcono,
    };
  };

  const proyectosConInformacion = useMemo(
    () =>
      listaProyectos.map((proy) => ({
        ...proy,
        informacion: calcularInformacion(proy),
      })),
    [proyectos]
  );

  const proyectosFiltrados = useMemo(() => {
    switch (filtro) {
      case "completados":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.total > 0 &&
            informacion.completadas === informacion.total
        );

      case "en_avance":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.enEjecucion > 0 ||
            (informacion.avance > 0 && informacion.avance < 100)
        );

      case "pendientes":
        return proyectosConInformacion.filter(
          ({ informacion }) => informacion.pendientes > 0
        );

      case "urgentes":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.prioridad === "Urgente" ||
            informacion.prioridad === "Alta"
        );

      default:
        return proyectosConInformacion;
    }
  }, [proyectosConInformacion, filtro]);

  const cantidadFiltro = (tipo) => {
    switch (tipo) {
      case "completados":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.total > 0 &&
            informacion.completadas === informacion.total
        ).length;

      case "en_avance":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.enEjecucion > 0 ||
            (informacion.avance > 0 && informacion.avance < 100)
        ).length;

      case "pendientes":
        return proyectosConInformacion.filter(
          ({ informacion }) => informacion.pendientes > 0
        ).length;

      case "urgentes":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.prioridad === "Urgente" ||
            informacion.prioridad === "Alta"
        ).length;

      default:
        return proyectosConInformacion.length;
    }
  };

  const filtros = [
    { id: "todos", label: "Todos" },
    { id: "en_avance", label: "En avance" },
    { id: "pendientes", label: "Pendientes" },
    { id: "completados", label: "Completados" },
    { id: "urgentes", label: "Prioridad alta" },
  ];

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="mb-4 shrink-0">
        <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-800">
          Actividades Proyectos Aprobados
        </h2>

        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Selecciona un proyecto para registrar el cumplimiento de
          indicadores y subir evidencias.
        </p>
      </div>

      {!loading && listaProyectos.length > 0 && (
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filtros.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setFiltro(opcion.id)}
                className={`h-8 rounded-lg px-3 text-[11px] font-semibold transition-colors sm:text-xs ${
                  filtro === opcion.id
                    ? "bg-[#b1122b] text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opcion.label}
                <span
                  className={`ml-1 ${
                    filtro === opcion.id
                      ? "text-white/80"
                      : "text-slate-400"
                  }`}
                >
                  ({cantidadFiltro(opcion.id)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <FiLoader className="mb-3 animate-spin text-3xl text-[#b1122b]" />
          <span className="text-sm font-medium text-slate-500">
            Consultando proyectos...
          </span>
        </div>
      ) : listaProyectos.length === 0 ? (
        <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <FiInbox className="mb-2 h-9 w-9 text-slate-300" />
          <span className="text-sm font-semibold text-slate-500">
            No registras proyectos en ejecución
          </span>
          <span className="mt-1 max-w-xs text-xs text-slate-400">
            Actualmente no cuentas con planes de trabajo en estado
            "Aprobado" o "En Ejecución".
          </span>
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <FiFilter className="mb-2 h-9 w-9 text-slate-300" />
          <span className="text-sm font-semibold text-slate-500">
            No hay proyectos con este filtro
          </span>
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className="mt-3 text-xs font-semibold text-[#b1122b] transition-colors hover:text-[#941020]"
          >
            Ver todos los proyectos
          </button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-2.5">
          {proyectosFiltrados.map((proy) => {
            const {
              completadas,
              enEjecucion,
              avance,
              proximaActividad,
              prioridad,
              prioridadClase,
              prioridadIcono,
            } = proy.informacion;

            return (
              <div
                key={proy.id}
                onClick={() => onSelect?.(proy)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(proy);
                  }
                }}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#b1122b] hover:shadow-md sm:p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="inline-block max-w-full truncate rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {proy.codigo || `ID #${proy.id}`}
                    </span>

                    <h3 className="break-words text-sm font-bold text-slate-800 transition-colors group-hover:text-[#b1122b]">
                      {proy.titulo}
                    </h3>

                    <p className="break-words text-[11px] font-medium text-slate-400">
                      {proy.escuela_nombre}
                      {proy.periodo_nombre && (
                        <>
                          {" "}
                          <span className="text-slate-300">·</span>{" "}
                          <span className="text-slate-500">
                            {proy.periodo_nombre}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <FiChevronRight className="mt-1 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-[#b1122b]" />
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <FiCheckCircle className="shrink-0 text-sm text-[#b1122b]" />
                      <span className="text-[11px] font-semibold text-slate-600">
                        Avance
                      </span>
                    </div>

                    <span className="shrink-0 text-xs font-bold text-slate-700">
                      {avance}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#b1122b] transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, avance))}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    <span className="text-slate-400">
                      {completadas} completadas
                    </span>
                    <span className="text-blue-500">
                      {enEjecucion} en ejecución
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                  {proximaActividad && (
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <FiCalendar className="shrink-0 text-xs text-slate-400" />

                      <span className="shrink-0 text-[10px] text-slate-500">
                        Próxima:
                      </span>

                      <span
                        title={proximaActividad.nombre}
                        className="min-w-0 truncate text-[11px] font-semibold text-slate-700"
                      >
                        {proximaActividad.nombre}
                      </span>

                      <span className="shrink-0 text-[10px] text-slate-400">
                        {new Date(
                          proximaActividad.fecha
                        ).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-1.5">
                    {prioridadIcono}

                    <span className="text-[10px] text-slate-500">
                      Prioridad:
                    </span>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${prioridadClase}`}
                    >
                      {prioridad}
                    </span>
                  </div>

                  {!proximaActividad && (
                    <span className="text-[10px] text-slate-400">
                      Sin actividades pendientes
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    let prioridadIcono = (
      <FiClock className="text-xs text-slate-400" />
    );

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
          <FiAlertCircle className="text-xs text-red-500" />
        );
      } else if (diferencia <= 3) {
        prioridad = "Alta";
        prioridadClase = "bg-red-100 text-red-600";
        prioridadIcono = (
          <FiAlertCircle className="text-xs text-red-500" />
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
    [listaProyectos]
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

  const seleccionarProyectoConTeclado = (e, proyecto) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(proyecto);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Encabezado */}
      <div className="mb-5 flex shrink-0 flex-col gap-1">
        <h2 className="m-0 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
          Actividades de proyectos aprobados
        </h2>

        <p className="m-0 text-sm leading-relaxed text-slate-500">
          Selecciona un proyecto para registrar el cumplimiento de
          indicadores y subir evidencias.
        </p>
      </div>

      {/* Filtros */}
      {!loading && listaProyectos.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 flex items-center gap-2">
            <FiFilter className="text-sm text-slate-400" />

            <span className="text-xs font-semibold text-slate-700">
              Filtrar proyectos
            </span>

            <span className="ml-auto text-xs text-slate-400">
              {proyectosFiltrados.length} de {listaProyectos.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {filtros.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setFiltro(opcion.id)}
                aria-pressed={filtro === opcion.id}
                className={`flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filtro === opcion.id
                    ? "border-[#b1122b] bg-[#b1122b] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {opcion.label}

                <span
                  className={
                    filtro === opcion.id
                      ? "text-white/80"
                      : "text-slate-400"
                  }
                >
                  ({cantidadFiltro(opcion.id)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cargando */}
      {loading ? (
        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
          <FiLoader className="mb-3 animate-spin text-2xl text-[#b1122b]" />

          <p className="m-0 text-sm font-medium text-slate-600">
            Consultando proyectos...
          </p>

          <p className="m-0 mt-1 text-xs text-slate-400">
            Estamos obteniendo la información disponible.
          </p>
        </div>
      ) : listaProyectos.length === 0 ? (
        /* Sin proyectos */
        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center md:p-10">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <FiInbox className="text-2xl text-slate-400" />
          </div>

          <p className="m-0 text-sm font-semibold text-slate-700">
            No registras proyectos en ejecución
          </p>

          <p className="m-0 mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
            Actualmente no cuentas con planes de trabajo en estado
            aprobado o en ejecución.
          </p>
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        /* Sin resultados para el filtro */
        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center md:p-10">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <FiFilter className="text-xl text-slate-400" />
          </div>

          <p className="m-0 text-sm font-semibold text-slate-700">
            No hay proyectos con este filtro
          </p>

          <p className="m-0 mt-1 text-xs text-slate-400">
            Prueba con otra categoría para consultar los proyectos.
          </p>

          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#b1122b] transition-colors hover:bg-slate-50"
          >
            Ver todos los proyectos
          </button>
        </div>
      ) : (
        /* Lista de proyectos */
        <div className="flex min-w-0 flex-col gap-3">
          {proyectosFiltrados.map((proy) => {
            const {
              total,
              completadas,
              enEjecucion,
              pendientes,
              avance,
              proximaActividad,
              prioridad,
              prioridadClase,
              prioridadIcono,
            } = proy.informacion;

            const avanceSeguro = Number.isFinite(avance)
              ? Math.min(100, Math.max(0, avance))
              : 0;

            return (
              <div
                key={proy.id}
                onClick={() => onSelect?.(proy)}
                onKeyDown={(e) =>
                  seleccionarProyectoConTeclado(e, proy)
                }
                role="button"
                tabIndex={0}
                aria-label={`Abrir proyecto ${proy.titulo || proy.codigo || proy.id}`}
                className="group min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#b1122b]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 sm:p-5"
              >
                {/* Información principal */}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="mb-2 inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
                      {proy.codigo || `ID #${proy.id}`}
                    </span>

                    <h3 className="m-0 break-words text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#b1122b] md:text-base">
                      {proy.titulo || "Proyecto sin título"}
                    </h3>

                    <p className="m-0 mt-1.5 break-words text-xs text-slate-500">
                      {proy.escuela_nombre || "Escuela no especificada"}

                      {proy.periodo_nombre && (
                        <>
                          <span className="mx-1.5 text-slate-300">
                            ·
                          </span>

                          <span className="text-slate-500">
                            {proy.periodo_nombre}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-[#b1122b]/5">
                    <FiChevronRight className="text-base text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#b1122b]" />
                  </div>
                </div>

                {/* Progreso */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="shrink-0 text-sm text-[#b1122b]" />

                      <span className="text-xs font-semibold text-slate-600">
                        Avance del proyecto
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">
                      {avanceSeguro}%
                    </span>
                  </div>

                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={avanceSeguro}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Porcentaje de avance del proyecto"
                  >
                    <div
                      className="h-full rounded-full bg-[#b1122b] transition-all duration-300"
                      style={{ width: `${avanceSeguro}%` }}
                    />
                  </div>

                  {/* Resumen de actividades */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FiCheckCircle className="text-emerald-600" />
                      {completadas} completadas
                    </span>

                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FiClock className="text-blue-500" />
                      {enEjecucion} en ejecución
                    </span>

                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FiInbox className="text-slate-400" />
                      {pendientes} pendientes
                    </span>

                    <span className="ml-auto text-xs text-slate-400">
                      {total} actividad{total !== 1 ? "es" : ""}
                    </span>
                  </div>
                </div>

                {/* Próxima actividad y prioridad */}
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  {proximaActividad ? (
                    <div className="flex min-w-0 items-start gap-2">
                      <FiCalendar className="mt-0.5 shrink-0 text-sm text-slate-400" />

                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400">
                          Próxima actividad
                        </span>

                        <p
                          title={proximaActividad.nombre}
                          className="m-0 mt-0.5 break-words text-xs font-medium text-slate-700"
                        >
                          {proximaActividad.nombre ||
                            "Actividad sin nombre"}
                        </p>

                        <span className="mt-1 block text-[11px] text-slate-400">
                          {new Date(
                            proximaActividad.fecha
                          ).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FiCalendar className="shrink-0" />
                      <span>Sin actividades pendientes con fecha</span>
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                    {prioridadIcono}

                    <span className="text-xs text-slate-500">
                      Prioridad
                    </span>

                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold ${prioridadClase}`}
                    >
                      {prioridad}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from "react";
import {
  FiFolder,
  FiInbox,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiFilter,
  FiLoader,
} from "react-icons/fi";

export default function ListaProyectos({ proyectos, loading, onSelect }) {
  const [filtro, setFiltro] = useState("todos");

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
      total > 0 ? Math.round((completadas / total) * 100) : 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const actividadesOrdenadas = [...actividades]
      .filter(
        (actividad) =>
          actividad.fecha && actividad.estado !== "completada"
      )
      .sort(
        (a, b) =>
          new Date(a.fecha) - new Date(b.fecha)
      );

    const proximaActividad = actividadesOrdenadas[0];

    let prioridad = "Sin prioridad";
    let prioridadClase = "bg-slate-100 text-slate-500";
    let prioridadIcono = (
      <FiClock className="text-slate-400 text-sm" />
    );

    if (proximaActividad) {
      const fechaActividad = new Date(proximaActividad.fecha);
      fechaActividad.setHours(0, 0, 0, 0);

      const diferencia = Math.ceil(
        (fechaActividad - hoy) /
          (1000 * 60 * 60 * 24)
      );

      if (diferencia < 0) {
        prioridad = "Urgente";
        prioridadClase = "bg-red-100 text-red-700";
        prioridadIcono = (
          <FiAlertCircle className="text-red-500 text-sm" />
        );
      } else if (diferencia <= 3) {
        prioridad = "Alta";
        prioridadClase = "bg-red-100 text-red-600";
        prioridadIcono = (
          <FiAlertCircle className="text-red-500 text-sm" />
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

  const proyectosConInformacion = useMemo(() => {
    return proyectos.map((proy) => ({
      ...proy,
      informacion: calcularInformacion(proy),
    }));
  }, [proyectos]);

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
            (informacion.avance > 0 &&
              informacion.avance < 100)
        );

      case "pendientes":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.pendientes > 0
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
            (informacion.avance > 0 &&
              informacion.avance < 100)
        ).length;

      case "pendientes":
        return proyectosConInformacion.filter(
          ({ informacion }) =>
            informacion.pendientes > 0
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

  return (
    <div className="flex-1 flex flex-col">

      {/* =====================================================
          HEADER (mismo patrón que Repositorio / Notificaciones)
      ===================================================== */}

      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Actividades Proyectos Aprobados
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Selecciona un proyecto para registrar el cumplimiento de
          indicadores y subir evidencias.
        </p>
      </div>

      {/* =====================================================
          BARRA DE FILTROS
      ===================================================== */}

      {!loading && proyectos.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">

          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "todos",
                label: "Todos",
              },
              {
                id: "en_avance",
                label: "En avance",
              },
              {
                id: "pendientes",
                label: "Pendientes",
              },
              {
                id: "completados",
                label: "Completados",
              },
              {
                id: "urgentes",
                label: "Prioridad alta",
              },
            ].map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setFiltro(opcion.id)}
                className={`px-4 h-9 rounded-lg text-xs font-semibold transition-colors ${
                  filtro === opcion.id
                    ? "bg-[#b1122b] text-white"
                    : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {opcion.label}

                <span
                  className={`ml-1.5 ${
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

      {/* =====================================================
          LOADING / RESULTADOS
      ===================================================== */}

      {loading ? (

        <div className="flex flex-col items-center justify-center flex-1 py-12">

          <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />

          <span className="text-slate-500 font-medium">
            Consultando proyectos...
          </span>

        </div>

      ) : proyectos.length === 0 ? (

        <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">

          <FiInbox className="w-10 h-10 text-slate-300 mb-2" />

          <span className="text-slate-500 text-sm font-semibold">
            No registras proyectos en ejecución
          </span>

          <span className="text-slate-400 text-xs mt-1 max-w-xs">
            Actualmente no cuentas con planes de trabajo en estado
            "Aprobado" o "En Ejecución".
          </span>

        </div>

      ) : proyectosFiltrados.length === 0 ? (

        <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">

          <FiFilter className="w-10 h-10 text-slate-300 mb-2" />

          <span className="text-slate-500 text-sm font-semibold">
            No hay proyectos con este filtro
          </span>

          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className="mt-3 text-xs font-semibold text-[#b1122b] hover:text-[#941020] transition-colors"
          >
            Ver todos los proyectos
          </button>

        </div>

      ) : (

        <div className="flex flex-col gap-3">
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

            return (
              <div
                key={proy.id}
                onClick={() => onSelect(proy)}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#b1122b] shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {proy.codigo || `ID #${proy.id}`}
                    </span>

                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#b1122b] transition-colors">
                      {proy.titulo}
                    </h3>

                    <p className="text-xs text-slate-400 font-medium">
                      {proy.escuela_nombre} —{" "}
                      <span className="text-slate-500">
                        {proy.periodo_nombre}
                      </span>
                    </p>
                  </div>

                  <FiChevronRight className="flex-shrink-0 text-slate-400 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-[#b1122b]" />

                      <span className="text-[11px] font-semibold text-slate-600">
                        Avance de actividades
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-700">
                      {avance}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b1122b] rounded-full transition-all"
                      style={{
                        width: `${avance}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
                    <span className="text-slate-400">
                      {completadas} completadas
                    </span>

                    <span className="text-blue-500">
                      {enEjecucion} en avance
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <FiCalendar className="text-slate-500 text-sm" />

                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Próxima actividad
                      </span>
                    </div>

                    {proximaActividad ? (
                      <>
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {proximaActividad.nombre}
                        </p>

                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(
                            proximaActividad.fecha
                          ).toLocaleDateString("es-PE")}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        No hay actividades pendientes
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      {prioridadIcono}

                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Prioridad
                      </span>
                    </div>

                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${prioridadClase}`}
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
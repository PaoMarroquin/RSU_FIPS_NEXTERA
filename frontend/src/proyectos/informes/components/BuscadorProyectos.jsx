import React from "react";
import {
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const TAMANOS_PAGINA = [10, 20, 50];

export const BuscadorProyectos = ({
  busquedaProyecto,
  setBusquedaProyecto,
  setSearchTerm,
  loading,
  proyectos = [],
  seleccionarProyecto,
  page = 1,
  setPage,
  totalPages = 1,
  pageSize = 10,
  setPageSize,
}) => {
  // Obtener el estado real del informe de finalización.
  const obtenerEstadoInforme = (proyecto) => {
    const estado = String(
      proyecto.informe_finalizacion_estado || ""
    ).toLowerCase().trim();

    const estados = {
      enviado: {
        texto: "ENVIADO",
        estilos: "bg-blue-100 text-blue-700 border-blue-200",
      },
      aprobado: {
        texto: "APROBADO",
        estilos: "bg-green-100 text-green-700 border-green-200",
      },
      borrador: {
        texto: "BORRADOR",
        estilos: "bg-amber-100 text-amber-700 border-amber-200",
      },
      // El backend manda "observado" cuando el Departamento devuelve el informe.
      observado: {
        texto: "OBSERVADO",
        estilos: "bg-red-100 text-red-700 border-red-200",
      },
      en_revision: {
        texto: "EN REVISIÓN",
        estilos: "bg-purple-100 text-purple-700 border-purple-200",
      },
      rechazado: {
        texto: "OBSERVADO",
        estilos: "bg-red-100 text-red-700 border-red-200",
      },
    };

    return (
      estados[estado] || {
        texto: "PENDIENTE",
        estilos: "bg-slate-100 text-slate-600 border-slate-200",
      }
    );
  };

  const hayPaginacion = Boolean(setPage) && totalPages > 1;

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-2xl">
      {/* Buscador */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <FiFilter />
          Búsqueda de Proyectos
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
          <FiSearch className="text-slate-400 shrink-0" />

          <input
            type="text"
            value={busquedaProyecto}
            onChange={(e) => {
              setBusquedaProyecto(e.target.value);
              setSearchTerm(e.target.value);
            }}
            placeholder="Buscar proyectos en ejecución..."
            className="w-full outline-none text-sm text-slate-700 bg-transparent"
          />
        </div>
      </div>

      {/* Listado de proyectos */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 shadow-sm">
            <FiRefreshCw className="animate-spin text-[#b1122b] text-lg" />
            <span>Buscando proyectos...</span>
          </div>
        ) : proyectos.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs flex flex-col items-center shadow-sm italic">
            No se encontraron proyectos en ejecución.
          </div>
        ) : (
          proyectos.map((proyecto) => {
            const estadoInforme = obtenerEstadoInforme(proyecto);

            return (
              <div
                key={proyecto.id}
                onClick={() => seleccionarProyecto(proyecto)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    seleccionarProyecto(proyecto);
                  }
                }}
                role="button"
                tabIndex={0}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {proyecto.codigo}
                    </span>

                    {/* Estado real del informe */}
                    <span
                      className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase whitespace-nowrap ${estadoInforme.estilos}`}
                    >
                      {estadoInforme.texto}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2">
                    {proyecto.titulo || "Sin título"}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Semestre:{" "}
                    <b className="text-slate-600">
                      {proyecto.semestre_academico || "S/A"}
                    </b>
                  </span>

                  <span className="text-slate-400 font-semibold text-[10px]">
                    Seleccionar →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {hayPaginacion && !loading && (
        <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft />
              Anterior
            </button>

            <span className="font-semibold text-slate-600">
              Página {page} de {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
              <FiChevronRight />
            </button>
          </div>

          {setPageSize && (
            <label className="flex items-center gap-2">
              Por página
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600"
              >
                {TAMANOS_PAGINA.map((tam) => (
                  <option key={tam} value={tam}>
                    {tam}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorProyectos;

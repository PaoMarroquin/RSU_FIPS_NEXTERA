import React from 'react';
import Layout from "../../shared/layout/Layout"; 
import { FiSearch, FiFileText, FiRefreshCw, FiFilter } from 'react-icons/fi';
import ReporteExpediente from '../../shared/components/ReporteExpediente'; 
import { useInformes } from './hooks/useInformes';

const Informes = () => {
  const {
    searchTerm, setSearchTerm,
    matrizSeleccionada, setMatrizSeleccionada,
    loading, error, filteredMatrices
  } = useInformes();

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        
        {/* ENCABEZADO */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 m-0">Informes Completos de Ejecución</h2>
            <p className="text-sm text-slate-500 mt-1">Expediente oficial consolidado del Proyecto de Responsabilidad Social</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* PANEL IZQUIERDO: BUSCADOR Y LISTA */}
          <div className="xl:col-span-4 flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FiFilter /> Búsqueda de Expedientes
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
                <FiSearch className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por título o código..."
                  className="w-full text-xs outline-none bg-transparent text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* LISTADO DE PROYECTOS */}
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />
                  <span>Leyendo expedientes en la base de datos...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              ) : filteredMatrices.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2 italic">
                  No se encontraron expedientes con ese filtro.
                </div>
              ) : (
                filteredMatrices.map((matriz) => (
                  <div 
                    key={matriz.id}
                    onClick={() => setMatrizSeleccionada(matriz)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      matrizSeleccionada?.id === matriz.id 
                        ? 'border-[#b1122b] ring-2 ring-[#b1122b]/5 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {matriz.codigo || `ID-BACK: #${matriz.id}`}
                        </span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                          {matriz.estado || 'activo'}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2">{matriz.titulo}</h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Semestre: <b className="text-slate-600">{matriz.semestre_academico || matriz.periodo_nombre || "S/A"}</b></span>
                      <span className={`${matrizSeleccionada?.id === matriz.id ? 'text-[#b1122b]' : 'text-slate-400'} font-semibold text-[10px]`}>
                        Ver Todo →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PANEL DERECHO: REPORTE COMPLETO */}
          <div className="xl:col-span-8 w-full">
            {!matrizSeleccionada ? (
              <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs">
                <FiFileText className="w-12 h-12 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-500">Selecciona un proyecto para previsualizar el expediente</span>
              </div>
            ) : (
              <ReporteExpediente matrizSeleccionada={matrizSeleccionada} showPrintButton={true} />
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Informes;
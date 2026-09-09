import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from '../api/axiosConfig'; // Importamos tu configuración de Axios[cite: 2]
import { 
  FiSearch, 
  FiBook, 
  FiFileText, 
  FiEye, 
  FiX, 
  FiCalendar, 
  FiUser, 
  FiMapPin, 
  FiDollarSign, 
  FiClock, 
  FiCheckCircle,
  FiLoader,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

const Repositorio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // ESTADOS REALES DE LA API[cite: 2]
  const [proyectosRepositorio, setProyectosRepositorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Efecto Debounce para no saturar al servidor en cada tecla[cite: 2]
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Petición Real al Servidor[cite: 2]
  useEffect(() => {
    const fetchRepositorio = async () => {
      setLoading(true);
      try {
        // Consumimos tu endpoint real pasando página y búsqueda[cite: 2]
        const response = await api.get('/api/v1/proyectos/', {
          params: { 
            page: page, 
            search: debouncedSearch 
          }
        });
        
        // Seteamos los resultados reales enviados por Django
        setProyectosRepositorio(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Divide el conteo general entre tu límite por página[cite: 2]
      } catch (error) {
        console.error("Error cargando el repositorio real:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositorio();
  }, [page, debouncedSearch]);

  // FUNCIÓN AUXILIAR PARA LOS BADGES DE ESTADO (Nativos de tu JSON)
  const renderEstadoBadge = (estado) => {
    if (estado === "aprobado") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FiCheckCircle className="w-3 h-3" /> APROBADO
        </span>
      );
    }
    if (estado === "en_revision") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <FiClock className="w-3 h-3" /> EN REVISIÓN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
        {estado?.toUpperCase().replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        <Topbar />

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          
          {/* HEADER */}
          <div className="mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-slate-800 m-0">Repositorio Institucional</h2>
            <p className="text-sm text-slate-500 mt-1">Biblioteca digital de proyectos RSU finalizados, en revisión y buenas prácticas</p>
          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white w-full max-w-xl focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código o título del proyecto..."
                className="w-full text-sm outline-none bg-transparent text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-[40px] shrink-0">
              <button onClick={() => setViewMode('grid')} className={`px-3 h-full flex items-center justify-center ${viewMode === 'grid' ? 'bg-slate-100 text-[#b1122b]' : 'bg-white text-slate-400'}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 h-full flex items-center justify-center border-l border-slate-300 ${viewMode === 'list' ? 'bg-slate-100 text-[#b1122b]' : 'bg-white text-slate-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
            </div>
          </div>

          {/* CARGADOR U HOJA DE RESULTADOS[cite: 2] */}
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />
              <span className="text-slate-500 font-medium">Consultando Repositorio RSU...</span>
            </div>
          ) : proyectosRepositorio.length > 0 ? (
            <>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-6" : "flex flex-col gap-3 mb-6"}>
                {proyectosRepositorio.map((proyecto) => (
                  <div key={proyecto.id} className={viewMode === 'grid' ? "bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow" : "bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"}>
                    <div className={viewMode === 'grid' ? "w-full" : "flex-1"}>
                      {viewMode === 'grid' && (
                        <div className="h-32 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative">
                          <FiBook className="w-8 h-8 text-slate-300" />
                          <span className="absolute top-3 left-3">
                            {renderEstadoBadge(proyecto.estado)}
                          </span>
                          <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/90 text-slate-600 px-2 py-0.5 rounded shadow-2xs">
                            {proyecto.semestre_academico}
                          </span>
                        </div>
                      )}
                      <div className={viewMode === 'grid' ? "p-4" : "flex flex-col gap-1"}>
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {viewMode === 'list' && renderEstadoBadge(proyecto.estado)}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {proyecto.eje_rsu_nombre}
                          </span>
                          {proyecto.ods_info?.map(o => (
                            <span key={o.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              ODS {o.numero}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 leading-snug">{proyecto.titulo}</h3>
                        <p className="text-xs text-slate-400 mt-1">{proyecto.facultad_nombre}</p>
                      </div>
                    </div>
                    
                    <div className={viewMode === 'grid' ? "p-4 pt-0 grid grid-cols-2 gap-2" : "flex items-center gap-2 shrink-0 w-full sm:w-auto"}>
                      <button 
                        onClick={() => setProyectoSeleccionado(proyecto)} 
                        className="flex items-center justify-center gap-1.5 h-9 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors w-full sm:px-4"
                      >
                        <FiEye /> Ver
                      </button>
                      <button 
                        disabled={proyecto.estado !== 'aprobado'} 
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold w-full sm:px-4 ${proyecto.estado === 'aprobado' ? 'bg-slate-100 text-[#b1122b] hover:bg-red-50' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        <FiFileText /> Informe
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINACIÓN DE LA DATA REAL[cite: 2] */}
              {totalPages > 1 && (
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-200">
                  <span className="text-sm text-slate-500">
                    Página <span className="font-semibold text-slate-800">{page}</span> de <span className="font-semibold text-slate-800">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#b1122b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#b1122b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">
              <FiBook className="w-10 h-10 text-slate-300 mb-2" />
              <span className="text-slate-500 text-sm font-semibold">No se encontraron registros</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLADO DE DATA REAL */}
      {proyectoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    {proyectoSeleccionado.codigo}
                  </span>
                  {renderEstadoBadge(proyectoSeleccionado.estado)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2 pr-4">{proyectoSeleccionado.titulo}</h3>
              </div>
              <button onClick={() => setProyectoSeleccionado(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <FiUser className="text-[#b1122b] w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Responsable</span>
                    <span className="text-xs font-bold text-slate-700">{proyectoSeleccionado.docente_responsable_nombre}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <FiCalendar className="text-blue-600 w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Semestre</span>
                    <span className="text-xs font-bold text-slate-700">{proyectoSeleccionado.semestre_academico}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <FiMapPin className="text-emerald-600 w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Lugar</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[140px] block">{proyectoSeleccionado.lugar_ejecucion}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <FiDollarSign className="text-amber-600 w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Financiamiento</span>
                    <span className="text-xs font-bold text-slate-700">S/. {proyectoSeleccionado.monto_financiamiento}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Estructura Académica</h4>
                  <ul className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <li><b>Facultad:</b> {proyectoSeleccionado.facultad_nombre}</li>
                    <li><b>Escuela:</b> {proyectoSeleccionado.escuela_nombre}</li>
                    <li><b>Departamento:</b> {proyectoSeleccionado.departamento_nombre}</li>
                    <li><b>Año Carrera:</b> {proyectoSeleccionado.anio_carrera_display || 'No asignado'}</li>
                    <li><b>Participantes totales:</b> {proyectoSeleccionado.nro_docentes} Docentes y {proyectoSeleccionado.nro_estudiantes} Estudiantes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alineamiento e Impacto RSU</h4>
                  <ul className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <li><b>Eje RSU Principal:</b> {proyectoSeleccionado.eje_rsu_nombre}</li>
                    <li><b>Línea Estratégica:</b> {proyectoSeleccionado.linea_estrategica_nombre || 'N/A'}</li>
                    <li><b>Fuente de Finan.:</b> {proyectoSeleccionado.fuente_financiamiento_display || 'Recursos RSU'}</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Trazabilidad Final</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-500">
                  <div><b>Creado:</b> {proyectoSeleccionado.created_at?.substring(0,10)}</div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end">
              <button onClick={() => setProyectoSeleccionado(null)} className="px-4 py-2 bg-slate-800 text-white font-semibold text-xs rounded-lg hover:bg-slate-700">
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Repositorio;
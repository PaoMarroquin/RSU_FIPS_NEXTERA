import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from '../api/axiosConfig'; 
import { FiSearch, FiCalendar, FiClock, FiCheckCircle, FiFileText, FiPrinter, FiTarget, FiDollarSign, FiRefreshCw, FiFilter } from 'react-icons/fi';
import ReporteExpediente from '../components/reports/ReporteExpediente';

const Informes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [dataMatrices, setDataMatrices] = useState([]);
  const [matrizSeleccionada, setMatrizSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CONSULTAR PROYECTOS DESDE EL BACKEND DEL USUARIO AUTENTICADO
  const fetchMatrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || localStorage.getItem('access_token'); 
      const config = {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '' 
        }
      };
      
      const response = await api.get('/api/v1/proyectos/?page=1', config);
      
      const proyectosArray = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      setDataMatrices(proyectosArray);
      
      if (proyectosArray.length > 0) {
        setMatrizSeleccionada(proyectosArray[0]);
      } else {
        setMatrizSeleccionada(null);
      }
    } catch (err) {
      console.error("Error al traer los informes desde el backend:", err);
      setDataMatrices([]);
      if (err.response?.status === 401) {
        setError("No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión.");
      } else {
        setError("No se pudo obtener la información de tus proyectos.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrices();
  }, []);

  const filteredMatrices = (Array.isArray(dataMatrices) ? dataMatrices : []).filter(matriz => {
    if (!matriz) return false;
    const facultad = matriz.facultad_nombre || "";
    const titulo = matriz.titulo || "";
    const codigo = matriz.codigo || `PRY-${matriz.id}`;
    const estado = matriz.estado || "pendiente";

    const matchesSearch = facultad.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = facultyFilter ? facultad === facultyFilter : true;
    const matchesStatus = statusFilter ? estado === statusFilter : true;
    
    return matchesSearch && matchesFaculty && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="ml-[230px] flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar />

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 m-0">Informes Completos de Ejecución</h2>
              <p className="text-sm text-slate-500 mt-1">Expediente oficial consolidado del Proyecto de Responsabilidad Social</p>
          </div>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* PANEL IZQUIERDO */}
            <div className="xl:col-span-4 flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <FiFilter /> Búsqueda de Expedientes
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <FiSearch className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar por título, código..."
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
                    <span>Leyendo proyectos del usuario en la base de datos...</span>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-semibold">
                    {error}
                  </div>
                ) : filteredMatrices.map((matriz) => (
                  <div 
                    key={matriz.id}
                    onClick={() => setMatrizSeleccionada(matriz)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                      matrizSeleccionada?.id === matriz.id ? 'border-[#b1122b] ring-2 ring-[#b1122b]/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ID-BACK: #{matriz.id}</span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                          {matriz.estado || 'activo'}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2">{matriz.titulo}</h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Semestre: <b className="text-slate-600">{matriz.semestre_academico}</b></span>
                      <span className="text-[#b1122b] font-semibold text-[10px]">Ver Todo →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PANEL REPORTE COMPLETO CON ABSOLUTAMENTE TODOS LOS DATOS */}
            <div className="xl:col-span-8 w-full">
              {!matrizSeleccionada ? (
                <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs">
                  <FiFileText className="w-12 h-12 text-slate-300 mb-2" />
                  <span className="font-semibold text-slate-500">Selecciona un proyecto</span>
                </div>
              ) : (
                <ReporteExpediente matrizSeleccionada={matrizSeleccionada} showPrintButton={true} />
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Informes;

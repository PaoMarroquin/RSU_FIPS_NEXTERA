import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from '../api/axiosConfig'; 
import { FiSearch, FiFileText, FiFilter, FiPrinter, FiRefreshCw, FiUser, FiCheckCircle, FiDollarSign } from "react-icons/fi";

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
            <button 
              onClick={fetchMatrices} 
              className="p-2 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold shadow-xs"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Sincronizar Back
            </button>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <FiCheckCircle /> Datos Vinculados al Usuario Autenticado
                    </span>
                    <button onClick={() => window.print()} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <FiPrinter /> Imprimir Todo el Expediente
                    </button>
                  </div>

                  {/* DOCUMENTO GLOBAL A4 */}
                  <div className="w-full bg-white rounded-xl border border-slate-200 shadow-md p-8 md:p-12 max-w-3xl mx-auto border-t-[6px] border-t-[#b1122b] font-serif text-slate-900 select-text leading-relaxed">
                    
                    {/* ENCABEZADO OFICIAL */}
                    <div className="text-center space-y-1 border-b-2 border-slate-800 pb-5 mb-6 font-sans">
                      <h2 className="text-sm font-extrabold uppercase tracking-wide">Universidad Nacional de San Agustín de Arequipa</h2>
                      <h3 className="text-xs font-bold text-slate-600 uppercase">Vicerrectorado Académico</h3>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Oficina Universitaria de Responsabilidad Social (OURS)</h3>
                      <div className="pt-4">
                        <h1 className="text-xs font-extrabold uppercase border-y-2 border-slate-900 py-2 inline-block px-4 bg-slate-50">
                          Expediente Integral Consolidado de Proyecto RSU
                        </h1>
                      </div>
                    </div>

                    {/* PASO 1: DATOS INFORMATIVOS */}
                    <div className="space-y-3 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">1. Datos Informativos Generales</h4>
                      <table className="w-full text-xs border border-slate-300 border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 w-4/12 border-r border-slate-300">Título Proyecto:</td><td className="p-2 font-bold font-sans text-slate-950">{matrizSeleccionada.titulo}</td></tr>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Código Registro:</td><td className="p-2 font-mono">{matrizSeleccionada.codigo || `RSU-PRY-${matrizSeleccionada.id}`}</td></tr>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Facultad / Escuela / Dept:</td><td className="p-2">Facultad de {matrizSeleccionada.facultad_nombre} / {matrizSeleccionada.escuela_nombre} / {matrizSeleccionada.departamento_nombre}</td></tr>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Semestre y Periodo:</td><td className="p-2 font-mono">Semestre {matrizSeleccionada.semestre_academico} / Periodo {matrizSeleccionada.periodo_nombre || matrizSeleccionada.periodo}</td></tr>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Lugar de Ejecución:</td><td className="p-2">{matrizSeleccionada.lugar_ejecucion || 'No especificado'}</td></tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Eje RSU y Detalles:</td>
                            <td className="p-2">
                              <div className="font-semibold text-slate-800 mb-1">{matrizSeleccionada.eje_rsu_nombre || `Eje ID: ${matrizSeleccionada.eje_rsu}`}</div>
                              {matrizSeleccionada.ejes_subitems && matrizSeleccionada.ejes_subitems.length > 0 ? (
                                <ul className="list-disc list-inside text-slate-600 pl-2">
                                  {matrizSeleccionada.ejes_subitems.map((subitem, idx) => (
                                    <li key={idx}>
                                      {subitem.sub_eje_nombre}
                                      {subitem.detalle ? <span className="italic text-slate-500"> — {subitem.detalle}</span> : ""}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="italic text-slate-400">Sin detalles adicionales</span>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Metas e Indicadores:</td><td className="p-2">
                            {(matrizSeleccionada.metas_indicadores || []).length > 0 ? (
                              (matrizSeleccionada.metas_indicadores || []).map((mi, idx) => (
                                <div key={idx} className={idx > 0 ? "mt-1 pt-1 border-t border-slate-200" : ""}>
                                  <b>Meta:</b> {mi.meta_descripcion} <br/>
                                  <b>Indicador:</b> {mi.indicador_nombre}
                                  {mi.valor_meta != null ? ` (Meta: ${mi.valor_meta}${mi.valor_alcanzado != null ? `, Alcanzado: ${mi.valor_alcanzado}` : ''})` : ''}
                                </div>
                              ))
                            ) : (
                              <span className="italic text-slate-400">Sin metas e indicadores registrados</span>
                            )}
                          </td></tr>
                          <tr className="border-b border-slate-300"><td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Tipo de Actividad:</td><td className="p-2">
                            {(() => {
                              const labels = {
                                'programas_formativos': 'Programas formativos',
                                'acompanamiento': 'Acompañamiento a sectores identificados',
                                'asesoria': 'Asesoría',
                                'acercamiento_comunidad': 'Iniciativas de acercamiento a la comunidad',
                                'otro': 'Otros',
                              };
                              const tipos = matrizSeleccionada.tipo_actividad || [];
                              if (tipos.length > 0) {
                                return tipos.map(t => labels[t] || t).join(', ') + 
                                  (matrizSeleccionada.tipo_actividad_otro ? ` — ${matrizSeleccionada.tipo_actividad_otro}` : '');
                              }
                              return matrizSeleccionada.tipo_actividad_otro || 'No declarado';
                            })()}
                          </td></tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Control de Fechas (Hitos):</td>
                            <td className="p-2 font-mono grid grid-cols-2 gap-1 text-[11px]">
                              <span><b>Inicio:</b> {matrizSeleccionada.fecha_inicio || 'N/A'}</span>
                              <span><b>Término:</b> {matrizSeleccionada.fecha_termino || 'N/A'}</span>
                              <span><b>Evaluación:</b> {matrizSeleccionada.fecha_evaluacion_avance || 'N/A'}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* PASO 2: FUNDAMENTACIÓN */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">2. Fundamentación Institucional</h4>
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
                        <p><b>¿Por qué se eligió a este grupo humano?:</b> {matrizSeleccionada.fund_por_que_grupo || "Sin registrar."}</p>
                        <p><b>¿Para qué se realiza el proyecto?:</b> {matrizSeleccionada.fund_para_que_proyecto || "Sin registrar."}</p>
                        <p><b>Mecanismo de enseñanza/Metodología:</b> {matrizSeleccionada.fund_mecanismo_ensenanza || "Sin registrar."}</p>
                      </div>
                    </div>

                    {/* PASO 3: DIAGNÓSTICO */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">3. Diagnóstico de la Realidad y Contexto</h4>
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
                        <p><b>Estado actual del grupo:</b> {matrizSeleccionada.diag_estado_grupo || "Sin registrar."}</p>
                        <p><b>Problemas detectados prioritarios:</b> {matrizSeleccionada.diag_problemas_detectados || "Sin registrar."}</p>
                        <p><b>Aportes directos a la formación académica:</b> {matrizSeleccionada.diag_aportes_formacion || "Sin registrar."}</p>
                        <p><b>Justificación integral de la intervención:</b> {matrizSeleccionada.diag_justificacion_intervencion || "Sin registrar."}</p>
                      </div>
                    </div>

                    {/* PASO 4: OBJETIVOS Y ODS */}
                    <div className="space-y-3 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">4. Objetivos del Plan e Impacto ODS</h4>
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1.5 text-xs">
                        <p><b>Logros buscados en el beneficiario:</b> {matrizSeleccionada.obj_logro_intervencion || "Sin registrar."}</p>
                        <p><b>Mejoras en el diseño curricular docente:</b> {matrizSeleccionada.obj_mejora_curricular || "Sin registrar."}</p>
                        <div className="pt-2 border-t mt-2">
                          <span className="font-bold block mb-1">Objetivos de Desarrollo Sostenible (ODS) Vinculados:</span>
                          <div className="flex flex-wrap gap-1">
                            {matrizSeleccionada.ods && matrizSeleccionada.ods.map((o, idx) => (
                              <span key={idx} className="bg-sky-100 text-sky-800 border border-sky-200 font-sans font-bold px-2 py-0.5 rounded text-[10px]">ODS Objetivo: {o}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PASO 5: RESULTADOS */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">5. Resultados e Impacto Esperado</h4>
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
                        <p><b>Resultados tangibles en los beneficiarios:</b> {matrizSeleccionada.resultado_en_beneficiarios || "Sin registrar."}</p>
                        <p><b>Resultados tangibles en el currículo formativo:</b> {matrizSeleccionada.resultado_en_curriculo || "Sin registrar."}</p>
                      </div>
                    </div>

                    {/* PASO 6: TABLA DE ACTIVIDADES */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">6. Planificación Táctica de Actividades</h4>
                      <table className="w-full text-[11px] border border-slate-300 border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-sans font-bold text-slate-700">
                            <th className="p-1 text-center border-r border-slate-300 w-1/12">Ord</th>
                            <th className="p-2 text-left border-r border-slate-300 w-5/12">Nombre Actividad / Detalle</th>
                            <th className="p-2 text-left border-r border-slate-300 w-3/12">Responsable Designado</th>
                            <th className="p-2 text-left w-3/12">Evidencia Verificable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {matrizSeleccionada.actividades?.map((act) => (
                            <tr key={act.id || act.orden}>
                              <td className="p-1 text-center font-mono border-r border-slate-300">{act.orden}</td>
                              <td className="p-2 border-r border-slate-300">
                                <b className="text-slate-900 block">{act.nombre}</b>
                                <span className="text-[10px] text-slate-500 block leading-tight">{act.descripcion}</span>
                              </td>
                              <td className="p-2 border-r border-slate-300">{act.responsable}</td>
                              <td className="p-2 text-[10px] italic">{act.evidencia_esperada}</td>
                            </tr>
                          )) || <tr><td colSpan="4" className="p-2 text-center text-slate-400">Sin actividades registradas.</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* PASO 7: CRONOGRAMA */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">7. Cronograma Físico de Avance</h4>
                      <table className="w-full text-[11px] border border-slate-300 border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-sans font-bold text-slate-700">
                            <th className="p-2 text-left border-r border-slate-300">Hito Planificado</th>
                            <th className="p-2 text-center border-r border-slate-300 w-4/12">Fechas (Inicio - Cierre)</th>
                            <th className="p-2 text-center w-2/12">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrizSeleccionada.cronograma?.map((crono, index) => (
                            <tr key={crono.id || index} className="border-b border-slate-200">
                              <td className="p-2 border-r border-slate-300 font-medium">{crono.descripcion}</td>
                              <td className="p-2 border-r border-slate-300 text-center font-mono text-[10px]">{crono.fecha_inicio} al {crono.fecha_fin}</td>
                              <td className="p-2 text-center">
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                  {crono.estado_avance}
                                </span>
                              </td>
                            </tr>
                          )) || <tr><td colSpan="3" className="p-2 text-center text-slate-400">Sin hitos de cronograma.</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* PASO 8: RECURSOS */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">8. Recursos Humanos y Materiales Autorizados</h4>
                      <table className="w-full text-xs border border-slate-300 border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-300 bg-slate-50">
                            <td className="p-2 font-bold border-r border-slate-300 w-4/12">Capital Humano:</td>
                            <td className="p-2 grid grid-cols-3 gap-1 font-sans text-center text-[11px]">
                              <span>Docentes: <b>{matrizSeleccionada.rec_hum_docentes}</b></span>
                              <span>Alumnos: <b>{matrizSeleccionada.rec_hum_estudiantes}</b></span>
                              <span>Administrativos: <b>{matrizSeleccionada.rec_hum_administrativos}</b></span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border-r border-slate-300">Materiales Declarados:</td>
                            <td className="p-2 text-slate-600 text-[11px]">
                              {matrizSeleccionada.rec_mat_material_didactico && `Didáctico: ${matrizSeleccionada.rec_mat_material_didactico}. `}
                              {matrizSeleccionada.rec_mat_equipos && `Equipos: ${matrizSeleccionada.rec_mat_equipos}. `}
                              {matrizSeleccionada.rec_mat_utiles && `Útiles: ${matrizSeleccionada.rec_mat_utiles}.`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* PASO 9: FINANCIAMIENTO */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider">9. Presupuesto y Fuentes de Financiamiento</h4>
                      
                      {matrizSeleccionada.fuentes_financiamiento && matrizSeleccionada.fuentes_financiamiento.length > 0 ? matrizSeleccionada.fuentes_financiamiento.map((fuente, idx) => (
                        <div key={fuente.id || idx} className="mb-4 border border-slate-300 rounded overflow-hidden">
                          <div className="bg-slate-100 p-2 border-b border-slate-300 flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">Fuente {idx + 1}: {fuente.fuente_display}</span>
                            <span className="font-bold text-[#b1122b]">Monto Asignado: S/ {fuente.monto}</span>
                          </div>
                          {fuente.descripcion && (
                            <div className="p-2 text-[10px] text-slate-600 border-b border-slate-300 italic bg-white">
                              Detalle: {fuente.descripcion}
                            </div>
                          )}
                          <table className="w-full text-[10px] border-collapse bg-white">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-300 text-slate-600">
                                <th className="p-1.5 text-left border-r border-slate-300 w-2/12">Categoría</th>
                                <th className="p-1.5 text-left border-r border-slate-300 w-4/12">Descripción / Rubro</th>
                                <th className="p-1.5 text-center border-r border-slate-300 w-1/12">Und</th>
                                <th className="p-1.5 text-center border-r border-slate-300 w-1/12">Cant</th>
                                <th className="p-1.5 text-right border-r border-slate-300 w-2/12">Costo U.</th>
                                <th className="p-1.5 text-right w-2/12">Total (S/)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {fuente.partidas && fuente.partidas.length > 0 ? fuente.partidas.map((partida, pIdx) => (
                                <tr key={partida.id || pIdx} className="hover:bg-slate-50">
                                  <td className="p-1.5 border-r border-slate-300 font-medium">{partida.categoria_display || partida.categoria}</td>
                                  <td className="p-1.5 border-r border-slate-300">{partida.descripcion}</td>
                                  <td className="p-1.5 text-center border-r border-slate-300">{partida.unidad}</td>
                                  <td className="p-1.5 text-center border-r border-slate-300">{partida.cantidad}</td>
                                  <td className="p-1.5 text-right border-r border-slate-300">{partida.costo_unitario}</td>
                                  <td className="p-1.5 text-right font-semibold">{partida.monto_presupuestado}</td>
                                </tr>
                              )) : (
                                <tr><td colSpan="6" className="p-2 text-center text-slate-400">No hay partidas registradas para esta fuente.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )) : (
                        <div className="text-center p-4 border border-slate-300 bg-slate-50 text-slate-500 text-[10px] rounded">Sin fuentes de financiamiento registradas.</div>
                      )}
                    </div>

                    {/* CONTROL DE CONTROL INTERNO Y FIRMA DIGITAL DE AUTORIZACIÓN */}
                    <div className="mt-12 pt-6 border-t-2 border-slate-800 font-sans">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Sección IX: Validación de Firmas y Trazabilidad del Servidor</h5>
                      
                      <div className="grid grid-cols-2 gap-8 text-center text-xs">
                        <div className="flex flex-col items-center justify-end h-28 border border-slate-200 bg-slate-50/50 p-4 rounded-xl relative overflow-hidden">
                          {matrizSeleccionada.docente_responsable_detalle?.firma_digital ? (
                            <img src={matrizSeleccionada.docente_responsable_detalle.firma_digital} alt="Firma del Docente" className="absolute top-2 max-h-16 object-contain opacity-90" />
                          ) : (
                            <div className="absolute top-2 text-[8px] font-mono text-slate-300 select-none rotate-12">SIN FIRMA DIGITAL</div>
                          )}
                          <div className="w-48 border-b border-slate-400 mb-1 z-10"></div>
                          <span className="font-bold text-slate-800 text-[11px] block z-10">
                            {matrizSeleccionada.docente_responsable_detalle ? 
                              `${matrizSeleccionada.docente_responsable_detalle.nombres} ${matrizSeleccionada.docente_responsable_detalle.apellidos}` 
                              : 'Coordinador Docente RSU'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono z-10">
                            Usuario: {matrizSeleccionada.docente_responsable_detalle?.correo_institucional || 'Vinc-Back'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-end h-28 border border-slate-200 bg-slate-50/50 p-4 rounded-xl relative overflow-hidden">
                          {/* Sello digital de la oficina */}
                          <div className="absolute top-2 text-[9px] font-bold text-emerald-600/20 border-2 border-emerald-600/20 px-2 py-0.5 rounded rotate-12">OFICINA OURS - VERIFICADO</div>
                          <div className="w-36 border-b border-slate-400 mb-1 border-dashed z-10"></div>
                          <span className="font-bold text-slate-800 text-[11px] block z-10">Jefatura de Oficina OURS</span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-1 rounded z-10">Sello Digital UNSA</span>
                        </div>
                      </div>
                    </div>

                    {/* TRAZABILIDAD FINAL */}
                    <div className="mt-10 text-[9px] text-slate-400 font-mono text-right border-t pt-2 flex justify-between items-center font-sans">
                      <span>Expediente ID: #{matrizSeleccionada.id} | Estado: {matrizSeleccionada.estado || 'Procesado'}</span>
                      <span>Sincronización Completa con Django REST</span>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Informes;

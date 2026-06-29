import React, { useState } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiSearch, FiFileText, FiFilter, FiPrinter, FiDownload, FiInfo } from "react-icons/fi";

const Informes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [matrizSeleccionada, setMatrizSeleccionada] = useState(null);

  // ARREGLO DE MATRICES UTILIZANDO ESTRICTAMENTE LAS VARIABLES DEL SERIALIZER
  const [dataMatrices, setDataMatrices] = useState([
    {
      id: 1,
      codigo: "MATRIZ-2026-MED",
      estado: "aprobado",
      periodo: 1,
      periodo_nombre: "AÑO ACADÉMICO 2026 - SEMESTRE I",
      facultad: 1,
      facultad_nombre: "Medicina",
      coordinador: 12,
      coordinador_nombre: "Ana Silva",
      coordinador_detalle: {
        id: 12,
        nombres: "Ana",
        apellidos: "Silva",
        correo_institucional: "asilva@unsa.edu.pe",
        firma_digital: "http://localhost:8000/media/firmas/firma_as.png"
      },
      presupuesto_global: "45000.00",
      observaciones: "La ejecución se realizó con normalidad en los centros de salud comunitarios asignados.",
      created_at: "2026-03-01T08:00:00Z",
      updated_at: "2026-06-25T14:20:00Z",
      objetivos: [
        {
          id: 20,
          matriz_operativa: 1,
          linea_estrategica: 1,
          linea_estrategica_nombre: "Salud Pública y Bienestar Social",
          objetivo_institucional: 2,
          objetivo_institucional_nombre: "Promover entornos saludables en poblaciones vulnerables",
          nombre: "Fortalecer la prevención en salud comunitaria",
          indicadores: [
            { id: 1, objetivo_operativo: 20, nombre: "Campañas de vacunación realizadas", unidad_medida: "Campañas", valor_meta: 5, valor_alcanzado: 5, observaciones: "Meta cumplida al 100%." },
            { id: 2, objetivo_operativo: 20, nombre: "Población atendida en zonas vulnerables", unidad_medida: "Personas", valor_meta: 500, valor_alcanzado: 580, observaciones: "Se superó la meta estimada por alta demanda." }
          ]
        }
      ]
    },
    {
      id: 2,
      codigo: "MATRIZ-2026-FIPS",
      estado: "aprobado",
      periodo: 1,
      periodo_nombre: "AÑO ACADÉMICO 2026 - SEMESTRE I",
      facultad: 3,
      facultad_nombre: "Ingeniería de Producción y Servicios",
      coordinador: 45,
      coordinador_nombre: "Pedro Marroquín",
      coordinador_detalle: {
        id: 45,
        nombres: "Pedro",
        apellidos: "Marroquín",
        correo_institucional: "pmarroquin@unsa.edu.pe",
        firma_digital: "http://localhost:8000/media/firmas/firma_pm.png"
      },
      presupuesto_global: "38000.00",
      observaciones: "Se detectaron retrasos leves en el cronograma por mantenimiento general de laboratorios.",
      created_at: "2026-03-02T09:30:00Z",
      updated_at: "2026-06-27T11:15:00Z",
      objetivos: [
        {
          id: 22,
          matriz_operativa: 2,
          linea_estrategica: 2,
          linea_estrategica_nombre: "Inclusión y Desarrollo Comunitario",
          objetivo_institucional: 1,
          objetivo_institucional_nombre: "Fortalecer la vinculación social universitaria",
          nombre: "Desarrollar habilidades digitales en el adulto mayor",
          indicadores: [
            { id: 3, objetivo_operativo: 22, nombre: "Talleres de alfabetización digital dictados", unidad_medida: "Talleres", valor_meta: 4, valor_alcanzado: 3, observaciones: "Un taller quedó pendiente de reprogramación." }
          ]
        }
      ]
    }
  ]);

  const filteredMatrices = dataMatrices.filter(matriz => {
    const matchesSearch = matriz.facultad_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          matriz.coordinador_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          matriz.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = facultyFilter ? matriz.facultad_nombre === facultyFilter : true;
    const matchesStatus = statusFilter ? matriz.estado === statusFilter : true;
    return matchesSearch && matchesFaculty && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="ml-[230px] flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar />

        {/* ÁREA DE TRABAJO */}
        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 m-0">Informes de Ejecución</h2>
            <p className="text-sm text-slate-500 mt-1">Generación e impresión del Formato Oficial OURS basado en la Matriz Operativa</p>
          </div>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* PANEL IZQUIERDO: FILTROS Y SELECCIÓN */}
            <div className="xl:col-span-5 flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <FiFilter /> Filtros de Búsqueda
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <FiSearch className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar por código, coordinador o facultad..."
                    className="w-full text-xs outline-none bg-transparent text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    className="w-full h-[38px] px-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 outline-none"
                    value={facultyFilter}
                    onChange={(e) => setFacultyFilter(e.target.value)}
                  >
                    <option value="">Todas las Facultades</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Ingeniería de Producción y Servicios">Ingeniería de Prod.</option>
                  </select>
                  <select 
                    className="w-full h-[38px] px-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos los Estados</option>
                    <option value="aprobado">Aprobado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {filteredMatrices.map((matriz) => (
                  <div 
                    key={matriz.id}
                    onClick={() => setMatrizSeleccionada(matriz)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                      matrizSeleccionada?.id === matriz.id ? 'border-[#b1122b] ring-2 ring-[#b1122b]/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{matriz.codigo}</span>
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                          {matriz.estado}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-1.5">Matriz - Facultad de {matriz.facultad_nombre}</h3>
                      <p className="text-xs text-slate-500 mt-1">Coordinador(a): {matriz.coordinador_nombre}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Asignado: <b className="text-slate-600">S/. {matriz.presupuesto_global}</b></span>
                      <span className="text-[#b1122b] font-semibold flex items-center gap-1">Ver Reporte Estructurado →</span>
                    </div>
                  </div>
                ))}
                {filteredMatrices.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs font-medium">
                    No se encontraron matrices operativas con los filtros actuales.
                  </div>
                )}
              </div>
            </div>

            {/* PANEL REPORTE HOJA FÍSICA A4 (OFICIAL OURS) */}
            <div className="xl:col-span-7 w-full">
              {!matrizSeleccionada ? (
                <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white shadow-xs">
                  <FiFileText className="w-12 h-12 text-slate-300 mb-2" />
                  <span className="text-slate-500 text-sm font-semibold">Ningún reporte cargado</span>
                  <span className="text-slate-400 text-xs mt-1 max-w-xs">Selecciona una planificación aprobada del panel izquierdo para compilar el Formato Final de Ejecución RSU.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* BARRA DE ACCIONES DEL REPORTE */}
                  <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Campos Validados del Backend
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.print()} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                        <FiPrinter /> Imprimir
                      </button>
                      <button className="px-3 py-1.5 bg-[#b1122b] text-white rounded-lg text-xs font-bold hover:bg-red-800 transition-colors flex items-center gap-1.5 shadow-xs">
                        <FiDownload /> Exportar PDF
                      </button>
                    </div>
                  </div>

                  {/* DOCUMENTO ESTRUCTURADO EXACTAMENTE COMO EL FORMATO DE LA OFICINA */}
                  <div className="w-full bg-white rounded-xl border border-slate-200 shadow-md p-8 md:p-12 max-w-2xl mx-auto border-t-[6px] border-t-[#b1122b] font-serif select-text">
                    
                    {/* ENCABEZADO INSTITUCIONAL */}
                    <div className="text-center space-y-1 border-b-2 border-slate-800 pb-5 mb-6">
                      <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Universidad Nacional de San Agustín de Arequipa</h2>
                      <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Vicerrectorado Académico</h3>
                      <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Oficina Universitaria de Responsabilidad Social (OURS)</h3>
                      <div className="pt-5">
                        <h1 className="text-sm font-extrabold text-slate-900 uppercase border-y-2 border-slate-900 py-2 inline-block px-6 tracking-wide bg-slate-50">
                          Informe Final de Consolidación y Metas RSU
                        </h1>
                      </div>
                    </div>

                    {/* SECCIÓN 1: DATOS GENERALES */}
                    <div className="space-y-3 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase tracking-wider">I. Datos Informativos de la Unidad</h4>
                      <table className="w-full text-xs border border-slate-300 border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-300 bg-slate-50/60">
                            <td className="p-2.5 font-bold text-slate-700 w-4/12 border-r border-slate-300">Código de Matriz:</td>
                            <td className="p-2.5 text-slate-800 font-mono font-bold">{matrizSeleccionada.codigo}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">Periodo Académico:</td>
                            <td className="p-2.5 text-slate-800 font-medium">{matrizSeleccionada.periodo_nombre}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">Facultad Destinataria:</td>
                            <td className="p-2.5 text-slate-800 font-semibold">{matrizSeleccionada.facultad_nombre}</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">Coordinador Responsable:</td>
                            <td className="p-2.5 text-slate-800">{matrizSeleccionada.coordinador_nombre}</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold text-slate-700 border-r border-slate-300">Presupuesto Global Asignado:</td>
                            <td className="p-2.5 text-slate-950 font-bold">S/. {matrizSeleccionada.presupuesto_global}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* SECCIÓN 2: DESEMPEÑO DE OBJETIVOS E INDICADORES OPERATIVOS */}
                    <div className="space-y-3 mb-6">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase tracking-wider">II. Cuadro Consolidado de Cumplimiento de Metas</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border border-slate-300 border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                              <th className="p-2.5 text-left border-r border-slate-300 w-5/12">Objetivos / Indicador Real Registrado</th>
                              <th className="p-2.5 text-center border-r border-slate-300 w-2/12">U. Medida</th>
                              <th className="p-2.5 text-center border-r border-slate-300 w-1.5/12">Meta</th>
                              <th className="p-2.5 text-center border-r border-slate-300 w-1.5/12">Logro</th>
                              <th className="p-2.5 text-left w-2/12">Evidencia / Notas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300">
                            {matrizSeleccionada.objetivos.map((obj) => (
                              <React.Fragment key={obj.id}>
                                {/* FILA CABECERA DE OBJETIVO OPERATIVO */}
                                <tr className="bg-slate-50 font-bold border-y border-slate-300">
                                  <td colSpan="5" className="p-2 text-slate-900 text-xs">
                                    🎯 Objetivo Operativo: {obj.nombre}
                                    <span className="block font-normal text-[9.5px] text-slate-500 mt-0.5">
                                      Línea Estratégica: {obj.linea_estrategica_nombre} | Objetivo Inst.: {obj.objetivo_institucional_nombre}
                                    </span>
                                  </td>
                                </tr>
                                {/* MAPEO DE INDICADORES DEL OBJETIVO */}
                                {obj.indicadores?.map((ind) => (
                                  <tr key={ind.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5 text-slate-700 border-r border-slate-300 pl-4 font-medium">
                                      {ind.nombre}
                                    </td>
                                    <td className="p-2.5 text-center text-slate-600 border-r border-slate-300 font-serif italic">
                                      {ind.unidad_medida}
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-slate-700 border-r border-slate-300">
                                      {ind.valor_meta}
                                    </td>
                                    <td className={`p-2.5 text-center font-bold border-r border-slate-300 ${
                                      ind.valor_alcanzado >= ind.valor_meta ? 'text-emerald-700 bg-emerald-50/30' : 'text-amber-700 bg-amber-50/30'
                                    }`}>
                                      {ind.valor_alcanzado}
                                    </td>
                                    <td className="p-2.5 text-slate-500 text-[10px] leading-tight">
                                      {ind.observaciones || "Sin observaciones adicionales."}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SECCIÓN 3: DIAGNÓSTICO Y OBSERVACIONES FINALES */}
                    <div className="space-y-3 mb-10">
                      <h4 className="text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase tracking-wider">III. Diagnóstico Técnico y Observaciones de la Unidad</h4>
                      <div className="p-3.5 border border-slate-300 bg-slate-50/40 text-xs text-slate-800 text-justify leading-relaxed font-serif whitespace-pre-line">
                        {matrizSeleccionada.observaciones || "No se registraron observaciones técnicas u obstáculos durante la ejecución del presente periodo fiscal RSU."}
                      </div>
                    </div>

                    {/* BLOQUE DE FIRMA Y VALIDACIÓN DIGITAL DE ACUERDO AL backend */}
                    <div className="mt-16 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                      <div className="flex flex-col items-center justify-end h-32">
                        {matrizSeleccionada.coordinador_detalle?.firma_digital ? (
                          <div className="border border-slate-100 p-1 bg-white mb-1 shadow-2xs rounded">
                            <span className="text-[8px] bg-emerald-500 text-white font-mono block px-1 py-0.5 rounded-2xs uppercase mb-1 font-sans">Firma Digitalizada</span>
                            <img 
                              src={matrizSeleccionada.coordinador_detalle.firma_digital} 
                              alt="Firma" 
                              className="h-10 object-contain mix-blend-multiply opacity-85" 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className="w-32 border-b border-slate-400 mb-2"></div>
                        )}
                        <span className="font-bold text-slate-800 block">{matrizSeleccionada.coordinador_nombre}</span>
                        <span className="text-[10px] text-slate-500 font-sans mt-0.5">Coordinador(a) RSU Facultad</span>
                        <span className="text-[9px] text-slate-400 font-mono block">{matrizSeleccionada.coordinador_detalle?.correo_institucional}</span>
                      </div>

                      <div className="flex flex-col items-center justify-end h-32">
                        <div className="w-36 border-b border-slate-400 mb-2 border-dashed"></div>
                        <span className="font-extrabold text-slate-800 block">Oficina OURS — UNSA</span>
                        <span className="text-[10px] text-slate-500 font-sans mt-0.5">Área de Control y Calidad RSU</span>
                        <span className="text-[9px] text-slate-400 font-mono block">Sello Técnico Institucional</span>
                      </div>
                    </div>

                    {/* TRAZABILIDAD DEL REPORTE */}
                    <div className="mt-12 text-[9px] text-slate-400 font-mono text-right border-t pt-2 flex justify-between items-center font-sans">
                      <span>Última mod. backend: {new Date(matrizSeleccionada.updated_at).toLocaleString()}</span>
                      <span>Formato Oficial OURS-V2</span>
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
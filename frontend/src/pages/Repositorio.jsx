import React, { useState } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiSearch, FiBook, FiFileText, FiEye, FiX, FiCalendar, FiUser, FiMapPin, FiAward, FiTarget, FiDollarSign } from "react-icons/fi";

const Repositorio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultadFilter, setFacultadFilter] = useState('');
  const [ejeRsuFilter, setEjeRsuFilter] = useState('');
  const [anioFilter, setAnioFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // ARREGLO DE PROYECTOS USANDO ÚNICAMENTE LAS VARIABLES DEL SERIALIZER
  const [proyectosRepositorio, setProyectosRepositorio] = useState([
    {
      id: 1,
      codigo: "PROY-FIPS-0001",
      estado: "aprobado",
      es_continuacion: false,
      proyecto_origen: null,
      continuaciones_count: 0,
      facultad: 3,
      facultad_nombre: "Ingeniería de Producción y Servicios",
      escuela: 5,
      escuela_nombre: "Ingeniería de Sistemas",
      departamento: 2,
      departamento_nombre: "Ingeniería de Sistemas e Informática",
      semestre_academico: "2026-I",
      titulo: "Alfabetización Digital para Adultos Mayores",
      nro_docentes: 2,
      nro_estudiantes: 25,
      lugar_ejecucion: "Cercado, Arequipa - Local Social Adulto Mayor",
      beneficiarios: [1],
      beneficiarios_info: [
        { id: 1, codigo: "adulto_mayor", label: "Adultos Mayores (60+ años)" }
      ],
      benef_otro_detalle: "",
      eje_rsu: 1,
      eje_rsu_nombre: "Voluntariado",
      ejes_subitems: [
        { id: 1, sub_eje: 4, sub_eje_clave: "V-01", sub_eje_nombre: "Inclusión Digital", detalle: "Capacitación básica" }
      ],
      eje_detalle: "",
      linea_estrategica: 2,
      linea_estrategica_nombre: "Inclusión y Desarrollo Comunitario",
      objetivo_institucional: 1,
      objetivo_institucional_nombre: "Fortalecer la vinculación social universitaria",
      tipo_actividad: ["programas_formativos"],
      tipo_actividad_display: ["Programas formativos"],
      tipo_actividad_otro: "",
      meta_cuantitativa: "Capacitar a 50 adultos mayores",
      indicador: "Número de adultos mayores certificados",
      fecha_inicio: "2026-04-01",
      fecha_evaluacion_avance: "2026-05-20",
      fecha_termino: "2026-07-15",
      fecha_encuesta_docentes: "2026-07-10",
      fecha_encuesta_alumnos: "2026-07-12",
      fecha_encuesta_grupo_destinatario: "2026-07-14",
      fund_por_que_grupo: "El grupo de adultos mayores presenta una brecha digital crítica que limita su acceso a trámites esenciales.",
      fund_para_que_proyecto: "Para empoderar al grupo mediante habilidades tecnológicas básicas reduciendo el aislamiento social.",
      fund_mecanismo_ensenanza: "Metodología Aprendizaje-Servicio mediante talleres prácticos personalizados.",
      diag_estado_grupo: "El 85% de los participantes no cuenta con correo electrónico.",
      diag_problemas_detectados: "Falta de paciencia en entornos familiares y analfabetismo digital.",
      diag_aportes_formacion: "Desarrollo de competencias de responsabilidad social y empatía en el alumnado.",
      diag_justificacion_intervencion: "Es imperativo intervenir para mitigar la exclusión financiera y gubernamental del adulto mayor.",
      obj_logro_intervencion: "Lograr la autonomía en el uso de herramientas de comunicación y banca móvil.",
      obj_mejora_curricular: "Vincular la teoría de interfaces de usuario con necesidades de usabilidad del mundo real.",
      resultado_en_beneficiarios: "Se capacitó con éxito a 58 adultos mayores con un nivel básico-intermedio.",
      resultado_en_curriculo: "Los estudiantes consolidaron competencias blandas de comunicación asertiva.",
      impacto_esperado: "Reducción estimada del 30% en la dependencia tecnológica del grupo piloto.",
      actividades: [
        { id: 1, nombre: "Taller 01: Configuración segura de Smartphone", descripcion: "Uso seguro de apps.", curso_vinculado: "Interacción Humano Computador", responsable: "Pedro Marroquín", fecha: "2026-04-15", evidencia_esperada: "Fotos del taller y lista de asistencia", orden: 1 }
      ],
      cronograma: [
        { id: 1, descripcion: "Convocatoria y registro de participantes", mes_semana: "Semana 1", responsable: "Alumnos asignados", estado_avance: "completado", orden: 1 }
      ],
      rec_hum_docentes: "2 docentes de la escuela de sistemas",
      rec_hum_administrativos: "Ninguno",
      rec_hum_estudiantes: "25 alumnos matriculados",
      rec_hum_egresados: "Ninguno",
      rec_hum_voluntarios: "Ninguno",
      rec_hum_otros: "",
      rec_mat_material_didactico: "Guías impresas visuales paso a paso",
      rec_mat_afiches: "Afiches digitales",
      rec_mat_equipos: "Proyector multimedia y smartphones propios",
      rec_mat_utiles: "Cuadernos de apuntes y lapiceros",
      rec_mat_otros: "",
      monto_financiamiento: "38000.00",
      fuente_financiamiento: "recursos_ordinarios",
      fuente_financiamiento_display: "Recursos Ordinarios UNSA",
      descripcion_gastos: "Adquisición de material didáctico, movilidad para alumnos y coffee break de clausura.",
      observaciones_financiamiento: "Presupuesto ejecutado al 98.5%.",
      financiamiento_confirmado: true,
      financiamiento_fecha_confirmacion: "2026-03-15",
      periodo: 1,
      periodo_nombre: "AÑO ACADÉMICO 2026 - SEMESTRE I",
      docente_responsable: 45,
      docente_responsable_nombre: "Pedro Marroquín",
      docente_responsable_detalle: {
        id: 45,
        nombres: "Pedro",
        apellidos: "Marroquín",
        correo_institucional: "pmarroquin@unsa.edu.pe",
        firma_digital: "http://localhost:8000/media/firmas/firma_pm.png"
      },
      anio_carrera: "4",
      anio_carrera_display: "Cuarto Año",
      es_tesis_quinto_anio: false,
      ods: [4, 10],
      ods_info: [
        { id: 4, numero: 4, nombre: "Educación de Calidad" },
        { id: 10, numero: 10, nombre: "Reducción de las Desigualdades" }
      ],
      asignaturas: [
        { id: 12, nombre_asignatura: "Interacción Humano Computador", codigo_asignatura: "IHC-202", anio_carrera: "4", semestre: "VII" }
      ],
      docentes_adicionales: [
        { id: 102, docente: 88, docente_nombre: "Carlos", docente_apellidos: "Mendoza", docente_correo: "cmendoza@unsa.edu.pe", docente_firma: null, rol_en_proyecto: "co_coordinador" }
      ],
      presentado_con_anticipacion: true,
      conclusiones: "El proyecto cubrió satisfactoriamente la brecha inicial detectada.",
      recomendaciones: "Se sugiere extender las horas de taller práctico en futuros semestres.",
      lecciones_aprendidas: "El ritmo de aprendizaje requiere asistencia uno a uno.",
      medio_difusion: "Nota de prensa en el portal web institucional de la UNSA.",
      documentos_sustento: [
        { id: 5, archivo: "http://localhost:8000/media/docs/informe_final.pdf", nombre: "Informe Final de Evidencias FIPS", uploaded_at: "2026-07-20" }
      ],
      created_at: "2026-03-01T10:00:00Z",
      updated_at: "2026-07-20T18:30:00Z",
      fecha_envio_revision: "2026-03-10",
      fecha_aprobacion: "2026-03-20",
      fecha_inicio_ejecucion: "2026-04-01",
      fecha_cierre: "2026-07-25"
    }
  ]);

  const filteredProyectos = proyectosRepositorio.filter(proyecto => {
    const matchesSearch = proyecto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          proyecto.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFacultad = facultadFilter ? proyecto.facultad_nombre === facultadFilter : true;
    const matchesEje = ejeRsuFilter ? proyecto.eje_rsu_nombre === ejeRsuFilter : true;
    const matchesAnio = anioFilter ? proyecto.periodo_nombre.includes(anioFilter) : true;
    return matchesSearch && matchesFacultad && matchesEje && matchesAnio;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        <Topbar />

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          
          {/* HEADER */}
          <div className="mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-slate-800 m-0">Repositorio Institucional</h2>
            <p className="text-sm text-slate-500 mt-1">Biblioteca digital de proyectos RSU finalizados y buenas prácticas</p>
          </div>

          {/* HERRAMIENTAS DE FILTRADO */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white w-full lg:max-w-md">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código o título..."
                className="w-full text-sm outline-none bg-transparent text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <select className="h-[40px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 bg-white" value={facultadFilter} onChange={(e) => setFacultadFilter(e.target.value)}>
                <option value="">Facultad</option>
                <option value="Ingeniería de Producción y Servicios">Ingeniería de Prod.</option>
              </select>

              <select className="h-[40px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 bg-white" value={ejeRsuFilter} onChange={(e) => setEjeRsuFilter(e.target.value)}>
                <option value="">Eje RSU</option>
                <option value="Voluntariado">Voluntariado</option>
              </select>

              <select className="h-[40px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 bg-white" value={anioFilter} onChange={(e) => setAnioFilter(e.target.value)}>
                <option value="">Año</option>
                <option value="2026">2026</option>
              </select>

              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-[40px]">
                <button onClick={() => setViewMode('grid')} className={`px-3 h-full flex items-center justify-center ${viewMode === 'grid' ? 'bg-slate-100 text-[#b1122b]' : 'bg-white text-slate-400'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`px-3 h-full flex items-center justify-center border-l border-slate-300 ${viewMode === 'list' ? 'bg-slate-100 text-[#b1122b]' : 'bg-white text-slate-400'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* LISTADO DE TARJETAS */}
          {filteredProyectos.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
              {filteredProyectos.map((proyecto) => (
                <div key={proyecto.id} className={viewMode === 'grid' ? "bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between" : "bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"}>
                  <div className={viewMode === 'grid' ? "w-full" : "flex-1"}>
                    {viewMode === 'grid' && (
                      <div className="h-32 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative">
                        <FiBook className="w-8 h-8 text-slate-300" />
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/90 text-slate-600 px-2 py-0.5 rounded shadow-2xs">
                          {proyecto.semestre_academico}
                        </span>
                      </div>
                    )}
                    <div className={viewMode === 'grid' ? "p-4" : "flex flex-col gap-1"}>
                      <div className="flex flex-wrap gap-1 mb-2">
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
                  <div className={viewMode === 'grid' ? "p-4 pt-0 grid grid-cols-2 gap-2" : "flex items-center gap-2 shrink-0"}>
                    <button onClick={() => setProyectoSeleccionado(proyecto)} className="flex items-center justify-center gap-1.5 h-9 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      <FiEye /> Ver
                    </button>
                    <button className="flex items-center justify-center gap-1.5 h-9 bg-slate-100 rounded-lg text-xs font-semibold text-[#b1122b] hover:bg-red-50">
                      <FiFileText /> Informe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">
              <FiBook className="w-10 h-10 text-slate-300 mb-2" />
              <span className="text-slate-500 text-sm font-semibold">No se encontraron registros</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CON VARIABLES EXCLUSIVAS DEL SERIALIZER */}
      {proyectoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold text-[#b1122b] uppercase bg-red-50 px-2 py-1 rounded">
                  {proyectoSeleccionado.codigo} — {proyectoSeleccionado.estado.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 pr-4">{proyectoSeleccionado.titulo}</h3>
              </div>
              <button onClick={() => setProyectoSeleccionado(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600">
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
                    <li><b>Año Carrera / Tesis:</b> {proyectoSeleccionado.anio_carrera_display} / {proyectoSeleccionado.es_tesis_quinto_anio ? "Sí" : "No"}</li>
                    <li><b>Participantes totales:</b> {proyectoSeleccionado.nro_docentes} Docentes y {proyectoSeleccionado.nro_estudiantes} Estudiantes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alineamiento e Impacto RSU</h4>
                  <ul className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <li><b>Eje RSU Principal:</b> {proyectoSeleccionado.eje_rsu_nombre}</li>
                    <li><b>Línea Estratégica:</b> {proyectoSeleccionado.linea_estrategica_nombre}</li>
                    <li><b>Objetivo Institucional:</b> {proyectoSeleccionado.objetivo_institucional_nombre}</li>
                    <li><b>Tipos de Actividad:</b> {proyectoSeleccionado.tipo_actividad_display?.join(', ')}</li>
                    <li><b>Fuente de Finan.:</b> {proyectoSeleccionado.fuente_financiamiento_display}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ODS Mapeados (`ods_info`)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {proyectoSeleccionado.ods_info?.map(o => (
                      <span key={o.id} className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
                        🌍 ODS {o.numero}: {o.nombre}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Beneficiarios Destinatarios (`beneficiarios_info`)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {proyectoSeleccionado.beneficiarios_info?.map(b => (
                      <span key={b.id} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-medium">
                        👥 [{b.codigo.toUpperCase()}] {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Fundamentación (Sección II y III)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block mb-1">Fundamentación Grupo (`fund_por_que_grupo`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.fund_por_que_grupo}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block mb-1">Fundamentación Proyecto (`fund_para_que_proyecto`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.fund_para_que_proyecto}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block mb-1">Mecanismo de Enseñanza (`fund_mecanismo_ensenanza`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.fund_mecanismo_ensenanza}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block mb-1">Diagnóstico del Grupo (`diag_estado_grupo`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.diag_estado_grupo}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Sección IV y V: Objetivos y Resultados</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 border border-slate-200 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-800 block mb-1">Logro Intervención (`obj_logro_intervencion`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.obj_logro_intervencion}</p>
                  </div>
                  <div className="p-3 border border-slate-200 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-800 block mb-1">Mejora Curricular (`obj_mejora_curricular`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.obj_mejora_curricular}</p>
                  </div>
                  <div className="p-3 border border-emerald-100 bg-emerald-50/20 rounded-xl">
                    <span className="font-bold text-emerald-900 block mb-1">Resultados Beneficiarios (`resultado_en_beneficiarios`)</span>
                    <p className="text-slate-600 text-justify">{proyectoSeleccionado.resultado_en_beneficiarios}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asignaturas (`asignaturas`)</h4>
                  {proyectoSeleccionado.asignaturas?.map(asig => (
                    <div key={asig.id} className="p-2 bg-slate-50 rounded-lg text-xs border mb-1">
                      📄 <b>{asig.nombre_asignatura}</b> ({asig.codigo_asignatura}) — {asig.anio_carrera}° Año / Semestre {asig.semestre}
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Docentes Adicionales (`docentes_adicionales`)</h4>
                  {proyectoSeleccionado.docentes_adicionales?.map(doc => (
                    <div key={doc.id} className="p-2 bg-slate-50 rounded-lg text-xs border mb-1">
                      👤 {doc.docente_nombre} {doc.docente_apellidos} — <span className="text-[#b1122b] font-semibold">{doc.rol_en_proyecto}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Trazabilidad Final</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-500">
                  <div><b>Creado:</b> {proyectoSeleccionado.created_at.substring(0,10)}</div>
                  <div><b>Aprobación:</b> {proyectoSeleccionado.fecha_aprobacion}</div>
                  <div><b>Inicio Ejecución:</b> {proyectoSeleccionado.fecha_inicio_ejecucion}</div>
                  <div><b>Cierre Técnico:</b> {proyectoSeleccionado.fecha_cierre}</div>
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
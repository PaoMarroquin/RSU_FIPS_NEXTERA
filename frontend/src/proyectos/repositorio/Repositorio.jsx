import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../shared/layout/Layout';
import {
  FiSearch,
  FiBook,
  FiEye,
  FiX,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiDollarSign,
  FiCheckCircle,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiFileText,
  FiBookOpen,
  FiTarget,
  FiCopy,
  FiAlertCircle,
} from 'react-icons/fi';

import { useRepositorio } from './hooks/useRepositorio';

const Repositorio = () => {
  const navigate = useNavigate();

  const {
    esDocente, // Obtenemos el rol desde el hook
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    proyectoSeleccionado,
    setProyectoSeleccionado,
    proyectosRepositorio,
    loading,
    error,
    page,
    setPage,
    totalPages,
    filtros,
    opcionesFiltros,
    filtrosAplicados,
    actualizarFiltro,
    limpiarFiltros,
    obtenerDetalleProyecto,
    obtenerInformeFinal,
    obtenerLeccionesAprendidas,
    continuarProyecto,
    periodosAcademicos,
    cargarPeriodosAcademicos,
  } = useRepositorio();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const [informeFinal, setInformeFinal] = useState(null);
  const [informeLoading, setInformeLoading] = useState(false);

  const [lecciones, setLecciones] = useState(null);
  const [leccionesLoading, setLeccionesLoading] = useState(false);

  const [mostrarContinuacion, setMostrarContinuacion] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  const [continuandoProyecto, setContinuandoProyecto] = useState(false);
  const [errorContinuacion, setErrorContinuacion] = useState('');

  const abrirDetalle = async (proyecto) => {
    setDetalleLoading(true);
    setInformeFinal(null);
    setLecciones(null);
    setErrorContinuacion('');

    const detalle = await obtenerDetalleProyecto(proyecto.id);
    setProyectoSeleccionado(detalle || proyecto);
    setDetalleLoading(false);
  };

  const cargarInformeFinal = async () => {
    if (!proyectoSeleccionado?.id) return;
    setInformeLoading(true);
    const response = await obtenerInformeFinal(proyectoSeleccionado.id);
    setInformeFinal(response);
    setInformeLoading(false);
  };

  const cargarLecciones = async () => {
    if (!proyectoSeleccionado?.id) return;
    setLeccionesLoading(true);
    const response = await obtenerLeccionesAprendidas({
      proyecto: proyectoSeleccionado.id,
      page: 1,
      page_size: 20,
    });
    setLecciones(response);
    setLeccionesLoading(false);
  };

  const abrirModalContinuacion = async () => {
    setPeriodoSeleccionado('');
    setErrorContinuacion('');
    await cargarPeriodosAcademicos();
    setMostrarContinuacion(true);
  };

  const cerrarModalContinuacion = () => {
    if (continuandoProyecto) return;
    setMostrarContinuacion(false);
    setPeriodoSeleccionado('');
    setErrorContinuacion('');
  };

  const handleContinuarProyecto = async () => {
    if (!periodoSeleccionado) {
      setErrorContinuacion('Selecciona el periodo académico para continuar el proyecto.');
      return;
    }
    if (!proyectoSeleccionado?.id) {
      setErrorContinuacion('No se encontró el proyecto seleccionado.');
      return;
    }

    setContinuandoProyecto(true);
    setErrorContinuacion('');

    try {
      const nuevoProyecto = await continuarProyecto(proyectoSeleccionado.id, periodoSeleccionado);

      if (!nuevoProyecto) {
        setErrorContinuacion('No fue posible crear la continuación del proyecto.');
        return;
      }

      setMostrarContinuacion(false);
      setProyectoSeleccionado(null);
      setPeriodoSeleccionado('');
      navigate(`/proyectos/editar/${nuevoProyecto.id}`);

    } catch (err) {
      const mensaje = err?.response?.data?.detail || err?.response?.data?.error || err.message || 'No fue posible crear la continuación del proyecto.';
      setErrorContinuacion(mensaje);
    } finally {
      setContinuandoProyecto(false);
    }
  };

  const cerrarDetalle = () => {
    if (continuandoProyecto) return;
    setProyectoSeleccionado(null);
    setInformeFinal(null);
    setLecciones(null);
    setMostrarContinuacion(false);
    setPeriodoSeleccionado('');
    setErrorContinuacion('');
  };

  const renderEstadoBadge = (estado) => {
    if (estado === 'finalizado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <FiCheckCircle className="w-3 h-3 shrink-0" /> FINALIZADO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
        {estado?.toUpperCase().replace(/_/g, ' ') || 'N/A'}
      </span>
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  const getNombre = (objeto) => {
    if (!objeto) return 'N/A';
    return objeto.nombre || objeto.name || 'N/A';
  };

  const getEjes = (proyecto) => proyecto?.ejes_rsu || [];
  const getODS = (proyecto) => proyecto?.ods || [];
  const periodosDisponibles = periodosAcademicos || [];

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden">

        {/* HEADER */}
        <div className="mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">Repositorio Institucional</h2>
          <p className="text-sm text-slate-500 mt-1">Biblioteca digital de proyectos RSU finalizados y buenas prácticas institucionales.</p>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row gap-3 justify-between">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white w-full lg:max-w-xl focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b]">
              <FiSearch className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por título, código, docente, lugar o lecciones..."
                className="w-full text-sm outline-none bg-transparent text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex-1 lg:flex-none items-center justify-center gap-2 px-4 h-[40px] rounded-lg border text-sm font-semibold transition-colors flex ${mostrarFiltros ? 'bg-[#b1122b] text-white border-[#b1122b]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
              >
                <FiFilter className="shrink-0" /> Filtros
              </button>

              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-[40px] shrink-0">
                <button onClick={() => setViewMode('grid')} className={`px-3 h-full flex items-center justify-center ${viewMode === 'grid' ? 'bg-slate-100 text-[#b1122b]' : 'bg-white text-slate-400'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" /></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`px-3 h-full flex items-center justify-center border-l border-slate-300 ${viewMode === 'list' ? 'bg-slate-100 text-[#b1122b]' : 'bg-white text-slate-400'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          {mostrarFiltros && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Semestre */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Semestre</label>
                  <select value={filtros.semestre} onChange={(e) => actualizarFiltro('semestre', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todos</option>
                    {opcionesFiltros.semestres.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Facultad */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Facultad</label>
                  <select value={filtros.facultad} onChange={(e) => actualizarFiltro('facultad', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todas</option>
                    {opcionesFiltros.facultades.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                </div>
                {/* Escuela */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Escuela</label>
                  <select value={filtros.escuela} onChange={(e) => actualizarFiltro('escuela', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todas</option>
                    {opcionesFiltros.escuelas.filter((e) => !filtros.facultad || String(e.facultad_id) === String(filtros.facultad)).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                {/* Departamento */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Departamento</label>
                  <select value={filtros.departamento} onChange={(e) => actualizarFiltro('departamento', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todos</option>
                    {opcionesFiltros.departamentos.filter((d) => !filtros.facultad || String(d.facultad_id) === String(filtros.facultad)).map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                {/* Eje RSU */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Eje RSU</label>
                  <select value={filtros.eje_rsu} onChange={(e) => actualizarFiltro('eje_rsu', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todos</option>
                    {opcionesFiltros.ejes_rsu.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                {/* ODS */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">ODS</label>
                  <select value={filtros.ods} onChange={(e) => actualizarFiltro('ods', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todos</option>
                    {opcionesFiltros.ods.map((o) => <option key={o.id} value={o.id}>ODS {o.numero} - {o.nombre}</option>)}
                  </select>
                </div>
                {/* Año */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Año</label>
                  <select value={filtros.anio} onChange={(e) => actualizarFiltro('anio', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="">Todos</option>
                    {opcionesFiltros.anios.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                {/* Ordenar */}
                <div>
                  <label className="text-xs font-semibold text-slate-600">Ordenar por</label>
                  <select value={filtros.ordering} onChange={(e) => actualizarFiltro('ordering', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none">
                    <option value="-fecha_cierre">Más recientes</option>
                    <option value="fecha_cierre">Más antiguos</option>
                    <option value="titulo">Título A-Z</option>
                    <option value="-titulo">Título Z-A</option>
                    <option value="codigo">Código A-Z</option>
                    <option value="-codigo">Código Z-A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Cierre desde</label>
                  <input type="date" value={filtros.fecha_cierre_desde} onChange={(e) => actualizarFiltro('fecha_cierre_desde', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Cierre hasta</label>
                  <input type="date" value={filtros.fecha_cierre_hasta} onChange={(e) => actualizarFiltro('fecha_cierre_hasta', e.target.value)} className="mt-1 w-full h-9 px-2 border border-slate-300 rounded-lg text-xs" />
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button onClick={limpiarFiltros} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 w-full sm:w-auto">Limpiar filtros</button>
              </div>
            </div>
          )}

          {/* CHIPS */}
          {Object.keys(filtrosAplicados).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
              {Object.entries(filtrosAplicados).map(([key, value]) => (
                <span key={key} className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                  {key}: {Array.isArray(value) ? value.join(', ') : value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            No fue posible cargar el repositorio. Verifica la conexión con el servidor.
          </div>
        )}

        {/* RESULTADOS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />
            <span className="text-slate-500 font-medium">Consultando Repositorio RSU...</span>
          </div>
        ) : proyectosRepositorio.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6' : 'flex flex-col gap-3 mb-6'}>
              {proyectosRepositorio.map((proyecto) => (
                <div key={proyecto.id} className={viewMode === 'grid' ? 'bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow' : 'bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm'}>
                  <div className={viewMode === 'grid' ? 'w-full' : 'flex-1 w-full min-w-0'}>
                    {viewMode === 'grid' && (
                      <div className="h-32 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative">
                        <FiBook className="w-8 h-8 text-slate-300" />
                        <span className="absolute top-3 left-3">{renderEstadoBadge(proyecto.estado)}</span>
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/90 text-slate-600 px-2 py-0.5 rounded">{proyecto.semestre_academico || 'N/A'}</span>
                      </div>
                    )}
                    <div className={viewMode === 'grid' ? 'p-4' : 'flex flex-col gap-1'}>
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        {viewMode === 'list' && renderEstadoBadge(proyecto.estado)}
                        {getEjes(proyecto).map((eje) => <span key={eje.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{eje.nombre}</span>)}
                        {getODS(proyecto).map((ods) => <span key={ods.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">ODS {ods.numero}</span>)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{proyecto.codigo}</span>
                      <h3 className="text-sm font-bold text-slate-800 leading-snug truncate">{proyecto.titulo}</h3>
                      <p className="text-xs text-slate-400 mt-1 truncate">{getNombre(proyecto.facultad)}</p>
                      {proyecto.docente_responsable && <p className="text-xs text-slate-400 truncate">{proyecto.docente_responsable}</p>}
                    </div>
                  </div>
                  <div className={viewMode === 'grid' ? 'p-4 pt-0' : 'flex items-center gap-2 shrink-0 w-full sm:w-auto'}>
                    <button onClick={() => abrirDetalle(proyecto)} className="flex items-center justify-center gap-1.5 h-9 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto sm:px-4 shrink-0">
                      <FiEye /> Ver detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-200">
                <span className="text-sm text-slate-500">Página <span className="font-semibold text-slate-800">{page}</span> de <span className="font-semibold text-slate-800">{totalPages}</span></span>
                <div className="flex items-center gap-2">
                  <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"><FiChevronLeft /></button>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"><FiChevronRight /></button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">
            <FiBook className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-slate-500 text-sm font-semibold">No se encontraron proyectos finalizados</span>
            <span className="text-slate-400 text-xs mt-1">Prueba modificando los filtros o términos de búsqueda.</span>
          </div>
        )}

      </div>

      {/* =======================================================
          MODAL DETALLE (Pantalla completa en móvil / Modal en PC)
      ======================================================= */}
      {proyectoSeleccionado && (
        <div className="fixed inset-0 bg-white md:bg-slate-900/60 md:backdrop-blur-sm flex items-center justify-center z-[100] md:p-4">
          <div className="bg-white md:rounded-2xl max-w-5xl w-full h-full md:h-auto md:max-h-[92vh] flex flex-col overflow-hidden md:shadow-2xl">

            {/* HEADER FIJO */}
            <div className="p-4 md:p-6 border-b border-slate-200 bg-white shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                      {proyectoSeleccionado.codigo || `ID #${proyectoSeleccionado.id}`}
                    </span>
                    {renderEstadoBadge(proyectoSeleccionado.estado)}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-2 leading-snug">
                    {proyectoSeleccionado.titulo}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Proyecto histórico · Repositorio Institucional
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  {esDocente && ['aprobado', 'en_ejecucion', 'finalizado'].includes(proyectoSeleccionado.estado) && (
                    <button
                      onClick={abrirModalContinuacion}
                      disabled={continuandoProyecto}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#b1122b] text-white text-xs font-semibold hover:bg-[#941020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <FiCopy className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Continuar proyecto</span>
                      <span className="sm:hidden">Continuar</span>
                    </button>
                  )}
                  <button
                    onClick={cerrarDetalle}
                    disabled={continuandoProyecto}
                    className="p-2 rounded-lg text-slate-400 hover:text-[#b1122b] hover:bg-slate-100 transition-colors disabled:opacity-50"
                    title="Cerrar"
                  >
                    <FiX className="w-6 h-6 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CONTENIDO CON SCROLL */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              {detalleLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-3" />
                  <span className="text-sm text-slate-500">Cargando ficha del proyecto...</span>
                </div>
              ) : (
                <div className="space-y-8">

                  {/* DATOS PRINCIPALES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <FiUser className="text-[#b1122b] w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate">Responsable</span>
                        <span className="text-xs font-bold text-slate-700 truncate block">{proyectoSeleccionado.docente_responsable || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <FiCalendar className="text-blue-600 w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate">Semestre</span>
                        <span className="text-xs font-bold text-slate-700 truncate block">{proyectoSeleccionado.semestre_academico || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <FiMapPin className="text-emerald-600 w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate">Lugar</span>
                        <span className="text-xs font-bold text-slate-700 truncate block" title={proyectoSeleccionado.datos_generales.lugar_ejecucion}>{proyectoSeleccionado.datos_generales.lugar_ejecucion || 'N/A'}</span>
                      </div>
                    </div>
                    
                  </div>

                  {/* ESTRUCTURA */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Estructura Académica</h4>
                      <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p><b>Facultad:</b> {getNombre(proyectoSeleccionado.facultad)}</p>
                        <p><b>Escuela:</b> {getNombre(proyectoSeleccionado.escuela)}</p>
                        <p><b>Departamento:</b> {getNombre(proyectoSeleccionado.departamento)}</p>
                        <p><b>Docentes:</b> {proyectoSeleccionado.datos_generales.nro_docentes || 0}</p>
                        <p><b>Estudiantes:</b> {proyectoSeleccionado.datos_generales.nro_estudiantes || 0}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alineamiento RSU</h4>
                      <div className="text-xs text-slate-600 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <b className="block mb-1">Ejes RSU:</b>
                          <div className="flex flex-wrap gap-1">
                            {getEjes(proyectoSeleccionado).map((eje) => <span key={eje.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px]">{eje.nombre}</span>)}
                          </div>
                        </div>
                        <div>
                          <b className="block mb-1">ODS:</b>
                          <div className="flex flex-wrap gap-1">
                            {getODS(proyectoSeleccionado).map((ods) => <span key={ods.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px]">ODS {ods.numero}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TRAZABILIDAD */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Trazabilidad</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Inicio</span>
                        <span className="text-xs font-semibold text-slate-700">{formatearFecha(proyectoSeleccionado.fecha_inicio)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Término</span>
                        <span className="text-xs font-semibold text-slate-700">{formatearFecha(proyectoSeleccionado.fecha_termino)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Cierre</span>
                        <span className="text-xs font-semibold text-slate-700">{formatearFecha(proyectoSeleccionado.fecha_cierre)}</span>
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENTACIÓN HISTÓRICA */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentación histórica</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button onClick={cargarInformeFinal} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors">
                        <FiFileText className="w-5 h-5 text-[#b1122b] shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-slate-700 block">Informe final</span>
                          <span className="text-[11px] text-slate-400">Resultados, conclusiones y recomendaciones</span>
                        </div>
                      </button>
                      <button onClick={cargarLecciones} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors">
                        <FiBookOpen className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-slate-700 block">Lecciones aprendidas</span>
                          <span className="text-[11px] text-slate-400">Buenas prácticas y recomendaciones</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* INFORME FINAL (Se muestra si se dio clic al boton) */}
                  {informeLoading && <div className="flex items-center gap-2 text-xs text-slate-500"><FiLoader className="animate-spin" /> Cargando informe final...</div>}
                  {informeFinal?.informe_final && (
                    <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h4 className="font-bold text-slate-700 text-sm">Informe Final</h4>
                        {!informeFinal.informe_final.completo && <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">INFORME INCOMPLETO</span>}
                      </div>

                      {!informeFinal.informe_final.completo && informeFinal.informe_final.campos_pendientes?.length > 0 && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                          <b>Campos pendientes:</b> {informeFinal.informe_final.campos_pendientes.join(', ')}
                        </div>
                      )}

                      <div className="space-y-4 text-xs text-slate-600">
                        <div><b className="block text-slate-700 mb-1">Conclusiones</b><p>{informeFinal.informe_final.conclusiones || 'No registradas.'}</p></div>
                        <div><b className="block text-slate-700 mb-1">Recomendaciones</b><p>{informeFinal.informe_final.recomendaciones || 'No registradas.'}</p></div>
                        <div><b className="block text-slate-700 mb-1">Lecciones aprendidas</b><p>{informeFinal.informe_final.lecciones_aprendidas || 'No registradas.'}</p></div>
                        {informeFinal.informe_final.medio_difusion && <div><b>Medio de difusión:</b> {informeFinal.informe_final.medio_difusion}</div>}
                      </div>

                      {informeFinal.resultados_alcanzados && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-white rounded-lg border border-slate-200"><FiTarget className="text-[#b1122b] mb-2" /><span className="text-[10px] text-slate-400 block">Ejecución</span><span className="text-lg font-bold text-slate-700">{informeFinal.resultados_alcanzados.avance?.porcentaje_ejecucion ?? 0}%</span></div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200"><FiCheckCircle className="text-emerald-600 mb-2" /><span className="text-[10px] text-slate-400 block">Cumplimiento de metas</span><span className="text-lg font-bold text-slate-700">{informeFinal.resultados_alcanzados.metas?.porcentaje_cumplimiento ?? 0}%</span></div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200"><FiDollarSign className="text-amber-600 mb-2" /><span className="text-[10px] text-slate-400 block">Presupuesto ejecutado</span><span className="text-lg font-bold text-slate-700">S/. {informeFinal.resultados_alcanzados.presupuesto?.monto_ejecutado ?? 0}</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LECCIONES (Se muestra si se dio clic) */}
                  {leccionesLoading && <div className="flex items-center gap-2 text-xs text-slate-500"><FiLoader className="animate-spin" /> Cargando lecciones aprendidas...</div>}
                  {lecciones?.results?.length > 0 && (
                    <div className="border border-slate-200 rounded-xl p-4 sm:p-5">
                      <h4 className="font-bold text-slate-700 text-sm mb-4">Lecciones aprendidas institucionales</h4>
                      <div className="space-y-3">
                        {lecciones.results.filter((item) => item.id === proyectoSeleccionado.id).map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600">{item.lecciones_aprendidas || 'No registradas.'}</p>
                            {item.recomendaciones && <p className="text-xs text-slate-600 mt-3"><b>Recomendaciones:</b> {item.recomendaciones}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL CONTINUAR PROYECTO
      ========================================================= */}
      {mostrarContinuacion && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-full overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#b1122b]/10 flex items-center justify-center shrink-0">
                    <FiCopy className="w-5 h-5 text-[#b1122b]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Continuar proyecto</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Crear nueva versión en estado Borrador</p>
                  </div>
                </div>
                <button onClick={cerrarModalContinuacion} disabled={continuandoProyecto} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"><FiX className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-4 md:p-5 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Proyecto histórico</span>
                <span className="text-xs font-bold text-slate-700 block mt-1">{proyectoSeleccionado?.codigo}</span>
                <span className="text-xs text-slate-600 block mt-1 line-clamp-2">{proyectoSeleccionado?.titulo}</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Nuevo periodo académico</label>
                <select value={periodoSeleccionado} onChange={(e) => { setPeriodoSeleccionado(e.target.value); setErrorContinuacion(''); }} disabled={continuandoProyecto} className="mt-1 w-full h-10 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] disabled:bg-slate-100">
                  <option value="">Selecciona un periodo</option>
                  {periodosDisponibles.map((periodo) => {
                    const id = typeof periodo === 'object' ? periodo.id : periodo;
                    const nombre = typeof periodo === 'object' ? periodo.nombre : periodo;
                    return <option key={id} value={id}>{nombre}</option>;
                  })}
                </select>
                {periodosDisponibles.length === 0 && <p className="text-[11px] text-amber-600 mt-2">No hay periodos académicos disponibles.</p>}
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-blue-700 leading-relaxed">El nuevo proyecto se creará automáticamente en estado <b>Borrador</b> y conservará la información base disponible del proyecto histórico.</p>
                </div>
              </div>

              {errorContinuacion && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorContinuacion}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button onClick={cerrarModalContinuacion} disabled={continuandoProyecto} className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-white disabled:opacity-50">Cancelar</button>
              <button onClick={handleContinuarProyecto} disabled={continuandoProyecto || !periodoSeleccionado} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#b1122b] text-white text-xs font-semibold rounded-lg hover:bg-[#941020] disabled:opacity-50 disabled:cursor-not-allowed">
                {continuandoProyecto ? <><FiLoader className="animate-spin" /> Creando...</> : <><FiCopy /> Crear proyecto</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Repositorio;
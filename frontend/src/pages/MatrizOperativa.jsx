import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../api/axiosConfig';
import {
  FiPlus,
  FiEdit,
  FiLoader,
  FiDownload,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiX
} from 'react-icons/fi';

// ─── MODAL: Crear Nueva Matriz ───────────────────────────────────────────────
function ModalNuevaMatriz({ onClose, onCreated }) {
  const [facultades, setFacultades] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [form, setForm] = useState({
    facultad: '',
    periodo: '',
    nombre: '',
    eje_rsu: '',
    linea_estrategica: '',
    descripcion: '',
    resultado_esperado: '',
    meta_cuantitativa: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/v1/facultades/').then(r => setFacultades(r.data.results || r.data)).catch(() => {});
    api.get('/api/v1/periodos/').then(r => setPeriodos(r.data.results || r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.facultad || !form.periodo) { setError('Facultad y periodo son obligatorios.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/api/v1/matrices/', {
        facultad: form.facultad,
        periodo: form.periodo
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la matriz.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">Nueva Matriz Operativa</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500"><FiX /></button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Facultad *</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#b1122b]"
              value={form.facultad}
              onChange={e => setForm(f => ({ ...f, facultad: e.target.value }))}
            >
              <option value="">Seleccione facultad...</option>
              {facultades.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Periodo *</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#b1122b]"
              value={form.periodo}
              onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}
            >
              <option value="">Seleccione periodo...</option>
              {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold text-white bg-[#b1122b] hover:bg-[#8e0e22] rounded-lg">
              {saving ? 'Guardando...' : 'Crear Matriz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ObjetivoCard({ obj, ejesRsu, onRefresh, matrizId }) {
  const [showIndicadorForm, setShowIndicadorForm] = useState(false);
  const [showActividadForm, setShowActividadForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form Indicador
  const [indForm, setIndForm] = useState({ nombre: '', unidad_medida: '', valor_meta: 1, metodo_verificacion: '' });
  
  // Form Actividad (Mapeado estrictamente según ActividadSugeridaSerializer)
  const [actForm, setActForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    tipo_actividad: '', 
    destinatarios: '', 
    eje_rsu: '',
    anio_academico: '1',     // Valor clave por defecto (asumiendo formato estándar de tuplas)
    presupuesto_ref: 0
  });

  const handleAddIndicador = async (e) => {
    e.preventDefault();
    if (!indForm.nombre) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/api/v1/indicadores-institucionales/', {
        objetivo: obj.id,
        nombre: indForm.nombre,
        unidad_medida: indForm.unidad_medida,
        valor_meta: indForm.valor_meta,
        metodo_verificacion: indForm.metodo_verificacion
      });
      setShowIndicadorForm(false);
      setIndForm({ nombre: '', unidad_medida: '', valor_meta: 1, metodo_verificacion: '' });
      onRefresh();
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error al guardar el indicador.');
    } finally { setSaving(false); }
  };

  const handleAddActividad = async (e) => {
    e.preventDefault();
    if (!actForm.nombre) return;
    setSaving(true);
    setError('');

    // Si no se selecciona eje_rsu específico, se hereda el del objetivo padre
    const ejeRsuFinal = actForm.eje_rsu || obj.eje_rsu || null;

    try {
      await api.post('/api/v1/actividades-sugeridas/', {
        matriz: matrizId,
        objetivo: obj.id,
        nombre: actForm.nombre,
        descripcion: actForm.descripcion,
        tipo_actividad: actForm.tipo_actividad,
        destinatarios: actForm.destinatarios,
        eje_rsu: ejeRsuFinal,
        anio_academico: actForm.anio_academico, // Envía la clave seleccionada
        presupuesto_ref: parseFloat(actForm.presupuesto_ref) || 0
      });
      
      setShowActividadForm(false);
      setActForm({ nombre: '', descripcion: '', tipo_actividad: '', destinatarios: '', eje_rsu: '', anio_academico: '1', presupuesto_ref: 0 });
      onRefresh();
    } catch (err) {
      console.error("Error detallado de Django en Actividades:", err.response?.data);
      const djangoErrors = err.response?.data;
      if (djangoErrors && typeof djangoErrors === 'object') {
        const mensajes = Object.entries(djangoErrors).map(([campo, msg]) => `${campo}: ${msg}`).join(' | ');
        setError(mensajes);
      } else {
        setError('Error al guardar la actividad sugerida.');
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-800">{obj.nombre}</p>
        {obj.linea_estrategica_nombre && <p className="text-xs text-slate-500 mt-1">Línea: {obj.linea_estrategica_nombre}</p>}
        {obj.eje_rsu_nombre && <p className="text-xs text-slate-500">Eje RSU: {obj.eje_rsu_nombre}</p>}
        {obj.descripcion && <p className="text-xs text-slate-600 mt-1">{obj.descripcion}</p>}
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Error de validación:</strong> {error}
        </div>
      )}

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lado Izquierdo: Indicadores */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Indicadores</h4>
            {!showIndicadorForm && (
              <button onClick={() => { setShowIndicadorForm(true); setError(''); }} className="text-[10px] font-bold text-[#b1122b] hover:bg-red-50 px-2 py-1 rounded">
                + Agregar
              </button>
            )}
          </div>

          <div className="space-y-2 mb-3">
            {obj.indicadores?.length === 0 && <p className="text-[11px] text-slate-400">Sin indicadores</p>}
            {obj.indicadores?.map(ind => (
              <div key={ind.id} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                <p className="font-semibold text-slate-700">{ind.nombre}</p>
                <p className="text-slate-500 mt-0.5">Meta: {ind.valor_meta} {ind.unidad_medida}</p>
              </div>
            ))}
          </div>

          {showIndicadorForm && (
            <form onSubmit={handleAddIndicador} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs mt-2">
              <input type="text" placeholder="Nombre (ej. Nro de sistemas)" className="w-full mb-2 border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]" required
                value={indForm.nombre} onChange={e => setIndForm({...indForm, nombre: e.target.value})} />
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="Unidad" className="w-1/2 border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]"
                  value={indForm.unidad_medida} onChange={e => setIndForm({...indForm, unidad_medida: e.target.value})} />
                <input type="number" placeholder="Meta" min="1" className="w-1/2 border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]"
                  value={indForm.valor_meta} onChange={e => setIndForm({...indForm, valor_meta: e.target.value})} />
              </div>
              <input type="text" placeholder="Método de verificación" className="w-full mb-2 border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]"
                value={indForm.metodo_verificacion} onChange={e => setIndForm({...indForm, metodo_verificacion: e.target.value})} />
              
              <div className="flex justify-end gap-1">
                <button type="button" onClick={() => setShowIndicadorForm(false)} className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded">Cancelar</button>
                <button type="submit" disabled={saving} className="px-2 py-1 bg-[#b1122b] text-white rounded font-semibold disabled:opacity-50">Guardar</button>
              </div>
            </form>
          )}
        </div>

        {/* Lado Derecho: Actividades */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Actividades Sugeridas</h4>
            {!showActividadForm && (
              <button onClick={() => { setShowActividadForm(true); setError(''); }} className="text-[10px] font-bold text-[#b1122b] hover:bg-red-50 px-2 py-1 rounded">
                + Agregar
              </button>
            )}
          </div>

          <div className="space-y-2 mb-3">
            {obj.actividades_sugeridas?.length === 0 && <p className="text-[11px] text-slate-400">Sin actividades</p>}
            {obj.actividades_sugeridas?.map(act => (
              <div key={act.id} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-slate-700">{act.nombre}</p>
                  {/* Lee dinámicamente el campo de visualización calculado por Django */}
                  <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                    {act.anio_academico_display || `Año ${act.anio_academico}`}
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5 text-[11px]">{act.descripcion}</p>
                {act.presupuesto_ref > 0 && <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Presupuesto Ref: ${act.presupuesto_ref}</p>}
              </div>
            ))}
          </div>

          {showActividadForm && (
            <form onSubmit={handleAddActividad} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs mt-2 flex flex-col gap-2">
              <input type="text" placeholder="Nombre de la actividad *" className="w-full border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]" required
                value={actForm.nombre} onChange={e => setActForm({...actForm, nombre: e.target.value})} />
              
              <textarea placeholder="Descripción breve" rows={2} className="w-full border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b] resize-none"
                value={actForm.descripcion} onChange={e => setActForm({...actForm, descripcion: e.target.value})} />

              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Tipo (ej. Taller, Seminario)" className="w-full border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]"
                  value={actForm.tipo_actividad} onChange={e => setActForm({...actForm, tipo_actividad: e.target.value})} />
                
                <input type="text" placeholder="Destinatarios" className="w-full border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]"
                  value={actForm.destinatarios} onChange={e => setActForm({...actForm, destinatarios: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Selector estático con los valores clave que espera el choices de Django */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Año académico *</label>
                  <select 
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#b1122b]"
                    required
                    value={actForm.anio_academico} 
                    onChange={e => setActForm({...actForm, anio_academico: e.target.value})}
                  >
                    <option value="1">Año 1</option>
                    <option value="2">Año 2</option>
                    <option value="3">Año 3</option>
                    <option value="4">Año 4</option>
                    <option value="5">Año 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Presupuesto ref. ($) *</label>
                  <input type="number" min="0" step="0.01" className="w-full border-slate-300 rounded px-2 py-1 outline-none focus:border-[#b1122b]" required
                    value={actForm.presupuesto_ref} onChange={e => setActForm({...actForm, presupuesto_ref: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Eje RSU alternativo</label>
                <select className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#b1122b]"
                  value={actForm.eje_rsu} onChange={e => setActForm({...actForm, eje_rsu: e.target.value})}>
                  <option value="">Heredar del Objetivo ({obj.eje_rsu_nombre || 'Sin eje'})</option>
                  {ejesRsu.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              
              <div className="flex justify-end gap-1 mt-1">
                <button type="button" onClick={() => setShowActividadForm(false)} className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded">Cancelar</button>
                <button type="submit" disabled={saving} className="px-2 py-1 bg-[#b1122b] text-white rounded font-semibold disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PANEL: Objetivos Institucionales ──────────────────────────────────────────
function PanelObjetivos({ matrizId, onClose }) {
  const [objetivos, setObjetivos] = useState([]);
  const [ejesRsu, setEjesRsu] = useState([]);
  const [lineasEstrategicas, setLineasEstrategicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    nombre: '', 
    eje_rsu: '', 
    linea_estrategica: '', 
    descripcion: '',
    resultado_esperado: '',
    meta_cuantitativa: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchObjetivos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/objetivos-institucionales/?matriz=${matrizId}`);
      setObjetivos(res.data.results || res.data);
    } catch { /* silencioso */ }
    setLoading(false);
  };

  // Primer useEffect corregido y cerrado correctamente
  useEffect(() => {
    fetchObjetivos();
    api.get('/api/v1/ejes-rsu/')
      .then(r => setEjesRsu(r.data.results || r.data))
      .catch(() => {});
  }, [matrizId]);

  // Segundo useEffect independiente
  useEffect(() => {
    if (form.eje_rsu) {
      api.get(`/api/v1/lineas-estrategicas/?eje_rsu=${form.eje_rsu}`)
        .then(r => setLineasEstrategicas(r.data.results || r.data))
        .catch(() => {});
    } else {
      setLineasEstrategicas([]);
    }
  }, [form.eje_rsu]);

  const handleAddObjetivo = async (e) => {
    e.preventDefault();
    if (!form.nombre) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/api/v1/objetivos-institucionales/', {
        matriz: matrizId,
        nombre: form.nombre,
        eje_rsu: form.eje_rsu || null,
        linea_estrategica: form.linea_estrategica || null,
        descripcion: form.descripcion,
        resultado_esperado: form.resultado_esperado,
        meta_cuantitativa: form.meta_cuantitativa
      });

      setForm({ nombre: '', eje_rsu: '', linea_estrategica: '', descripcion: '', resultado_esperado: '', meta_cuantitativa: '' });
      setShowForm(false);
      fetchObjetivos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el objetivo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Objetivos Institucionales — Matriz #{matrizId}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500"><FiX /></button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FiLoader className="animate-spin text-[#b1122b] text-2xl" />
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {objetivos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No hay objetivos registrados aún.</p>
              )}
              {objetivos.map(obj => (
                <ObjetivoCard key={obj.id} obj={obj} ejesRsu={ejesRsu} onRefresh={fetchObjetivos} matrizId={matrizId} />
              ))}
            </div>
          )}

          {/* Formulario agregar objetivo */}
          {showForm ? (
            <form onSubmit={handleAddObjetivo} className="border border-slate-200 rounded-lg p-4 bg-white">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Agregar Objetivo</h3>
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                  <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b1122b]"
                    value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Eje RSU</label>
                  <select className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b1122b]"
                    value={form.eje_rsu} onChange={e => setForm(f => ({ ...f, eje_rsu: e.target.value }))}>
                    <option value="">Sin eje</option>
                    {ejesRsu.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Línea estratégica</label>
                  <select
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b1122b]"
                    value={form.linea_estrategica}
                    onChange={e => setForm(f => ({ ...f, linea_estrategica: e.target.value }))}
                  >
                    <option value="">Seleccione línea estratégica</option>
                    {lineasEstrategicas.map(linea => (
                      <option key={linea.id} value={linea.id}>{linea.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                  <textarea rows={2} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b1122b] resize-none"
                    value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs rounded bg-[#b1122b] text-white font-semibold hover:bg-[#8e0e22] disabled:opacity-60 flex items-center gap-1">
                  {saving && <FiLoader className="animate-spin text-xs" />} Guardar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-[#b1122b] hover:text-[#b1122b] transition-colors w-full justify-center"
            >
              <FiPlus /> Agregar Objetivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BADGE de Estado ──────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    borrador:    'bg-slate-100 text-slate-700',
    activo:      'bg-green-100 text-green-700',
    cerrado:     'bg-red-100 text-red-700',
    en_revision: 'bg-yellow-100 text-yellow-700',
  };
  const cls = map[estado?.toLowerCase()] || 'bg-slate-100 text-slate-600';
  return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${cls}`}>{estado}</span>;
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function MatrizOperativa() {
  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [panelMatrizId, setPanelMatrizId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchMatrices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/matrices/');
      setMatrices(res.data.results || res.data);
    } catch (err) {
      console.error('Error cargando matrices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatrices(); }, []);

  const handleCreated = (nueva) => {
    setMatrices(prev => [nueva, ...prev]);
  };

  const handleExport = async (id, tipo) => {
    try {
      const res = await api.get(`/api/v1/matrices/${id}/export/${tipo}/`, {
        responseType: 'blob'
      });
      const ext = tipo === 'excel' ? 'xlsx' : 'pdf';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const filename = `matriz_${id}.${ext}`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exportando ${tipo}:`, err);
      alert(`No se pudo exportar a ${tipo.toUpperCase()}. Verifique que el endpoint esté disponible.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />

        <section className="p-6 md:p-8 flex-1">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Matriz Operativa</h1>
              <p className="text-sm text-slate-500 mt-1">Gestión de matrices operativas por facultad y periodo</p>
            </div>
            <button
              onClick={() => setShowModalNueva(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" /> Nueva Matriz
            </button>
          </div>

          {/* TABLA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <FiLoader className="animate-spin text-[#b1122b] text-3xl" />
              </div>
            ) : matrices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FiFileText className="text-4xl mb-2" />
                <p className="font-medium">No hay matrices registradas</p>
                <p className="text-sm mt-1">Crea la primera usando el botón "Nueva Matriz"</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Facultad</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Periodo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Coordinador</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrices.map(m => (
                    <React.Fragment key={m.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-800">{m.facultad_nombre || m.facultad}</td>
                        <td className="px-5 py-4 text-slate-600">{m.periodo_nombre || m.periodo}</td>
                        <td className="px-5 py-4">
                          <EstadoBadge estado={m.estado} />
                        </td>
                        <td className="px-5 py-4 text-slate-600">{m.coordinador_nombre || m.coordinador || '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Ver/Editar Objetivos */}
                            <button
                              onClick={() => setPanelMatrizId(m.id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                            >
                              <FiEdit className="text-xs" /> Ver/Editar
                            </button>

                            {/* Exportar Excel */}
                            <button
                              onClick={() => handleExport(m.id, 'excel')}
                              title="Exportar a Excel"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition border border-transparent hover:border-green-200"
                            >
                              <FiDownload className="text-sm" />
                            </button>

                            {/* Exportar PDF */}
                            <button
                              onClick={() => handleExport(m.id, 'pdf')}
                              title="Exportar a PDF"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                            >
                              <FiFileText className="text-sm" />
                            </button>

                            {/* Expandir fila */}
                            <button
                              onClick={() => setExpandedRow(expandedRow === m.id ? null : m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                            >
                              {expandedRow === m.id ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* FILA EXPANDIDA: observaciones */}
                      {expandedRow === m.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-5 py-3">
                            <p className="text-xs text-slate-500 font-medium mb-1">Observaciones:</p>
                            <p className="text-sm text-slate-700">{m.observaciones || 'Sin observaciones registradas.'}</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* MODAL: Nueva Matriz */}
      {showModalNueva && (
        <ModalNuevaMatriz
          onClose={() => setShowModalNueva(false)}
          onCreated={handleCreated}
        />
      )}

      {/* PANEL: Objetivos */}
      {panelMatrizId !== null && (
        <PanelObjetivos
          matrizId={panelMatrizId}
          onClose={() => setPanelMatrizId(null)}
        />
      )}
    </div>
  );
}
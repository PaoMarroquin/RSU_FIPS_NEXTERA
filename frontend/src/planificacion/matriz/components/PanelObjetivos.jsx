import React, { useState, useEffect } from 'react';
import { FiX, FiLoader, FiPlus } from 'react-icons/fi';
import ObjetivoCard from './ObjetivoCard';
import { catalogoPlanificacionApi } from '../../../shared/api/planificacion/catalogoPlanificacionApi';
import { objetivoIndicadorApi } from '../../../shared/api/planificacion/objetivoIndicadorApi';

export default function PanelObjetivos({ matrizId, onClose }) {
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
      const data = await objetivoIndicadorApi.obtenerObjetivos(matrizId);
      setObjetivos(data.results || data);
    } catch { /* silencioso */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchObjetivos();
    catalogoPlanificacionApi.obtenerEjesRSU()
      .then(data => setEjesRsu(data.results || data))
      .catch(() => {});
  }, [matrizId]);

  useEffect(() => {
    if (form.eje_rsu) {
      catalogoPlanificacionApi.obtenerLineasEstrategicas(form.eje_rsu)
        .then(data => setLineasEstrategicas(data.results || data))
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
      await objetivoIndicadorApi.crearObjetivo({
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
import React, { useState } from 'react';
import { objetivoIndicadorApi } from '../../../shared/api/planificacion/objetivoIndicadorApi';
import { actividadSugeridaApi } from '../../../shared/api/planificacion/actividadSugeridaApi';

export default function ObjetivoCard({ obj, ejesRsu, onRefresh, matrizId }) {
  const [showIndicadorForm, setShowIndicadorForm] = useState(false);
  const [showActividadForm, setShowActividadForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form Indicador
  const [indForm, setIndForm] = useState({ nombre: '', unidad_medida: '', valor_meta: 1, metodo_verificacion: '' });
  
  // Form Actividad
  const [actForm, setActForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    tipo_actividad: '', 
    destinatarios: '', 
    eje_rsu: '',
    anio_academico: '1',     
    presupuesto_ref: 0
  });

  const handleAddIndicador = async (e) => {
    e.preventDefault();
    if (!indForm.nombre) return;
    setSaving(true);
    setError('');
    try {
      await objetivoIndicadorApi.crearIndicador({
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
      await actividadSugeridaApi.crearActividadSugerida({
        matriz: matrizId,
        objetivo: obj.id,
        nombre: actForm.nombre,
        descripcion: actForm.descripcion,
        tipo_actividad: actForm.tipo_actividad,
        destinatarios: actForm.destinatarios,
        eje_rsu: ejeRsuFinal,
        anio_academico: actForm.anio_academico,
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
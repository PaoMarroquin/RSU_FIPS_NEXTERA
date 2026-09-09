import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import PaginatedSelect from '../../../shared/components/forms/PaginatedSelect';
import { matrizOperativaApi } from '../../../shared/api/planificacion/matrizOperativaApi';
import { periodoApi } from '../../../shared/api/planificacion/periodoApi';
import { catalogoApi } from '../../../shared/api/usuario/catalogoApi';

export default function ModalNuevaMatriz({ onClose, onCreated }) {
  const [form, setForm] = useState({
    facultad: '',
    facultad_nombre: '',
    periodo: '',
    periodo_nombre: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.facultad || !form.periodo) { 
      setError('Facultad y periodo son obligatorios.'); 
      return; 
    }
    
    setSaving(true);
    setError('');
    try {
      const res = await matrizOperativaApi.crearMatriz({
        facultad: form.facultad,
        periodo: form.periodo
      });
      onCreated(res);
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
          <PaginatedSelect
            label="Facultad"
            name="facultad"
            value={form.facultad}
            selectedName={form.facultad_nombre}
            fetchFn={async () => {
              const res = await catalogoApi.obtenerFacultades();
              return res.results ? res : { results: res, next: null };
            }}
            placeholder="Seleccione una facultad"
            onChange={(e, nombre) => setForm(f => ({ ...f, facultad: e.target.value, facultad_nombre: nombre }))}
          />

          <PaginatedSelect
            label="Periodo"
            name="periodo"
            value={form.periodo}
            selectedName={form.periodo_nombre}
            fetchFn={async (page) => {
              const res = await periodoApi.obtenerPeriodos({ page });
              return res.results ? res : { results: res, next: null };
            }}
            placeholder="Seleccione periodo..."
            onChange={(e, nombre) => setForm(f => ({ ...f, periodo: e.target.value, periodo_nombre: nombre }))}
          />

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
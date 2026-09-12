import React, { useState, useEffect } from 'react';
import { FiX, FiLoader, FiShield } from 'react-icons/fi';
import { useRolesUsuario } from '../hooks/useRolesUsuario';

export default function ModalRoles({ usuario, onClose }) {
  const { historial, loadingRoles, fetchHistorial, asignarRol } = useRolesUsuario(usuario.id);
  const [rolId, setRolId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!rolId) { setError('Seleccione un rol.'); return; }
    setSaving(true);
    setError('');
    try {
      await asignarRol(rolId, motivo);
      setRolId('');
      setMotivo('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al asignar el rol.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Gestión de Roles</h2>
            <p className="text-xs text-slate-500">{usuario.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Formulario Asignación */}
          <form onSubmit={handleAsignar} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1"><FiShield/> Asignar Nuevo Rol</h3>
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            <div className="space-y-3">
              <select 
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#b1122b]"
                value={rolId} onChange={e => setRolId(e.target.value)}
              >
                <option value="">-- Seleccione un rol --</option>
                <option value="1">Docente</option>
                <option value="2">Jefe de Departamento</option>
                <option value="3">Autoridad</option>
              </select>
              
              <input 
                type="text" placeholder="Motivo (Opcional, ej: Resolución Nro 123)"
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#b1122b]"
                value={motivo} onChange={e => setMotivo(e.target.value)}
              />
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-3 py-1.5 bg-[#b1122b] text-white rounded text-xs font-semibold disabled:opacity-50">
                  {saving ? 'Asignando...' : 'Asignar Rol'}
                </button>
              </div>
            </div>
          </form>

          {/* Historial */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Historial de Roles</h3>
            {loadingRoles ? (
              <div className="flex justify-center py-4"><FiLoader className="animate-spin text-[#b1122b]" /></div>
            ) : historial.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay roles asignados históricamente.</p>
            ) : (
              <div className="space-y-2">
                {historial.map((h, i) => (
                  <div key={i} className="border border-slate-100 rounded p-2 text-xs flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-700">{h.rol_nombre || 'Rol Desconocido'}</p>
                      {h.motivo && <p className="text-slate-500 italic mt-0.5">Motivo: {h.motivo}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(h.fecha_asignacion).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
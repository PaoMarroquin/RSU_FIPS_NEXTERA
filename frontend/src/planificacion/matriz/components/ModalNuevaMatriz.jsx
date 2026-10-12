import React, { useState } from 'react';
import { FiX, FiUpload, FiFileText } from 'react-icons/fi';
import { matrizOperativaApi } from '../../../shared/api/planificacion/matrizOperativaApi';

export default function ModalNuevaMatriz({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    archivo: null
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.descripcion || !form.archivo) { 
      setError('Todos los campos son obligatorios (incluyendo el archivo).'); 
      return; 
    }
    
    setSaving(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('descripcion', form.descripcion);
      formData.append('archivo', form.archivo);

      const res = await matrizOperativaApi.crearMatriz(formData);
      onCreated(res);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir el documento de apoyo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Nuevo Documento</h2>
            <p className="text-xs text-slate-500">Publicar guía o matriz operativa</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <FiX />
          </button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del documento *</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b]/20"
              value={form.nombre} 
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} 
              placeholder="Ej. Guía de formulación..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción *</label>
            <textarea 
              rows={3} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b]/20 resize-none"
              value={form.descripcion} 
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} 
              placeholder="Breve descripción del contenido"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Archivo (PDF, Word, Excel) *</label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-[#b1122b] bg-slate-50 text-center transition-colors">
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.xls,.xlsx" 
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => setForm(f => ({ ...f, archivo: e.target.files[0] }))}
              />
              {form.archivo ? (
                <div className="flex flex-col items-center">
                  <FiFileText className="text-3xl text-[#b1122b] mb-2" />
                  <p className="text-xs font-bold text-slate-700 truncate w-full px-4">{form.archivo.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <FiUpload className="text-2xl text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Clic o arrastrar archivo aquí</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-transparent rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-[#b1122b] hover:bg-[#8e0e22] rounded-lg shadow-sm transition-colors">
              {saving ? 'Publicando...' : 'Publicar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';
import ReporteExpediente from '../../../shared/components/ReporteExpediente';

export default function ModalInforme({ proyectoId, onClose }) {
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await proyectoApi.obtenerProyectoPorId(proyectoId);
        setProyecto(data);
      } catch (err) {
        setError('No se pudo cargar el informe del proyecto.');
      } finally {
        setLoading(false);
      }
    };
    
    fetch();
  }, [proyectoId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Expediente Integral del Proyecto</h2>
            {proyecto && <p className="text-xs text-slate-500 mt-0.5">{proyecto.codigo} — {proyecto.titulo}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <FiX />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="animate-spin text-[#b1122b] text-3xl" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}
          {!loading && !error && (
            <ReporteExpediente matrizSeleccionada={proyecto} showPrintButton={false} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
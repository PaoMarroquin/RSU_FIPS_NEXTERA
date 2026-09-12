import React, { useEffect, useState } from 'react';
import Layout from '../../shared/layout/Layout';
import { useMatrizOperativa } from './hooks/useMatrizOperativa';
import { FiPlus, FiLoader, FiDownload, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ModalNuevaMatriz from './components/ModalNuevaMatriz';
import PanelObjetivos from './components/PanelObjetivos';
import EstadoBadge from './components/EstadoBadge';

export default function MatrizOperativa() {
  const { matrices, loading, fetchMatrices, handleCreated, handleExport } = useMatrizOperativa();
  
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [panelMatrizId, setPanelMatrizId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => { 
    fetchMatrices(); 
  }, [fetchMatrices]);

  return (
    <Layout>
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
                          <button
                            onClick={() => setPanelMatrizId(m.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                          >
                            Ver/Editar
                          </button>
                          <button
                            onClick={() => handleExport(m.id, 'excel')}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                          >
                            <FiDownload className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleExport(m.id, 'pdf')}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                          >
                            <FiFileText className="text-sm" />
                          </button>
                          <button
                            onClick={() => setExpandedRow(expandedRow === m.id ? null : m.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                          >
                            {expandedRow === m.id ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                        </div>
                      </td>
                    </tr>
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

      {showModalNueva && (
        <ModalNuevaMatriz
          onClose={() => setShowModalNueva(false)}
          onCreated={handleCreated}
        />
      )}

      {panelMatrizId !== null && (
        <PanelObjetivos
          matrizId={panelMatrizId}
          onClose={() => setPanelMatrizId(null)}
        />
      )}
    </Layout>
  );
}
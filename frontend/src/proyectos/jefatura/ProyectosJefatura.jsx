import React from 'react';
import Layout from '../../shared/layout/Layout';
import { FiSearch, FiFolder, FiLoader, FiEye } from 'react-icons/fi';
import { useProyectosJefatura } from './hooks/useProyectosJefatura';
import EstadoBadge from './components/EstadoBadge';
import ModalInforme from './components/ModalInforme';

export default function ProyectosJefatura() {
  const {
    proyectos,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalPages,
    modalId,
    setModalId
  } = useProyectosJefatura();

  return (
    <Layout>
      <section className="p-6 md:p-8 flex-1 flex flex-col min-h-full">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Proyectos RSU</h1>
            <p className="text-sm text-slate-500 mt-1">Supervisión de todos los proyectos de responsabilidad social</p>
          </div>
        </div>

        {/* BÚSQUEDA */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white w-full max-w-sm focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
            <FiSearch className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por título, código o docente..."
              className="w-full text-sm outline-none bg-transparent placeholder:text-slate-400 text-slate-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-20 flex-1">
              <FiLoader className="animate-spin text-[#b1122b] text-3xl" />
            </div>
          ) : proyectos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 flex-1">
              <FiFolder className="text-4xl mb-2" />
              <p className="font-medium">No se encontraron proyectos</p>
              <p className="text-sm mt-1">Ajusta la búsqueda o espera a que se registren proyectos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Docente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Facultad</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proyectos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{p.codigo}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 max-w-xs">
                        <p className="truncate">{p.titulo}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">
                        {p.docente_responsable_nombre || p.docente_responsable || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">
                        {p.facultad_nombre || p.facultad || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <EstadoBadge estado={p.estado} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setModalId(p.id)}
                          title="Ver informe completo"
                          className="p-2 rounded-lg text-slate-500 hover:bg-[#b1122b]/10 hover:text-[#b1122b] transition"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-500">
              Página <span className="font-semibold text-slate-800">{page}</span> de <span className="font-semibold text-slate-800">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL: Informe Completo */}
      {modalId !== null && (
        <ModalInforme
          proyectoId={modalId}
          onClose={() => setModalId(null)}
        />
      )}
    </Layout>
  );
}
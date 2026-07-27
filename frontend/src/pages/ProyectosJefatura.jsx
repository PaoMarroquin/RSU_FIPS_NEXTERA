import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../api/axiosConfig';
import ReporteExpediente from '../components/reports/ReporteExpediente';
import {
  FiEye,
  FiLoader,
  FiX,
  FiSearch,
  FiFolder,
} from 'react-icons/fi';

// ─── BADGE de Estado ──────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    borrador:       'bg-slate-100 text-slate-700',
    'en revision':  'bg-yellow-100 text-yellow-700',
    observado:      'bg-orange-100 text-orange-700',
    aprobado:       'bg-green-100 text-green-700',
    'en ejecucion': 'bg-blue-100 text-blue-700',
    finalizado:     'bg-purple-100 text-purple-700',
  };
  const cls = map[estado?.toLowerCase()] || 'bg-slate-100 text-slate-600';
  return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${cls}`}>{estado}</span>;
}

// ─── MODAL: Informe Completo (usa ReporteExpediente) ─────────────────────────
function ModalInforme({ proyectoId, onClose }) {
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let res;
        try {
          res = await api.get(`/api/v1/proyectos/${proyectoId}/informe/`);
        } catch {
          res = await api.get(`/api/v1/proyectos/${proyectoId}/`);
        }
        setProyecto(res.data);
      } catch {
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><FiX /></button>
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

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function ProyectosJefatura() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalId, setModalId] = useState(null);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch de proyectos
  const fetchProyectos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/proyectos/', {
        params: { page, search: debouncedSearch }
      });
      setProyectos(res.data.results || res.data);
      if (res.data.count) setTotalPages(Math.ceil(res.data.count / 10));
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProyectos(); }, [page, debouncedSearch]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />

        <section className="p-6 md:p-8 flex-1 flex flex-col">
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FiLoader className="animate-spin text-[#b1122b] text-3xl" />
              </div>
            ) : proyectos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FiFolder className="text-4xl mb-2" />
                <p className="font-medium">No se encontraron proyectos</p>
                <p className="text-sm mt-1">Ajusta la búsqueda o espera a que se registren proyectos</p>
              </div>
            ) : (
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
      </div>

      {/* MODAL: Informe Completo */}
      {modalId !== null && (
        <ModalInforme
          proyectoId={modalId}
          onClose={() => setModalId(null)}
        />
      )}
    </div>
  );
}

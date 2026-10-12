import React, { useEffect, useState } from 'react';
import Layout from '../../shared/layout/Layout';
import { useMatrizOperativa } from './hooks/useMatrizOperativa';
import { FiPlus, FiLoader, FiDownload, FiFileText, FiSearch } from 'react-icons/fi';
import ModalNuevaMatriz from './components/ModalNuevaMatriz';

export default function MatrizOperativa() {
  // Extraemos puedeCrear del hook
  const { matrices, loading, fetchMatrices, handleCreated, puedeCrear } = useMatrizOperativa();
  
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Efecto para cargar inicialmente y buscar con debounce
  useEffect(() => { 
    const handler = setTimeout(() => {
      fetchMatrices(busqueda);
    }, 500);
    return () => clearTimeout(handler);
  }, [busqueda, fetchMatrices]);

  return (
    <Layout>
      {/* Paddings ajustados para móvil (p-4) y desktop (md:p-8) */}
      <section className="p-4 md:p-8 flex-1 w-full max-w-full">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Documentos de apoyo</h1>
            <p className="text-sm text-slate-500 mt-1">Guías y matrices operativas para la formulación de proyectos</p>
          </div>
          
          {/* Botón condicionado al rol (se vuelve ancho completo en móviles) */}
          {puedeCrear && (
            <button
              onClick={() => setShowModalNueva(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm w-full sm:w-auto shrink-0"
            >
              <FiPlus className="w-4 h-4" /> Nuevo Documento
            </button>
          )}
        </div>

        {/* BUSCADOR */}
        <div className="mb-4 w-full sm:max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#b1122b]"
          />
        </div>

        {/* CONTENEDOR DE TABLA RESPONSIVO (overflow-x-auto) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <FiLoader className="animate-spin text-[#b1122b] text-3xl" />
            </div>
          ) : matrices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FiFileText className="text-4xl mb-2" />
              <p className="font-medium px-4 text-center">No hay documentos registrados</p>
            </div>
          ) : (
            /* min-w-[700px] asegura que en celular se genere scroll horizontal en lugar de aplastar el texto */
            <div className="min-w-[700px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Nombre</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Publicado</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrices.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#b1122b]">{m.nombre}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <p className="line-clamp-2" title={m.descripcion}>{m.descripcion}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {m.archivo && (
                          <a
                            href={m.archivo}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition whitespace-nowrap"
                          >
                            <FiDownload /> Descargar
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Renderizado del modal protegido */}
      {showModalNueva && puedeCrear && (
        <ModalNuevaMatriz
          onClose={() => setShowModalNueva(false)}
          onCreated={handleCreated}
        />
      )}
    </Layout>
  );
}
import React, { useEffect, useState } from 'react';
import Layout from '../../shared/layout/Layout';
import { useMatrizOperativa } from './hooks/useMatrizOperativa';
import { FiPlus, FiLoader, FiSearch, FiGrid, FiList, FiFilter } from 'react-icons/fi';
import ModalNuevaMatriz from './components/ModalNuevaMatriz';
import DocumentoCard from './components/DocumentoCard';

export default function MatrizOperativa() {
  const { matrices, loading, fetchMatrices, handleCreated, puedeCrear } = useMatrizOperativa();
  
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para alternar entre vista de tarjetas o tabla
  const [vista, setVista] = useState('grid'); 

  useEffect(() => { 
    const handler = setTimeout(() => {
      fetchMatrices(busqueda);
    }, 500);
    return () => clearTimeout(handler);
  }, [busqueda, fetchMatrices]);

  return (
    <Layout>
      <section className="p-4 md:p-8 flex-1 w-full max-w-full bg-slate-50/50 min-h-screen">
        
        {/* Título de la sección */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Documentos de apoyo</h1>
          <p className="text-sm text-slate-500 mt-1">Guías y matrices operativas para la formulación de proyectos</p>
        </div>

        {/* TOOLBAR SUPERIOR (Busqueda y Filtros idéntico a la imagen) */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col md:flex-row items-center gap-3 mb-8 shadow-sm">
          
          {/* Input Búsqueda */}
          <div className="flex-1 w-full flex items-center border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus-within:border-[#b1122b] focus-within:ring-1 focus-within:ring-[#b1122b]/20 transition-all">
            <FiSearch className="text-slate-400 text-lg mr-2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, código o descripción..."
              className="w-full text-sm outline-none text-slate-700 bg-transparent"
            />
          </div>

          {/* Botones de acción derecha */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            
            {puedeCrear && (
              <button
                onClick={() => setShowModalNueva(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 bg-white rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                <FiPlus className="text-lg" /> Nuevo
              </button>
            )}

            {/* Selector de vistas */}
            <div className="flex bg-slate-100/80 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setVista('grid')}
                className={`p-2 rounded-md transition-colors ${vista === 'grid' ? 'bg-white shadow-sm text-[#b1122b]' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vista de cuadrícula"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setVista('list')}
                className={`p-2 rounded-md transition-colors ${vista === 'list' ? 'bg-white shadow-sm text-[#b1122b]' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vista de lista"
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <FiLoader className="animate-spin text-[#b1122b] text-4xl" />
          </div>
        ) : matrices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            <FiSearch className="text-4xl mb-3 text-slate-300" />
            <p className="font-medium px-4 text-center">No se encontraron documentos</p>
          </div>
        ) : (
          <>
            {/* VISTA CUADRÍCULA (TIPO TARJETAS COMO LA IMAGEN) */}
            {vista === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {matrices.map(m => (
                  <DocumentoCard key={m.id} documento={m} />
                ))}
              </div>
            )}

            {/* VISTA LISTA CLÁSICA (Mantenida por si quieren usar el botón FiList) */}
            {vista === 'list' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto w-full">
                <div className="min-w-[700px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Nombre</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Publicado</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matrices.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800">{m.nombre}</td>
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
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition whitespace-nowrap"
                              >
                                Descargar
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL */}
      {showModalNueva && puedeCrear && (
        <ModalNuevaMatriz
          onClose={() => setShowModalNueva(false)}
          onCreated={handleCreated}
        />
      )}
    </Layout>
  );
}
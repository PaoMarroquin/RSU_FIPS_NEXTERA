import React from 'react';
import { FiBook, FiDownload, FiCheckCircle, FiFileText } from 'react-icons/fi';

export default function DocumentoCard({ documento }) {
  // Función para obtener extensión (opcional para mostrar en el icono)
  const esPDF = documento.archivo?.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      
      {/* SECCIÓN SUPERIOR (Gris claro con ícono e insignias) */}
      <div className="bg-[#f4f7f9] h-40 relative flex items-center justify-center p-4">
        {/* Insignia Izquierda: Estado */}
        <div className="absolute top-3 left-3 bg-white/90 border border-green-200 text-green-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
          <FiCheckCircle className="text-green-500" /> PUBLICADO
        </div>
        
        {/* Insignia Derecha: Fecha/Año */}
        <div className="absolute top-3 right-3 bg-white text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
          {new Date(documento.created_at).getFullYear()}
        </div>
        
        {/* Ícono central como en la imagen */}
        <FiBook className="text-6xl text-slate-200" strokeWidth={1} />
      </div>

      {/* SECCIÓN DE TEXTO Y DETALLES */}
      <div className="p-5 flex flex-col flex-1 bg-white">
        {/* Título y Código */}
        <h3 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2">
          {documento.nombre}
        </h3>
        
        {/* Descripción (Subtítulo en la imagen) */}
        <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-5">
          {documento.descripcion}
        </p>

        {/* Botón de Acción ("Ver detalle" / "Descargar") */}
        <div className="mt-auto">
          {documento.archivo ? (
            <a
              href={documento.archivo}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <FiDownload className="text-sm" /> Descargar
            </a>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Sin archivo adjunto</span>
          )}
        </div>
      </div>
    </div>
  );
}
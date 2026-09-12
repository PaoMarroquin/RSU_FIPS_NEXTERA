import React from 'react';

export default function EstadoBadge({ estado }) {
  const map = {
    borrador:       'bg-slate-100 text-slate-700',
    'en revision':  'bg-yellow-100 text-yellow-700',
    observado:      'bg-orange-100 text-orange-700',
    aprobado:       'bg-green-100 text-green-700',
    'en ejecucion': 'bg-blue-100 text-blue-700',
    finalizado:     'bg-purple-100 text-purple-700',
  };
  const cls = map[estado?.toLowerCase()] || 'bg-slate-100 text-slate-600';
  
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${cls}`}>
      {estado}
    </span>
  );
}
import React from 'react';

export default function EstadoBadge({ estado }) {
  const map = {
    borrador:    'bg-slate-100 text-slate-700',
    activo:      'bg-green-100 text-green-700',
    cerrado:     'bg-red-100 text-red-700',
    en_revision: 'bg-yellow-100 text-yellow-700',
  };
  const cls = map[estado?.toLowerCase()] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${cls}`}>
      {estado}
    </span>
  );
}
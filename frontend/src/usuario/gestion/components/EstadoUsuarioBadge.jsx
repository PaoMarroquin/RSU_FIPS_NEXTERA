import React from 'react';

export default function EstadoUsuarioBadge({ estado }) {
  const isActivo = estado === 'activo';
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${isActivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {estado || 'Desconocido'}
    </span>
  );
}
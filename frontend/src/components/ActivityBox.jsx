import React from 'react';
import ActivityCard from './ActivityCard'; // Importamos la tarjeta adaptada

export default function ActivityBox({ proyectoSeleccionado, onUpdateAccionEstado }) {
  // 'proyectoSeleccionado' es el objeto completo traído desde tu 'ProyectoRSUSerializer'
  // El cual contiene: proyectoSeleccionado.cronograma (Array de acciones)
  const acciones = proyectoSeleccionado?.cronograma || [];

  // Clasificamos en tiempo real las acciones que vienen del back
  const accionesPendientes = acciones.filter(act => act.estado_avance !== 'completado' && !act.completado);
  const accionesCompletadas = acciones.filter(act => act.estado_avance === 'completado' || act.completado);

  if (!proyectoSeleccionado) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
        Selecciona un proyecto para auditar el cronograma de actividades recientes.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-4 rounded-xl border border-slate-200">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800 m-0">Cronograma de Trabajo</h3>
        <p className="text-xs text-slate-500">{proyectoSeleccionado.titulo}</p>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[600px] pr-1">
        
        {/* SECCIÓN ACCIONES PENDIENTES / POR HACER */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Por Ejecutar ({accionesPendientes.length})
            </h4>
          </div>
          
          {accionesPendientes.length === 0 ? (
            <p className="text-xs text-slate-400 italic pl-4">No hay acciones pendientes en este periodo.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {accionesPendientes.map((accion) => (
                <ActivityCard 
                  key={accion.id || accion.orden} 
                  accion={accion} 
                  onToggleComplete={onUpdateAccionEstado}
                />
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN ACCIONES COMPLETADAS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Completadas ({accionesCompletadas.length})
            </h4>
          </div>

          {accionesCompletadas.length === 0 ? (
            <p className="text-xs text-slate-400 italic pl-4">Aún no se han registrado hitos completados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {accionesCompletadas.map((accion) => (
                <ActivityCard 
                  key={accion.id || accion.orden} 
                  accion={accion} 
                  onToggleComplete={onUpdateAccionEstado}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
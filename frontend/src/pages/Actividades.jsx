import React, { useState } from 'react';
import ActivityCard from "../components/ActivityCard";

export default function Actividades({ data, updateData }) {
  // Aseguramos que data.actividades sea siempre un arreglo para que no rompa el código
  const listaActividades = data.actividades || [];

  // Estado local para controlar los campos del formulario de la "Nueva Actividad"
  const [nuevaActividad, setNuevaActividad] = useState({
    nombre: '',
    descripcion: '',
    curso_vinculado: '',
    responsable: '',
    fecha: '',
    evidencia_esperada: '',
    orden: 1 // 1: Pendiente, 2: En Proceso, 3: Finalizado
  });

  // Manejador para el formulario de la actividad que estamos escribiendo
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaActividad(prev => ({
      ...prev,
      [name]: name === 'orden' ? parseInt(value, 10) : value
    }));
  };

  // Función para agregar la actividad al estado global del proyecto (formData)
  const handleAgregarActividad = (e) => {
    e.preventDefault();
    if (!nuevaActividad.nombre.trim()) return;

    // Generamos un id temporal en el frontend por si necesitas borrarlas o editarlas luego
    const actividadConId = {
      ...nuevaActividad,
      id: Date.now() 
    };

    const nuevasActividades = [...listaActividades, actividadConId];
    
    // Guardamos en el estado del padre (al igual que haces en DatosGenerales)
    updateData('actividades', nuevasActividades);

    // Limpiamos el formulario para meter la siguiente actividad
    setNuevaActividad({
      nombre: '',
      descripcion: '',
      curso_vinculado: '',
      responsable: '',
      fecha: '',
      evidencia_esperada: '',
      orden: 1
    });
  };

  // Función opcional por si el usuario quiere eliminar una actividad de la lista
  const handleEliminarActividad = (id) => {
    const filtradas = listaActividades.filter(act => act.id !== id);
    updateData('actividades', filtradas);
  };

  // Clasificación en caliente para el tablero Kanban visual
  const pendientes = listaActividades.filter(act => act.orden === 1);
  const enProceso = listaActividades.filter(act => act.orden === 2);
  const finalizadas = listaActividades.filter(act => act.orden === 3);

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA (Estilo igual a tus otros pasos) */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">VI.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Actividades y Cronograma</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 6 de 9</span>
        </div>
      </div>

      {/* FORMULARIO PARA AGREGAR UNA ACTIVIDAD */}
      <form onSubmit={handleAgregarActividad} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 m-0">
          Añadir Nueva Actividad al Proyecto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Nombre de la Actividad *</label>
            <input 
              type="text" name="nombre" value={nuevaActividad.nombre} onChange={handleInputChange} required
              placeholder="Ej. Taller de capacitación inicial"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Curso Vinculado</label>
            <input 
              type="text" name="curso_vinculado" value={nuevaActividad.curso_vinculado} onChange={handleInputChange}
              placeholder="Ej. RSU II, Desarrollo Web"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Responsable *</label>
            <input 
              type="text" name="responsable" value={nuevaActividad.responsable} onChange={handleInputChange} required
              placeholder="Nombre del docente o alumno líder"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Fecha Tentativa *</label>
            <input 
              type="date" name="fecha" value={nuevaActividad.fecha} onChange={handleInputChange} required
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Evidencia Esperada *</label>
            <input 
              type="text" name="evidencia_esperada" value={nuevaActividad.evidencia_esperada} onChange={handleInputChange} required
              placeholder="Ej. Lista de asistencia firmada, fotografías del evento, informe técnico"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Descripción de la Actividad</label>
            <textarea 
              name="descripcion" value={nuevaActividad.descripcion} onChange={handleInputChange}
              placeholder="Breve detalle de lo que se realizará..."
              className="min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all resize-y"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Estado Inicial de la Tarea</label>
            <select 
              name="orden" value={nuevaActividad.orden} onChange={handleInputChange}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b1122b] transition-all"
            >
              <option value={1}>Pendiente</option>
              <option value={2}>En Proceso</option>
              <option value={3}>Finalizado</option>
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button 
              type="submit"
              className="h-10 px-5 bg-[#b1122b] text-white rounded-md text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm"
            >
              + Agregar Actividad
            </button>
          </div>
        </div>
      </form>

      {/* VISTA PREVIA EN TABLERO KANBAN */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Vista Previa del Tablero de Actividades ({listaActividades.length})
        </h3>

        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {/* COLUMNA: Pendiente */}
          <div className="flex-none w-72 bg-slate-100 rounded-xl p-3 flex flex-col gap-2.5 border border-slate-200">
            <span className="font-bold text-slate-700 text-xs px-1">Pendiente ({pendientes.length})</span>
            {pendientes.map(act => (
              <div key={act.id} className="relative group">
                <ActivityCard
                  title={act.nombre}
                  project={act.curso_vinculado || "Sin curso"}
                  date={act.fecha}
                  user={act.responsable ? act.responsable.charAt(0).toUpperCase() : "?"}
                  color="red"
                />
                <button type="button" onClick={() => handleEliminarActividad(act.id)} className="absolute top-2 right-2 hidden group-hover:block bg-red-100 text-red-700 rounded p-1 text-2xs font-bold">✕</button>
              </div>
            ))}
          </div>

          {/* COLUMNA: En Proceso */}
          <div className="flex-none w-72 bg-blue-50/50 rounded-xl p-3 flex flex-col gap-2.5 border border-blue-100">
            <span className="font-bold text-slate-700 text-xs px-1">En Proceso ({enProceso.length})</span>
            {enProceso.map(act => (
              <div key={act.id} className="relative group">
                <ActivityCard
                  title={act.nombre}
                  project={act.curso_vinculado || "Sin curso"}
                  date={act.fecha}
                  user={act.responsable ? act.responsable.charAt(0).toUpperCase() : "?"}
                  color="blue"
                />
                <button type="button" onClick={() => handleEliminarActividad(act.id)} className="absolute top-2 right-2 hidden group-hover:block bg-red-100 text-red-700 rounded p-1 text-2xs font-bold">✕</button>
              </div>
            ))}
          </div>

          {/* COLUMNA: Finalizado */}
          <div className="flex-none w-72 bg-emerald-50/50 rounded-xl p-3 flex flex-col gap-2.5 border border-emerald-100">
            <span className="font-bold text-slate-700 text-xs px-1">Finalizado ({finalizadas.length})</span>
            {finalizadas.map(act => (
              <div key={act.id} className="relative group">
                <ActivityCard
                  title={act.nombre}
                  project={act.curso_vinculado || "Sin curso"}
                  date={act.fecha}
                  user={act.responsable ? act.responsable.charAt(0).toUpperCase() : "?"}
                  color="green"
                  done
                />
                <button type="button" onClick={() => handleEliminarActividad(act.id)} className="absolute top-2 right-2 hidden group-hover:block bg-red-100 text-red-700 rounded p-1 text-2xs font-bold">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
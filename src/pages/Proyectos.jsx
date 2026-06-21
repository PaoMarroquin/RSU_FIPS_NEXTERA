import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProjectCard from "../components/ProjectCard";

import {
  FiSearch,
  FiGrid,
  FiList,
  FiPlus
} from "react-icons/fi";

export default function Proyectos() {
  const navigate = useNavigate();

  // HOOKS DE ESTADO: Para que los filtros funcionen
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const data = [
    {
      id: "PRJ-2024-001",
      title: "Campaña de Salud Preventiva en Zonas Rurales",
      author: "Ana Silva",
      faculty: "Medicina",
      progress: 65,
      status: "En ejecución",
      tag: "Extensión"
    },
    {
      id: "PRJ-2024-002",
      title: "Alfabetización Digital para Adultos Mayores",
      author: "Pedro Marroquín",
      faculty: "Ingeniería de Producción y Servicios",
      progress: 0,
      status: "Aprobado",
      tag: "Voluntariado"
    },
    {
      id: "PRJ-2024-003",
      title: "Asesoría Legal Gratuita para Pymes",
      author: "Carlos Ruiz",
      faculty: "Derecho",
      progress: 100,
      status: "Finalizado",
      tag: "Extensión"
    },
    {
      id: "PRJ-2024-004",
      title: "Reciclaje y Economía Circular en el Campus",
      author: "Jorge Luna",
      faculty: "Ingeniería Ambiental",
      progress: 35,
      status: "En revisión",
      tag: "Investigación"
    },
    {
      id: "PRJ-2024-005",
      title: "Diseño de Espacios Públicos Inclusivos",
      author: "María Gómez",
      faculty: "Arquitectura y Urbanismo",
      progress: 15,
      status: "Observado",
      tag: "Extensión"
    },
    {
      id: "PRJ-2024-006",
      title: "Taller de Robótica Educativa",
      author: "Pedro Marroquín",
      faculty: "Ingeniería de Producción y Servicios",
      progress: 10,
      status: "Borrador",
      tag: "Voluntariado"
    }
  ];

  // Lógica para filtrar los datos según lo que el usuario seleccione o escriba
  const filteredProjects = data.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = facultyFilter ? project.faculty === facultyFilter : true;
    const matchesTag = tagFilter ? project.tag === tagFilter : true;
    const matchesStatus = statusFilter ? project.status === statusFilter : true;

    return matchesSearch && matchesFaculty && matchesTag && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. Sidebar Fijo a la izquierda */}
      <Sidebar />

      {/* 2. Contenido principal desplazado 230px a la derecha */}
      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        
        <Topbar />

        {/* CONTENEDOR PRINCIPAL */}
        <section className="p-6 md:p-8 flex-1">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">Proyectos RSU</h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestiona los proyectos de responsabilidad social
              </p>
            </div>

            <button
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm"
              onClick={() => navigate('/proyectos/nuevo')}
            >
              <FiPlus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            
            {/* Buscador */}
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white w-full lg:w-80 focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título o código..."
                className="w-full text-sm outline-none bg-transparent placeholder:text-slate-400 text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Selects */}
            <select 
              className="w-full lg:w-auto h-[42px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b] bg-white cursor-pointer"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
            >
              <option value="">Todas las Facultades</option>
              <option value="Medicina">Medicina</option>
              <option value="Ingeniería de Producción y Servicios">Ingeniería de Prod. y Servicios</option>
              <option value="Derecho">Derecho</option>
              <option value="Ingeniería Ambiental">Ingeniería Ambiental</option>
              <option value="Arquitectura y Urbanismo">Arquitectura y Urbanismo</option>
            </select>

            <select 
              className="w-full lg:w-auto h-[42px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b] bg-white cursor-pointer"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">Todos los Ejes RSU</option>
              <option value="Extensión">Extensión</option>
              <option value="Voluntariado">Voluntariado</option>
              <option value="Investigación">Investigación</option>
              <option value="Formación">Formación</option>
              <option value="Gestión">Gestión</option>
            </select>

            <select 
              className="w-full lg:w-auto h-[42px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b] bg-white cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="Borrador">Borrador</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado</option>
              <option value="Aprobado">Aprobado</option>
              <option value="En ejecución">En ejecución</option>
              <option value="Finalizado">Finalizado</option>
            </select>

            {/* Alternar Vistas */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-auto border border-slate-200">
              <button className="p-1.5 bg-white shadow-sm text-[#b1122b] rounded-md transition-all">
                <FiGrid className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-slate-500 hover:bg-white hover:text-slate-700 rounded-md transition-all">
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GRILLA DE PROYECTOS */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <span className="text-slate-400 text-lg font-medium">No se encontraron proyectos</span>
              <span className="text-slate-400 text-sm mt-1">Intenta ajustando los filtros de búsqueda</span>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
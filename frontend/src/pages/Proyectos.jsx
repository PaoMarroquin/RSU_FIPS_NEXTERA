import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProjectCard from "../components/ProjectCard";
import api from '../api/axiosConfig';

import {
  FiSearch,
  FiGrid,
  FiList,
  FiPlus,
  FiLoader,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

export default function Proyectos() {
  const navigate = useNavigate();

  // HOOKS DE ESTADO PARA LA API
  const [projectsDb, setProjectsDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // HOOKS DE ESTADO PARA FILTROS LOCALES Y BÚSQUEDA
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. Efecto Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Fetch a la API
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/proyectos/', {
        params: {
          page: page,
          search: debouncedSearch
        }
      });
      
      setProjectsDb(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10)); 
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  // MANDAR A CREAR DESDE CERO COMPLETAMENTE VACÍO
  const handleNuevoProyecto = () => {
    // 1. Limpiamos cualquier rastro que dejes guardado temporalmente en la sesión local
    localStorage.removeItem('proyecto_form_data'); 
    localStorage.removeItem('current_project_id'); // Por si guardas el ID para saber si editas o creas

    // 2. Opcional: Si manejas un estado global (como un Context o Zustand), asegúrate de invocar su reset aquí.
    // resetFormGlobal();

    // 3. Navegamos al formulario limpio
    navigate('/proyectos/nuevo');
  };

  // EDITAR Y ELIMINAR
  const handleEdit = (id) => {
    navigate(`/proyectos/editar/${id}`); 
  };

  const handleDelete = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.");
    
    if (confirmar) {
      try {
        await api.delete(`/api/v1/proyectos/${id}/`);
        setProjectsDb(prevProjects => prevProjects.filter(p => p.id !== id));
        alert("Proyecto eliminado con éxito.");
      } catch (error) {
        console.error("Error al eliminar el proyecto:", error);
        alert("Hubo un problema al intentar eliminar el proyecto.");
      }
    }
  };

  // 3. Mapeo de datos
  const mappedProjects = projectsDb.map(p => {
    let progresoSimulado = 0;
    if (p.estado === 'borrador') progresoSimulado = 10;
    if (p.estado === 'en revision') progresoSimulado = 30;
    if (p.estado === 'aprobado') progresoSimulado = 50;
    if (p.estado === 'en ejecucion') progresoSimulado = 75;
    if (p.estado === 'finalizado') progresoSimulado = 100;

    return {
      dbId: p.id,
      id: p.codigo,
      title: p.titulo,
      author: p.docente_responsable_nombre,
      faculty: p.facultad_nombre,
      progress: progresoSimulado,
      status: p.estado,
      tag: p.eje_rsu_nombre
    };
  });

  // 4. Filtros Locales
  const filteredProjects = mappedProjects.filter(project => {
    const matchesFaculty = facultyFilter ? project.faculty === facultyFilter : true;
    const matchesTag = tagFilter ? project.tag === tagFilter : true;
    const matchesStatus = statusFilter ? project.status.toLowerCase() === statusFilter.toLowerCase() : true;

    return matchesFaculty && matchesTag && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        
        <Topbar />

        <section className="p-6 md:p-8 flex-1 flex flex-col">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">Proyectos RSU</h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestiona los proyectos de responsabilidad social
              </p>
            </div>

            {/* Cambiado para invocar la función de limpieza y reseteo */}
            <button
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm"
              onClick={handleNuevoProyecto}
            >
              <FiPlus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            
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

            <select 
              className="w-full lg:w-auto h-[42px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b] bg-white cursor-pointer"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
            >
              <option value="">Todas las Facultades</option>
              <option value="Medicina">Medicina</option>
              <option value="Arquitectura y Urbanismo">Arquitectura y Urbanismo</option>
              <option value="Ingeniería de Producción y Servicios">Ingeniería de Prod. y Servicios</option>
            </select>

            <select 
              className="w-full lg:w-auto h-[42px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b] bg-white cursor-pointer"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">Todos los Ejes RSU</option>
              <option value="Gestión">Gestión</option>
              <option value="Extensión">Extensión</option>
              <option value="Voluntariado">Voluntariado</option>
              <option value="Investigación">Investigación</option>
              <option value="Formación">Formación</option>
            </select>

            <select 
              className="w-full lg:w-auto h-[42px] px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-[#b1122b] focus:ring-1 focus:ring-[#b1122b] bg-white cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="borrador">Borrador</option>
              <option value="en revision">En revisión</option>
              <option value="observado">Observado</option>
              <option value="aprobado">Aprobado</option>
              <option value="en ejecucion">En ejecución</option>
              <option value="finalizado">Finalizado</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-auto border border-slate-200">
              <button className="p-1.5 bg-white shadow-sm text-[#b1122b] rounded-md transition-all">
                <FiGrid className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-slate-500 hover:bg-white hover:text-slate-700 rounded-md transition-all">
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ESTADO DE CARGA */}
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />
              <span className="text-slate-500 font-medium">Cargando proyectos...</span>
            </div>
          ) : (
            <>
              {/* GRILLA DE PROYECTOS */}
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.dbId}
                      {...project} 
                      onEdit={() => handleEdit(project.dbId)}
                      onDelete={() => handleDelete(project.dbId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed flex-1">
                  <span className="text-slate-400 text-lg font-medium">No se encontraron proyectos</span>
                  <span className="text-slate-400 text-sm mt-1">Intenta ajustando los filtros de búsqueda</span>
                </div>
              )}

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-200">
                  <span className="text-sm text-slate-500">
                    Página <span className="font-semibold text-slate-800">{page}</span> de <span className="font-semibold text-slate-800">{totalPages}</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#b1122b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#b1122b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </section>
      </div>
    </div>
  );
}
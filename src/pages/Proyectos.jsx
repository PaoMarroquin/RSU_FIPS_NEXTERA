import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProjectCard from "../components/ProjectCard";

import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  FiSearch,
  FiGrid,
  FiList,
  FiPlus
} from "react-icons/fi";

import "../styles/proyectos.css";

export default function Proyectos() {
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

  return (
    <div className="layout">

      <Sidebar />

      <div className="content">

        <Topbar />

        <section className="projects-page">

          <div className="page-header">

            <div>
              <h1>Proyectos RSU</h1>
              <p>
                Gestiona los proyectos de responsabilidad social
              </p>
            </div>

            <button
              className="new-project-btn"
              onClick={() => navigate('/proyectos/nuevo')}
            >
              <FiPlus />
              Nuevo Proyecto
            </button>

          </div>

          <div className="filters-container">

            <div className="search-project">
              <FiSearch />
              <input
                type="text"
                placeholder="Buscar por título o código..."
              />
            </div>

            <select>
              <option>Facultad</option>
            </select>

            <select>
              <option>Eje RSU</option>
            </select>

            <select>
              <option>Estado</option>
            </select>

            <div className="view-toggle">
              <button>
                <FiGrid />
              </button>

              <button>
                <FiList />
              </button>
            </div>

          </div>

          <div className="projects-grid">

            {data.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
              />
            ))}

          </div>

        </section>

      </div>

    </div>
  );
}
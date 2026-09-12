import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../shared/layout/Layout";
import ConfirmModal from "../../shared/components/ConfirmModal";
import { useToast } from "../../shared/context/ToastContext";
import { useProyectosListado } from "./hooks/useProyectosListado";
import ProyectosHeader from "./components/ProyectosHeader";
import ProyectosToolbar from "./components/ProyectosToolbar";
import ProyectosGridView from "./components/ProyectosGridView";
import ProyectosListView from "./components/ProyectosListView";
import ProyectosEmptyState from "./components/ProyectosEmptyState";
import ProyectosPagination from "./components/ProyectosPagination";
import ModalInforme from "./components/ModalInforme";
import { FiLoader } from "react-icons/fi";

export default function Proyectos() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [modalId, setModalId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const userRole = (localStorage.getItem("user_role") || "").toLowerCase().trim();
  const canCreate = userRole === "docente" || userRole === "administrador";
  const canEdit = userRole === "docente" || userRole === "administrador";
  const canDelete = userRole === "administrador";

  const {
    projectsDb, loading, page, setPage, totalPages,
    searchTerm, setSearchTerm, eliminarProyecto,
  } = useProyectosListado();

  const mappedProjects = projectsDb.map((p) => ({
    dbId: p.id,
    id: p.codigo,
    title: p.titulo,
    author: p.docente_responsable_nombre,
    faculty: p.facultad_nombre,
    progress: parseFloat(p.porcentaje_ejecucion) || 0,
    status: p.estado,
    tag: p.eje_rsu_nombre,
  }));

  const handleNuevoProyecto = () => {
    localStorage.removeItem("rsu_draft");
    navigate("/proyectos/nuevo");
  };

  const handleEdit = (id) => navigate(`/proyectos/editar/${id}`);
  const handleDelete = (id) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await eliminarProyecto(id);
      showToast("success", "Proyecto eliminado con éxito.");
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
      showToast("error", "Hubo un problema al intentar eliminar el proyecto.");
    }
  };

  return (
    <Layout>
      <section className="p-6 md:p-8 flex-1 flex flex-col">
        <ProyectosHeader canCreate={canCreate} onNuevoProyecto={handleNuevoProyecto} />
        <ProyectosToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />
            <span className="text-slate-500 font-medium">Cargando proyectos...</span>
          </div>
        ) : mappedProjects.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <ProyectosGridView
                projects={mappedProjects}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={setModalId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <ProyectosListView
                projects={mappedProjects}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={setModalId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            <ProyectosPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <ProyectosEmptyState />
        )}
      </section>

      <ConfirmModal
        open={deleteTargetId !== null}
        titulo="Eliminar proyecto"
        mensaje="¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {modalId !== null && <ModalInforme proyectoId={modalId} onClose={() => setModalId(null)}/>}
    </Layout>
  );
}
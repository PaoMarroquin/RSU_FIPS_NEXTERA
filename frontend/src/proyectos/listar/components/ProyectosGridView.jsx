import ProjectCard from "../../../shared/components/ProjectCard";

export default function ProyectosGridView({ projects, canEdit, canDelete, onView, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {projects.map((project) => (
        <ProjectCard
          key={project.dbId}
          {...project}
          onView={() => onView(project.dbId)}
          onEdit={canEdit ? () => onEdit(project.dbId) : null}
          onDelete={canDelete ? () => onDelete(project.dbId) : null}
        />
      ))}
    </div>
  );
}
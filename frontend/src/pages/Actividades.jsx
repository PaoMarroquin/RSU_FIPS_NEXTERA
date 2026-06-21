import Layout from "../layout/Layout";
import ActivityCard from "../components/ActivityCard";
import "../styles/actividades.css";

const Actividades = () => {
  return (
    <Layout>
      <div className="page">

        <div className="header">
          <div>
            <h2>Actividades y Cronograma</h2>
            <p>Gestión de tareas de los proyectos en ejecución</p>
          </div>

          <div className="actions">
            <div className="views">
              <button className="active">Kanban</button>
              <button>Gantt</button>
              <button>Calendario</button>
            </div>

            <button className="btn">+ Nueva Actividad</button>
          </div>
        </div>

        <div className="kanban">

          <div className="column">
            <div className="col-header">
              <span>Pendiente</span>
              <span>1</span>
            </div>

            <ActivityCard
              title="Primera sesión de capacitación"
              project="Alfabetización Digital"
              date="25 Oct"
              user="P"
              color="red"
            />
          </div>

          <div className="column blue">
            <div className="col-header">
              <span>En Proceso</span>
              <span>2</span>
            </div>

            <ActivityCard
              title="Convocatoria de voluntarios"
              project="Alfabetización Digital"
              date="16 Oct - 20 Oct"
              user="A"
              color="blue"
            />

            <ActivityCard
              title="Evaluación inicial"
              project="Campaña de Salud"
              date="18 Oct - 22 Oct"
              user="C"
              color="blue"
            />
          </div>

          <div className="column green">
            <div className="col-header">
              <span>Finalizado</span>
              <span>1</span>
            </div>

            <ActivityCard
              title="Diseño del material didáctico"
              project="Alfabetización Digital"
              date="10 Oct - 15 Oct"
              user="P"
              color="green"
              done
            />
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Actividades;
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ActivityCard from "../components/ActivityCard";

const Actividades = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. Sidebar Fijo a la izquierda */}
      <Sidebar />

      {/* 2. Contenido principal desplazado 230px a la derecha */}
      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        
        <Topbar />

        {/* 3. Área de trabajo (ocupa el resto del alto de la pantalla) */}
        <div className="p-6 md:p-8 flex-1 flex flex-col">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 m-0">Actividades y Cronograma</h2>
              <p className="text-sm text-slate-500 mt-1">Gestión de tareas de los proyectos en ejecución</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              
              {/* Toggles de vista */}
              <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto justify-center">
                <button className="px-3 py-1.5 bg-white shadow-sm text-slate-800 rounded-md text-sm font-semibold transition-all">Kanban</button>
                <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 rounded-md text-sm font-medium transition-all">Gantt</button>
                <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 rounded-md text-sm font-medium transition-all">Calendario</button>
              </div>

              {/* Botón Nueva Actividad */}
              <button className="w-full sm:w-auto px-4 py-2 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm">
                + Nueva Actividad
              </button>
            </div>
          </div>

          {/* TABLERO KANBAN */}
          <div className="flex-1 flex items-start gap-6 overflow-x-auto pb-4">

            {/* COLUMNA: Pendiente */}
            <div className="flex-none w-80 bg-slate-100 rounded-xl p-4 flex flex-col gap-3 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="font-bold text-slate-700 text-sm">Pendiente</span>
                </div>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
              </div>

              <ActivityCard
                title="Primera sesión de capacitación"
                project="Alfabetización Digital"
                date="25 Oct"
                user="P"
                color="red"
              />
            </div>

            {/* COLUMNA: En Proceso */}
            <div className="flex-none w-80 bg-blue-50/50 rounded-xl p-4 flex flex-col gap-3 border border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-bold text-slate-700 text-sm">En Proceso</span>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
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

            {/* COLUMNA: Finalizado */}
            <div className="flex-none w-80 bg-emerald-50/50 rounded-xl p-4 flex flex-col gap-3 border border-emerald-100">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="font-bold text-slate-700 text-sm">Finalizado</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
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
      </div>
    </div>
  );
};

export default Actividades;
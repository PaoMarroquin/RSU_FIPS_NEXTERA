import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FiCheckCircle, FiXCircle, FiEye, FiClock } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function RevisionProyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [comentario, setComentario] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [actionType, setActionType] = useState(null); // 'aprobar' or 'observar'

  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/proyectos/para-revisar/");
      setProyectos(res.data.results || res.data); // in case pagination is used
    } catch (error) {
      console.error("Error fetching revisiones:", error);
      alert("Error al cargar los proyectos para revisión.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (proyecto, action) => {
    setSelectedProyecto(proyecto);
    setActionType(action);
    setComentario("");
    setModalOpen(true);
  };

  const handleEvaluate = async () => {
    if (actionType === "observar" && !comentario.trim()) {
      alert("El comentario técnico es obligatorio al observar.");
      return;
    }

    try {
      setEvaluating(true);
      const endpoint = `/api/v1/proyectos/${selectedProyecto.id}/${actionType}/`;
      
      const payload = {};
      if (actionType === "observar") {
        payload.comentario_tecnico = comentario;
      }

      await api.post(endpoint, payload);
      alert(`Proyecto ${actionType === 'aprobar' ? 'Aprobado' : 'Observado'} con éxito.`);
      setModalOpen(false);
      fetchProyectos();
    } catch (error) {
      console.error("Error evaluating:", error);
      const msg = error.response?.data?.comentario_tecnico?.[0] || error.response?.data?.detail || "Error al procesar la evaluación.";
      alert(msg);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[230px]">
        <Topbar />
        
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Evaluación de Proyectos</h1>
              <p className="text-slate-500 mt-1">Revisa y emite dictámenes para los proyectos de tu departamento.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Cargando proyectos...</div>
            ) : proyectos.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <FiCheckCircle className="text-5xl text-emerald-400 mb-3" />
                <p className="font-medium text-lg">No hay proyectos pendientes de revisión</p>
                <p className="text-sm">Todo está al día en tu departamento.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6 font-semibold">Código / Título</th>
                    <th className="py-4 px-6 font-semibold">Docente Responsable</th>
                    <th className="py-4 px-6 font-semibold">Enviado en</th>
                    <th className="py-4 px-6 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {proyectos.map((proyecto) => (
                    <tr key={proyecto.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{proyecto.codigo || 'Sin código'}</div>
                        <div className="text-slate-500 line-clamp-1" title={proyecto.titulo}>{proyecto.titulo}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {proyecto.docente_responsable_nombre}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {proyecto.fecha_envio_revision ? format(new Date(proyecto.fecha_envio_revision), "dd/MM/yyyy HH:mm", { locale: es }) : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver expediente"
                            onClick={() => window.open(`/informes?proyecto=${proyecto.id}`, '_blank')}
                          >
                            <FiEye className="text-lg" />
                          </button>
                          <button 
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium rounded-lg transition-colors text-xs flex items-center gap-1"
                            onClick={() => openModal(proyecto, 'aprobar')}
                          >
                            <FiCheckCircle /> Aprobar
                          </button>
                          <button 
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors text-xs flex items-center gap-1"
                            onClick={() => openModal(proyecto, 'observar')}
                          >
                            <FiXCircle /> Observar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal Evaluation */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {actionType === 'aprobar' ? 'Aprobar Proyecto' : 'Observar Proyecto'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Estás a punto de dictaminar el proyecto <strong>{selectedProyecto?.codigo || 'Borrador'}</strong>.
            </p>

            {actionType === 'observar' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Comentario Técnico (Obligatorio) <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] resize-none"
                  rows="4"
                  placeholder="Detalla las observaciones y correcciones necesarias..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </div>
            )}
            
            {actionType === 'aprobar' && (
              <div className="mb-6 bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex gap-3">
                <FiCheckCircle className="text-xl shrink-0 mt-0.5" />
                <p className="text-sm">
                  Al aprobar, el proyecto cambiará de estado y el docente responsable será notificado para iniciar la ejecución. Esta acción es irreversible por ti.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                onClick={() => setModalOpen(false)}
                disabled={evaluating}
              >
                Cancelar
              </button>
              <button
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 ${
                  actionType === 'aprobar' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-[#b1122b] hover:bg-[#8e0e22]'
                }`}
                onClick={handleEvaluate}
                disabled={evaluating}
              >
                {evaluating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  actionType === 'aprobar' ? 'Confirmar Aprobación' : 'Enviar Observación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

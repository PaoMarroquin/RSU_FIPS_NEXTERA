import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import api from "../api/axiosConfig";

import {
  FiFolder,
  FiCheckCircle,
  FiFlag,
  FiUsers,
  FiTarget,
  FiClock,
  FiEye,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_LABELS = {
  borrador: "Borrador",
  en_revision: "En revisión",
  corregido: "Corregido",
  aprobado: "Aprobado",
  en_ejecucion: "En ejecución",
  finalizado: "Finalizado",
  observado: "Observado",
  rechazado: "Rechazado",
};

const ESTADO_COLORS = {
  borrador: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  en_revision: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  corregido: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  aprobado: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  en_ejecucion: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  finalizado: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  observado: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  rechazado: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function EstadoBadge({ estado }) {
  const c = ESTADO_COLORS[estado] || ESTADO_COLORS.borrador;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {ESTADO_LABELS[estado] || estado}
    </span>
  );
}

function ProyectoRow({ proyecto }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#7B1E3A]/10 flex items-center justify-center flex-shrink-0">
          <FiFolder className="text-[#7B1E3A] text-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate max-w-[260px]">
            {proyecto.titulo || "Sin título"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {proyecto.codigo || `#${proyecto.id}`}
            {proyecto.periodo?.nombre ? ` · ${proyecto.periodo.nombre}` : ""}
          </p>
        </div>
      </div>
      <EstadoBadge estado={proyecto.estado} />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-[#7B1E3A]/20 border-t-[#7B1E3A] rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Cargando datos…</p>
    </div>
  );
}

function EmptyState({ mensaje }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
      <FiAlertCircle className="text-3xl" />
      <p className="text-sm">{mensaje}</p>
    </div>
  );
}

// ─── Vistas por rol ───────────────────────────────────────────────────────────

function DashboardDocente({ proyectos, loading }) {
  if (loading) return <LoadingSpinner />;

  const total = proyectos.length;
  const enRevision = proyectos.filter((p) => p.estado === "en_revision").length;
  const aprobados = proyectos.filter((p) => p.estado === "aprobado").length;
  const enEjecucion = proyectos.filter((p) => p.estado === "en_ejecucion").length;
  const recientes = [...proyectos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mis Proyectos"
          value={String(total)}
          icon={<FiFolder />}
          color="blue"
        />
        <StatCard
          title="En Revisión"
          value={String(enRevision)}
          icon={<FiEye />}
          color="yellow"
        />
        <StatCard
          title="Aprobados"
          value={String(aprobados)}
          icon={<FiCheckCircle />}
          color="green"
        />
        <StatCard
          title="En Ejecución"
          value={String(enEjecucion)}
          icon={<FiTarget />}
          color="purple"
        />
      </div>

      {/* Lista de proyectos recientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Mis proyectos recientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimos 5 proyectos registrados</p>
          </div>
          <FiClock className="text-slate-300 text-lg" />
        </div>
        <div className="divide-y divide-slate-50">
          {recientes.length === 0 ? (
            <EmptyState mensaje="No tienes proyectos registrados aún." />
          ) : (
            recientes.map((p) => <ProyectoRow key={p.id} proyecto={p} />)
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardDepartamento({ proyectos, loading }) {
  if (loading) return <LoadingSpinner />;

  const total = proyectos.length;
  const enRevision = proyectos.filter((p) => p.estado === "en_revision").length;
  const aprobados = proyectos.filter((p) => p.estado === "aprobado").length;
  const observados = proyectos.filter((p) => p.estado === "observado").length;

  // Proyectos pendientes de revisión ordenados por fecha de envío
  const pendientes = proyectos
    .filter((p) => p.estado === "en_revision")
    .sort((a, b) => new Date(a.fecha_envio_revision || a.created_at) - new Date(b.fecha_envio_revision || b.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Proyectos"
          value={String(total)}
          icon={<FiFolder />}
          color="blue"
        />
        <StatCard
          title="En Revisión"
          value={String(enRevision)}
          icon={<FiEye />}
          color="yellow"
        />
        <StatCard
          title="Aprobados"
          value={String(aprobados)}
          icon={<FiCheckCircle />}
          color="green"
        />
        <StatCard
          title="Observados"
          value={String(observados)}
          icon={<FiFlag />}
          color="purple"
        />
      </div>

      {/* Lista de proyectos pendientes de revisión */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Pendientes de revisión</h2>
            <p className="text-xs text-slate-400 mt-0.5">Proyectos con mayor antigüedad en cola</p>
          </div>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
            {enRevision}
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {pendientes.length === 0 ? (
            <EmptyState mensaje="No hay proyectos pendientes de revisión." />
          ) : (
            pendientes.map((p) => <ProyectoRow key={p.id} proyecto={p} />)
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardAutoridad({ proyectos, loading }) {
  if (loading) return <LoadingSpinner />;

  const total = proyectos.length;
  const enRevision = proyectos.filter((p) => p.estado === "en_revision").length;
  const aprobados = proyectos.filter((p) => p.estado === "aprobado").length;
  const enEjecucion = proyectos.filter((p) => p.estado === "en_ejecucion").length;
  const finalizados = proyectos.filter((p) => p.estado === "finalizado").length;

  const recientes = [...proyectos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total" value={String(total)} icon={<FiFolder />} color="blue" />
        <StatCard title="En Revisión" value={String(enRevision)} icon={<FiEye />} color="yellow" />
        <StatCard title="Aprobados" value={String(aprobados)} icon={<FiCheckCircle />} color="green" />
        <StatCard title="En Ejecución" value={String(enEjecucion)} icon={<FiTarget />} color="purple" />
        <StatCard title="Finalizados" value={String(finalizados)} icon={<FiFlag />} color="gray" />
      </div>

      {/* Lista de proyectos recientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Actividad reciente</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimos 5 proyectos registrados en el sistema</p>
          </div>
          <FiUsers className="text-slate-300 text-lg" />
        </div>
        <div className="divide-y divide-slate-50">
          {recientes.length === 0 ? (
            <EmptyState mensaje="No hay proyectos en el sistema." />
          ) : (
            recientes.map((p) => <ProyectoRow key={p.id} proyecto={p} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem("user_role");
    return role ? role.toLowerCase() : "docente";
  });
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sincronizar rol si cambia en localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) setUserRole(role.toLowerCase());
  }, []);

  // Fetch de proyectos
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get("/api/v1/proyectos/")
      .then((res) => {
        if (cancelled) return;
        // El endpoint puede devolver { results: [...] } (paginado) o un array directo
        const data = res.data;
        if (Array.isArray(data)) {
          setProyectos(data);
        } else if (data && Array.isArray(data.results)) {
          setProyectos(data.results);
        } else {
          setProyectos([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Error al cargar proyectos:", err);
          setError("No se pudieron cargar los proyectos. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const HEADER = {
    docente: {
      title: "Panel del Docente",
      subtitle: "Mis proyectos de Responsabilidad Social (RSU)",
    },
    departamento: {
      title: "Gestión de Departamento",
      subtitle: "Seguimiento y aprobación de proyectos del área",
    },
    autoridad: {
      title: "Dashboard Institucional",
      subtitle: "Resumen macro y cumplimiento de metas FIPS",
    },
  };

  const header = HEADER[userRole] || HEADER.autoridad;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8 space-y-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">
                {header.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{header.subtitle}</p>
            </div>

            {/* Indicador de estado de carga */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                <div className="w-3 h-3 border-2 border-[#7B1E3A]/30 border-t-[#7B1E3A] rounded-full animate-spin" />
                Actualizando…
              </div>
            )}
          </div>

          {/* ERROR */}
          {error && !loading && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <FiAlertCircle className="text-lg flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CONTENIDO POR ROL */}
          {userRole === "docente" && (
            <DashboardDocente proyectos={proyectos} loading={loading} />
          )}
          {userRole === "departamento" && (
            <DashboardDepartamento proyectos={proyectos} loading={loading} />
          )}
          {(userRole === "autoridad" ||
            userRole === "administrador" ||
            userRole === "jefatura rsu") && (
            <DashboardAutoridad proyectos={proyectos} loading={loading} />
          )}

        </div>
      </div>
    </div>
  );
}

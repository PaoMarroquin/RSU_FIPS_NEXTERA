import React, { useState, useMemo } from "react";
import Layout from "../../../shared/layout/Layout";
import { FiRefreshCw, FiSave, FiDownload, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import { obtenerInformeFinalizacion, guardarInformeFinalizacion, enviarInformeFinalizacion } from "../hooks/informefinalizado";
import { useProyectosListado } from "../../listar/hooks/useProyectosListado";

// Importaciones al mismo nivel
import { BuscadorProyectos } from "./BuscadorProyectos";
import { SidebarNavegacion } from "./SidebarNavegacion";
import { 
  SeccionDatosGenerales, SeccionFortalezas, SeccionResultados, 
  SeccionTextosSimple, SeccionRecomendaciones, SeccionCronologia, 
  SeccionMetas, SeccionPresupuesto, SeccionEvidencias, SeccionEnvio 
} from "./SeccionesInforme";

const InformeFinalizacion = () => {
  const {
    projectsDb = [],
    loading = false,
    searchTerm = "",
    setSearchTerm = () => {},
  } = useProyectosListado({ estado: "finalizado" }); 

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [mostrarProyectos, setMostrarProyectos] = useState(false);
  const [busquedaProyecto, setBusquedaProyecto] = useState(searchTerm || "");

  const [informe, setInforme] = useState(null);
  const [loadingInforme, setLoadingInforme] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [seccionActiva, setSeccionActiva] = useState(0);

  const [textos, setTextos] = useState({ conclusiones: "", recomendaciones: "", lecciones_aprendidas: "", medio_difusion: "" });
  const [metas, setMetas] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [actividadesSeguimiento, setActividadesSeguimiento] = useState([]);

  const cargarInforme = async (proyectoId) => {
    if (!proyectoId) return;
    setLoadingInforme(true);
    setError("");
    setMensaje("");

    try {
      const response = await obtenerInformeFinalizacion(proyectoId);
      const data = response?.data ?? response;

      setInforme(data || null);
      setTextos({
        conclusiones: data?.conclusiones || "",
        recomendaciones: data?.recomendaciones || "",
        lecciones_aprendidas: data?.lecciones_aprendidas || "",
        medio_difusion: data?.medio_difusion || "",
      });

      setMetas(Array.isArray(data?.metas_indicadores) ? data.metas_indicadores.map((meta) => ({
        id: meta.id, descripcion: meta.meta_descripcion, linea_base: meta.linea_base, valor_meta: meta.valor_meta, valor_alcanzado: meta.valor_alcanzado || ""
      })) : []);

      let allPartidas = [];
      if (Array.isArray(data?.fuentes_financiamiento)) {
        data.fuentes_financiamiento.forEach((fuente) => {
          if (Array.isArray(fuente.partidas)) {
            const mapeadas = fuente.partidas.map((p) => ({ id: p.id, partida: p.descripcion || p.categoria_display || "Partida", monto: p.monto_presupuestado || p.costo_unitario, monto_ejecutado: p.monto_ejecutado || "" }));
            allPartidas = [...allPartidas, ...mapeadas];
          }
        });
      }
      setPartidas(allPartidas);
      setActividadesSeguimiento(Array.isArray(data?.actividades) ? data.actividades : []);
    } catch (err) {
      setInforme(null);
      setError(err?.response?.data?.detail || "No se pudo cargar el informe.");
    } finally {
      setLoadingInforme(false);
    }
  };

  const seleccionarProyecto = async (proyecto) => {
    if (!proyecto?.id) return;
    setProyectoSeleccionado(proyecto);
    setMostrarProyectos(false);
    setError("");
    setMensaje("");
    setInforme(null);
    setSeccionActiva(0);
    await cargarInforme(proyecto.id);
  };

  const estadoInforme = informe?.informe_finalizacion_estado || "borrador";
  const puedeEditar = estadoInforme === "borrador" || estadoInforme === "observado";
  const revisiones = Array.isArray(informe?.revisiones) ? informe.revisiones : [];
  const porcentajeEjecucion = informe?.porcentaje_ejecucion ?? 0;

  const docentesParticipantes = useMemo(() => {
    const list = [];
    if (informe?.docente_responsable_nombre) list.push(`Responsable: ${informe.docente_responsable_nombre}`);
    if (Array.isArray(informe?.docentes_adicionales)) informe.docentes_adicionales.forEach(d => list.push(`${d.docente_nombre} ${d.docente_apellidos} (${d.rol_en_proyecto})`));
    return list;
  }, [informe]);

  const actividadesCompletadas = actividadesSeguimiento.filter((act) => act?.estado === "completada" || act?.estado === "completado").length;

  const cambiarTexto = (campo, valor) => setTextos((prev) => ({ ...prev, [campo]: valor }));
  const cambiarMeta = (index, valor) => setMetas((prev) => prev.map((m, i) => (i === index ? { ...m, valor_alcanzado: valor } : m)));
  const cambiarPartida = (index, valor) => setPartidas((prev) => prev.map((p, i) => (i === index ? { ...p, monto_ejecutado: valor } : p)));

  const guardar = async () => {
    if (!proyectoSeleccionado?.id) return;
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const payload = {
        conclusiones: textos.conclusiones, recomendaciones: textos.recomendaciones, lecciones_aprendidas: textos.lecciones_aprendidas, medio_difusion: textos.medio_difusion,
        metas: metas.map((m) => ({ id: m.id, valor_alcanzado: m.valor_alcanzado })),
        partidas: partidas.map((p) => ({ id: p.id, monto_ejecutado: p.monto_ejecutado })),
      };
      await guardarInformeFinalizacion(proyectoSeleccionado.id, payload);
      setMensaje("Borrador guardado correctamente.");
      await cargarInforme(proyectoSeleccionado.id);
    } catch (err) { setError(err?.response?.data?.detail || "No se pudo guardar."); } finally { setGuardando(false); }
  };

  const enviar = async () => {
    if (!proyectoSeleccionado?.id || !window.confirm("¿Deseas enviar este informe al Departamento?")) return;
    setEnviando(true);
    try {
      await enviarInformeFinalizacion(proyectoSeleccionado.id);
      setMensaje("Informe enviado correctamente.");
      await cargarInforme(proyectoSeleccionado.id);
      setSeccionActiva(10);
    } catch (err) { setError(err?.response?.data?.detail || "No se pudo enviar."); } finally { setEnviando(false); }
  };

  const renderSeccionActiva = () => {
    switch (seccionActiva) {
      case 0: return <SeccionDatosGenerales informe={informe} docentes={docentesParticipantes} />;
      case 1: return <SeccionFortalezas />;
      case 2: return <SeccionResultados porcentaje={porcentajeEjecucion} completadas={actividadesCompletadas} total={actividadesSeguimiento.length} metas={metas.length} />;
      case 3: return <SeccionTextosSimple numero="IV" titulo="Lecciones aprendidas" descripcion="Registra las lecciones." label="Lecciones aprendidas" valor={textos.lecciones_aprendidas} onChange={(v) => cambiarTexto("lecciones_aprendidas", v)} puedeEditar={puedeEditar} />;
      case 4: return <SeccionTextosSimple numero="V" titulo="Conclusiones" descripcion="Conclusiones finales." label="Conclusiones" valor={textos.conclusiones} onChange={(v) => cambiarTexto("conclusiones", v)} puedeEditar={puedeEditar} />;
      case 5: return <SeccionRecomendaciones textos={textos} cambiarTexto={cambiarTexto} puedeEditar={puedeEditar} />;
      case 6: return <SeccionCronologia actividades={actividadesSeguimiento} />;
      case 7: return <SeccionMetas metas={metas} cambiarMeta={cambiarMeta} puedeEditar={puedeEditar} />;
      case 8: return <SeccionPresupuesto partidas={partidas} cambiarPartida={cambiarPartida} puedeEditar={puedeEditar} />;
      case 9: return <SeccionEvidencias />;
      case 10: return <SeccionEnvio estado={estadoInforme} revisiones={revisiones} puedeEditar={puedeEditar} guardar={guardar} enviar={enviar} enviando={enviando} guardando={guardando} />;
      default: return null;
    }
  };

  if (!proyectoSeleccionado) {
    return (
      <Layout>
        <BuscadorProyectos busquedaProyecto={busquedaProyecto} setBusquedaProyecto={setBusquedaProyecto} setSearchTerm={setSearchTerm} mostrarProyectos={mostrarProyectos} setMostrarProyectos={setMostrarProyectos} loading={loading} proyectos={projectsDb} seleccionarProyecto={seleccionarProyecto} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Informe de Finalización</h2>
            <p className="text-sm text-slate-500 mt-1">Proyecto: {proyectoSeleccionado.codigo}</p>
          </div>
          <div className="flex gap-2">
             {puedeEditar && <button onClick={guardar} disabled={guardando} className="px-4 py-2 border rounded-lg bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">{guardando ? <FiRefreshCw className="animate-spin" /> : <FiSave />} Guardar</button>}
             {(estadoInforme === "enviado" || estadoInforme === "aprobado") && <button className="px-4 py-2 border rounded-lg bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><FiDownload /> PDF</button>}
          </div>
        </div>

        {error && <div className="mb-4 bg-red-50 p-3 rounded-lg text-xs text-red-600 border border-red-100 flex items-center gap-2"><FiAlertCircle /> {error}</div>}
        {mensaje && <div className="mb-4 bg-green-50 p-3 rounded-lg text-xs text-green-700 border border-green-100 flex items-center gap-2"><FiCheckCircle /> {mensaje}</div>}

        <div className="flex flex-col md:flex-row gap-5 flex-1">
          <SidebarNavegacion seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva} />
          <main className="flex-1 min-w-0">
             {loadingInforme ? <div className="py-20 text-center text-slate-400"><FiRefreshCw className="animate-spin text-2xl text-[#b1122b] mx-auto mb-3" /> Cargando...</div> : renderSeccionActiva()}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default InformeFinalizacion;
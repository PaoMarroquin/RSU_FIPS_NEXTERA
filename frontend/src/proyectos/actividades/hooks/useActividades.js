import { useState, useEffect } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";
import { useToast } from "../../../shared/context/ToastContext";

const obtenerLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.results)) return respuesta.results;
  return [];
};

const extensionesPermitidas = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
];

const tiposPermitidos = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const obtenerMensajeError = (error) => {
  const detalle = error?.response?.data;

  if (typeof detalle === "string") return detalle;

  if (typeof detalle?.detail === "string") return detalle.detail;
  if (typeof detalle?.error === "string") return detalle.error;

  const campos = [
    "archivo",
    "url",
    "enlace_drive",
    "tipo",
    "observacion",
    "non_field_errors",
  ];

  for (const campo of campos) {
    const valor = detalle?.[campo];

    if (Array.isArray(valor) && valor.length > 0) {
      return String(valor[0]);
    }

    if (typeof valor === "string" && valor) {
      return valor;
    }
  }

  return "No se pudo registrar la evidencia de la actividad.";
};

export const useActividades = () => {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [avances, setAvances] = useState([]);
  const [evidencias, setEvidencias] = useState({});
  const [metasIndicadores, setMetasIndicadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const { showToast } = useToast();

  useEffect(() => {
    const cargarProyectosDocente = async () => {
      try {
        setLoading(true);

        const response = await proyectoApi.obtenerProyectos();
        const listaProyectos = obtenerLista(response);

        setProyectos(
          listaProyectos.filter((proyecto) => {
            const estado = String(proyecto.estado || "")
              .toLowerCase()
              .replaceAll(" ", "_");

            return estado === "aprobado" || estado === "en_ejecucion";
          })
        );
      } catch (error) {
        console.error("Error cargando proyectos:", error);

        showToast(
          "error",
          "No se pudo sincronizar la lista de proyectos desde el servidor."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarProyectosDocente();
  }, [showToast]);

  const seleccionarProyecto = async (proyecto) => {
    try {
      setLoadingDetalle(true);
      setProyectoSeleccionado(proyecto);

      setActividades([]);
      setAvances([]);
      setEvidencias({});
      setMetasIndicadores([]);

      const [dataActividades, dataAvances, dataMetasIndicadores] =
        await Promise.all([
          proyectoApi.obtenerActividades(proyecto.id),
          proyectoApi.obtenerAvances(proyecto.id),
          proyectoApi.obtenerMetasIndicadores(proyecto.id),
        ]);

      const listaActividades = obtenerLista(dataActividades);
      const listaAvances = obtenerLista(dataAvances);
      const listaMetasIndicadores = obtenerLista(dataMetasIndicadores);

      setActividades(listaActividades);
      setAvances(listaAvances);
      setMetasIndicadores(listaMetasIndicadores);

      const evidenciasPorAvance = {};

      await Promise.all(
        listaAvances.map(async (avance) => {
          try {
            const respuesta = await proyectoApi.obtenerEvidenciasAvance(
              proyecto.id,
              avance.id
            );

            evidenciasPorAvance[avance.id] = Array.isArray(respuesta)
              ? respuesta
              : respuesta?.results || respuesta?.evidencias || avance.evidencias || [];
          } catch (error) {
            console.error(
              `Error cargando evidencias del avance ${avance.id}:`,
              error
            );

            evidenciasPorAvance[avance.id] = avance.evidencias || [];
          }
        })
      );

      setEvidencias(evidenciasPorAvance);
    } catch (error) {
      console.error("Error al abrir proyecto:", error);

      showToast(
        "error",
        "Ocurrió un problema al descargar las actividades, avances y metas."
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  const deseleccionarProyecto = () => {
    setProyectoSeleccionado(null);
    setActividades([]);
    setAvances([]);
    setEvidencias({});
    setMetasIndicadores([]);
    setFiltroEstado("todos");
  };

  const registrarEvidenciaActividad = async (
    actividadId,
    {
      archivo = null,
      enlace_drive = "",
      url = "",
      observacion = "",
    } = {}
  ) => {
    const enlace = String(url || enlace_drive || "").trim();
    const observacionFinal = String(observacion || "").trim();

    if (!proyectoSeleccionado) {
      showToast("error", "No hay ningún proyecto seleccionado.");
      return null;
    }

    if (Boolean(archivo) === Boolean(enlace)) {
      showToast(
        "error",
        "Adjunte un archivo o pegue un enlace de Drive (solo uno de los dos)."
      );
      return null;
    }

    const actividad = actividades.find(
      (item) => Number(item.id) === Number(actividadId)
    );

    if (!actividad) {
      showToast("error", "No se encontró la actividad.");
      return null;
    }

    if (actividad.estado === "completada") {
      showToast("info", "La actividad ya está completada.");
      return null;
    }

    if (archivo) {
      const extension = String(archivo.name || "")
        .split(".")
        .pop()
        .toLowerCase();

      if (
        !extensionesPermitidas.includes(extension) ||
        (archivo.type &&
          !tiposPermitidos.includes(archivo.type) &&
          !archivo.type.startsWith("image/"))
      ) {
        showToast(
          "error",
          "Formato no permitido. Adjunta una imagen, PDF, Word, Excel o PowerPoint."
        );
        return null;
      }

      if (archivo.size > 10 * 1024 * 1024) {
        showToast("error", "El archivo no debe superar los 10 MB.");
        return null;
      }
    }

    if (enlace) {
      try {
        const urlValidada = new URL(enlace);

        const esGoogleDrive =
          urlValidada.protocol === "https:" &&
          (urlValidada.hostname === "drive.google.com" ||
            urlValidada.hostname === "docs.google.com");

        if (!esGoogleDrive) {
          showToast(
            "error",
            "Ingresa un enlace HTTPS válido de Google Drive."
          );
          return null;
        }
      } catch {
        showToast("error", "Ingresa un enlace válido de Google Drive.");
        return null;
      }
    }

    try {
      const proyectoId = proyectoSeleccionado.id;
      const formData = new FormData();

      formData.append("tipo", archivo ? "archivo" : "enlace");

      if (archivo) {
        formData.append("archivo", archivo);
      } else {
        formData.append("url", enlace);
      }

      formData.append("observacion", observacionFinal);

      const resultado = await proyectoApi.registrarEvidenciaActividad(
        proyectoId,
        actividadId,
        formData
      );

      if (!resultado?.actividad || !resultado?.avance) {
        throw new Error(
          "El servidor no devolvió la actividad y el avance esperados."
        );
      }

      const actividadActualizada = resultado.actividad;
      const nuevoAvance = resultado.avance;

      const actualizarActividad = (item) =>
        Number(item.id) === Number(actividadId)
          ? { ...item, ...actividadActualizada }
          : item;

      setActividades((prev) => prev.map(actualizarActividad));

      setAvances((prev) => {
        const existe = prev.some(
          (item) => Number(item.id) === Number(nuevoAvance.id)
        );

        return existe
          ? prev.map((item) =>
              Number(item.id) === Number(nuevoAvance.id)
                ? { ...item, ...nuevoAvance }
                : item
            )
          : [...prev, nuevoAvance];
      });

      const evidenciasNuevas =
        nuevoAvance.evidencias ||
        resultado.evidencias ||
        [];

      setEvidencias((prev) => ({
        ...prev,
        [nuevoAvance.id]: evidenciasNuevas,
      }));

      const porcentaje = Number(resultado.porcentaje_ejecucion);

      setProyectoSeleccionado((prev) => ({
        ...prev,
        estado: resultado.estado_proyecto || prev.estado,
        ...(resultado.porcentaje_ejecucion != null &&
        Number.isFinite(porcentaje)
          ? { porcentaje_ejecucion: porcentaje }
          : {}),
        actividades: (prev?.actividades || []).map(actualizarActividad),
      }));

      setProyectos((prev) =>
        prev.map((proyecto) =>
          Number(proyecto.id) === Number(proyectoId)
            ? {
                ...proyecto,
                estado: resultado.estado_proyecto || proyecto.estado,
                ...(resultado.porcentaje_ejecucion != null &&
                Number.isFinite(porcentaje)
                  ? { porcentaje_ejecucion: porcentaje }
                  : {}),
                actividades: (proyecto.actividades || []).map(
                  actualizarActividad
                ),
              }
            : proyecto
        )
      );

      showToast(
        "success",
        "Evidencia registrada y actividad completada correctamente."
      );

      return resultado;
    } catch (error) {
      console.error("Error registrando evidencia de actividad:", error);
      showToast("error", obtenerMensajeError(error));
      throw error;
    }
  };

  const eliminarEvidencia = async (avanceId, evidenciaId) => {
    try {
      await proyectoApi.eliminarEvidenciaAvance(
        proyectoSeleccionado.id,
        avanceId,
        evidenciaId
      );

      setEvidencias((prev) => ({
        ...prev,
        [avanceId]: (prev[avanceId] || []).filter(
          (evidencia) => Number(evidencia.id) !== Number(evidenciaId)
        ),
      }));

      setAvances((prev) =>
        prev.map((avance) =>
          Number(avance.id) === Number(avanceId)
            ? {
                ...avance,
                evidencias: (avance.evidencias || []).filter(
                  (evidencia) =>
                    Number(evidencia.id) !== Number(evidenciaId)
                ),
              }
            : avance
        )
      );

      showToast("success", "Evidencia eliminada correctamente.");
    } catch (error) {
      console.error("Error eliminando evidencia:", error);
      showToast("error", "No se pudo eliminar la evidencia.");
      throw error;
    }
  };

  const obtenerDetalleAvance = async (avanceId) => {
    try {
      return await proyectoApi.obtenerAvancePorId(
        proyectoSeleccionado.id,
        avanceId
      );
    } catch (error) {
      console.error("Error obteniendo avance:", error);
      showToast("error", "No se pudo obtener el detalle del avance.");
      throw error;
    }
  };

  const corregirAvance = async (avanceId) => {
    try {
      await proyectoApi.corregirAvance(
        proyectoSeleccionado.id,
        avanceId
      );

      const avanceActualizado = await proyectoApi.obtenerAvancePorId(
        proyectoSeleccionado.id,
        avanceId
      );

      setAvances((prev) =>
        prev.map((avance) =>
          Number(avance.id) === Number(avanceId)
            ? avanceActualizado
            : avance
        )
      );

      showToast("success", "El avance fue marcado como corregido.");

      return avanceActualizado;
    } catch (error) {
      console.error("Error corrigiendo avance:", error);
      showToast("error", "No se pudo corregir el avance.");
      throw error;
    }
  };

  const observarAvance = async (avanceId, comentario = "") => {
    try {
      await proyectoApi.observarAvance(
        proyectoSeleccionado.id,
        avanceId,
        { comentario_revision: comentario }
      );

      const avanceActualizado = await proyectoApi.obtenerAvancePorId(
        proyectoSeleccionado.id,
        avanceId
      );

      setAvances((prev) =>
        prev.map((avance) =>
          Number(avance.id) === Number(avanceId)
            ? avanceActualizado
            : avance
        )
      );

      showToast("success", "El avance fue observado correctamente.");

      return avanceActualizado;
    } catch (error) {
      console.error("Error observando avance:", error);
      showToast("error", "No se pudo observar el avance.");
      throw error;
    }
  };

  const actividadesFiltradas = actividades.filter(
    (actividad) =>
      filtroEstado === "todos" || actividad.estado === filtroEstado
  );

  const totalActividades = actividades.length;

  const actividadesCompletadas = actividades.filter(
    (actividad) => actividad.estado === "completada"
  ).length;

  const porcentajeCalculado =
    totalActividades > 0
      ? Math.round((actividadesCompletadas / totalActividades) * 100)
      : 0;

  const porcentajeBackend = proyectoSeleccionado?.porcentaje_ejecucion;

  const porcentajeProgreso =
    porcentajeBackend != null && Number.isFinite(Number(porcentajeBackend))
      ? Number(porcentajeBackend)
      : porcentajeCalculado;

  return {
    proyectos,
    proyectoSeleccionado,
    actividades,
    actividadesFiltradas,
    avances,
    evidencias,
    metasIndicadores,
    loading,
    loadingDetalle,
    filtroEstado,
    setFiltroEstado,
    totalActividades,
    actividadesCompletadas,
    porcentajeProgreso,
    seleccionarProyecto,
    deseleccionarProyecto,
    registrarEvidenciaActividad,
    obtenerDetalleAvance,
    eliminarEvidencia,
    observarAvance,
    corregirAvance,
  };
};
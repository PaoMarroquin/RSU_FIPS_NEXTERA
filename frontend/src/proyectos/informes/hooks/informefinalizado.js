import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";

export const obtenerInformeFinalizacion = async (proyectoId) => {
  return await proyectoApi.obtenerInformeFinalizacion(proyectoId);
};

export const guardarInformeFinalizacion = async (proyectoId, datos) => {
  return await proyectoApi.guardarInformeFinalizacion(proyectoId, datos);
};

// ACÁ ESTÁ EL CAMBIO: Recibe los datos y los envía al endpoint para hacer todo en una transacción
export const enviarInformeFinalizacion = async (proyectoId, datos = {}) => {
  return await proyectoApi.enviarInformeFinalizacion(proyectoId, datos);
};

export const obtenerProyectosParaFinalizar = async (params = {}) => {
  return await proyectoApi.obtenerProyectosParaFinalizar(params);
};

export const observarInformeFinalizacion = async (proyectoId, comentario) => {
  return await proyectoApi.observarInformeFinalizacion(proyectoId, comentario);
};

export const finalizarProyecto = async (proyectoId, comentario = "") => {
  return await proyectoApi.finalizarProyecto(proyectoId, comentario);
};

export const descargarInformeFinalizacion = async (proyectoId) => {
  return await proyectoApi.descargarInformeFinalizacionPDF(proyectoId);
};

export const descargarInformeFinalizacionPDF = async (proyectoId) => {
  return await proyectoApi.descargarInformeFinalizacionPDF(proyectoId);
};

export const obtenerSeguimientoProyecto = async (proyectoId) => {
  return await proyectoApi.obtenerSeguimientoProyecto(proyectoId);
};

export const registrarEvidenciaActividad = async (proyectoId, actividadId, datosEvidencia) => {
  return await proyectoApi.registrarEvidenciaActividad(proyectoId, actividadId, datosEvidencia);
};

export const obtenerConstancias = async () => {
  return await proyectoApi.obtenerConstancias();
};

export const descargarConstancia = async (proyectoId) => {
  return await proyectoApi.descargarConstancia(proyectoId);
};

export const aprobarConstancia = async (proyectoId) => {
  return await proyectoApi.aprobarConstancia(proyectoId);
};
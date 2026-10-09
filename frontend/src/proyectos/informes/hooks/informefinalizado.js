import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";

// =====================================================
// INFORME DE FINALIZACIÓN
// SPRINT 8
// =====================================================

export const obtenerInformeFinalizacion = async (
  proyectoId
) => {
  return await proyectoApi.obtenerInformeFinalizacion(
    proyectoId
  );
};

export const guardarInformeFinalizacion = async (
  proyectoId,
  datos
) => {
  return await proyectoApi.guardarInformeFinalizacion(
    proyectoId,
    datos
  );
};

export const enviarInformeFinalizacion = async (
  proyectoId
) => {
  return await proyectoApi.enviarInformeFinalizacion(
    proyectoId
  );
};

// =====================================================
// PROYECTOS POR FINALIZAR
// DEPARTAMENTO
//
// Solo deben aparecer proyectos cuyo
// InformeFinalizacion.estado = "enviado"
// =====================================================

export const obtenerProyectosParaFinalizar = async (
  params = {}
) => {
  return await proyectoApi.obtenerProyectosParaFinalizar(
    params
  );
};

// =====================================================
// OBSERVAR INFORME DE FINALIZACIÓN
// DEPARTAMENTO
//
// El backend valida que el comentario tenga
// mínimo 15 caracteres.
// =====================================================

export const observarInformeFinalizacion = async (
  proyectoId,
  comentario
) => {
  return await proyectoApi.observarInformeFinalizacion(
    proyectoId,
    comentario
  );
};

// =====================================================
// FINALIZAR PROYECTO
// DEPARTAMENTO
//
// El Departamento puede aprobar el informe
// y cambiar el proyecto a "finalizado".
// Jefatura RSU NO utiliza esta función.
// =====================================================

export const finalizarProyecto = async (
  proyectoId,
  comentario = ""
) => {
  return await proyectoApi.finalizarProyecto(
    proyectoId,
    comentario
  );
};

// =====================================================
// PDF DEL INFORME DE FINALIZACIÓN
// =====================================================

export const descargarInformeFinalizacion = async (
  proyectoId
) => {
  return await proyectoApi.descargarInformeFinalizacionPDF(
    proyectoId
  );
};

// Alias para mantener compatibilidad con componentes
// que utilicen explícitamente el nombre PDF.

export const descargarInformeFinalizacionPDF = async (
  proyectoId
) => {
  return await proyectoApi.descargarInformeFinalizacionPDF(
    proyectoId
  );
};

// =====================================================
// SEGUIMIENTO DEL PROYECTO
// HU-16 / SPRINT 8
//
// Obtiene:
// - actividades
// - acciones
// - avances
// - evidencias
// - porcentaje de ejecución
// =====================================================

export const obtenerSeguimientoProyecto = async (
  proyectoId
) => {
  return await proyectoApi.obtenerSeguimientoProyecto(
    proyectoId
  );
};

// =====================================================
// EVIDENCIA DE ACTIVIDAD
// SPRINT 8
//
// datosEvidencia puede contener:
// - archivo
// - enlace_drive
// - observacion
//
// El backend procesa la evidencia y recalcula
// el avance de la actividad/proyecto.
// =====================================================

export const registrarEvidenciaActividad = async (
  proyectoId,
  actividadId,
  datosEvidencia
) => {
  return await proyectoApi.registrarEvidenciaActividad(
    proyectoId,
    actividadId,
    datosEvidencia
  );
};

// =====================================================
// CONSTANCIAS
// HU-10 / SPRINT 8
// =====================================================

// Obtener listado de constancias

export const obtenerConstancias = async () => {
  return await proyectoApi.obtenerConstancias();
};

// Descargar constancia PDF

export const descargarConstancia = async (
  proyectoId
) => {
  return await proyectoApi.descargarConstancia(
    proyectoId
  );
};

// Aprobar constancia
// Departamento

export const aprobarConstancia = async (
  proyectoId
) => {
  return await proyectoApi.aprobarConstancia(
    proyectoId
  );
};
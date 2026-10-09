
import api from "../../../shared/api/axiosConfig";

export const finalizacionApi = {
  // Obtener informe de finalización con datos del proyecto
  obtenerInforme: async (id) => {
    const response = await api.get(
      `/api/v1/proyectos/${id}/informe-finalizacion/`
    );
    return response.data;
  },

  // Guardar los datos completados por el docente
  actualizarInforme: async (id, datos) => {
    const response = await api.patch(
      `/api/v1/proyectos/${id}/informe-finalizacion/`,
      datos
    );
    return response.data;
  },

  // Finalizar proyecto y generar constancia pendiente de aprobación
  finalizarProyecto: async (id) => {
    const response = await api.post(
      `/api/v1/proyectos/${id}/finalizar/`
    );
    return response.data;
  },

  // Aprobar constancia para habilitarla al docente
  aprobarConstancia: async (id) => {
    const response = await api.post(
      `/api/v1/proyectos/${id}/constancia/aprobar/`
    );
    return response.data;
  },

  // Descargar PDF de la constancia
  obtenerConstanciaPdf: async (id) => {
    const response = await api.get(
      `/api/v1/proyectos/${id}/constancia/pdf/`,
      { responseType: "blob" }
    );
    return response.data;
  },

  // Descargar PDF del informe de finalización
  obtenerInformePdf: async (id) => {
    const response = await api.get(
      `/api/v1/proyectos/${id}/informe-finalizacion/pdf/`,
      { responseType: "blob" }
    );
    return response.data;
  },

  // Crear continuación del proyecto en otro periodo
  continuarProyecto: async (id, datos) => {
    const response = await api.post(
      `/api/v1/proyectos/${id}/continuar/`,
      {
        periodo: datos.periodo,
        docentes_adicionales: datos.docentes_adicionales ?? [],
      }
    );
    return response.data;
  },
};

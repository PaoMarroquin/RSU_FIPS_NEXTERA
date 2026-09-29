import { useState, useCallback } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";
import { useToast } from "../../../shared/context/ToastContext";

export const useProyectosParaFinalizar = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { showToast } = useToast();

  // =========================================================
  // OBTENER PROYECTOS PARA FINALIZAR
  // GET /api/v1/proyectos/para-finalizar/
  // =========================================================
  const obtenerProyectosParaFinalizar = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await proyectoApi.obtenerProyectosParaFinalizar(params);

        const proyectosData = response?.results || [];

        setProyectos(proyectosData);

        return response;
      } catch (err) {
        console.error(
          "Error al obtener proyectos para finalizar:",
          err
        );

        if (err.response?.status === 401) {
          setError(
            "No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión."
          );
        } else if (err.response?.status === 403) {
          setError(
            "No tienes permisos para consultar los proyectos por finalizar."
          );
        } else {
          setError(
            err.response?.data?.detail ||
              "No se pudieron obtener los proyectos por finalizar."
          );

          showToast(
            "error",
            "Error al cargar los proyectos por finalizar."
          );
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // =========================================================
  // FINALIZAR PROYECTO
  // POST /api/v1/proyectos/{id}/finalizar/
  // =========================================================
  const finalizarProyecto = useCallback(
    async (id) => {
      try {
        setError(null);

        if (!id) {
          throw new Error("Se requiere el ID del proyecto.");
        }

        const response =
          await proyectoApi.finalizarProyecto(id);

        showToast(
          "success",
          response?.detail || "Proyecto finalizado exitosamente."
        );

        // Actualizar la bandeja después de finalizar
        setProyectos((prev) =>
          prev.filter((proyecto) => proyecto.id !== id)
        );

        return response;
      } catch (err) {
        console.error(
          "Error al finalizar proyecto:",
          err
        );

        const mensajeError =
          err.response?.data?.errors?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          err.message ||
          "No se pudo finalizar el proyecto.";

        setError(mensajeError);

        showToast("error", mensajeError);

        throw err;
      }
    },
    [showToast]
  );

  return {
    proyectos,
    loading,
    error,

    obtenerProyectosParaFinalizar,
    finalizarProyecto,
  };
};
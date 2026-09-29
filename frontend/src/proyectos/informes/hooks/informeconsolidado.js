import { useState, useCallback } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";
import { useToast } from "../../../shared/context/ToastContext";

export const useInformes = () => {
  const [informe, setInforme] = useState(null);
  const [filtros, setFiltros] = useState(null);
  const [proyectos, setProyectos] = useState(null);
  const [proyectoDetalle, setProyectoDetalle] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingFiltros, setLoadingFiltros] = useState(false);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [error, setError] = useState(null);

  const { showToast } = useToast();

  // =========================================================
  // INFORME CONSOLIDADO
  // GET /api/v1/informes/consolidado/
  // =========================================================
  const obtenerInformeConsolidado = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await proyectoApi.obtenerInformeConsolidado(params);

        setInforme(response);

        return response;
      } catch (err) {
        console.error("Error al obtener informe consolidado:", err);

        if (err.response?.status === 401) {
          setError(
            "No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión."
          );
        } else {
          setError(
            err.response?.data?.detail ||
              "No se pudo obtener el informe consolidado."
          );

          showToast("error", "Error al cargar el informe consolidado.");
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // =========================================================
  // FILTROS
  // GET /api/v1/informes/consolidado/filtros/
  // =========================================================
  const obtenerFiltros = useCallback(async () => {
    try {
      setLoadingFiltros(true);
      setError(null);

      const response =
        await proyectoApi.obtenerFiltrosInformeConsolidado();

      setFiltros(response);

      return response;
    } catch (err) {
      console.error("Error al obtener filtros:", err);

      if (err.response?.status === 401) {
        setError(
          "No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "No se pudieron obtener los filtros."
        );

        showToast("error", "Error al cargar los filtros.");
      }

      throw err;
    } finally {
      setLoadingFiltros(false);
    }
  }, [showToast]);

  // =========================================================
  // PROYECTOS CONSOLIDADOS
  // GET /api/v1/informes/consolidado/proyectos/
  // =========================================================
  const obtenerProyectosConsolidados = useCallback(
    async (params = {}) => {
      try {
        setLoadingProyectos(true);
        setError(null);

        const response =
          await proyectoApi.obtenerProyectosConsolidados(params);

        setProyectos(response);

        return response;
      } catch (err) {
        console.error("Error al obtener proyectos consolidados:", err);

        if (err.response?.status === 401) {
          setError(
            "No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión."
          );
        } else {
          setError(
            err.response?.data?.detail ||
              "No se pudieron obtener los proyectos."
          );

          showToast("error", "Error al cargar los proyectos.");
        }

        throw err;
      } finally {
        setLoadingProyectos(false);
      }
    },
    [showToast]
  );

  // =========================================================
  // DETALLE DE PROYECTO
  // GET /api/v1/informes/consolidado/proyectos/{id}/
  // =========================================================
  const obtenerDetalleProyecto = useCallback(
    async (id) => {
      try {
        setLoadingDetalle(true);
        setError(null);

        if (!id) {
          throw new Error("Se requiere el ID del proyecto.");
        }

        const response =
          await proyectoApi.obtenerDetalleProyectoConsolidado(id);

        setProyectoDetalle(response);

        return response;
      } catch (err) {
        console.error("Error al obtener detalle del proyecto:", err);

        if (err.response?.status === 401) {
          setError(
            "No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión."
          );
        } else {
          setError(
            err.response?.data?.detail ||
              err.message ||
              "No se pudo obtener el detalle del proyecto."
          );

          showToast("error", "Error al cargar el detalle del proyecto.");
        }

        throw err;
      } finally {
        setLoadingDetalle(false);
      }
    },
    [showToast]
  );

  // =========================================================
  // DESCARGAR PDF
  // GET /api/v1/informes/consolidado/export/pdf/
  // =========================================================
  const descargarPDF = useCallback(
    async (params = {}) => {
      try {
        setError(null);

        const response =
          await proyectoApi.descargarInformeConsolidadoPDF(params);

        const blob = response.data || response;

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = blobUrl;
        link.download = "informe_consolidado.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Error al descargar PDF:", err);

        setError(
          err.response?.data?.detail ||
            "No se pudo generar el informe PDF."
        );

        showToast("error", "No se pudo generar el informe PDF.");

        throw err;
      }
    },
    [showToast]
  );

  // =========================================================
  // DESCARGAR EXCEL
  // GET /api/v1/informes/consolidado/export/excel/
  // =========================================================
  const descargarExcel = useCallback(
    async (params = {}) => {
      try {
        setError(null);

        const response =
          await proyectoApi.descargarInformeConsolidadoExcel(params);

        const blob = response.data || response;

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = blobUrl;
        link.download = "informe_consolidado.xlsx";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Error al descargar Excel:", err);

        setError(
          err.response?.data?.detail ||
            "No se pudo generar el informe Excel."
        );

        showToast("error", "No se pudo generar el informe Excel.");

        throw err;
      }
    },
    [showToast]
  );

  return {
    informe,
    filtros,
    proyectos,
    proyectoDetalle,

    loading,
    loadingFiltros,
    loadingProyectos,
    loadingDetalle,

    error,

    obtenerInformeConsolidado,
    obtenerFiltros,
    obtenerProyectosConsolidados,
    obtenerDetalleProyecto,

    descargarPDF,
    descargarExcel,
  };
};
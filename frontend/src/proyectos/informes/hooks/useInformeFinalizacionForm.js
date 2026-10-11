import { useState, useCallback, useMemo } from "react";
import {
  obtenerInformeFinalizacion,
  guardarInformeFinalizacion,
  enviarInformeFinalizacion,
} from "./informefinalizado";

export const useInformeFinalizacionForm = () => {
  const [step, setStep] = useState(1);
  const [informeData, setInformeData] = useState(null);

  const [textos, setTextos] = useState({
    conclusiones: "",
    recomendaciones: "",
    lecciones_aprendidas: "",
    medio_difusion: "",
  });

  const [metas, setMetas] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [partidasEditadas, setPartidasEditadas] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // CÁLCULO DINÁMICO DE PASOS COMPLETADOS
  // ============================================================
  const pasosCompletados = useMemo(() => {
    const completados = [1, 2, 3, 7, 10];

    if (textos.lecciones_aprendidas?.trim() !== "") {
      completados.push(4);
    }

    if (textos.conclusiones?.trim() !== "") {
      completados.push(5);
    }

    if (
      textos.recomendaciones?.trim() !== "" &&
      textos.medio_difusion?.trim() !== ""
    ) {
      completados.push(6);
    }

    // Paso 8: todas las metas deben tener un valor válido.
    const metasCompletas =
      metas.length > 0 &&
      metas.every((meta) => {
        const valor = meta.valor_alcanzado;

        return (
          valor !== null &&
          valor !== undefined &&
          String(valor).trim() !== "" &&
          Number.isFinite(Number(valor)) &&
          Number(valor) >= 0
        );
      });

    if (metasCompletas) {
      completados.push(8);
    }

    // Paso 9: presupuesto.
    // No se considera completado al cargar datos del backend.
    const presupuestoCompleto =
      partidasEditadas &&
      partidas.length > 0 &&
      partidas.every((partida) => {
        const monto = partida.monto_ejecutado;

        return (
          monto !== null &&
          monto !== undefined &&
          String(monto).trim() !== "" &&
          Number.isFinite(Number(monto)) &&
          Number(monto) >= 0
        );
      });

    if (presupuestoCompleto) {
      completados.push(9);
    }

    return completados;
  }, [textos, metas, partidas, partidasEditadas]);

  // ============================================================
  // CARGAR INFORME
  // ============================================================
  const cargarInforme = useCallback(async (proyectoId) => {
    if (!proyectoId) return;

    setLoading(true);
    setError(null);
    setStep(1);

    try {
      const response = await obtenerInformeFinalizacion(proyectoId);
      const data = response?.data ?? response;

      setInformeData(data);

      setTextos({
        conclusiones: data?.informe_final?.conclusiones ?? "",
        recomendaciones: data?.informe_final?.recomendaciones ?? "",
        lecciones_aprendidas:
          data?.informe_final?.lecciones_aprendidas ?? "",
        medio_difusion: data?.informe_final?.medio_difusion ?? "",
      });

      setMetas(data?.resultados_alcanzados?.detalle_metas ?? []);
      setPartidas(data?.presupuesto_detalle ?? []);

      // La carga inicial no cuenta como edición del usuario.
      setPartidasEditadas(false);
    } catch (err) {
      console.error("Error al cargar el informe:", err);

      setError(
        err?.response?.data?.detail ||
          "No se pudo cargar la información del informe."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // CAMBIAR CAMPOS
  // ============================================================
  const cambiarTexto = (campo, valor) => {
    setTextos((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const cambiarMeta = (id, valor) => {
    if (
      valor !== "" &&
      (!Number.isFinite(Number(valor)) || Number(valor) < 0)
    ) {
      return;
    }

    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === id
          ? { ...meta, valor_alcanzado: valor }
          : meta
      )
    );
  };

  const cambiarPartida = (id, valor) => {
    if (
      valor !== "" &&
      (!Number.isFinite(Number(valor)) || Number(valor) < 0)
    ) {
      return;
    }

    setPartidas((prev) =>
      prev.map((partida) =>
        partida.id === id
          ? { ...partida, monto_ejecutado: valor }
          : partida
      )
    );

    setPartidasEditadas(true);
  };

  // ============================================================
  // VALIDAR ANTES DE GUARDAR O ENVIAR
  // ============================================================
  const validarDatos = () => {
    const metasInvalidas = metas.some((meta) => {
      const valor = meta.valor_alcanzado;

      return (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === "" ||
        !Number.isFinite(Number(valor)) ||
        Number(valor) < 0
      );
    });

    if (metasInvalidas) {
      setError(
        "Completa todas las metas con valores numéricos iguales o mayores que cero."
      );
      setStep(8);
      return false;
    }

    const partidasInvalidas = partidas.some((partida) => {
      const monto = partida.monto_ejecutado;

      return (
        monto === null ||
        monto === undefined ||
        String(monto).trim() === "" ||
        !Number.isFinite(Number(monto)) ||
        Number(monto) < 0
      );
    });

    if (partidasInvalidas) {
      setError(
        "Completa todas las partidas presupuestales con montos iguales o mayores que cero."
      );
      setStep(9);
      return false;
    }

    return true;
  };

  // ============================================================
  // PAYLOAD PARA EL BACKEND
  // ============================================================
  const prepararPayload = () => ({
    conclusiones: textos.conclusiones,
    recomendaciones: textos.recomendaciones,
    lecciones_aprendidas: textos.lecciones_aprendidas,
    medio_difusion: textos.medio_difusion,

    metas: metas.map((meta) => ({
      id: meta.id,
      valor_alcanzado:
        meta.valor_alcanzado === "" ||
        meta.valor_alcanzado === null ||
        meta.valor_alcanzado === undefined
          ? null
          : Number(meta.valor_alcanzado),
    })),

    partidas: partidas.map((partida) => ({
      id: partida.id,
      monto_ejecutado:
        partida.monto_ejecutado === "" ||
        partida.monto_ejecutado === null ||
        partida.monto_ejecutado === undefined
          ? null
          : Number(partida.monto_ejecutado),
    })),
  });

  // ============================================================
  // GUARDAR BORRADOR
  // ============================================================
  const guardarBorrador = async (proyectoId) => {
    if (!proyectoId) {
      setError("No se ha identificado el proyecto.");
      return false;
    }

    if (!validarDatos()) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = prepararPayload();

      await guardarInformeFinalizacion(proyectoId, payload);

      return true;
    } catch (err) {
      console.error("Error al guardar borrador:", err);
      console.error("Detalle del backend:", err?.response?.data);

      setError(
        err?.response?.data?.detail ||
          "No se pudo guardar el borrador."
      );

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // ENVIAR A REVISIÓN
  // ============================================================
  const enviarRevision = async (proyectoId) => {
    if (!proyectoId) {
      setError("No se ha identificado el proyecto.");
      return false;
    }

    if (!validarDatos()) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = prepararPayload();

      await enviarInformeFinalizacion(proyectoId, payload);

      return true;
    } catch (err) {
      console.error("Error completo al enviar a revisión:", err);
      console.error("Respuesta del backend:", err?.response?.data);
      console.error("Código de estado:", err?.response?.status);

      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "No se pudo enviar el informe a revisión.";

      setError(backendMessage);

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // NAVEGACIÓN
  // ============================================================
  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 10));
    setError(null);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const goToStep = (nuevoStep) => {
    setStep(Math.min(Math.max(nuevoStep, 1), 10));
    setError(null);
  };

  return {
    step,
    nextStep,
    prevStep,
    goToStep,
    pasosCompletados,

    informeData,
    textos,
    metas,
    partidas,

    cambiarTexto,
    cambiarMeta,
    cambiarPartida,

    loading,
    isSubmitting,
    error,
    setError,

    cargarInforme,
    guardarBorrador,
    enviarRevision,
  };
};

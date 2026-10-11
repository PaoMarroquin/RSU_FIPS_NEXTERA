import { useState, useCallback, useMemo } from "react";
import { obtenerInformeFinalizacion, guardarInformeFinalizacion, enviarInformeFinalizacion } from "./informefinalizado";

export const useInformeFinalizacionForm = () => {
  const [step, setStep] = useState(1);
  const [informeData, setInformeData] = useState(null);
  
  const [textos, setTextos] = useState({ conclusiones: "", recomendaciones: "", lecciones_aprendidas: "", medio_difusion: "" });
  const [metas, setMetas] = useState([]);
  const [partidas, setPartidas] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // =========================================================================
  // CÁLCULO DINÁMICO DE PASOS COMPLETADOS (VERDES)
  // =========================================================================
  const pasosCompletados = useMemo(() => {
    const completados = [1, 2, 3, 7, 10]; // Pasos de solo lectura

    if (textos.lecciones_aprendidas?.trim() !== "") completados.push(4);
    if (textos.conclusiones?.trim() !== "") completados.push(5);
    if (textos.recomendaciones?.trim() !== "" && textos.medio_difusion?.trim() !== "") completados.push(6);

    if (metas.length === 0 || metas.every(m => m.valor_alcanzado !== null && m.valor_alcanzado !== "")) {
      completados.push(8);
    }
    if (partidas.length === 0 || partidas.every(p => p.monto_ejecutado !== null && p.monto_ejecutado !== "")) {
      completados.push(9);
    }

    return completados;
  }, [textos, metas, partidas]);

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
        conclusiones: data?.informe_final?.conclusiones || "",
        recomendaciones: data?.informe_final?.recomendaciones || "",
        lecciones_aprendidas: data?.informe_final?.lecciones_aprendidas || "",
        medio_difusion: data?.informe_final?.medio_difusion || "",
      });

      setMetas(data?.resultados_alcanzados?.detalle_metas || []);
      setPartidas(data?.presupuesto_detalle || []);

    } catch (err) {
      console.error("Error al cargar el informe:", err);
      setError(err?.response?.data?.detail || "No se pudo cargar la información del informe.");
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarTexto = (campo, valor) => setTextos(prev => ({ ...prev, [campo]: valor }));
  const cambiarMeta = (id, valor) => setMetas(prev => prev.map(m => m.id === id ? { ...m, valor_alcanzado: valor } : m));
  const cambiarPartida = (id, valor) => setPartidas(prev => prev.map(p => p.id === id ? { ...p, monto_ejecutado: valor } : p));

  // EL PAYLOAD QUE PIDE EL BACKEND
  const prepararPayload = () => ({
    conclusiones: textos.conclusiones,
    recomendaciones: textos.recomendaciones,
    lecciones_aprendidas: textos.lecciones_aprendidas,
    medio_difusion: textos.medio_difusion,
    metas: metas.map(m => ({ id: m.id, valor_alcanzado: m.valor_alcanzado ? Number(m.valor_alcanzado) : 0 })),
    partidas: partidas.map(p => ({ id: p.id, monto_ejecutado: p.monto_ejecutado ? Number(p.monto_ejecutado) : 0 }))
  });

  // PATCH (Borrador)
  const guardarBorrador = async (proyectoId) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = prepararPayload();
      await guardarInformeFinalizacion(proyectoId, payload);
      return true;
    } catch (err) {
      console.error("Error al guardar borrador:", err);
      console.error("Detalle del backend:", err?.response?.data);
      setError(err?.response?.data?.detail || "No se pudo guardar el borrador.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // POST (Enviar y Guardar en una sola transacción)
  const enviarRevision = async (proyectoId) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = prepararPayload(); // MISMO PAYLOAD
      await enviarInformeFinalizacion(proyectoId, payload); // ENVIAMOS JUNTO CON LA ACCION
      return true;
    } catch (err) {
      // AQUÍ IMPRIMIMOS EL ERROR PARA DEPURAR
      console.error("Error completo al enviar a revisión:", err);
      console.error("Respuesta del backend (data):", err?.response?.data);
      console.error("Código de estado:", err?.response?.status);

      // Si el backend manda un array de errores (común en validaciones de Django/DRF), lo mostramos mejor
      const backendMessage = err?.response?.data?.detail || err?.response?.data?.error || "No se pudo enviar el informe a revisión.";
      
      setError(backendMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 10));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const goToStep = (s) => setStep(s);

  return {
    step, nextStep, prevStep, goToStep, pasosCompletados,
    informeData, textos, metas, partidas,
    cambiarTexto, cambiarMeta, cambiarPartida,
    loading, isSubmitting, error, setError,
    cargarInforme, guardarBorrador, enviarRevision
  };
};
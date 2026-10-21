import { useState, useCallback, useMemo } from "react";
import {
  obtenerInformeFinalizacion,
  guardarInformeFinalizacion,
  enviarInformeFinalizacion,
} from "./informefinalizado";

// Campos de texto que llena el docente (contrato del informe, formato OURS).
export const CAMPOS_TEXTO = [
  "fortalezas",
  "oportunidades",
  "aliados",
  "debilidades",
  "amenazas",
  "estrategias",
  "resultado_grupo_destinatario",
  "resultado_desarrollo_curricular",
  "lecciones_analisis",
  "lecciones_reflexiones",
  "conclusiones",
  "recomendaciones",
  "medio_difusion",
];

export const MAX_MEDIO_DIFUSION = 200;

const ETIQUETAS = {
  fortalezas: "Fortalezas",
  oportunidades: "Oportunidades",
  aliados: "Principales aliados",
  debilidades: "Debilidades",
  amenazas: "Amenazas",
  estrategias: "Estrategias empleadas",
  resultado_grupo_destinatario: "Resultados en el grupo destinatario",
  resultado_desarrollo_curricular: "Resultados en el desarrollo curricular",
  lecciones_analisis: "Lecciones: análisis",
  lecciones_reflexiones: "Lecciones: reflexiones",
  conclusiones: "Conclusiones",
  recomendaciones: "Recomendaciones",
  medio_difusion: "Medio de difusión",
  metas_valor_alcanzado: "Valor alcanzado de las metas",
};

// Paso del formulario donde se llena cada campo.
const PASO_DE_CAMPO = {
  fortalezas: 2,
  oportunidades: 2,
  aliados: 2,
  debilidades: 2,
  amenazas: 2,
  estrategias: 2,
  resultado_grupo_destinatario: 3,
  resultado_desarrollo_curricular: 3,
  lecciones_analisis: 4,
  lecciones_reflexiones: 4,
  conclusiones: 5,
  recomendaciones: 6,
  medio_difusion: 6,
  metas_valor_alcanzado: 8,
};

const textosVacios = () =>
  Object.fromEntries(CAMPOS_TEXTO.map((campo) => [campo, ""]));

const textoLleno = (valor) => String(valor ?? "").trim() !== "";

const numeroValido = (valor) =>
  valor !== null &&
  valor !== undefined &&
  String(valor).trim() !== "" &&
  Number.isFinite(Number(valor)) &&
  Number(valor) >= 0;

const vacio = (valor) =>
  valor === null || valor === undefined || String(valor).trim() === "";

const nombresDeCampos = (campos) =>
  campos.map((campo) => ETIQUETAS[campo] || campo).join(", ");

export const useInformeFinalizacionForm = () => {
  const [step, setStep] = useState(1);
  const [informeData, setInformeData] = useState(null);

  const [textos, setTextos] = useState(textosVacios);
  const [metas, setMetas] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [partidasEditadas, setPartidasEditadas] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // El backend decide si el formulario se puede editar.
  const finalizacion = informeData?.finalizacion;
  const puedeEditar = Boolean(finalizacion?.editable);

  // ============================================================
  // CARGAR DATOS DEL BACKEND AL FORMULARIO
  // ============================================================
  const aplicarInforme = useCallback((data) => {
    setInformeData(data);

    const informe = data?.informe_final ?? {};
    setTextos(
      Object.fromEntries(
        CAMPOS_TEXTO.map((campo) => [campo, informe[campo] ?? ""])
      )
    );

    setMetas(data?.resultados_alcanzados?.detalle_metas ?? []);
    setPartidas(data?.presupuesto_detalle ?? []);

    // La carga inicial no cuenta como edición del usuario.
    setPartidasEditadas(false);
  }, []);

  // ============================================================
  // CÁLCULO DINÁMICO DE PASOS COMPLETADOS
  // ============================================================
  const pasosCompletados = useMemo(() => {
    // I, VII y X son de solo lectura.
    const completados = [1, 7, 10];
    const llenos = (campos) => campos.every((c) => textoLleno(textos[c]));

    if (
      llenos([
        "fortalezas",
        "oportunidades",
        "aliados",
        "debilidades",
        "amenazas",
        "estrategias",
      ])
    ) {
      completados.push(2);
    }

    if (llenos(["resultado_grupo_destinatario", "resultado_desarrollo_curricular"])) {
      completados.push(3);
    }

    if (llenos(["lecciones_analisis", "lecciones_reflexiones"])) {
      completados.push(4);
    }

    if (llenos(["conclusiones"])) completados.push(5);
    if (llenos(["recomendaciones", "medio_difusion"])) completados.push(6);

    if (metas.length > 0 && metas.every((m) => numeroValido(m.valor_alcanzado))) {
      completados.push(8);
    }

    // Las partidas son opcionales: el paso cuenta como completo cuando el
    // usuario las llenó, o cuando el proyecto no tiene partidas.
    if (
      partidas.length === 0 ||
      (partidasEditadas && partidas.every((p) => numeroValido(p.monto_ejecutado)))
    ) {
      completados.push(9);
    }

    return completados;
  }, [textos, metas, partidas, partidasEditadas]);

  // ============================================================
  // CARGAR INFORME
  // ============================================================
  const cargarInforme = useCallback(
    async (proyectoId) => {
      if (!proyectoId) return;

      setLoading(true);
      setError(null);
      setStep(1);
      setInformeData(null);

      try {
        const response = await obtenerInformeFinalizacion(proyectoId);
        aplicarInforme(response?.data ?? response);
      } catch (err) {
        console.error("Error al cargar el informe:", err);

        setError(
          err?.response?.data?.detail ||
            "No se pudo cargar la información del informe."
        );
      } finally {
        setLoading(false);
      }
    },
    [aplicarInforme]
  );

  // ============================================================
  // CAMBIAR CAMPOS
  // ============================================================
  const cambiarTexto = (campo, valor) => {
    if (campo === "medio_difusion" && valor.length > MAX_MEDIO_DIFUSION) {
      valor = valor.slice(0, MAX_MEDIO_DIFUSION);
    }

    setTextos((prev) => ({ ...prev, [campo]: valor }));
  };

  const cambiarMeta = (id, valor) => {
    if (valor !== "" && !numeroValido(valor)) return;

    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === id ? { ...meta, valor_alcanzado: valor } : meta
      )
    );
  };

  const cambiarPartida = (id, valor) => {
    if (valor !== "" && !numeroValido(valor)) return;

    setPartidas((prev) =>
      prev.map((partida) =>
        partida.id === id ? { ...partida, monto_ejecutado: valor } : partida
      )
    );

    setPartidasEditadas(true);
  };

  // ============================================================
  // VALIDACIONES
  // ============================================================

  // Guardar borrador: se permite guardar por partes, solo se rechazan
  // valores que el backend no aceptaría.
  const validarParaGuardar = () => {
    if (metas.some((m) => !vacio(m.valor_alcanzado) && !numeroValido(m.valor_alcanzado))) {
      setError("Los valores alcanzados de las metas deben ser números iguales o mayores que cero.");
      setStep(8);
      return false;
    }

    if (partidas.some((p) => !vacio(p.monto_ejecutado) && !numeroValido(p.monto_ejecutado))) {
      setError("Los montos ejecutados deben ser números iguales o mayores que cero.");
      setStep(9);
      return false;
    }

    return true;
  };

  // Enviar: todos los textos y todas las metas son obligatorios.
  const validarParaEnviar = () => {
    if (!validarParaGuardar()) return false;

    const faltantes = CAMPOS_TEXTO.filter((campo) => !textoLleno(textos[campo]));

    if (faltantes.length > 0) {
      setError(
        `Completa los campos obligatorios: ${nombresDeCampos(faltantes)}.`
      );
      setStep(PASO_DE_CAMPO[faltantes[0]]);
      return false;
    }

    if (metas.some((m) => !numeroValido(m.valor_alcanzado))) {
      setError("Completa el valor alcanzado de todas las metas.");
      setStep(8);
      return false;
    }

    return true;
  };

  // ============================================================
  // PAYLOAD PARA EL BACKEND
  // ============================================================
  const prepararPayload = () => ({
    ...Object.fromEntries(
      CAMPOS_TEXTO.map((campo) => [campo, textos[campo] ?? ""])
    ),

    // Solo se envían las metas y partidas que tienen valor: un guardado
    // parcial no debe borrar ni invalidar las demás.
    metas: metas
      .filter((meta) => !vacio(meta.valor_alcanzado))
      .map((meta) => ({
        id: meta.id,
        valor_alcanzado: Number(meta.valor_alcanzado),
      })),

    partidas: partidas
      .filter((partida) => !vacio(partida.monto_ejecutado))
      .map((partida) => ({
        id: partida.id,
        monto_ejecutado: Number(partida.monto_ejecutado),
      })),
  });

  // Convierte el error del backend en un mensaje legible.
  const mensajeDeError = (err, porDefecto) => {
    const data = err?.response?.data;
    const pendientes = data?.errors?.campos_pendientes;

    if (Array.isArray(pendientes) && pendientes.length > 0) {
      const paso = PASO_DE_CAMPO[pendientes[0]];
      if (paso) setStep(paso);

      return `Faltan datos para enviar el informe: ${nombresDeCampos(pendientes)}.`;
    }

    return data?.detail || data?.error || porDefecto;
  };

  // ============================================================
  // GUARDAR BORRADOR
  // ============================================================
  const guardarBorrador = async (proyectoId) => {
    if (!proyectoId) {
      setError("No se ha identificado el proyecto.");
      return false;
    }

    if (!validarParaGuardar()) return false;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await guardarInformeFinalizacion(
        proyectoId,
        prepararPayload()
      );

      // El PATCH devuelve el informe completo: se refresca el formulario.
      const data = response?.data ?? response;
      if (data?.finalizacion) aplicarInforme(data);

      return true;
    } catch (err) {
      console.error("Error al guardar borrador:", err);
      setError(mensajeDeError(err, "No se pudo guardar el borrador."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // ENVIAR A REVISIÓN (guarda y envía en un paso)
  // ============================================================
  const enviarRevision = async (proyectoId) => {
    if (!proyectoId) {
      setError("No se ha identificado el proyecto.");
      return false;
    }

    if (!validarParaEnviar()) return false;

    setIsSubmitting(true);
    setError(null);

    try {
      await enviarInformeFinalizacion(proyectoId, prepararPayload());
      return true;
    } catch (err) {
      console.error("Error al enviar a revisión:", err);
      setError(mensajeDeError(err, "No se pudo enviar el informe a revisión."));
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
    puedeEditar,
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

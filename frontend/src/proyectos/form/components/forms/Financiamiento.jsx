
import React, { useState, useEffect } from "react";

export default function Financiamiento({
  data,
  updateData,
  documentosSustento: documentosGuardadosServidor = [],
  cargandoDocumentos = false,
  subiendoDocumento = false,
  subirDocumentoSustento,
  cargarDocumentosSustento,
  eliminarDocumentoSustento,
}) {
  const fuentesGuardadas = data.fuentes_financiamiento || [];

  const crearPartidaVacia = () => ({
    id: null,
    categoria: "",
    tipo_recurso: "material",
    descripcion: "",
    unidad: "Unidad",
    cantidad: 1,
    costo_unitario: "",
  });

  const crearFuenteVacia = () => ({
    id: null,
    fuente_financiamiento: "",
    monto_financiamiento: "",
    descripcion_fuente: "",
    partidas: [crearPartidaVacia()],
  });

  const [listaFuentes, setListaFuentes] = useState(() =>
    fuentesGuardadas.length > 0
      ? fuentesGuardadas
      : [crearFuenteVacia()]
  );

  const [archivosNuevos, setArchivosNuevos] = useState([]);
  const [errorDocumento, setErrorDocumento] = useState("");
  const [subiendoLocales, setSubiendoLocales] = useState(false);

  useEffect(() => {
    updateData("fuentes_financiamiento", listaFuentes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaFuentes]);

  const agregarFuente = () => {
    setListaFuentes((prev) => [...prev, crearFuenteVacia()]);
  };

  const eliminarFuente = (fIndex) => {
    setListaFuentes((prev) =>
      prev.length === 1
        ? [crearFuenteVacia()]
        : prev.filter((_, i) => i !== fIndex)
    );
  };

  const handleFuenteChange = (fIndex, field, value) => {
    if (field === "monto_financiamiento") {
      const regex = /^\d{0,10}(?:\.\d{0,2})?$/;
      if (value !== "" && !regex.test(value)) return;
    }

    setListaFuentes((prev) =>
      prev.map((fuente, i) =>
        i === fIndex ? { ...fuente, [field]: value } : fuente
      )
    );
  };

  const agregarPartida = (fIndex) => {
    setListaFuentes((prev) =>
      prev.map((fuente, i) =>
        i === fIndex
          ? {
              ...fuente,
              partidas: [
                ...(fuente.partidas || []),
                crearPartidaVacia(),
              ],
            }
          : fuente
      )
    );
  };

  const eliminarPartida = (fIndex, pIndex) => {
    setListaFuentes((prev) =>
      prev.map((fuente, i) => {
        if (i !== fIndex) return fuente;

        const partidas = fuente.partidas || [];
        const nuevasPartidas =
          partidas.length === 1
            ? [crearPartidaVacia()]
            : partidas.filter((_, j) => j !== pIndex);

        return { ...fuente, partidas: nuevasPartidas };
      })
    );
  };

  const handlePartidaChange = (fIndex, pIndex, field, value) => {
    if (field === "costo_unitario") {
      const regex = /^\d{0,10}(?:\.\d{0,2})?$/;
      if (value !== "" && !regex.test(value)) return;
    }

    if (field === "cantidad" && value !== "" && !/^\d*$/.test(value)) {
      return;
    }

    setListaFuentes((prev) =>
      prev.map((fuente, i) => {
        if (i !== fIndex) return fuente;

        return {
          ...fuente,
          partidas: (fuente.partidas || []).map((partida, j) =>
            j === pIndex
              ? {
                  ...partida,
                  [field]:
                    field === "cantidad" && value !== ""
                      ? parseInt(value, 10)
                      : value,
                }
              : partida
          ),
        };
      })
    );
  };

  // DOCUMENTOS DE SUSTENTO
  const formatosPermitidos = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const extensionesPermitidas = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
  ];

  const seleccionarDocumentos = (event) => {
    const archivos = Array.from(event.target.files || []);
    const validos = [];
    const errores = [];

    archivos.forEach((archivo) => {
      const extension = archivo.name
        .slice(archivo.name.lastIndexOf("."))
        .toLowerCase();

      const formatoValido =
        formatosPermitidos.includes(archivo.type) ||
        extensionesPermitidas.includes(extension);

      if (!formatoValido) {
        errores.push(`${archivo.name}: formato no permitido.`);
        return;
      }

      if (archivo.size > 10 * 1024 * 1024) {
        errores.push(`${archivo.name}: supera el límite de 10 MB.`);
        return;
      }

      const duplicado = archivosNuevos.some(
        (existente) =>
          existente.name === archivo.name &&
          existente.size === archivo.size &&
          existente.lastModified === archivo.lastModified
      );

      if (!duplicado) validos.push(archivo);
    });

    if (validos.length > 0) {
      setArchivosNuevos((prev) => [...prev, ...validos]);
    }

    setErrorDocumento(errores.join(" "));
    event.target.value = "";
  };

  const quitarArchivoNuevo = (index) => {
    setArchivosNuevos((prev) =>
      prev.filter((_, i) => i !== index)
    );
    setErrorDocumento("");
  };

  const subirArchivosPendientes = async () => {
    if (!archivosNuevos.length) return true;

    if (typeof subirDocumentoSustento !== "function") {
      setErrorDocumento(
        "No se configuró la función para subir documentos. Revisa la integración con useFormRSU."
      );
      return false;
    }

    setSubiendoLocales(true);
    setErrorDocumento("");

    try {
      for (const archivo of archivosNuevos) {
        const resultado = await subirDocumentoSustento(
          archivo,
          archivo.name
        );

        if (resultado === false) {
          setErrorDocumento(
            `No se pudo subir "${archivo.name}". Puedes volver a intentarlo.`
          );
          return false;
        }
      }

      setArchivosNuevos([]);

      if (typeof cargarDocumentosSustento === "function") {
        await cargarDocumentosSustento(data.id);
      }

      return true;
    } catch (error) {
      console.error("Error subiendo documentos:", error);
      setErrorDocumento(
        error?.message || "No se pudieron subir los documentos."
      );
      return false;
    } finally {
      setSubiendoLocales(false);
    }
  };

  const inputClass =
    "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#b1122b] focus:ring-2 focus:ring-[#b1122b]/10";

  const selectClass =
    "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#b1122b] focus:ring-2 focus:ring-[#b1122b]/10";

  const partidaInputClass =
    "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#b1122b] focus:ring-2 focus:ring-[#b1122b]/10";

  const documentosExistentes = Array.isArray(documentosGuardadosServidor)
    ? documentosGuardadosServidor
    : [];

  return (
    <div className="space-y-6">
      {/* ENCABEZADO DE SECCIÓN */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <span className="shrink-0 text-2xl font-bold text-[#b1122b]">
          IX.
        </span>

        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            Financiamiento y presupuesto
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sección 9 de 9 · Define las fuentes de financiamiento y registra
            las partidas de gasto asociadas a cada una.
          </p>
        </div>
      </div>

      {/* ENCABEZADO DE FUENTES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Fuentes de financiamiento
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Registra una o más fuentes para el presupuesto del proyecto.
          </p>
        </div>

        <button
          type="button"
          onClick={agregarFuente}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#b1122b] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8f0e22]"
        >
          + Añadir fuente
        </button>
      </div>

      {/* LISTADO DE FUENTES */}
      {listaFuentes.map((fuente, fIndex) => {
        const partidas = fuente.partidas || [];

        const totalPartidasFuente = partidas.reduce(
          (sum, partida) =>
            sum +
            Number(partida.cantidad || 0) *
              Number(partida.costo_unitario || 0),
          0
        );

        const montoAsignado = Number(fuente.monto_financiamiento || 0);

        const existeDiferencia =
          fuente.monto_financiamiento !== "" &&
          montoAsignado !== totalPartidasFuente;

        return (
          <section
            key={fIndex}
            className="w-full overflow-hidden rounded-xl border border-slate-200 border-l-4 border-l-[#b1122b] bg-white shadow-sm"
          >
            {/* DATOS DE LA FUENTE */}
            <div className="space-y-4 border-b border-slate-200 bg-slate-50/70 p-4 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="w-fit rounded-full border border-[#b1122b]/10 bg-[#b1122b]/5 px-3 py-1 text-xs font-bold text-[#b1122b]">
                  Fuente de financiamiento #{fIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={() => eliminarFuente(fIndex)}
                  className="w-fit text-xs font-semibold text-red-600 transition-colors hover:text-red-800"
                >
                  Eliminar fuente
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor={`fuente-tipo-${fIndex}`}
                    className="text-xs font-semibold text-slate-600"
                  >
                    Tipo de fuente
                  </label>

                  <select
                    id={`fuente-tipo-${fIndex}`}
                    className={selectClass}
                    value={fuente.fuente_financiamiento}
                    onChange={(e) =>
                      handleFuenteChange(
                        fIndex,
                        "fuente_financiamiento",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="recursos_propios_unsa">
                      Recursos Propios UNSA
                    </option>
                    <option value="cooperacion_externa">
                      Cooperación Externa
                    </option>
                    <option value="aporte_facultad">
                      Aporte de la Facultad
                    </option>
                    <option value="autofinanciado">Autofinanciado</option>
                  </select>
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor={`fuente-monto-${fIndex}`}
                    className="text-xs font-semibold text-slate-600"
                  >
                    Monto asignado teórico (S/)
                  </label>

                  <input
                    id={`fuente-monto-${fIndex}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={inputClass}
                    value={fuente.monto_financiamiento ?? ""}
                    onChange={(e) =>
                      handleFuenteChange(
                        fIndex,
                        "monto_financiamiento",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2 xl:col-span-1">
                  <label
                    htmlFor={`fuente-descripcion-${fIndex}`}
                    className="text-xs font-semibold text-slate-600"
                  >
                    Descripción / observaciones
                  </label>

                  <input
                    id={`fuente-descripcion-${fIndex}`}
                    type="text"
                    placeholder="Detalles sobre este desembolso..."
                    className={inputClass}
                    value={fuente.descripcion_fuente || ""}
                    onChange={(e) =>
                      handleFuenteChange(
                        fIndex,
                        "descripcion_fuente",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* PARTIDAS PRESUPUESTARIAS */}
            <div className="space-y-4 p-4 md:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Partidas presupuestarias
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Registra los gastos vinculados a esta fuente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => agregarPartida(fIndex)}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#b1122b]/20 bg-white px-3 text-xs font-semibold text-[#b1122b] transition-colors hover:bg-[#b1122b]/5"
                >
                  + Añadir partida
                </button>
              </div>

              <div className="space-y-4">
                {partidas.map((partida, pIndex) => (
                  <div
                    key={pIndex}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">
                        Partida #{pIndex + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => eliminarPartida(fIndex, pIndex)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                        title="Eliminar partida"
                        aria-label={`Eliminar partida ${pIndex + 1}`}
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
                      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-3">
                        <label
                          htmlFor={`categoria-${fIndex}-${pIndex}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Categoría
                        </label>

                        <select
                          id={`categoria-${fIndex}-${pIndex}`}
                          className={selectClass}
                          value={partida.categoria || ""}
                          onChange={(e) =>
                            handlePartidaChange(
                              fIndex,
                              pIndex,
                              "categoria",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Seleccione categoría</option>
                          <option value="material_escritorio">
                            Material de escritorio
                          </option>
                          <option value="refrigerio">Refrigerio</option>
                          <option value="transporte">Transporte</option>
                          <option value="otros">Otros</option>
                        </select>
                      </div>

                      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-1 xl:col-span-2">
                        <label
                          htmlFor={`tipo-recurso-${fIndex}-${pIndex}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Tipo de recurso
                        </label>

                        <select
                          id={`tipo-recurso-${fIndex}-${pIndex}`}
                          className={selectClass}
                          value={partida.tipo_recurso || "material"}
                          onChange={(e) =>
                            handlePartidaChange(
                              fIndex,
                              pIndex,
                              "tipo_recurso",
                              e.target.value
                            )
                          }
                        >
                          <option value="material">Material</option>
                          <option value="humano">Humano</option>
                          <option value="financiero">Financiero</option>
                        </select>
                      </div>

                      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-3">
                        <label
                          htmlFor={`descripcion-${fIndex}-${pIndex}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Descripción del gasto
                        </label>

                        <input
                          id={`descripcion-${fIndex}-${pIndex}`}
                          type="text"
                          placeholder="Nombre del gasto..."
                          className={partidaInputClass}
                          value={partida.descripcion || ""}
                          onChange={(e) =>
                            handlePartidaChange(
                              fIndex,
                              pIndex,
                              "descripcion",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-1 xl:col-span-1">
                        <label
                          htmlFor={`cantidad-${fIndex}-${pIndex}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Cantidad
                        </label>

                        <input
                          id={`cantidad-${fIndex}-${pIndex}`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          className={partidaInputClass}
                          value={partida.cantidad ?? ""}
                          onKeyDown={(e) => {
                            if (
                              ["-", "+", ".", ",", "e", "E"].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                              handlePartidaChange(
                                fIndex,
                                pIndex,
                                "cantidad",
                                e.target.value
                              );
                            }
                          }}
                        />
                      </div>

                      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-1 xl:col-span-1">
                        <label
                          htmlFor={`costo-${fIndex}-${pIndex}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Costo unitario (S/)
                        </label>

                        <input
                          id={`costo-${fIndex}-${pIndex}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          className={`${partidaInputClass} text-right font-mono`}
                          value={partida.costo_unitario ?? ""}
                          onChange={(e) =>
                            handlePartidaChange(
                              fIndex,
                              pIndex,
                              "costo_unitario",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-slate-500">
                        Subtotal de la partida
                      </span>

                      <span className="font-mono font-bold text-slate-800">
                        S/{" "}
                        {(
                          Number(partida.cantidad || 0) *
                          Number(partida.costo_unitario || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALES DE LA FUENTE */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex flex-col gap-2 rounded-lg bg-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    Total de partidas de esta fuente
                  </span>

                  <span className="font-mono text-base font-bold text-slate-800">
                    S/ {totalPartidasFuente.toFixed(2)}
                  </span>
                </div>

                {existeDiferencia && (
                  <div
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                    role="status"
                  >
                    <p className="font-semibold">
                      Diferencia entre el monto asignado y las partidas
                    </p>
                    <p className="mt-1">
                      Monto asignado: S/ {montoAsignado.toFixed(2)}. Total de
                      partidas: S/ {totalPartidasFuente.toFixed(2)}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* DOCUMENTOS ADJUNTOS DE SUSTENTO */}
      <section className="overflow-hidden rounded-xl border-2 border-[#b1122b]/20 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-[#b1122b]/10 bg-[#b1122b]/5 p-4 md:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b1122b] text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 md:text-lg">
                Documentos adjuntos de sustento
              </h3>
              <span className="rounded-full border border-[#b1122b]/20 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#b1122b]">
                Paso IX
              </span>
            </div>

            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Adjunta los documentos que respalden la información del
              proyecto, su financiamiento o presupuesto.
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <label
            htmlFor="documentos-sustento"
            className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center transition-colors hover:border-[#b1122b] hover:bg-[#b1122b]/5"
          >
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#b1122b] shadow-sm transition-transform group-hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </span>

            <span className="text-sm font-bold text-slate-800">
              Selecciona los documentos de sustento
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Haz clic aquí para buscar archivos en tu equipo.
            </span>
            <span className="mt-3 rounded-lg bg-[#b1122b] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-[#8f0e22]">
              + Añadir documentos
            </span>
            <span className="mt-3 text-[11px] text-slate-500">
              PDF, DOC, DOCX, XLS o XLSX · Máximo 10 MB por archivo
            </span>

            <input
              id="documentos-sustento"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              className="sr-only"
              onChange={seleccionarDocumentos}
              disabled={subiendoDocumento || subiendoLocales}
            />
          </label>

          {errorDocumento && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorDocumento}
            </div>
          )}

          {/* ARCHIVOS NUEVOS AÚN NO SUBIDOS */}
          {archivosNuevos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-800">
                Pendientes de subir ({archivosNuevos.length})
              </h4>

              {archivosNuevos.map((archivo, index) => (
                <div
                  key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-700">
                      {archivo.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(archivo.size / (1024 * 1024)).toFixed(2)} MB · Pendiente
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => quitarArchivoNuevo(index)}
                    disabled={subiendoDocumento || subiendoLocales}
                    className="shrink-0 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={subirArchivosPendientes}
                disabled={subiendoDocumento || subiendoLocales || !data.id}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#b1122b] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8f0e22] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subiendoDocumento || subiendoLocales
                  ? "Subiendo documentos..."
                  : !data.id
                    ? "Guarda primero el proyecto para subir documentos"
                    : "Subir documentos de sustento"}
              </button>

              {!data.id && (
                <p className="text-xs text-amber-700">
                  Primero guarda el proyecto como borrador. Después podrás
                  subir los documentos asociados a su ID.
                </p>
              )}
            </div>
          )}

          {/* DOCUMENTOS GUARDADOS EN EL SERVIDOR */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-800">
                Documentos guardados
              </h4>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {documentosExistentes.length}{" "}
                {documentosExistentes.length === 1 ? "documento" : "documentos"}
              </span>
            </div>

            {cargandoDocumentos ? (
              <p className="rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-500">
                Cargando documentos...
              </p>
            ) : documentosExistentes.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-5 text-center">
                <p className="text-sm text-slate-500">
                  Todavía no hay documentos guardados.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documentosExistentes.map((documento, index) => {
                  const nombreArchivo =
                    documento.nombre ||
                    documento.nombre_original ||
                    documento.archivo_nombre ||
                    `Documento ${index + 1}`;

                  return (
                    <div
                      key={documento.id ?? index}
                      className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#b1122b]/5 text-[#b1122b]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="21"
                          height="21"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="8" x2="16" y1="13" y2="13" />
                          <line x1="8" x2="16" y1="17" y2="17" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-700">
                          {nombreArchivo}
                        </p>
                        {documento.archivo && (
                          <a
                            href={documento.archivo}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs font-semibold text-[#b1122b] hover:underline"
                          >
                            Ver o descargar archivo
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarDocumentoSustento?.(documento.id)
                        }
                        disabled={
                          typeof eliminarDocumentoSustento !== "function"
                        }
                        className="shrink-0 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

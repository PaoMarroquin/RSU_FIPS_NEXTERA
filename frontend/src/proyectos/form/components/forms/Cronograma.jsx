
import React, { useEffect, useMemo } from "react";

const obtenerIdActividad = (actividad, index) =>
  String(actividad?.id ?? index);

const crearAccionVacia = (orden = 1, actividadId = "") => ({
  actividad_id: String(actividadId),
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  responsable: "",
  evidencia_esperada: "",
  estado_avance: "no_iniciado",
  orden,
});

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const [anio, mes, dia] = String(fecha).split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
};

export default function Cronograma({ data, updateData }) {
  const cronogramas = Array.isArray(data.cronogramas)
    ? data.cronogramas
    : [];

  const actividades = Array.isArray(data.actividades)
    ? data.actividades
    : [];

  const actividadesValidas = useMemo(
    () =>
      actividades
        .map((actividad, index) => ({
          actividad,
          id: obtenerIdActividad(actividad, index),
        }))
        .filter(({ actividad }) => actividad.nombre?.trim()),
    [actividades]
  );

  useEffect(() => {
    if (cronogramas.length > 0 || actividadesValidas.length === 0) return;

    updateData(
      "cronogramas",
      actividadesValidas.map(({ id }, index) =>
        crearAccionVacia(index + 1, id)
      )
    );
  }, [cronogramas.length, actividadesValidas, updateData]);

  const handleChangeCronograma = (index, field, value) => {
    updateData(
      "cronogramas",
      cronogramas.map((item, idx) =>
        idx === index
          ? { ...item, [field]: value, orden: idx + 1 }
          : item
      )
    );
  };

  const addAccion = (actividadId) => {
    updateData("cronogramas", [
      ...cronogramas,
      crearAccionVacia(cronogramas.length + 1, actividadId),
    ]);
  };

  const removeAccion = (index) => {
    const nuevoCronograma = cronogramas
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({
        ...item,
        orden: idx + 1,
      }));

    updateData("cronogramas", nuevoCronograma);
  };

  const obtenerErroresFila = (item) => {
    if (!item || typeof item !== "object") {
      return ["La acción no contiene datos válidos."];
    }

    const errores = [];

    if (!item.descripcion?.trim()) {
      errores.push("Falta completar la descripción de la acción.");
    }

    if (!item.fecha_inicio) {
      errores.push("Falta seleccionar la fecha de inicio.");
    } else {
      if (data.fechaInicio && item.fecha_inicio < data.fechaInicio) {
        errores.push(
          `La fecha de inicio (${formatearFecha(item.fecha_inicio)}) es anterior al inicio del proyecto (${formatearFecha(data.fechaInicio)}).`
        );
      }

      if (data.fechaTermino && item.fecha_inicio > data.fechaTermino) {
        errores.push(
          `La fecha de inicio (${formatearFecha(item.fecha_inicio)}) supera el término del proyecto (${formatearFecha(data.fechaTermino)}).`
        );
      }
    }

    if (!item.fecha_fin) {
      errores.push("Falta seleccionar la fecha de fin.");
    } else {
      if (item.fecha_inicio && item.fecha_fin < item.fecha_inicio) {
        errores.push(
          `La fecha de fin (${formatearFecha(item.fecha_fin)}) es anterior a la fecha de inicio (${formatearFecha(item.fecha_inicio)}).`
        );
      }

      if (data.fechaInicio && item.fecha_fin < data.fechaInicio) {
        errores.push(
          `La fecha de fin (${formatearFecha(item.fecha_fin)}) es anterior al inicio del proyecto (${formatearFecha(data.fechaInicio)}).`
        );
      }

      if (data.fechaTermino && item.fecha_fin > data.fechaTermino) {
        errores.push(
          `La fecha de fin (${formatearFecha(item.fecha_fin)}) supera el término del proyecto (${formatearFecha(data.fechaTermino)}).`
        );
      }
    }

    if (!item.responsable?.trim()) {
      errores.push("Falta indicar el responsable de la acción.");
    }

    if (!item.evidencia_esperada?.trim()) {
      errores.push("Falta indicar la evidencia esperada.");
    }

    return errores;
  };

  const erroresCronograma = actividadesValidas
    .map(({ actividad, id }) => {
      const acciones = cronogramas.filter(
        (item) => String(item?.actividad_id ?? "") === id
      );

      const errores = acciones.flatMap((item) =>
        obtenerErroresFila(item)
      );

      return {
        id,
        cantidad: errores.length,
        mensaje: `${actividad.nombre}: ${[...new Set(errores)].join(" ")}`,
      };
    })
    .filter(({ cantidad }) => cantidad > 0);

  const idsActividadValidos = new Set(
    actividadesValidas.map(({ id }) => id)
  );

  const accionesSinActividad = cronogramas.filter(
    (item) => !idsActividadValidos.has(String(item?.actividad_id ?? ""))
  );

  const cantidadProblemas =
    erroresCronograma.reduce(
      (total, error) => total + error.cantidad,
      0
    ) + accionesSinActividad.length;

  const inputClass =
    "w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-700 outline-none transition focus:border-[#5E151D] focus:ring-1 focus:ring-[#5E151D]/20";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Cronograma de Acciones
          </h2>

          <span className="mt-0.5 block text-xs text-slate-500">
            Sección 7 de 9
          </span>
        </div>
      </div>

      {actividadesValidas.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No hay actividades registradas. Registra al menos una actividad
          con nombre en la sección VI para poder agregar acciones.
        </div>
      )}

      {(erroresCronograma.length > 0 ||
        accionesSinActividad.length > 0) && (
          <div
            role="alert"
            className="space-y-2 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-800"
          >
            <p className="font-semibold">
              El cronograma tiene errores pendientes. Se encontraron{" "}
              {cantidadProblemas} problema(s). Corrige los siguientes puntos:
            </p>

            <ul className="list-disc space-y-1 pl-5">
              {erroresCronograma.map(({ id, mensaje }) => (
                <li key={id}>{mensaje}</li>
              ))}

              {accionesSinActividad.map((item, index) => (
                <li key={`sin-actividad-${index}`}>
                  Acción con descripción «
                  {item?.descripcion?.trim() || "Sin descripción"}»: la
                  actividad asociada ya no existe o no es válida. Verifica
                  las actividades registradas en la sección VI.
                </li>
              ))}
            </ul>
          </div>
        )}

      {actividadesValidas.map(({ actividad, id }, actividadIndex) => {
        const acciones = cronogramas
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => String(item?.actividad_id ?? "") === id);

        return (
          <section
            key={id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#5E151D]/15 bg-slate-50 p-3">
              <h3 className="inline-flex max-w-full items-center rounded-md border border-[#5E151D]/20 bg-white px-4 py-2 text-sm font-semibold text-[#5E151D]">
                <span className="break-words">
                  Actividad {actividadIndex + 1}: {actividad.nombre}
                </span>
              </h3>

              <button
                type="button"
                onClick={() => addAccion(id)}
                className="shrink-0 rounded-md bg-[#5E151D] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#451017]"
              >
                + Agregar Acción
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-2 py-3 text-center">N.º</th>
                    <th className="w-52 px-2 py-3">
                      Acción / Descripción *
                    </th>
                    <th className="w-36 px-2 py-3">Fecha inicio *</th>
                    <th className="w-36 px-2 py-3">Fecha fin *</th>
                    <th className="w-40 px-2 py-3">Responsable *</th>
                    <th className="w-48 px-2 py-3">
                      Evidencia esperada *
                    </th>
                    <th className="w-20 px-2 py-3 text-center">
                      Eliminar
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {acciones.map(({ item, index }, accionIndex) => {
                    const errores = obtenerErroresFila(item);

                    return (
                      <tr
                        key={`${id}-${index}`}
                        className={
                          errores.length > 0
                            ? "bg-red-50/20"
                            : "hover:bg-slate-50/50"
                        }
                      >
                        <td className="px-2 py-2 text-center text-slate-500">
                          {accionIndex + 1}
                        </td>

                        <td className="px-2 py-2">
                          <input
                            value={item.descripcion || ""}
                            onChange={(e) =>
                              handleChangeCronograma(
                                index,
                                "descripcion",
                                e.target.value
                              )
                            }
                            placeholder="Descripción de la acción"
                            aria-label={`Descripción de la acción ${accionIndex + 1} de la actividad ${actividadIndex + 1}`}
                            className={inputClass}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={item.fecha_inicio || ""}
                            min={data.fechaInicio || undefined}
                            max={data.fechaTermino || undefined}
                            onChange={(e) =>
                              handleChangeCronograma(
                                index,
                                "fecha_inicio",
                                e.target.value
                              )
                            }
                            aria-label={`Fecha de inicio de la acción ${accionIndex + 1}`}
                            className={inputClass}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={item.fecha_fin || ""}
                            min={
                              item.fecha_inicio ||
                              data.fechaInicio ||
                              undefined
                            }
                            max={data.fechaTermino || undefined}
                            onChange={(e) =>
                              handleChangeCronograma(
                                index,
                                "fecha_fin",
                                e.target.value
                              )
                            }
                            aria-label={`Fecha de fin de la acción ${accionIndex + 1}`}
                            className={inputClass}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <input
                            value={item.responsable || ""}
                            onChange={(e) =>
                              handleChangeCronograma(
                                index,
                                "responsable",
                                e.target.value
                              )
                            }
                            placeholder="Nombre o rol"
                            aria-label={`Responsable de la acción ${accionIndex + 1}`}
                            className={inputClass}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <input
                            value={item.evidencia_esperada || ""}
                            onChange={(e) =>
                              handleChangeCronograma(
                                index,
                                "evidencia_esperada",
                                e.target.value
                              )
                            }
                            placeholder="Ej. Lista de asistencia"
                            aria-label={`Evidencia esperada de la acción ${accionIndex + 1}`}
                            className={inputClass}
                          />
                        </td>

                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeAccion(index)}
                            className="rounded px-2 py-1.5 text-[11px] text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Eliminar acción"
                            aria-label={`Eliminar acción ${accionIndex + 1} de ${actividad.nombre}`}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {acciones.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-xs text-slate-400"
                      >
                        No hay acciones para esta actividad. Presiona
                        “Agregar Acción” para comenzar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

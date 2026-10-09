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
          index,
          id: obtenerIdActividad(actividad, index),
        }))
        .filter(({ actividad }) => actividad.nombre?.trim()),
    [actividades]
  );

  // Si se agregan actividades, no se pierde la asociación por índice.
  useEffect(() => {
    if (cronogramas.length > 0) return;

    const primeraActividad = actividadesValidas[0]?.id ?? "";

    updateData("cronogramas", [
      crearAccionVacia(1, primeraActividad),
    ]);

    // Solo inicializar cuando el usuario entra con el cronograma vacío.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeCronograma = (index, field, value) => {
    const nuevoCronograma = cronogramas.map((item, idx) =>
      idx === index
        ? {
            ...item,
            [field]: value,
            orden: idx + 1,
          }
        : item
    );

    updateData("cronogramas", nuevoCronograma);
  };

  const addAccion = () => {
    const primeraActividad = actividadesValidas[0]?.id ?? "";

    updateData("cronogramas", [
      ...cronogramas,
      crearAccionVacia(cronogramas.length + 1, primeraActividad),
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

  const obtenerErrorFila = (item) => {
    const actividadExiste = actividadesValidas.some(
      ({ id }) => id === String(item.actividad_id ?? "")
    );

    if (!actividadExiste) {
      return "Selecciona una actividad válida para esta acción.";
    }

    if (!item.descripcion?.trim()) {
      return "La descripción de la acción es obligatoria.";
    }

    if (!item.fecha_inicio || !item.fecha_fin) {
      return "Completa las fechas de inicio y fin.";
    }

    if (item.fecha_fin < item.fecha_inicio) {
      return "La fecha de fin no puede ser anterior a la fecha de inicio.";
    }

    if (
      data.fechaInicio &&
      (item.fecha_inicio < data.fechaInicio ||
        item.fecha_fin < data.fechaInicio)
    ) {
      return "Las fechas no pueden ser anteriores al inicio del proyecto.";
    }

    if (
      data.fechaTermino &&
      (item.fecha_inicio > data.fechaTermino ||
        item.fecha_fin > data.fechaTermino)
    ) {
      return "Las fechas no pueden superar el término del proyecto.";
    }

    if (!item.responsable?.trim()) {
      return "Indica el responsable de la acción.";
    }

    if (!item.evidencia_esperada?.trim()) {
      return "Indica la evidencia esperada.";
    }

    return null;
  };

  const tieneErroresFecha = cronogramas.some((item) => {
    if (!item) return true;

    if (
      item.fecha_inicio &&
      item.fecha_fin &&
      item.fecha_fin < item.fecha_inicio
    ) {
      return true;
    }

    if (
      item.fecha_inicio &&
      ((data.fechaInicio && item.fecha_inicio < data.fechaInicio) ||
        (data.fechaTermino &&
          item.fecha_inicio > data.fechaTermino))
    ) {
      return true;
    }

    if (
      item.fecha_fin &&
      ((data.fechaInicio && item.fecha_fin < data.fechaInicio) ||
        (data.fechaTermino && item.fecha_fin > data.fechaTermino))
    ) {
      return true;
    }

    return false;
  });

  const tieneCamposVacios = cronogramas.some(
    (item) => !item || Boolean(obtenerErrorFila(item))
  );

  return (
    <div className="space-y-6 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#b1122b]">
            VII.
          </span>

          <div>
            <h2 className="text-xl font-semibold text-slate-800 m-0">
              Cronograma de Acciones
            </h2>

            <span className="text-xs text-slate-500 block mt-0.5">
              Sección 7 de 9
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={addAccion}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b1122b] text-white rounded-md text-xs font-semibold hover:bg-[#8f0e22] transition-colors shadow-sm"
        >
          + Agregar Acción
        </button>
      </div>

      {actividadesValidas.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          Primero registra al menos una actividad con nombre en la
          sección VI.
        </div>
      )}

      {cronogramas.length > 0 &&
        (tieneCamposVacios || tieneErroresFecha) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1 text-xs text-red-700">
            Completa los campos obligatorios y corrige las fechas antes
            de enviar el proyecto a revisión.
          </div>
        )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3 text-center">N.º</th>
              <th className="p-3">Actividad *</th>
              <th className="p-3">Acción / Descripción *</th>
              <th className="p-3">Fecha inicio *</th>
              <th className="p-3">Fecha fin *</th>
              <th className="p-3">Responsable *</th>
              <th className="p-3">Evidencia esperada *</th>
              <th className="p-3 text-center">Eliminar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {cronogramas.map((item, index) => {
              const errorFila = obtenerErrorFila(item);

              const errorFecha =
                item?.fecha_inicio &&
                item?.fecha_fin &&
                item.fecha_fin < item.fecha_inicio;

              return (
                <tr
                  key={index}
                  className={
                    errorFila
                      ? "bg-red-50/20"
                      : "hover:bg-slate-50/50"
                  }
                >
                  <td className="p-2 text-center text-xs font-bold text-slate-400">
                    {index + 1}
                  </td>

                  <td className="p-2 min-w-48">
                    <select
                      value={item.actividad_id ?? ""}
                      onChange={(e) =>
                        handleChangeCronograma(
                          index,
                          "actividad_id",
                          e.target.value
                        )
                      }
                      className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-xs text-slate-700"
                    >
                      <option value="">Seleccionar actividad</option>

                      {actividadesValidas.map(({ actividad, id }) => (
                        <option key={id} value={id}>
                          {actividad.nombre}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 min-w-48">
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
                      className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-xs"
                    />
                  </td>

                  <td className="p-2 min-w-36">
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
                      className="w-full border border-slate-300 rounded-md px-2 py-2 text-xs"
                    />
                  </td>

                  <td className="p-2 min-w-36">
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
                      className="w-full border border-slate-300 rounded-md px-2 py-2 text-xs"
                    />

                    {errorFecha && (
                      <span className="text-[10px] text-red-600 block mt-1">
                        Fin anterior al inicio
                      </span>
                    )}
                  </td>

                  <td className="p-2 min-w-40">
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
                      className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-xs"
                    />
                  </td>

                  <td className="p-2 min-w-44">
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
                      className="w-full border border-slate-300 rounded-md px-2.5 py-2 text-xs"
                    />
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeAccion(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Eliminar acción"
                      aria-label={`Eliminar acción ${index + 1}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}

            {cronogramas.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-8 text-xs text-slate-400"
                >
                  No hay acciones registradas. Presiona “Agregar Acción”
                  para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

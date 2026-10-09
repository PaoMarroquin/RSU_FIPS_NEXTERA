import React, { useEffect, useMemo } from "react";

const crearActividadVacia = (orden = 1) => ({
  nombre: "",
  descripcion: "",
  orden,
  acciones: [],
});

const obtenerIdActividad = (actividad, index) =>
  String(actividad?.id ?? index);

export default function Actividades({ data, updateData }) {
  const actividades = Array.isArray(data.actividades)
    ? data.actividades
    : [];

  const cronogramas = Array.isArray(data.cronogramas)
    ? data.cronogramas
    : [];

  const actividadesConId = useMemo(
    () =>
      actividades.map((actividad, index) => ({
        actividad,
        index,
        id: obtenerIdActividad(actividad, index),
      })),
    [actividades]
  );

  useEffect(() => {
    if (!Array.isArray(data.actividades) || data.actividades.length === 0) {
      updateData("actividades", [crearActividadVacia(1)]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeActividades = (index, field, value) => {
    const nuevasActividades = actividades.map((actividad, idx) =>
      idx === index
        ? {
            ...actividad,
            [field]: value,
            orden: idx + 1,
          }
        : actividad
    );

    updateData("actividades", nuevasActividades);
  };

  const addActividad = () => {
    updateData("actividades", [
      ...actividades,
      crearActividadVacia(actividades.length + 1),
    ]);
  };

  const removeActividad = (indexEliminar) => {
    const actividadEliminada = actividades[indexEliminar];

    if (!actividadEliminada) return;

    const idEliminado = obtenerIdActividad(
      actividadEliminada,
      indexEliminar
    );

    const nuevasActividades = actividades
      .filter((_, index) => index !== indexEliminar)
      .map((actividad, index) => ({
        ...actividad,
        orden: index + 1,
      }));

    /*
     * Las acciones del formulario utilizan:
     * - El ID de la actividad si ya existe.
     * - El índice original si la actividad aún no tiene ID.
     *
     * Al eliminar una actividad nueva, se ajustan los índices de
     * las actividades posteriores para mantener las asociaciones.
     *
     * Las acciones de la actividad eliminada quedan sin asignar
     * para que el usuario pueda corregirlas en el cronograma.
     */
    const nuevoCronograma = cronogramas.map((accion) => {
      const actividadId = String(accion.actividad_id ?? "");

      if (actividadId === idEliminado) {
        return {
          ...accion,
          actividad_id: "",
        };
      }

      // Los IDs persistidos no son índices temporales.
      const referenciaEsIdPersistido = actividades.some(
        (actividad) =>
          actividad.id != null &&
          String(actividad.id) === actividadId
      );

      if (referenciaEsIdPersistido) {
        return accion;
      }

      // Si es una referencia por índice, actualizar los posteriores.
      const indiceReferencia = Number(actividadId);

      if (
        actividadId !== "" &&
        Number.isInteger(indiceReferencia) &&
        indiceReferencia > indexEliminar
      ) {
        return {
          ...accion,
          actividad_id: String(indiceReferencia - 1),
        };
      }

      return accion;
    });

    updateData("actividades", nuevasActividades);
    updateData("cronogramas", nuevoCronograma);
  };

  const tieneCamposVacios = actividades.some(
    (actividad) =>
      !actividad.nombre?.trim() ||
      !actividad.descripcion?.trim()
  );

  const idsActividadesValidas = new Set(
    actividadesConId
      .filter(({ actividad }) => actividad.nombre?.trim())
      .map(({ id }) => id)
  );

  const accionesSinActividad = cronogramas.filter((accion) => {
    const actividadId = String(accion?.actividad_id ?? "");

    return (
      actividadId === "" ||
      !idsActividadesValidas.has(actividadId)
    );
  }).length;

  return (
    <div className="space-y-6 transition-all duration-300">
      {/* CABECERA */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#b1122b]">
            VI.
          </span>

          <div>
            <h2 className="text-xl font-semibold text-slate-800 m-0">
              Actividades del Proyecto
            </h2>

            <span className="text-xs text-slate-500 block mt-0.5">
              Sección 6 de 9
            </span>
          </div>
        </div>

        <button
          onClick={addActividad}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b1122b] text-white rounded-md text-xs font-semibold hover:bg-[#8f0e22] transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>

          Agregar Actividad
        </button>
      </div>

      {tieneCamposVacios && actividades.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          El nombre y la descripción de cada actividad son obligatorios.
        </div>
      )}

      {accionesSinActividad > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          Hay {accionesSinActividad} acción(es) sin una actividad válida.
          Entra en la sección VII y asigna la actividad correspondiente.
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3 w-1/12 text-center">N.º</th>
              <th className="p-3 w-5/12">Nombre *</th>
              <th className="p-3 w-5/12">Descripción *</th>
              <th className="p-3 w-1/12 text-center">Eliminar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {actividades.map((actividad, index) => {
              const nombreInvalido = !actividad.nombre?.trim();
              const descripcionInvalida =
                !actividad.descripcion?.trim();

              const idActividad = obtenerIdActividad(
                actividad,
                index
              );

              const accionesAsignadas = cronogramas.filter(
                (accion) =>
                  String(accion?.actividad_id ?? "") ===
                  idActividad
              ).length;

              return (
                <tr
                  key={actividad.id ?? `actividad-${index}`}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    nombreInvalido || descripcionInvalida
                      ? "bg-red-50/10"
                      : ""
                  }`}
                >
                  <td className="p-2 text-center text-xs font-bold text-slate-400">
                    {actividad.orden || index + 1}
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      value={actividad.nombre || ""}
                      onChange={(e) =>
                        handleChangeActividades(
                          index,
                          "nombre",
                          e.target.value
                        )
                      }
                      placeholder="Ej. Taller de capacitación"
                      aria-label={`Nombre de la actividad ${index + 1}`}
                      className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${
                        nombreInvalido
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-300 focus:border-[#b1122b]"
                      }`}
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      value={actividad.descripcion || ""}
                      onChange={(e) =>
                        handleChangeActividades(
                          index,
                          "descripcion",
                          e.target.value
                        )
                      }
                      placeholder="Breve descripción..."
                      aria-label={`Descripción de la actividad ${index + 1}`}
                      className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${
                        descripcionInvalida
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-300 focus:border-[#b1122b]"
                      }`}
                    />

                    <span className="text-[10px] text-slate-500 block mt-1">
                      {accionesAsignadas} acción(es) asignada(s)
                    </span>
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeActividad(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none"
                      title="Eliminar actividad"
                      aria-label={`Eliminar actividad ${index + 1}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21a48.108 48.108 0 01-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}

            {actividades.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-8 text-xs text-slate-400"
                >
                  No hay actividades registradas. Presiona “Agregar Actividad”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Las acciones, fechas, responsables y evidencias se registran
        en la sección VII (Cronograma de Acciones) y deben vincularse
        con una actividad.
      </p>
    </div>
  );
}

import React from "react";

export default function Recursos({ data, updateData }) {

  const recursos = data.recursos || {
    rec_hum_docentes: 0,
    rec_hum_administrativos: 0,
    rec_hum_estudiantes: 0,
    rec_hum_egresados: 0,
    rec_hum_voluntarios: 0,
    rec_hum_otros: 0,

    rec_mat_material_didactico: "",
    rec_mat_afiches: "",
    rec_mat_equipos: "",
    rec_mat_utiles: "",
    rec_mat_otros: "",
  };

  const handleChange = (field, value) => {
    updateData("recursos", {
      ...recursos,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6 transition-all duration-300">

      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">VIII.</span>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">
            Recursos
          </h2>

          <span className="text-xs text-slate-500 block mt-0.5">
            Sección 8 de 9
          </span>
        </div>
      </div>

      {/* RECURSOS HUMANOS */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">
          Recursos Humanos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Docentes
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={recursos.rec_hum_docentes}
              onChange={(e) =>
                handleChange("rec_hum_docentes", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Administrativos
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={recursos.rec_hum_administrativos}
              onChange={(e) =>
                handleChange("rec_hum_administrativos", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Estudiantes
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={recursos.rec_hum_estudiantes}
              onChange={(e) =>
                handleChange("rec_hum_estudiantes", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Egresados
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={recursos.rec_hum_egresados}
              onChange={(e) =>
                handleChange("rec_hum_egresados", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Voluntarios
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={recursos.rec_hum_voluntarios}
              onChange={(e) =>
                handleChange("rec_hum_voluntarios", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Otros
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={recursos.rec_hum_otros}
              onChange={(e) =>
                handleChange("rec_hum_otros", Number(e.target.value))
              }
            />
          </div>

        </div>
      </div>

      {/* RECURSOS MATERIALES */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">
          Recursos Materiales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Material Didáctico
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Detalle del material didáctico..."
              value={recursos.rec_mat_material_didactico}
              onChange={(e) =>
                handleChange(
                  "rec_mat_material_didactico",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Afiches
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Detalle de afiches..."
              value={recursos.rec_mat_afiches}
              onChange={(e) =>
                handleChange("rec_mat_afiches", e.target.value)
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Equipos
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Detalle de equipos..."
              value={recursos.rec_mat_equipos}
              onChange={(e) =>
                handleChange("rec_mat_equipos", e.target.value)
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              Útiles
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Detalle de útiles..."
              value={recursos.rec_mat_utiles}
              onChange={(e) =>
                handleChange("rec_mat_utiles", e.target.value)
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600 block mb-1">
              Otros Materiales
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Detalle de otros materiales..."
              value={recursos.rec_mat_otros}
              onChange={(e) =>
                handleChange("rec_mat_otros", e.target.value)
              }
            />
          </div>

        </div>
      </div>

    </div>
  );
}
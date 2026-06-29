import React from "react";

export default function Recursos({ data, updateData }) {
  // Aseguramos la existencia del objeto de recursos bajo tu estándar del hook
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

  // Función para actualizar campos anidados de forma reactiva
  const handleNestedChange = (field, value) => {
    updateData("recursos", {
      ...recursos,
      [field]: value,
    });
  };

  // Conversiones seguras para cálculos en caliente (evita problemas si ingresan texto vacío temporalmente)
  const docentes = parseInt(recursos.rec_hum_docentes, 10) || 0;
  const admin = parseInt(recursos.rec_hum_administrativos, 10) || 0;
  const alumnos = parseInt(recursos.rec_hum_estudiantes, 10) || 0;
  const egresados = parseInt(recursos.rec_hum_egresados, 10) || 0;
  const voluntarios = parseInt(recursos.rec_hum_voluntarios, 10) || 0;
  const otrosHum = parseInt(recursos.rec_hum_otros, 10) || 0;

  const totalHum = docentes + admin + alumnos + egresados + voluntarios + otrosHum;
  const tieneNegativos = [docentes, admin, alumnos, egresados, voluntarios, otrosHum].some(num => num < 0);

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA DE SECCIÓN */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">VIII.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Recursos Necesarios</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 8 de 9</span>
        </div>
      </div>

      {/* ALERTAS EN TIEMPO REAL COINCIDENTES CON TUS VALIDACIONES */}
      {(tieneNegativos || totalHum === 0) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in slide-in-from-top-2">
          <p className="font-bold">Correcciones requeridas para marcar este paso como completado:</p>
          <ul className="list-disc list-inside ml-1 mt-0.5 opacity-90">
            {tieneNegativos && <li>No se permiten valores negativos en el conteo de personas.</li>}
            {totalHum === 0 && <li>Debe registrar al menos un (1) miembro en los Recursos Humanos del proyecto.</li>}
          </ul>
        </div>
      )}

      {/* PANEL: RECURSOS HUMANOS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 m-0">Recursos Humanos (Cantidad de personas)</h3>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors ${
            totalHum > 0 ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-slate-500 bg-slate-100"
          }`}>
            Total Integrantes: {totalHum}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Docentes</label>
            <input
              type="number" min="0"
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
                docentes < 0 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#b1122b]'
              }`}
              value={recursos.rec_hum_docentes ?? 0}
              onChange={(e) => handleNestedChange("rec_hum_docentes", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Administrativos</label>
            <input
              type="number" min="0"
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
                admin < 0 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#b1122b]'
              }`}
              value={recursos.rec_hum_administrativos ?? 0}
              onChange={(e) => handleNestedChange("rec_hum_administrativos", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Estudiantes</label>
            <input
              type="number" min="0"
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
                alumnos < 0 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#b1122b]'
              }`}
              value={recursos.rec_hum_estudiantes ?? 0}
              onChange={(e) => handleNestedChange("rec_hum_estudiantes", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Egresados</label>
            <input
              type="number" min="0"
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
                egresados < 0 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#b1122b]'
              }`}
              value={recursos.rec_hum_egresados ?? 0}
              onChange={(e) => handleNestedChange("rec_hum_egresados", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Voluntarios</label>
            <input
              type="number" min="0"
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
                voluntarios < 0 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#b1122b]'
              }`}
              value={recursos.rec_hum_voluntarios ?? 0}
              onChange={(e) => handleNestedChange("rec_hum_voluntarios", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Otros</label>
            <input
              type="number" min="0"
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
                otrosHum < 0 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#b1122b]'
              }`}
              value={recursos.rec_hum_otros ?? 0}
              onChange={(e) => handleNestedChange("rec_hum_otros", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* PANEL: RECURSOS MATERIALES */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 m-0">Recursos Materiales</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Especifique los materiales o bienes requeridos para el desarrollo de las actividades.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Material Didáctico</label>
            <input
              type="text" placeholder="Ej. Guías de aprendizaje, separatas impresas, manuales..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
              value={recursos.rec_mat_material_didactico || ""}
              onChange={(e) => handleNestedChange("rec_mat_material_didactico", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Afiches y Material Gráfico</label>
            <input
              type="text" placeholder="Ej. Banners informativos, dípticos, afiches de difusión..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
              value={recursos.rec_mat_afiches || ""}
              onChange={(e) => handleNestedChange("rec_mat_afiches", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Equipos de Soporte</label>
            <input
              type="text" placeholder="Ej. Proyector multimedia, parlante portátil, micrófonos..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
              value={recursos.rec_mat_equipos || ""}
              onChange={(e) => handleNestedChange("rec_mat_equipos", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Útiles de Escritorio</label>
            <input
              type="text" placeholder="Ej. Papelógrafos, plumones gruesos, notas adhesivas, cintas..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
              value={recursos.rec_mat_utiles || ""}
              onChange={(e) => handleNestedChange("rec_mat_utiles", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Otros Recursos Materiales</label>
            <textarea
              placeholder="Describa de forma general cualquier otro bien material o necesidad logística que no se encuentre tipificada en los campos anteriores..."
              className="min-h-[70px] w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#b1122b] resize-y"
              value={recursos.rec_mat_otros || ""}
              onChange={(e) => handleNestedChange("rec_mat_otros", e.target.value)}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
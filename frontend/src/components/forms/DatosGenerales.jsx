import React from 'react';
import PaginatedSelect from './PaginatedSelect';
import BeneficiariosSelector from './BeneficiariosSelector';
import EjeRSUSelector from './EjeRSUSelector';

export default function DatosGenerales({ data, updateData }) {

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    updateData(name, type === 'checkbox' ? checked : value);
  };

  const CheckboxItem = ({ label, name }) => (
    <label className="flex items-start gap-2.5 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
      <input
        type="checkbox"
        name={name}
        checked={data[name] || false}
        onChange={handleChange}
        className="mt-0.5 rounded border-slate-300 text-[#b1122b] focus:ring-[#b1122b] w-4 h-4"
      />
      <span className="text-xs font-medium text-slate-600 leading-tight">{label}</span>
    </label>
  );

  return (
    <div className="space-y-6 transition-all duration-300">
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">I.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Datos Generales</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 1 de 9</span>
        </div>
      </div>

      {/* 1. INFORMACIÓN INSTITUCIONAL */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Información Institucional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PaginatedSelect
            label="Facultad"
            name="facultad"
            value={data.facultad}
            selectedName={data.facultad_nombre}
            onChange={(e, nombre) => {
              handleChange(e); // Guarda el ID normalmente
              updateData('facultad_nombre', nombre); // Guarda el Nombre explícitamente

              // Limpiamos los hijos 
              updateData('escuela', null);
              updateData('escuela_nombre', '');
              updateData('departamento', null);
              updateData('departamento_nombre', '');
            }}
            endpoint="/api/v1/facultades/"
            placeholder="Seleccione una facultad"
          />

          <PaginatedSelect
            label="Escuela Profesional"
            name="escuela"
            value={data.escuela}
            selectedName={data.escuela_nombre}
            onChange={(e, nombre) => {
              handleChange(e);
              updateData('escuela_nombre', nombre);
            }}
            endpoint="/api/v1/escuelas/"
            placeholder="Seleccione una escuela"
            disabled={!data.facultad}
            dependencia={data.facultad}
          />

          <PaginatedSelect
            label="Departamento Académico"
            name="departamento"
            value={data.departamento}
            selectedName={data.departamento_nombre}
            onChange={(e, nombre) => {
              handleChange(e);
              updateData('departamento_nombre', nombre);
            }}
            endpoint="/api/v1/departamentos/"
            placeholder="Seleccione un departamento"
            disabled={!data.facultad}
            dependencia={data.facultad}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Semestre Académico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
              name="semestre"
              placeholder="Ej. 2026-A"
              value={data.semestre || ''}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Asignatura(s) participante(s) <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="asignaturas" placeholder="Ej. Desarrollo Web, Bases de Datos" value={data.asignaturas} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Título del Proyecto <span className="text-red-500">*</span></label>
            <textarea className="min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-vertical" name="titulo" placeholder="Ingrese el título completo..." value={data.titulo} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">N° Docentes Participantes <span className="text-red-500">*</span> </label>
            <input type="number" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="numDocentes" value={data.numDocentes === null ? '' : data.numDocentes} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">N° Estudiantes Participantes <span className="text-red-500">*</span> </label>
            <input type="number" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="numEstudiantes" value={data.numEstudiantes === null ? '' : data.numEstudiantes} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Lugar de Ejecución</label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="lugar" placeholder="Ej. Distrito de Cayma, Arequipa" value={data.lugar} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* 2. BENEFICIARIOS */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Beneficiarios / Destinatarios
        </h3>

        {/* <-- 2. REEMPLAZAR TODA LA SECCIÓN POR ESTO --> */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <BeneficiariosSelector
            value={data.beneficiarios}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* 3. TIPO DE EJE RSU */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Tipo de Eje RSU
        </h3>

        <EjeRSUSelector
          valueSeccion={data.ejeRsuSeccion}
          valueDetalle={data.ejeRsuDetalle}
          onChange={handleChange}
        />
      </div>

      {/* 4. TIPO DE ACTIVIDAD */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Tipo de Actividad
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* OPCIONES ESTÁNDAR */}
          {[
            "Programas formativos",
            "Acompañamiento a sectores identificados",
            "Asesoría",
            "Iniciativas de acercamiento a la comunidad"
          ].map((opcion) => {
            const isSelected = data.tipoActividad === opcion;

            return (
              <label
                key={opcion}
                className={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                  ? 'bg-red-50/60 border-[#b1122b] shadow-sm font-semibold text-[#b1122b]'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <input
                  type="radio"
                  name="tipoActividad_radio"
                  value={opcion}
                  checked={isSelected}
                  onChange={(e) => updateData("tipoActividad", e.target.value)}
                  className="mt-0.5 w-4 h-4 text-[#b1122b] focus:ring-[#b1122b] border-slate-300"
                />
                <span className="text-xs leading-tight">{opcion}</span>
              </label>
            );
          })}

          {/* RADIO "OTROS" */}
          {(() => {
            const opcionesEstandar = [
              "Programas formativos", "Acompañamiento a sectores identificados",
              "Asesoría", "Iniciativas de acercamiento a la comunidad"
            ];
            // Está marcado si tiene texto y no es de la lista estándar, o si tiene el comodín
            const isOtrosChecked = (data.tipoActividad !== '' && !opcionesEstandar.includes(data.tipoActividad)) || data.tipoActividad === '__OTROS__';

            return (
              <label
                className={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isOtrosChecked
                  ? 'bg-red-50/60 border-[#b1122b] shadow-sm font-semibold text-[#b1122b]'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <input
                  type="radio"
                  name="tipoActividad_radio"
                  checked={isOtrosChecked}
                  onChange={() => updateData("tipoActividad", "__OTROS__")}
                  className="mt-0.5 w-4 h-4 text-[#b1122b] focus:ring-[#b1122b] border-slate-300"
                />
                <span className="text-xs leading-tight">Otros (especificar)</span>
              </label>
            );
          })()}
        </div>

        {/* INPUT DE TEXTO PURO */}
        {((data.tipoActividad !== '' && !["Programas formativos", "Acompañamiento a sectores identificados", "Asesoría", "Iniciativas de acercamiento a la comunidad"].includes(data.tipoActividad)) || data.tipoActividad === '__OTROS__') && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-3 bg-slate-50 p-4 rounded-lg border border-slate-200 w-full md:w-1/2">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Especifique el tipo de actividad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400 shadow-inner"
              placeholder="Escriba aquí..."
              value={data.tipoActividad === '__OTROS__' ? '' : data.tipoActividad}
              onChange={(e) => updateData("tipoActividad", e.target.value || '__OTROS__')}
              required
              autoFocus
            />
          </div>
        )}
      </div>

      {/* 5. META E INDICADOR */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Meta e Indicador
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Meta (cuantificable) <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="meta" placeholder="Ej. Capacitar a 50 estudiantes" value={data.meta} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Indicador <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="indicador" placeholder="Ej. N° de estudiantes capacitados" value={data.indicador} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* 6. CRONOGRAMA GENERAL */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Cronograma General
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Fecha de Inicio <span className="text-red-500">*</span></label>
            <input type="date" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="fechaInicio" value={data.fechaInicio} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Fecha de Evaluación de Avance</label>
            <input type="date" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="fechaEvaluacion" value={data.fechaEvaluacion} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Fecha de Término <span className="text-red-500">*</span></label>
            <input type="date" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="fechaTermino" value={data.fechaTermino} onChange={handleChange} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mt-4">
          <label className="text-xs font-bold text-slate-700 block mb-3">Fechas de Aplicación de Encuestas</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-500">Encuesta a Docentes</label>
              <input type="date" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="encuestaDocentes" value={data.encuestaDocentes} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-500">Encuesta a Estudiantes</label>
              <input type="date" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="encuestaEstudiantes" value={data.encuestaEstudiantes} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-500">Encuesta a Grupo Destinatario</label>
              <input type="date" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="encuestaDestinatarios" value={data.encuestaDestinatarios} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
import React from 'react';

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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Facultad <span className="text-red-500">*</span></label>
            <select 
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" 
              name="facultad" 
              value={data.facultad} 
              onChange={handleChange}
            >
              <option value="">Seleccione una facultad</option>
              <option value="Ingeniería de Producción y Servicios">Ingeniería de Producción y Servicios</option>
              <option value="Ciencias Naturales y Formales">Ciencias Naturales y Formales</option>
              <option value="Ciencias Biológicas">Ciencias Biológicas</option>
              <option value="Medicina">Medicina</option>
              <option value="Derecho">Derecho</option>
              <option value="Economía">Economía</option>
              <option value="Ciencias Histórico Sociales">Ciencias Histórico Sociales</option>
              <option value="Geología, Geofísica y Minas">Geología, Geofísica y Minas</option>
              <option value="Arquitectura y Urbanismo">Arquitectura y Urbanismo</option>
              <option value="Enfermería">Enfermería</option>
              <option value="Psicología, Relaciones Industriales y Ciencias de la Comunicación">Psicología, Relaciones Industriales y Ciencias de la Comunicación</option>
              <option value="Filosofía y Humanidades">Filosofía y Humanidades</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Escuela Profesional <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="escuela" placeholder="Ej. Ingeniería de Sistemas" value={data.escuela} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Departamento Académico</label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="departamento" placeholder="Ej. Ingeniería de Software" value={data.departamento} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Semestre Académico <span className="text-red-500">*</span></label>
            <select 
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" 
              name="semestre" 
              value={data.semestre} 
              onChange={handleChange}
            >
              <option value="">Seleccione</option>
              <option value="2024-A">2024-A</option>
              <option value="2024-B">2024-B</option>
              <option value="2025-A">2025-A</option>
            </select>
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
            <label className="text-xs font-semibold text-slate-600">N° Docentes Participantes</label>
            <input type="number" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all" name="numDocentes" value={data.numDocentes === null ? '' : data.numDocentes} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">N° Estudiantes Participantes</label>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <CheckboxItem label="Comunidad universitaria interna" name="beneficiarios_comunidadInterna" />
          <CheckboxItem label="Instituciones Educativas Básicas Regulares" name="beneficiarios_iebr" />
          <CheckboxItem label="Instituciones Educativas Especiales" name="beneficiarios_iee" />
          <CheckboxItem label="Gobierno Local" name="beneficiarios_gobLocal" />
          <CheckboxItem label="Gobierno Regional" name="beneficiarios_gobRegional" />
          <CheckboxItem label="Gobierno Nacional" name="beneficiarios_gobNacional" />
          <CheckboxItem label="Asociaciones" name="beneficiarios_asociaciones" />
          <CheckboxItem label="Organizaciones comunales" name="beneficiarios_orgComunales" />
          <CheckboxItem label="Sector empresarial" name="beneficiarios_sectorEmpresarial" />
          <CheckboxItem label="Sectores laborales" name="beneficiarios_sectoresLaborales" />
          <CheckboxItem label="Centros penitenciarios" name="beneficiarios_centrosPenitenciarios" />
          <CheckboxItem label="Otro (especificar)" name="beneficiarios_otro" />
        </div>
      </div>

      {/* 3. TIPO DE EJE RSU */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 m-0">Tipo de Eje RSU</h3>
        <p className="text-[11px] text-slate-400 m-0 mt-0.5 mb-3">Seleccione las subcategorías aplicables a su proyecto (puede marcar varias)</p>
        
        {/* GESTIÓN */}
        <div className="border border-slate-200 rounded-lg mb-3 overflow-hidden">
          <div className="bg-red-50/40 px-4 py-2 border-b border-slate-200 flex items-center">
            <span className="bg-[#b1122b] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">GESTIÓN</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxItem label="Programa de acciones ambientales a nivel administrativo" name="eje_gestion_admin" />
            <CheckboxItem label="Programa de acciones ambientales a nivel académico" name="eje_gestion_academico" />
            <CheckboxItem label="Programa de iniciativas de activación ambiental" name="eje_gestion_iniciativas" />
            <CheckboxItem label="Acciones sobre clima laboral y cultura organizacional" name="eje_gestion_clima" />
            <CheckboxItem label="Inclusión y equidad social en el ámbito laboral" name="eje_gestion_inclusion" />
            <CheckboxItem label="Otro (especificar)" name="eje_gestion_otro" />
          </div>
        </div>

        {/* FORMACIÓN */}
        <div className="border border-slate-200 rounded-lg mb-3 overflow-hidden">
          <div className="bg-red-50/40 px-4 py-2 border-b border-slate-200 flex items-center">
            <span className="bg-[#b1122b] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">FORMACIÓN</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxItem label="Ética en el desempeño profesional" name="eje_formacion_etica" />
            <CheckboxItem label="Prácticas anticorrupción" name="eje_formacion_anticorrupcion" />
            <CheckboxItem label="Inclusión social" name="eje_formacion_inclusion" />
            <CheckboxItem label="Equidad en el desarrollo profesional" name="eje_formacion_equidad" />
            <CheckboxItem label="Educación ambiental" name="eje_formacion_ambiental" />
            <CheckboxItem label="Derechos Humanos" name="eje_formacion_ddhh" />
            <CheckboxItem label="Objetivos de Desarrollo Sostenible (ODS)" name="eje_formacion_ods" />
            <CheckboxItem label="Otro (especificar)" name="eje_formacion_otro" />
          </div>
        </div>

        {/* INVESTIGACIÓN */}
        <div className="border border-slate-200 rounded-lg mb-3 overflow-hidden">
          <div className="bg-red-50/40 px-4 py-2 border-b border-slate-200 flex items-center">
            <span className="bg-[#b1122b] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">INVESTIGACIÓN</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxItem label="Contribuye a metas de los ODS" name="eje_investigacion_ods" />
            <CheckboxItem label="Contribuye a políticas de salud" name="eje_investigacion_salud" />
            <CheckboxItem label="Contribuye a educación" name="eje_investigacion_educacion" />
            <CheckboxItem label="Contribuye a igualdad de género" name="eje_investigacion_genero" />
            <CheckboxItem label="Contribuye a inclusión social" name="eje_investigacion_inclusion" />
            <CheckboxItem label="Contribuye a justicia" name="eje_investigacion_justicia" />
            <CheckboxItem label="Contribuye a formación ciudadana" name="eje_investigacion_ciudadania" />
            <CheckboxItem label="Contribuye a calidad de vida" name="eje_investigacion_calidad" />
            <CheckboxItem label="Contribuye a condiciones económicas" name="eje_investigacion_economia" />
            <CheckboxItem label="Contribuye a Política Ambiental Nacional" name="eje_investigacion_ambiental" />
          </div>
        </div>

        {/* EXTENSIÓN */}
        <div className="border border-slate-200 rounded-lg mb-3 overflow-hidden">
          <div className="bg-red-50/40 px-4 py-2 border-b border-slate-200 flex items-center">
            <span className="bg-[#b1122b] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">EXTENSIÓN</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckboxItem label="Contribuye a metas de los ODS (indicar número de ODS)" name="eje_extension_ods" />
            <CheckboxItem label="Contribuye a salud" name="eje_extension_salud" />
            <CheckboxItem label="Contribuye a educación" name="eje_extension_educacion" />
            <CheckboxItem label="Contribuye a igualdad de género" name="eje_extension_genero" />
            <CheckboxItem label="Contribuye a inclusión social" name="eje_extension_inclusion" />
            <CheckboxItem label="Contribuye a justicia" name="eje_extension_justicia" />
            <CheckboxItem label="Contribuye a formación ciudadana" name="eje_extension_ciudadania" />
            <CheckboxItem label="Contribuye a calidad de vida" name="eje_extension_calidad" />
            <CheckboxItem label="Contribuye a condiciones económicas" name="eje_extension_economia" />
            <CheckboxItem label="Contribuye a Política Ambiental Nacional" name="eje_extension_ambiental" />
          </div>
          <div className="px-4 pb-4 flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Detalle del ámbito de intervención <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="ambitoExtension" placeholder="Especifique el ámbito de extensión..." value={data.ambitoExtension} onChange={handleChange} />
          </div>
        </div>

        {/* VOLUNTARIADO */}
        <div className="border border-slate-200 rounded-lg mb-3 overflow-hidden">
          <div className="bg-red-50/40 px-4 py-2 border-b border-slate-200 flex items-center">
            <span className="bg-[#b1122b] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">VOLUNTARIADO</span>
          </div>
          <div className="p-4">
            <CheckboxItem label="Contribuye a iniciativas de voluntariado" name="eje_voluntariado_iniciativas" />
          </div>
          <div className="px-4 pb-4 flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Detalle del ámbito de intervención <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="ambitoVoluntariado" placeholder="Especifique el ámbito de voluntariado..." value={data.ambitoVoluntariado} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* 4. TIPO DE ACTIVIDAD */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Tipo de Actividad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <CheckboxItem label="Programas formativos" name="actividad_formativos" />
          <CheckboxItem label="Acompañamiento a sectores identificados" name="actividad_acompanamiento" />
          <CheckboxItem label="Asesoría" name="actividad_asesoria" />
          <CheckboxItem label="Iniciativas de acercamiento a la comunidad" name="actividad_acercamiento" />
          <CheckboxItem label="Otros (especificar)" name="actividad_otros" />
        </div>
      </div>

      {/* 5. META E INDICADOR */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Meta e Indicador
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Meta (cuantificable) <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="meta" placeholder="Ej. Capacitar a 50 docentes" value={data.meta} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Indicador <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="indicador" placeholder="Ej. N° de docentes capacitados" value={data.indicador} onChange={handleChange} />
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
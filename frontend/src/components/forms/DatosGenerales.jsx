import React, { useState, useEffect } from 'react';
import PaginatedSelect from './PaginatedSelect';
import BeneficiariosSelector from './BeneficiariosSelector';
import EjeRSUSelector from './EjeRSUSelector';
import { academicService } from './../../api/academicService';

export default function DatosGenerales({ data, updateData }) {

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (type === 'date' && value) {
      if (name === 'fechaTermino' && data.fechaInicio && value < data.fechaInicio) {
        alert('⚠️ La fecha de término no puede ser anterior a la fecha de inicio.');
        return; 
      }
      if (name === 'fechaInicio' && data.fechaTermino && value > data.fechaTermino) {
        alert('⚠️ La fecha de inicio no puede ser posterior a la fecha de término.');
        return; 
      }
    }

    // Si pasa la validación o es otro tipo de input, actualiza normal
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

  const metasGuardadas = data.metas_indicadores || [];

  const [listaMetas, setListaMetas] = useState(() =>
    metasGuardadas.length > 0
      ? metasGuardadas
      : [
        {
          id: null,
          meta_descripcion: "",
          indicador_nombre: "",
          linea_base: "",
          valor_meta: "",
        },
      ]
  );

  useEffect(() => {
    updateData("metas_indicadores", listaMetas);
  }, [listaMetas]);

  const agregarMeta = () => {
    setListaMetas([
      ...listaMetas,
      {
        id: null,
        meta_descripcion: "",
        indicador_nombre: "",
        linea_base: "",
        valor_meta: "",
      },
    ]);
  };

  const eliminarMeta = (index) => {
    if (listaMetas.length === 1) {
      setListaMetas([
        {
          id: null,
          meta_descripcion: "",
          indicador_nombre: "",
          linea_base: "",
          valor_meta: "",
        },
      ]);
    } else {
      setListaMetas(listaMetas.filter((_, i) => i !== index));
    }
  };

  const handleMetaChange = (index, field, value) => {
    const nuevas = [...listaMetas];
    nuevas[index] = {
      ...nuevas[index],
      [field]: value,
    };
    setListaMetas(nuevas);
  };

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
            fetchFn={academicService.getFacultades}
            placeholder="Seleccione una facultad"
            onChange={(e, nombre) => {
              handleChange(e);
              updateData('facultad_nombre', nombre);
              // Limpiamos cascada de hijos de forma limpia
              updateData('escuela', null);
              updateData('escuela_nombre', '');
              updateData('departamento', null);
              updateData('departamento_nombre', '');
            }}
          />

          <PaginatedSelect
            label="Escuela Profesional"
            name="escuela"
            value={data.escuela}
            selectedName={data.escuela_nombre}
            fetchFn={academicService.getEscuelas}
            placeholder="Seleccione una escuela"
            disabled={!data.facultad}
            dependencia={data.facultad}
            onChange={(e, nombre) => {
              handleChange(e);
              updateData('escuela_nombre', nombre);
            }}
          />

          <PaginatedSelect
            label="Departamento Académico"
            name="departamento"
            value={data.departamento}
            selectedName={data.departamento_nombre}
            fetchFn={academicService.getDepartamentos}
            placeholder="Seleccione un departamento"
            disabled={!data.facultad}
            dependencia={data.facultad}
            onChange={(e, nombre) => {
              handleChange(e);
              updateData('departamento_nombre', nombre);
            }}
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

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="es_tesis_quinto_anio"
              name="es_tesis_quinto_anio"
              className="h-4 w-4 rounded border-slate-300 text-[#b1122b] focus:ring-[#b1122b]/20 transition-all cursor-pointer accent-[#b1122b]"
              checked={!!data.es_tesis_quinto_anio}
              onChange={handleChange}
            />
            <label
              htmlFor="es_tesis_quinto_anio"
              className="text-sm font-semibold text-slate-600 cursor-pointer select-none"
            >
              ¿Es tesis de 5to año?
            </label>
          </div>

          <PaginatedSelect
            label="Periodo Académico"
            name="periodo"
            value={data.periodo}
            selectedName={data.periodo_nombre}
            fetchFn={academicService.getPeriodos}
            placeholder="Seleccione el periodo"
            onChange={(e, nombre) => {
              handleChange(e);
              updateData('periodo_nombre', nombre);
            }}
          />

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

        {/* Le pasamos data completo para que gestione toda la estructura JSON */}
        <EjeRSUSelector
          data={data}
          updateData={updateData}
        />
      </div>

      {/* 4. TIPO DE ACTIVIDAD */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-100">
          Tipo de Actividad <span className="text-red-500 font-normal text-xs">(puede seleccionar varias)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Programas formativos", value: "programas_formativos" },
            { label: "Acompañamiento a sectores identificados", value: "acompanamiento" },
            { label: "Asesoría", value: "asesoria" },
            { label: "Iniciativas de acercamiento a la comunidad", value: "acercamiento_comunidad" },
          ].map(({ label, value }) => {
            const isSelected = (data.tiposActividad || []).includes(value);
            return (
              <label
                key={value}
                className={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                  ? 'bg-red-50/60 border-[#b1122b] shadow-sm font-semibold text-[#b1122b]'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <input
                  type="checkbox"
                  value={value}
                  checked={isSelected}
                  onChange={(e) => {
                    const current = data.tiposActividad || [];
                    if (e.target.checked) {
                      updateData("tiposActividad", [...current, value]);
                    } else {
                      updateData("tiposActividad", current.filter(v => v !== value));
                    }
                  }}
                  className="mt-0.5 w-4 h-4 text-[#b1122b] focus:ring-[#b1122b] border-slate-300 rounded"
                />
                <span className="text-xs leading-tight">{label}</span>
              </label>
            );
          })}

          {/* OPCIÓN "OTROS" */}
          {(() => {
            const isOtrosChecked = (data.tiposActividad || []).includes("otro");
            return (
              <label
                className={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isOtrosChecked
                  ? 'bg-red-50/60 border-[#b1122b] shadow-sm font-semibold text-[#b1122b]'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <input
                  type="checkbox"
                  value="otro"
                  checked={isOtrosChecked}
                  onChange={(e) => {
                    const current = data.tiposActividad || [];
                    if (e.target.checked) {
                      updateData("tiposActividad", [...current, "otro"]);
                    } else {
                      updateData("tiposActividad", current.filter(v => v !== "otro"));
                      updateData("tipoActividadOtro", "");
                    }
                  }}
                  className="mt-0.5 w-4 h-4 text-[#b1122b] focus:ring-[#b1122b] border-slate-300 rounded"
                />
                <span className="text-xs leading-tight">Otros (especificar)</span>
              </label>
            );
          })()}
        </div>

        {/* INPUT TEXTO SOLO SI "OTROS" ESTÁ MARCADO */}
        {(data.tiposActividad || []).includes("otro") && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-3 bg-slate-50 p-4 rounded-lg border border-slate-200 w-full md:w-1/2">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Especifique el tipo de actividad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400 shadow-inner"
              placeholder="Escriba aquí..."
              value={data.tipoActividadOtro || ''}
              onChange={(e) => updateData("tipoActividadOtro", e.target.value)}
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

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          {listaMetas.map((meta, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4"
            >
              <input
                type="text"
                placeholder="Descripción de la meta"
                value={meta.meta_descripcion}
                onChange={(e) =>
                  handleMetaChange(index, "meta_descripcion", e.target.value)
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />

              <input
                type="text"
                placeholder="Nombre del indicador"
                value={meta.indicador_nombre}
                onChange={(e) =>
                  handleMetaChange(index, "indicador_nombre", e.target.value)
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />

              <input
                type="number"
                placeholder="Línea base"
                value={meta.linea_base}
                onChange={(e) =>
                  handleMetaChange(index, "linea_base", e.target.value)
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />

              <input
                type="number"
                placeholder="Valor meta"
                value={meta.valor_meta}
                onChange={(e) =>
                  handleMetaChange(index, "valor_meta", e.target.value)
                }
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />

              <button
                type="button"
                onClick={() => eliminarMeta(index)}
                className="h-10 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={agregarMeta}
            className="mt-2 px-4 py-2 rounded-md bg-[#b1122b] text-white hover:bg-[#920f24]"
          >
            + Agregar meta e indicador
          </button>
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
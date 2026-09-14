import React, { useState, useEffect } from 'react';
import { FiTrash2, FiPlus } from "react-icons/fi";
// Ajustamos las rutas hacia la carpeta shared
import PaginatedSelect from '../../../../shared/components/forms/PaginatedSelect';
import BeneficiariosSelector from '../../../../shared/components/forms/BeneficiariosSelector';
import EjeRSUSelector from '../../../../shared/components/forms/EjeRSUSelector';
// Importamos el API correcto
import { catalogoApi } from '../../../../shared/api/usuario/catalogoApi';

export default function DatosGenerales({ data, updateData }) {

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (type === 'date' && value) {
      if (name === 'fechaTermino' && data.fechaInicio && value < data.fechaInicio) {
        alert('La fecha de término no puede ser anterior a la fecha de inicio.');
        return;
      }
      if (name === 'fechaInicio' && data.fechaTermino && value > data.fechaTermino) {
        alert('La fecha de inicio no puede ser posterior a la fecha de término.');
        return;
      }
    }

    // Si pasa la validación o es otro tipo de input, actualiza en el Hook
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

  // Sincronizamos el estado local de metas con el hook global
  useEffect(() => {
    updateData("metas_indicadores", listaMetas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // Envolvemos la llamada para estandarizar la respuesta para PaginatedSelect
            fetchFn={async () => {
              const res = await catalogoApi.obtenerFacultades();
              return res.results ? res : { results: res, next: null };
            }}
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
            // Mapeamos el parámetro 'dep' (dependencia) que envía PaginatedSelect hacia el backend
            fetchFn={async (page, dep) => {
              const res = await catalogoApi.obtenerEscuelas(dep);
              return res.results ? res : { results: res, next: null };
            }}
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
            // Mapeamos el parámetro 'dep'
            fetchFn={async (page, dep) => {
              const res = await catalogoApi.obtenerDepartamentos(dep);
              return res.results ? res : { results: res, next: null };
            }}
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Año de Carrera
            </label>
            <select
              name="anio_carrera"
              value={data.anio_carrera || ''}
              onChange={handleChange}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
            >
              <option value="">Seleccione un año</option>
              <option value="1">1° Año</option>
              <option value="2">2° Año</option>
              <option value="3">3° Año</option>
              <option value="4">4° Año</option>
              <option value="5">5° Año</option>
            </select>
          </div>

          {data.anio_carrera === '5' && (
            <div className="md:col-span-2">
              <CheckboxItem
                label="Este proyecto es tesis de 5to año"
                name="es_tesis_quinto_anio"
              />
            </div>
          )}

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Asignatura(s) participante(s) <span className="text-red-500">*</span></label>
            <input className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400" name="asignaturas" placeholder="Ej. Desarrollo Web, Bases de Datos" value={data.asignaturas} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Título del Proyecto <span className="text-red-500">*</span></label>
            <textarea className="min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-vertical" name="titulo" placeholder="Ingrese el título completo..." value={data.titulo} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              N° Docentes Participantes <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
              name="numDocentes"
              value={data.numDocentes === null ? '' : data.numDocentes}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              N° Estudiantes Participantes <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
              name="numEstudiantes"
              value={data.numEstudiantes === null ? '' : data.numEstudiantes}
              onChange={handleChange}
            />
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
        {/* CABECERA DE SECCIÓN */}
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Meta e Indicador</h3>
          <span className="text-xs font-semibold text-slate-500">
            {listaMetas.length} {listaMetas.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          {listaMetas.map((meta, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-all relative"
            >
              {/* NUMERACIÓN Y BOTÓN ELIMINAR */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Meta #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarMeta(index)}
                  title="Eliminar registro"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              {/* GRILLA DE CAMPOS (12 Columnas) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 1. Descripción de la Meta (Textarea - 5 columnas) */}
                <div className="md:col-span-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-600 mb-1">
                    Descripción de la meta
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describa detalladamente la meta..."
                    value={meta.meta_descripcion}
                    onChange={(e) =>
                      handleMetaChange(index, "meta_descripcion", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] resize-y transition-all"
                  />
                </div>

                {/* 2. Nombre del Indicador (Textarea - 4 columnas) */}
                <div className="md:col-span-4 flex flex-col">
                  <label className="text-xs font-semibold text-slate-600 mb-1">
                    Nombre del indicador
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nombre o fórmula del indicador..."
                    value={meta.indicador_nombre}
                    onChange={(e) =>
                      handleMetaChange(index, "indicador_nombre", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] resize-y transition-all"
                  />
                </div>

                {/* 3. Números: Línea Base y Valor Meta (3 columnas) */}
                <div className="md:col-span-3 grid grid-cols-2 gap-2 content-start">
                  <div className="flex flex-col">
                    <label
                      className="text-xs font-semibold text-slate-600 mb-1 truncate"
                      title="Línea base"
                    >
                      Línea base
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={meta.linea_base}
                      onChange={(e) =>
                        handleMetaChange(index, "linea_base", e.target.value)
                      }
                      className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label
                      className="text-xs font-semibold text-slate-600 mb-1 truncate"
                      title="Valor meta"
                    >
                      Valor meta
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={meta.valor_meta}
                      onChange={(e) =>
                        handleMetaChange(index, "valor_meta", e.target.value)
                      }
                      className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* BOTÓN AGREGAR */}
          <button
            type="button"
            onClick={agregarMeta}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#b1122b] text-white text-sm font-medium hover:bg-[#920f24] active:bg-[#780c1d] transition-colors shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Agregar meta e indicador
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
            <input
              type="date"
              className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all ${(data.fechaInicio && data.fechaTermino && data.fechaInicio > data.fechaTermino)
                ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                : 'border-slate-300 focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b]'
                }`}
              name="fechaInicio"
              value={data.fechaInicio || ""}
              max={data.fechaTermino || undefined}
              onChange={handleChange}
            />
            {(data.fechaInicio && data.fechaTermino && data.fechaInicio > data.fechaTermino) && (
              <span className="text-[10px] text-red-600 block mt-0.5 font-medium">Mayor a la fecha de término</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Fecha de Evaluación de Avance
            </label>
            <input
              type="date"
              className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all ${data.fechaEvaluacion &&
                ((data.fechaInicio && data.fechaEvaluacion < data.fechaInicio) ||
                  (data.fechaTermino && data.fechaEvaluacion > data.fechaTermino))
                ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                : 'border-slate-300 focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b]'
                }`}
              name="fechaEvaluacion"
              value={data.fechaEvaluacion || ""}
              min={data.fechaInicio || undefined}
              max={data.fechaTermino || undefined}
              onChange={handleChange}
            />
            {data.fechaEvaluacion &&
              ((data.fechaInicio && data.fechaEvaluacion < data.fechaInicio) ||
                (data.fechaTermino && data.fechaEvaluacion > data.fechaTermino)) && (
                <span className="text-[10px] text-red-600 block mt-0.5 font-medium">
                  Debe estar entre la fecha de inicio y término
                </span>
              )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Fecha de Término <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all ${(data.fechaTermino && data.fechaInicio && data.fechaTermino < data.fechaInicio)
                ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                : 'border-slate-300 focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b]'
                }`}
              name="fechaTermino"
              value={data.fechaTermino || ""}
              min={data.fechaInicio || undefined}
              onChange={handleChange}
            />
            {(data.fechaTermino && data.fechaInicio && data.fechaTermino < data.fechaInicio) && (
              <span className="text-[10px] text-red-600 block mt-0.5 font-medium">Menor a la fecha de inicio</span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mt-4">
          <label className="text-xs font-bold text-slate-700 block mb-3">Fechas de Aplicación de Encuestas</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Encuesta a Docentes */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-500">
                Encuesta a Docentes
              </label>
              <input
                type="date"
                className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all ${data.encuestaDocentes &&
                    ((data.fechaInicio && data.encuestaDocentes < data.fechaInicio) ||
                      (data.fechaTermino && data.encuestaDocentes > data.fechaTermino))
                    ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b]'
                  }`}
                name="encuestaDocentes"
                value={data.encuestaDocentes || ""}
                min={data.fechaInicio || undefined}
                max={data.fechaTermino || undefined}
                onChange={handleChange}
              />
              {data.encuestaDocentes &&
                ((data.fechaInicio && data.encuestaDocentes < data.fechaInicio) ||
                  (data.fechaTermino && data.encuestaDocentes > data.fechaTermino)) && (
                  <span className="text-[10px] text-red-600 block mt-0.5 font-medium">
                    Debe estar entre la fecha de inicio y término
                  </span>
                )}
            </div>

            {/* Encuesta a Estudiantes */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-500">
                Encuesta a Estudiantes
              </label>
              <input
                type="date"
                className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all ${data.encuestaEstudiantes &&
                    ((data.fechaInicio && data.encuestaEstudiantes < data.fechaInicio) ||
                      (data.fechaTermino && data.encuestaEstudiantes > data.fechaTermino))
                    ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b]'
                  }`}
                name="encuestaEstudiantes"
                value={data.encuestaEstudiantes || ""}
                min={data.fechaInicio || undefined}
                max={data.fechaTermino || undefined}
                onChange={handleChange}
              />
              {data.encuestaEstudiantes &&
                ((data.fechaInicio && data.encuestaEstudiantes < data.fechaInicio) ||
                  (data.fechaTermino && data.encuestaEstudiantes > data.fechaTermino)) && (
                  <span className="text-[10px] text-red-600 block mt-0.5 font-medium">
                    Debe estar entre la fecha de inicio y término
                  </span>
                )}
            </div>

            {/* Encuesta a Grupo Destinatario */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-500">
                Encuesta a Grupo Destinatario
              </label>
              <input
                type="date"
                className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all ${data.encuestaDestinatarios &&
                    ((data.fechaInicio && data.encuestaDestinatarios < data.fechaInicio) ||
                      (data.fechaTermino && data.encuestaDestinatarios > data.fechaTermino))
                    ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b]'
                  }`}
                name="encuestaDestinatarios"
                value={data.encuestaDestinatarios || ""}
                min={data.fechaInicio || undefined}
                max={data.fechaTermino || undefined}
                onChange={handleChange}
              />
              {data.encuestaDestinatarios &&
                ((data.fechaInicio && data.encuestaDestinatarios < data.fechaInicio) ||
                  (data.fechaTermino && data.encuestaDestinatarios > data.fechaTermino)) && (
                  <span className="text-[10px] text-red-600 block mt-0.5 font-medium">
                    Debe estar entre la fecha de inicio y término
                  </span>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
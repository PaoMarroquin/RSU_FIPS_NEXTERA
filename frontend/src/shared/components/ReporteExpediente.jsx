import React from 'react';
import { FiFileText, FiPrinter } from 'react-icons/fi';

const ReporteExpediente = ({
  matrizSeleccionada,
  showPrintButton = false,
}) => {
  if (!matrizSeleccionada) {
    return (
      <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs">
        <FiFileText className="w-12 h-12 text-slate-300 mb-2" />
        <span className="font-semibold text-slate-500">
          Selecciona un proyecto
        </span>
      </div>
    );
  }

  const proyecto = matrizSeleccionada;

  const fecha = (valor) => {
    if (!valor) return 'No registrada';

    const [anio, mes, dia] = valor.split('T')[0].split('-');

    return `${dia}/${mes}/${anio}`;
  };

  const moneda = (valor) =>
    `S/ ${Number(valor || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const ejes = proyecto.ejes_rsu_info || [];
  const ods = proyecto.ods_info || [];
  const metas = proyecto.metas_indicadores || [];
  const actividades = proyecto.actividades || [];
  const cronograma = proyecto.cronograma || [];
  const fuentes = proyecto.fuentes_financiamiento || [];

  const tiposActividad = (
    proyecto.tipo_actividad_display ||
    proyecto.tipo_actividad ||
    []
  );

  const acciones = actividades.flatMap((actividad) =>
    (actividad.acciones || []).map((accion) => ({
      ...accion,
      actividadNombre: actividad.nombre,
      actividadDescripcion: actividad.descripcion,
      actividadOrden: actividad.orden,
    }))
  );

  const estadoLabel = (estado) => {
    const estados = {
      borrador: 'Borrador',
      en_revision: 'En revisión',
      aprobado: 'Aprobado',
      en_ejecucion: 'En ejecución',
      finalizado: 'Finalizado',
      observado: 'Observado',
      no_iniciado: 'No iniciado',
      en_progreso: 'En progreso',
      completada: 'Completada',
    };

    return estados[estado] || estado || 'No registrado';
  };

  const seccion =
    'text-[11px] font-bold text-white bg-slate-800 px-2 py-1 uppercase font-sans tracking-wider';

  const celda =
    'p-2 border-b border-slate-300 align-top';

  const etiqueta =
    'p-2 font-bold bg-slate-50 border-b border-r border-slate-300 align-top w-4/12';

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <FiPrinter />
            Imprimir todo el expediente
          </button>
        </div>
      )}

      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-md p-5 md:p-10 max-w-4xl mx-auto border-t-[6px] border-t-[#b1122b] font-serif text-slate-900 select-text leading-relaxed">
        {/* ENCABEZADO */}
        <header className="text-center space-y-1 border-b-2 border-slate-800 pb-5 mb-6 font-sans">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">
            Universidad Nacional de San Agustín de Arequipa
          </h2>

          <h3 className="text-xs font-bold text-slate-600 uppercase">
            Vicerrectorado Académico
          </h3>

          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Oficina Universitaria de Responsabilidad Social (OURS)
          </h3>

          <div className="pt-4">
            <h1 className="text-xs font-extrabold uppercase border-y-2 border-slate-900 py-2 inline-block px-4 bg-slate-50">
              Expediente Integral Consolidado de Proyecto RSU
            </h1>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            Código: {proyecto.codigo || `RSU-PRY-${proyecto.id}`}
          </p>
        </header>

        {/* 1. DATOS GENERALES */}
        <section className="space-y-3 mb-6">
          <h4 className={seccion}>
            1. Datos Informativos Generales
          </h4>

          <table className="w-full text-xs border border-slate-300 border-collapse">
            <tbody>
              <tr>
                <td className={etiqueta}>Título del proyecto</td>
                <td className={celda}>{proyecto.titulo || 'Sin registrar'}</td>
              </tr>

              <tr>
                <td className={etiqueta}>Código de registro</td>
                <td className={`${celda} font-mono`}>
                  {proyecto.codigo || `RSU-PRY-${proyecto.id}`}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Facultad</td>
                <td className={celda}>
                  {proyecto.facultad_nombre || 'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Escuela profesional</td>
                <td className={celda}>
                  {proyecto.escuela_nombre || 'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Departamento académico</td>
                <td className={celda}>
                  {proyecto.departamento_nombre || 'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Semestre académico</td>
                <td className={celda}>
                  {proyecto.semestre_academico || 'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Periodo</td>
                <td className={celda}>
                  {proyecto.periodo_nombre || proyecto.periodo || 'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Lugar de ejecución</td>
                <td className={celda}>
                  {proyecto.lugar_ejecucion || 'No especificado'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Estado del proyecto</td>
                <td className={`${celda} font-bold`}>
                  {estadoLabel(proyecto.estado)}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Porcentaje de ejecución</td>
                <td className={celda}>
                  {proyecto.porcentaje_ejecucion ?? 0}%
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Ejes RSU</td>
                <td className={celda}>
                  {ejes.length > 0
                    ? ejes.map((eje) => eje.nombre).join(', ')
                    : 'Sin ejes registrados'}

                  {(proyecto.ejes_subitems || []).length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-slate-600">
                      {proyecto.ejes_subitems.map((subitem) => (
                        <li key={subitem.id}>
                          {subitem.sub_eje_nombre || subitem.sub_eje_clave}
                          {subitem.detalle && ` — ${subitem.detalle}`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {proyecto.eje_detalle && (
                    <p className="mt-2">
                      <b>Detalle:</b> {proyecto.eje_detalle}
                    </p>
                  )}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Tipo de actividad</td>
                <td className={celda}>
                  {tiposActividad.length > 0
                    ? tiposActividad.join(', ')
                    : proyecto.tipo_actividad_otro || 'No declarado'}

                  {proyecto.tipo_actividad_otro && tiposActividad.length > 0 &&
                    ` — ${proyecto.tipo_actividad_otro}`}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Fechas principales</td>
                <td className={celda}>
                  <p><b>Inicio:</b> {fecha(proyecto.fecha_inicio)}</p>
                  <p><b>Término:</b> {fecha(proyecto.fecha_termino)}</p>
                  <p><b>Evaluación de avance:</b> {fecha(proyecto.fecha_evaluacion_avance)}</p>
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Docente responsable</td>
                <td className={celda}>
                  {[
                    proyecto.docente_responsable_detalle?.nombres,
                    proyecto.docente_responsable_detalle?.apellidos,
                  ].filter(Boolean).join(' ') ||
                    proyecto.docente_responsable_nombre ||
                    'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Docentes participantes</td>
                <td className={celda}>
                  {(proyecto.docentes_participantes || []).join(', ') ||
                    'Sin registrar'}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Estudiantes participantes</td>
                <td className={celda}>
                  {proyecto.nro_estudiantes ?? 0}
                  {proyecto.observacion_estudiantes &&
                    ` — ${proyecto.observacion_estudiantes}`}
                </td>
              </tr>

              <tr>
                <td className={etiqueta}>Beneficiarios</td>
                <td className={celda}>
                  {(proyecto.beneficiarios_info || [])
                    .map((beneficiario) =>
                      typeof beneficiario === 'object'
                        ? beneficiario.nombre || beneficiario.nombre_display || ''
                        : beneficiario
                    )
                    .filter(Boolean)
                    .join(', ') ||
                    (proyecto.beneficiarios || []).join(', ') ||
                    proyecto.benef_otro_detalle ||
                    'Sin registrar'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* METAS */}
          <h5 className="text-xs font-bold mt-4">Metas e indicadores</h5>

          {metas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border border-slate-300 border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border border-slate-300">Meta</th>
                    <th className="p-2 border border-slate-300">Indicador</th>
                    <th className="p-2 border border-slate-300">Línea base</th>
                    <th className="p-2 border border-slate-300">Valor meta</th>
                    <th className="p-2 border border-slate-300">Alcanzado</th>
                    <th className="p-2 border border-slate-300">% avance</th>
                  </tr>
                </thead>

                <tbody>
                  {metas.map((meta) => (
                    <tr key={meta.id}>
                      <td className="p-2 border border-slate-300">
                        {meta.meta_descripcion || '—'}
                      </td>
                      <td className="p-2 border border-slate-300">
                        {meta.indicador_nombre || '—'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {meta.linea_base ?? '—'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {meta.valor_meta ?? '—'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {meta.valor_alcanzado ?? '—'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {meta.porcentaje_avance ?? 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Sin metas e indicadores registrados.
            </p>
          )}
        </section>

        {/* 2. FUNDAMENTACIÓN */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>2. Fundamentación Institucional</h4>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
            <p>
              <b>¿Por qué se eligió a este grupo humano?:</b>{' '}
              {proyecto.fund_por_que_grupo || 'Sin registrar.'}
            </p>
            <p>
              <b>¿Para qué se realiza el proyecto?:</b>{' '}
              {proyecto.fund_para_que_proyecto || 'Sin registrar.'}
            </p>
            <p>
              <b>Mecanismo de enseñanza/metodología:</b>{' '}
              {proyecto.fund_mecanismo_ensenanza || 'Sin registrar.'}
            </p>
          </div>
        </section>

        {/* 3. DIAGNÓSTICO */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>3. Diagnóstico de la Realidad y Contexto</h4>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
            <p>
              <b>Estado actual del grupo:</b>{' '}
              {proyecto.diag_estado_grupo || 'Sin registrar.'}
            </p>
            <p>
              <b>Problemas prioritarios:</b>{' '}
              {proyecto.diag_problemas_detectados || 'Sin registrar.'}
            </p>
            <p>
              <b>Aportes a la formación académica:</b>{' '}
              {proyecto.diag_aportes_formacion || 'Sin registrar.'}
            </p>
            <p>
              <b>Justificación de la intervención:</b>{' '}
              {proyecto.diag_justificacion_intervencion || 'Sin registrar.'}
            </p>
          </div>
        </section>

        {/* 4. OBJETIVOS Y ODS */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>4. Objetivos del Plan e Impacto ODS</h4>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
            <p>
              <b>Logros buscados en los beneficiarios:</b>{' '}
              {proyecto.obj_logro_intervencion || 'Sin registrar.'}
            </p>
            <p>
              <b>Mejoras en el diseño curricular:</b>{' '}
              {proyecto.obj_mejora_curricular || 'Sin registrar.'}
            </p>
            <p>
              <b>Impacto esperado:</b>{' '}
              {proyecto.impacto_esperado || 'Sin registrar.'}
            </p>

            <div className="pt-2 border-t">
              <b className="block mb-2">Objetivos de Desarrollo Sostenible</b>

              <div className="flex flex-wrap gap-1">
                {ods.length > 0 ? (
                  ods.map((objetivo) => (
                    <span
                      key={objetivo.id}
                      className="bg-sky-100 text-sky-800 border border-sky-200 font-sans font-bold px-2 py-1 rounded text-[10px]"
                    >
                      ODS {objetivo.numero}: {objetivo.nombre}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">Sin ODS registrados</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 5. RESULTADOS */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>5. Resultados e Impacto</h4>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
            <p>
              <b>Resultados en los beneficiarios:</b>{' '}
              {proyecto.resultado_en_beneficiarios || 'Sin registrar.'}
            </p>
            <p>
              <b>Resultados en el currículo:</b>{' '}
              {proyecto.resultado_en_curriculo || 'Sin registrar.'}
            </p>
          </div>
        </section>

        {/* 6. ACTIVIDADES */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>6. Planificación de Actividades</h4>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 font-sans font-bold text-slate-700">
                  <th className="p-2 border border-slate-300">Orden</th>
                  <th className="p-2 border border-slate-300 text-left">Actividad / Acción</th>
                  <th className="p-2 border border-slate-300 text-left">Responsable</th>
                  <th className="p-2 border border-slate-300 text-left">Evidencia</th>
                </tr>
              </thead>

              <tbody>
                {actividades.length > 0 ? (
                  actividades.map((actividad) => {
                    const accionesActividad = actividad.acciones || [];

                    if (accionesActividad.length === 0) {
                      return (
                        <tr key={actividad.id}>
                          <td className="p-2 border border-slate-300 text-center">
                            {actividad.orden ?? '—'}
                          </td>
                          <td className="p-2 border border-slate-300">
                            <b>{actividad.nombre || 'Sin nombre'}</b>
                            {actividad.descripcion && (
                              <p className="text-slate-500">
                                {actividad.descripcion}
                              </p>
                            )}
                          </td>
                          <td className="p-2 border border-slate-300">Sin asignar</td>
                          <td className="p-2 border border-slate-300">Sin especificar</td>
                          <td className="p-2 border border-slate-300 text-center">
                            {estadoLabel(actividad.estado)}
                          </td>
                        </tr>
                      );
                    }

                    return accionesActividad.map((accion) => (
                      <tr key={accion.id}>
                        <td className="p-2 border border-slate-300 text-center">
                          {actividad.orden ?? '—'}.{accion.orden ?? '—'}
                        </td>
                        <td className="p-2 border border-slate-300">
                          <b>{actividad.nombre || 'Sin nombre'}</b>
                          <p className="text-slate-500">
                            {accion.descripcion || actividad.descripcion || '—'}
                          </p>
                        </td>
                        <td className="p-2 border border-slate-300">
                          {accion.responsable || 'Sin asignar'}
                        </td>
                        <td className="p-2 border border-slate-300">
                          {accion.evidencia_esperada || 'Sin especificar'}
                        </td>
                      </tr>
                    ));
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400">
                      Sin actividades registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. CRONOGRAMA */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>7. Cronograma Físico de Avance</h4>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 font-sans font-bold text-slate-700">
                  <th className="p-2 border border-slate-300 text-left">Actividad / Hito</th>
                  <th className="p-2 border border-slate-300">Inicio</th>
                  <th className="p-2 border border-slate-300">Fin</th>
                  <th className="p-2 border border-slate-300">Responsable</th>
                </tr>
              </thead>

              <tbody>
                {cronograma.length > 0 ? (
                  cronograma.map((hito, index) => {
                    const actividad = actividades.find(
                      (item) => item.id === hito.actividad
                    );

                    return (
                      <tr key={hito.id || index}>
                        <td className="p-2 border border-slate-300">
                          {actividad?.nombre
                            ? `${actividad.nombre} — ${hito.descripcion || ''}`
                            : hito.descripcion || 'Sin descripción'}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          {fecha(hito.fecha_inicio)}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          {fecha(hito.fecha_fin)}
                        </td>
                        <td className="p-2 border border-slate-300">
                          {hito.responsable || 'Sin asignar'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400">
                      Sin hitos de cronograma registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. RECURSOS */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>8. Recursos Humanos y Materiales</h4>

          <table className="w-full text-xs border border-slate-300 border-collapse">
            <tbody>
              <tr>
                <td className={etiqueta}>Docentes</td>
                <td className={celda}>{proyecto.rec_hum_docentes ?? 0}</td>
              </tr>
              <tr>
                <td className={etiqueta}>Estudiantes</td>
                <td className={celda}>{proyecto.rec_hum_estudiantes ?? 0}</td>
              </tr>
              <tr>
                <td className={etiqueta}>Administrativos</td>
                <td className={celda}>{proyecto.rec_hum_administrativos ?? 0}</td>
              </tr>
              <tr>
                <td className={etiqueta}>Egresados</td>
                <td className={celda}>{proyecto.rec_hum_egresados ?? 0}</td>
              </tr>
              <tr>
                <td className={etiqueta}>Voluntarios</td>
                <td className={celda}>{proyecto.rec_hum_voluntarios ?? 0}</td>
              </tr>
              <tr>
                <td className={etiqueta}>Otros recursos humanos</td>
                <td className={celda}>{proyecto.rec_hum_otros ?? 0}</td>
              </tr>
              <tr>
                <td className={etiqueta}>Material didáctico</td>
                <td className={celda}>
                  {proyecto.rec_mat_material_didactico || 'No declarado'}
                </td>
              </tr>
              <tr>
                <td className={etiqueta}>Equipos</td>
                <td className={celda}>
                  {proyecto.rec_mat_equipos || 'No declarado'}
                </td>
              </tr>
              <tr>
                <td className={etiqueta}>Útiles</td>
                <td className={celda}>
                  {proyecto.rec_mat_utiles || 'No declarado'}
                </td>
              </tr>
              <tr>
                <td className={etiqueta}>Afiches</td>
                <td className={celda}>
                  {proyecto.rec_mat_afiches || 'No declarado'}
                </td>
              </tr>
              <tr>
                <td className={etiqueta}>Otros materiales</td>
                <td className={celda}>
                  {proyecto.rec_mat_otros || 'No declarado'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 9. FINANCIAMIENTO */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>9. Presupuesto y Fuentes de Financiamiento</h4>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs mb-3">
            <p>
              <b>Monto de financiamiento:</b>{' '}
              {moneda(
                fuentes.length > 0
                  ? fuentes.reduce(
                      (total, fuente) => total + Number(fuente.monto || 0),
                      0
                    )
                  : proyecto.monto_financiamiento
              )}
            </p>

            <p>
              <b>Financiamiento confirmado:</b>{' '}
              {proyecto.financiamiento_confirmado ? 'Sí' : 'No'}
            </p>

            {proyecto.observaciones_financiamiento && (
              <p>
                <b>Observaciones:</b>{' '}
                {proyecto.observaciones_financiamiento}
              </p>
            )}
          </div>

          {fuentes.length > 0 ? (
            fuentes.map((fuente, indice) => (
              <div
                key={fuente.id || indice}
                className="mb-4 border border-slate-300 rounded overflow-hidden"
              >
                <div className="bg-slate-100 p-2 border-b border-slate-300 flex flex-wrap justify-between gap-2 text-[11px]">
                  <span className="font-bold text-slate-800">
                    Fuente {indice + 1}: {fuente.fuente_display || fuente.fuente}
                  </span>

                  <span className="font-bold text-[#b1122b]">
                    Monto asignado: {moneda(fuente.monto)}
                  </span>
                </div>

                {fuente.descripcion && (
                  <div className="p-2 text-[10px] text-slate-600 border-b border-slate-300">
                    <b>Detalle:</b> {fuente.descripcion}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="p-2 border border-slate-300 text-left">Categoría</th>
                        <th className="p-2 border border-slate-300 text-left">Descripción</th>
                        <th className="p-2 border border-slate-300">Unidad</th>
                        <th className="p-2 border border-slate-300">Cantidad</th>
                        <th className="p-2 border border-slate-300">Costo unitario</th>
                        <th className="p-2 border border-slate-300">Presupuestado</th>
                        <th className="p-2 border border-slate-300">Ejecutado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(fuente.partidas || []).length > 0 ? (
                        fuente.partidas.map((partida, indicePartida) => (
                          <tr key={partida.id || indicePartida}>
                            <td className="p-2 border border-slate-300">
                              {partida.categoria_display || partida.categoria || '—'}
                            </td>
                            <td className="p-2 border border-slate-300">
                              {partida.descripcion || '—'}
                            </td>
                            <td className="p-2 border border-slate-300 text-center">
                              {partida.unidad || '—'}
                            </td>
                            <td className="p-2 border border-slate-300 text-center">
                              {partida.cantidad ?? '—'}
                            </td>
                            <td className="p-2 border border-slate-300 text-right">
                              {moneda(partida.costo_unitario)}
                            </td>
                            <td className="p-2 border border-slate-300 text-right">
                              {moneda(partida.monto_presupuestado)}
                            </td>
                            <td className="p-2 border border-slate-300 text-right">
                              {moneda(partida.monto_ejecutado)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-3 text-center text-slate-400">
                            Sin partidas registradas para esta fuente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">
              Sin fuentes de financiamiento registradas.
            </p>
          )}
        </section>

        {/* 10. INFORME DE FINALIZACIÓN */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>10. Informe de Finalización</h4>

          <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
            <p>
              <b>Estado del informe:</b>{' '}
              {estadoLabel(proyecto.informe_finalizacion_estado)}
            </p>
            <p>
              <b>Conclusiones:</b>{' '}
              {proyecto.conclusiones || 'Sin registrar.'}
            </p>
            <p>
              <b>Recomendaciones:</b>{' '}
              {proyecto.recomendaciones || 'Sin registrar.'}
            </p>
            <p>
              <b>Lecciones aprendidas:</b>{' '}
              {proyecto.lecciones_aprendidas || 'Sin registrar.'}
            </p>
            <p>
              <b>Medio de difusión:</b>{' '}
              {proyecto.medio_difusion || 'Sin registrar.'}
            </p>
            <p>
              <b>Constancia aprobada:</b>{' '}
              {proyecto.constancia_aprobada ? 'Sí' : 'No'}
            </p>
          </div>

          {(proyecto.documentos_sustento || []).length > 0 && (
            <div className="text-xs">
              <b>Documentos de sustento</b>
              <ul className="list-disc list-inside mt-1">
                {proyecto.documentos_sustento.map((documento, index) => (
                  <li key={documento.id || index}>
                    {documento.nombre || documento.nombre_archivo || `Documento ${index + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 11. TRAZABILIDAD */}
        <section className="space-y-2 mb-6">
          <h4 className={seccion}>11. Historial y Trazabilidad</h4>

          <div className="text-xs space-y-2">
            <p>
              <b>Creación:</b> {fecha(proyecto.created_at)}
            </p>
            <p>
              <b>Última actualización:</b> {fecha(proyecto.updated_at)}
            </p>
            <p>
              <b>Envío a revisión:</b> {fecha(proyecto.fecha_envio_revision)}
            </p>
            <p>
              <b>Aprobación:</b> {fecha(proyecto.fecha_aprobacion)}
            </p>
            <p>
              <b>Inicio de ejecución:</b> {fecha(proyecto.fecha_inicio_ejecucion)}
            </p>
            <p>
              <b>Cierre:</b> {fecha(proyecto.fecha_cierre)}
            </p>
          </div>

          {(proyecto.historial_estados || []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border border-slate-300 border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border border-slate-300">Fecha</th>
                    <th className="p-2 border border-slate-300">Estado anterior</th>
                    <th className="p-2 border border-slate-300">Estado nuevo</th>
                    <th className="p-2 border border-slate-300">Usuario</th>
                    <th className="p-2 border border-slate-300">Comentario</th>
                  </tr>
                </thead>

                <tbody>
                  {proyecto.historial_estados.map((registro) => (
                    <tr key={registro.id}>
                      <td className="p-2 border border-slate-300">
                        {fecha(registro.created_at)}
                      </td>
                      <td className="p-2 border border-slate-300">
                        {estadoLabel(registro.estado_anterior)}
                      </td>
                      <td className="p-2 border border-slate-300">
                        {estadoLabel(registro.estado_nuevo)}
                      </td>
                      <td className="p-2 border border-slate-300">
                        {registro.usuario_nombre || '—'}
                      </td>
                      <td className="p-2 border border-slate-300">
                        {registro.comentario || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(proyecto.revisiones || []).length > 0 && (
            <>
              <h5 className="font-bold mt-4">Revisiones</h5>

              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border border-slate-300 border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 border border-slate-300">Fecha</th>
                      <th className="p-2 border border-slate-300">Etapa</th>
                      <th className="p-2 border border-slate-300">Decisión</th>
                      <th className="p-2 border border-slate-300">Revisor</th>
                      <th className="p-2 border border-slate-300">Comentario</th>
                    </tr>
                  </thead>

                  <tbody>
                    {proyecto.revisiones.map((revision) => (
                      <tr key={revision.id}>
                        <td className="p-2 border border-slate-300">
                          {fecha(revision.created_at)}
                        </td>
                        <td className="p-2 border border-slate-300">
                          {revision.etapa || '—'}
                        </td>
                        <td className="p-2 border border-slate-300">
                          {estadoLabel(revision.decision)}
                        </td>
                        <td className="p-2 border border-slate-300">
                          {revision.revisor_nombre || '—'}
                        </td>
                        <td className="p-2 border border-slate-300">
                          {revision.comentario_tecnico || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* 12. FIRMAS */}
        <section className="mt-12 pt-6 border-t-2 border-slate-800 font-sans">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
            12. Validación de Firmas
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
            <div className="flex flex-col items-center justify-end min-h-32 border border-slate-200 bg-slate-50 p-4 rounded-xl relative overflow-hidden">
              {proyecto.docente_responsable_detalle?.firma_digital ? (
                <img
                  src={proyecto.docente_responsable_detalle.firma_digital}
                  alt="Firma del docente responsable"
                  className="max-h-16 max-w-full object-contain mb-2"
                />
              ) : (
                <div className="text-[9px] text-slate-400 mb-4">
                  Sin firma digital registrada
                </div>
              )}

              <div className="w-48 border-b border-slate-400 mb-1" />

              <span className="font-bold text-slate-800 text-[11px]">
                {[
                  proyecto.docente_responsable_detalle?.nombres,
                  proyecto.docente_responsable_detalle?.apellidos,
                ].filter(Boolean).join(' ') ||
                  proyecto.docente_responsable_nombre ||
                  'Docente responsable'}
              </span>

              <span className="text-[9px] text-slate-500 break-all">
                {proyecto.docente_responsable_detalle?.correo_institucional || ''}
              </span>
            </div>

            <div className="flex flex-col items-center justify-end min-h-32 border border-slate-200 bg-slate-50 p-4 rounded-xl">
              <div className="text-[9px] font-bold text-emerald-700 border border-emerald-200 px-2 py-1 rounded mb-4">
                VALIDACIÓN INSTITUCIONAL
              </div>

              <div className="w-48 border-b border-slate-400 border-dashed mb-1" />

              <span className="font-bold text-slate-800 text-[11px]">
                Oficina Universitaria de Responsabilidad Social
              </span>

              <span className="text-[9px] text-slate-500">
                Estado del proyecto: {estadoLabel(proyecto.estado)}
              </span>
            </div>
          </div>
        </section>

        {/* PIE */}
        <footer className="mt-10 text-[9px] text-slate-400 font-mono border-t pt-2 flex flex-wrap justify-between gap-2 font-sans">
          <span>
            Expediente ID: #{proyecto.id}
          </span>
          <span>
            Código: {proyecto.codigo || 'Sin código'}
          </span>
          <span>
            Actualizado: {fecha(proyecto.updated_at)}
          </span>
        </footer>
      </div>
    </div>
  );
};

export default ReporteExpediente;

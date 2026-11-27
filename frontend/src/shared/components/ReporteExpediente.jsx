import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FiFileText, FiPrinter } from 'react-icons/fi';
import { catalogoPlanificacionApi } from '../api/planificacion/catalogoPlanificacionApi';
import logoUnsa from '../assets/logo-unsa-formato.jpeg';
import { paginarFormato } from './paginarFormato';
import './ReporteExpediente.css';

// Réplica del formato oficial F-PM03.01-01 "Proyecto de Responsabilidad Social"
// (formato OURS): A4, Calibri, mismos márgenes, tablas y numeración.

// 1.9 Beneficiarios (códigos del catálogo TipoBeneficiario).
const BENEFICIARIOS = [
  ['Comunidad universitaria – interna', ['comunidad_universitaria']],
  ['Instituciones Educativas Básico Regulares', ['inst_educativas_basicas']],
  ['Instituciones Educativas Especiales', ['inst_educativas_especiales']],
  ['Gobierno Local, Regional, Nacional', ['gobierno_local', 'gobierno_regional', 'gobierno_nacional']],
  ['Asociaciones', ['asociaciones']],
  ['Organizaciones comunales', ['organizaciones_comunales']],
  ['Sector empresarial', ['sector_empresarial']],
  ['Sectores laborales', ['sectores_laborales']],
  ['Centros Penitenciarios', ['centros_penitenciarios']],
  ['Otro', ['otro']],
];

// 1.10 Tipo de eje: [texto del formato, claves de sub-ítem que marcan la opción].
const AMBITO = 'Detallar el ámbito de intervención';

const EJES = [
  {
    eje: 'Gestión',
    titulo: 'GESTIÓN: (IMPACTO INTERNO - INSTITUCIONAL)',
    items: [
      ['Programa de acciones ambientales a nivel administrativo', ['acc_amb_administrativo']],
      ['Programa de acciones ambientales a nivel académico', ['acc_amb_academico']],
      ['Programa de iniciativas de activación ambiental', ['activacion_ambiental']],
      ['Conjunto de acciones sobre clima laboral y cultura organizacional', ['clima_laboral']],
      ['Iniciativas orientadas a fomentar la inclusión y equidad social en el ámbito laboral', ['inclusion_equidad']],
      ['Otro:', ['otro']],
    ],
  },
  {
    eje: 'Formación',
    titulo: 'FORMACIÓN: (IMPACTO INTERNO - ESTUDIANTES)',
    items: [
      ['Incorpora la temática de ética en el desempeño profesional', ['etica_profesional']],
      ['Incorpora la temática de prácticas anticorrupción en la formación profesional', ['anticorrupcion']],
      ['Incorpora la temática de inclusión social en la formación profesional', ['inclusion_social']],
      ['Incorpora la temática de equidad en el desarrollo profesional', ['equidad']],
      ['Incorpora la temática Educación ambiental relacionado al ejercicio profesional', ['educacion_ambiental']],
      ['Incorpora la temática de Derechos Humanos en la formación profesional', ['derechos_humanos']],
      ['Incorpora la temática Objetivos de Desarrollo Sostenible en la formación profesional', ['ods']],
      ['Otro:', ['otro']],
    ],
  },
  {
    eje: 'Investigación',
    titulo: 'INVESTIGACIÓN: (IMPACTO INTERNO - ESTUDIANTES)',
    items: [
      ['Contribuye a alguna de las metas de los Objetivos de Desarrollo Sostenible', ['metas_ods']],
      ['Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia',
        ['politicas_salud', 'educacion', 'igualdad_genero', 'inclusion_social', 'justicia']],
      ['Contribuye a la formación ciudadana', ['formacion_ciudadana']],
      ['Contribuye a mejorar calidad de vida y condiciones económicas', ['calidad_vida', 'condiciones_economicas']],
      ['Contribuye al cumplimiento de la Política Ambiental Nacional (líneas de investigación ambiental MINAM)', ['politica_ambiental']],
    ],
  },
  {
    eje: 'Extensión',
    titulo: 'EXTENSIÓN: (IMPACTO EXTERNO)',
    items: [
      ['Contribuye a alguna de las metas de los Objetivos de Desarrollo Sostenible', ['metas_ods'], 'ODS Nro.'],
      ['Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia', ['salud_educacion'], AMBITO],
      ['Contribuye a la formación ciudadana', ['formacion_ciudadana'], AMBITO],
      ['Contribuye a mejorar calidad de vida y condiciones económicas', ['calidad_vida'], AMBITO],
      ['Contribuye al cumplimiento de la Política Ambiental Nacional (líneas de investigación ambiental MINAM)', ['politica_ambiental'], AMBITO],
    ],
  },
  {
    eje: 'Voluntariado',
    titulo: 'VOLUNTARIADO',
    items: [
      ['Contribuye a la realización de iniciativas de voluntariado (evitando asistencialismo como finalidad de la intervención)',
        ['iniciativas_voluntariado'], AMBITO],
    ],
  },
];

// 1.11 Tipo de actividad.
const TIPOS_ACTIVIDAD = [
  ['programas_formativos', 'Programas formativos', ' - no charlas o capacitaciones aisladas -'],
  ['acompanamiento', 'Acompañamiento a sectores identificados', ''],
  ['asesoria', 'Asesoría', ''],
  ['acercamiento_comunidad', 'Iniciativas de acercamiento a la comunidad', ' – responda a un programa-'],
  ['otro', 'Otros', ''],
];

const marca = (marcado) => (marcado ? '( X )' : '(…..)');

const fecha = (valor) => {
  if (!valor) return '';
  const [anio, mes, dia] = valor.split('T')[0].split('-');
  return `${dia}/${mes}/${anio}`;
};

const moneda = (valor) =>
  `S/ ${Number(valor || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Pregunta guía del formato seguida de la(s) respuesta(s) del proyecto.
const Pregunta = ({ texto, respuestas }) => (
  <li>
    <span className="fo-guia">{texto}</span>
    {respuestas.filter(Boolean).map((respuesta, i) => (
      <p key={i} className="fo-respuesta">{respuesta}</p>
    ))}
  </li>
);

const Titulo = ({ numero, children }) => (
  <h3 className="fo-titulo">
    <span>{numero}</span>
    {children}
  </h3>
);

const Fila = ({ numero, etiqueta, children }) => (
  <tr>
    <th>{numero}</th>
    <td className="fo-etiqueta">{etiqueta}</td>
    <td className="fo-valor">{children}</td>
  </tr>
);

// Relaciona cada sub-ítem con su eje: hay claves repetidas entre ejes.
const useEjePorSubitem = () => {
  const [mapa, setMapa] = useState({});

  useEffect(() => {
    let cancelado = false;

    catalogoPlanificacionApi
      .obtenerEjesRSU()
      .then((data) => {
        if (cancelado) return;
        const ejes = data?.results ?? data ?? [];
        setMapa(Object.fromEntries(
          ejes.flatMap((eje) => (eje.subitems || []).map((sub) => [sub.id, eje.nombre]))
        ));
      })
      .catch((err) => console.error('Error al cargar los ejes RSU:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  return mapa;
};

// Imprime solo la hoja del formato, sin el resto de la aplicación.
const imprimirHoja = (hoja) => {
  const marco = document.createElement('iframe');
  marco.style.cssText = 'position:fixed;width:0;height:0;border:0';
  document.body.appendChild(marco);

  const doc = marco.contentDocument;
  document
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((nodo) => doc.head.appendChild(nodo.cloneNode(true)));
  doc.body.appendChild(hoja.cloneNode(true));

  setTimeout(() => {
    marco.contentWindow.focus();
    marco.contentWindow.print();
    setTimeout(() => marco.remove(), 1000);
  }, 500);
};

const ReporteExpediente = ({
  matrizSeleccionada,
  showPrintButton = false,
}) => {
  const ejePorSubitem = useEjePorSubitem();
  const origenRef = useRef(null);
  const hojaRef = useRef(null);

  // Vuelve a paginar cuando cambian los datos o termina de cargar la firma.
  useLayoutEffect(() => {
    const origen = origenRef.current;
    const destino = hojaRef.current;
    if (!origen || !destino) return undefined;

    let activo = true;
    const paginar = () => activo && paginarFormato(origen, destino);

    paginar();
    document.fonts?.ready.then(paginar);
    const imagenes = Array.from(origen.querySelectorAll('img'));
    imagenes.forEach((img) => img.addEventListener('load', paginar));

    return () => {
      activo = false;
      imagenes.forEach((img) => img.removeEventListener('load', paginar));
    };
  }, [matrizSeleccionada, ejePorSubitem]);

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
  const detalleDocente = proyecto.docente_responsable_detalle;

  const docente =
    [detalleDocente?.nombres, detalleDocente?.apellidos].filter(Boolean).join(' ') ||
    proyecto.docente_responsable_nombre ||
    '';
  const departamento = proyecto.departamento_nombre || '…………………………';
  const anio = (proyecto.semestre_academico || proyecto.fecha_inicio || '').slice(0, 4) || '____';

  const asignaturas = proyecto.asignaturas || [];
  const metas = proyecto.metas_indicadores || [];
  const actividades = proyecto.actividades || [];
  const subitems = proyecto.ejes_subitems || [];
  const ejesProyecto = (proyecto.ejes_rsu_info || []).map((eje) => eje.nombre);
  const tipos = proyecto.tipo_actividad || [];
  const fuentes = proyecto.fuentes_financiamiento || [];

  const codigosBeneficiario = (proyecto.beneficiarios_info || []).map((b) => b.codigo);

  const buscarSubitem = (eje, claves) =>
    subitems.filter((sub) => {
      const ejeSub =
        ejePorSubitem[sub.sub_eje] ||
        (ejesProyecto.length === 1 ? ejesProyecto[0] : null);
      return ejeSub === eje && claves.includes(sub.sub_eje_clave);
    });

  const acciones = actividades.some((a) => a.acciones?.length)
    ? actividades.flatMap((a) => a.acciones || [])
    : proyecto.cronograma || [];

  const total = fuentes.length > 0
    ? fuentes.reduce((suma, f) => suma + Number(f.monto || 0), 0)
    : proyecto.monto_financiamiento;

  const humanos = [
    ['Docentes', proyecto.rec_hum_docentes],
    ['Administrativos', proyecto.rec_hum_administrativos],
    ['Alumnos', proyecto.rec_hum_estudiantes],
    ['Alumnos egresados', proyecto.rec_hum_egresados],
    ['Voluntariado', proyecto.rec_hum_voluntarios],
    ['Otros', proyecto.rec_hum_otros],
  ];

  const materiales = [
    ['Afiches', proyecto.rec_mat_afiches],
    ['Material didáctico', proyecto.rec_mat_material_didactico],
    ['Equipos', proyecto.rec_mat_equipos],
    ['Útiles', proyecto.rec_mat_utiles],
    ['Otros', proyecto.rec_mat_otros],
  ].filter(([, valor]) => valor);

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="print:hidden flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => imprimirHoja(hojaRef.current)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <FiPrinter />
            Imprimir todo el expediente
          </button>
        </div>
      )}

      <div className="fo-contenedor">
        {/* Hojas A4 paginadas (se llenan desde el contenido de abajo). */}
        <div className="formato-ours" ref={hojaRef} />

        <div className="formato-ours fo-origen" ref={origenRef} aria-hidden="true">
          <table className="fo-encabezado">
            <colgroup>
              <col style={{ width: '26.9%' }} />
              <col style={{ width: '42.8%' }} />
              <col style={{ width: '11.2%' }} />
              <col style={{ width: '19.1%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td rowSpan={3}>
                  <img src={logoUnsa} alt="UNSA" />
                </td>
                <th>FORMATO</th>
                <th>Código</th>
                <td className="fo-codigo">F-PM03.01-01</td>
              </tr>
              <tr>
                <th rowSpan={2}>PROYECTO DE PROYECCIÓN SOCIAL Y EXTENSION UNIVERSITARIA</th>
                <th>Versión</th>
                <td>1.0</td>
              </tr>
              <tr>
                <th>Página</th>
                <td className="fo-numero">Página …. de ….</td>
              </tr>
            </tbody>
          </table>

          <div className="fo-cuerpo">
                  <div className="fo-centro">
                    PROYECTO DE RESPONSABILIDAD SOCIAL
                    <br />
                    (FORMATO OURS)
                  </div>

                  <div className="fo-oficio">
                    <div className="fo-campo"><span>A</span>:</div>
                    <p className="fo-sangria">Director del Departamento Académico de {departamento}</p>
                    <div className="fo-campo"><span>DE</span>: {docente}</div>
                    <p className="fo-sangria">Docente adscrito al Departamento Académico de {departamento}</p>
                    <div>
                      <span className="fo-rotulo">ASUNTO</span>: PROYECTO DE RESPONSABILIDAD SOCIAL NRO.{' '}
                      {proyecto.codigo || '_____'}-{anio}-UNSA
                    </div>
                    <div className="fo-campo"><span>FECHA</span>: {fecha(proyecto.fecha_envio_revision)}</div>
                  </div>

                  <p className="fo-intro">
                    Me dirijo a usted para saludarlo y en cumplimiento al criterio de
                    estandarización conforme al SGC, se presenta el formato de Proyecto de
                    Responsabilidad Social, el mismo que será incluido en el Plan Anual de
                    Responsabilidad Social.
                  </p>

                  {/* I. DATOS GENERALES */}
                  <Titulo numero="I.">DATOS GENERALES</Titulo>

                  <table className="fo-tabla fo-datos">
                    <colgroup>
                      <col style={{ width: '1.08cm' }} />
                      <col style={{ width: '6.17cm' }} />
                      <col />
                    </colgroup>
                    <tbody>
                      <Fila numero="1.1" etiqueta="Facultad">{proyecto.facultad_nombre}</Fila>
                      <Fila numero="1.2" etiqueta="Escuela Profesional">{proyecto.escuela_nombre}</Fila>
                      <Fila numero="1.3" etiqueta="Departamento Académico">{proyecto.departamento_nombre}</Fila>
                      <Fila numero="1.4" etiqueta="Semestre">{proyecto.semestre_academico}</Fila>
                      <Fila numero="1.5" etiqueta="Asignatura (s)">
                        {asignaturas.map((a, i) => (
                          <div key={a.id || i}>
                            {a.nombre_asignatura}
                            {a.codigo_asignatura && ` (${a.codigo_asignatura})`}
                          </div>
                        ))}
                      </Fila>
                      <Fila numero="1.6" etiqueta="Título del proyecto">{proyecto.titulo}</Fila>
                      <Fila numero="1.7" etiqueta="Nro. de Docentes que participaron">
                        {proyecto.nro_docentes}
                        {(proyecto.docentes_participantes || []).map((nombre, i) => (
                          <div key={i}>{nombre}</div>
                        ))}
                      </Fila>
                      <Fila numero="1.8" etiqueta="Nro. de estudiantes universitario que participaron">
                        {proyecto.nro_estudiantes}
                      </Fila>
                    </tbody>
                  </table>

                  {/* 1.9 BENEFICIARIOS */}
                  <table className="fo-tabla fo-bloque">
                    <colgroup><col style={{ width: '1.08cm' }} /><col /></colgroup>
                    <tbody>
                      <tr>
                        <th>1.9</th>
                        <td>
                          <p className="fo-enunciado">
                            Beneficiarios o destinatarios, marcar el que corresponda{' '}
                            <span className="fo-azul">
                              (partes interesadas, sector focalizado, stakeholders, aliados estratégicos):
                            </span>
                          </p>
                          <ol className="fo-letras fo-beneficiarios">
                            {BENEFICIARIOS.map(([texto, codigos]) => {
                              const marcados = (proyecto.beneficiarios_info || [])
                                .filter((b) => codigos.includes(b.codigo));
                              const marcado = codigos.some((c) => codigosBeneficiario.includes(c));
                              let detalle = '';
                              if (marcado && codigos.length > 1) {
                                detalle = marcados.map((b) => b.label).join(', ');
                              }
                              if (marcado && codigos[0] === 'otro') {
                                detalle = proyecto.benef_otro_detalle;
                              }
                              return (
                                <li key={texto}>
                                  {texto}: {marca(marcado)} {detalle}
                                </li>
                              );
                            })}
                          </ol>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 1.10 TIPO DE EJE */}
                  <table className="fo-tabla fo-bloque fo-saliente fo-ejes">
                    <colgroup><col style={{ width: '1.08cm' }} /><col /></colgroup>
                    <tbody>
                      {EJES.map(({ eje, titulo, items }, indice) => (
                        <tr key={eje}>
                          <th>{indice === 0 && '1.10'}</th>
                          <td>
                            {/* El enunciado va junto al primer eje para no quedar solo. */}
                            {indice === 0 && (
                              <p className="fo-enunciado">
                                Tipo de eje: MARCAR EL QUE CORRESPONDA{' '}
                                <span className="fo-azul">
                                  (La RSU se expresa en 4 ejes, se puede trabajar en uno de ellos o articular entre ellos)
                                </span>
                              </p>
                            )}
                              <p className="fo-eje">{titulo}</p>
                              <ol className="fo-letras">
                                {items.map(([texto, claves, rotulo]) => {
                                  const marcados = buscarSubitem(eje, claves);
                                  const detalle = marcados.map((s) => s.detalle).filter(Boolean).join(', ');
                                  return (
                                    <li key={texto}>
                                      {texto} {marca(marcados.length > 0)}
                                      {rotulo ? (
                                        <div className="fo-detalle">- {rotulo}: {detalle || '……………………'}</div>
                                      ) : (
                                        detalle && ` ${detalle}`
                                      )}
                                    </li>
                                  );
                                })}
                              </ol>
                          </td>
                        </tr>
                      ))}
                      {proyecto.eje_detalle && (
                        <tr>
                          <th />
                          <td>
                            <p className="fo-respuesta"><b>Otro eje:</b> {proyecto.eje_detalle}</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* 1.11 TIPO DE ACTIVIDAD */}
                  <table className="fo-tabla fo-bloque fo-saliente">
                    <colgroup><col style={{ width: '1.08cm' }} /><col /></colgroup>
                    <tbody>
                      <tr>
                        <th>1.11</th>
                        <td>
                          <p className="fo-enunciado">Tipo de actividad:</p>
                          <ul className="fo-guiones">
                            {TIPOS_ACTIVIDAD.map(([clave, texto, nota]) => (
                              <li key={clave}>
                                {texto} {marca(tipos.includes(clave))}{nota}
                                {clave === 'otro' && tipos.includes(clave) && ` ${proyecto.tipo_actividad_otro || ''}`}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 1.12 - 1.18 */}
                  <table className="fo-tabla fo-bloque">
                    <colgroup>
                      <col style={{ width: '1.08cm' }} />
                      <col style={{ width: '4.42cm' }} />
                      <col />
                    </colgroup>
                    <tbody>
                      <Fila numero="1.12" etiqueta="Meta">
                        {metas.map((m, i) => (
                          <div key={m.id || i}>
                            {m.meta_descripcion}
                            {m.valor_meta != null && `: ${Number(m.valor_meta)} ${m.unidad_medida || ''}`}
                          </div>
                        ))}
                      </Fila>
                      <Fila numero="1.13" etiqueta="Indicador">
                        {metas.map((m, i) => <div key={m.id || i}>{m.indicador_nombre}</div>)}
                      </Fila>
                      <Fila numero="1.14" etiqueta="Fecha de inicio">{fecha(proyecto.fecha_inicio)}</Fila>
                      <Fila numero="1.15" etiqueta="Fecha de evaluación de avance">
                        {fecha(proyecto.fecha_evaluacion_avance)}
                      </Fila>
                      <Fila numero="1.16" etiqueta="Fecha de término">{fecha(proyecto.fecha_termino)}</Fila>
                      <Fila numero="1.17" etiqueta="Fecha de aplicación de Encuesta de evaluación de intervención">
                        <div>Docentes: {fecha(proyecto.fecha_encuesta_docentes)}</div>
                        <div>Alumnos: {fecha(proyecto.fecha_encuesta_alumnos)}</div>
                        <div>Grupo destinatario: {fecha(proyecto.fecha_encuesta_grupo_destinatario)}</div>
                      </Fila>
                      <Fila numero="1.18" etiqueta="Lugar de ejecución">{proyecto.lugar_ejecucion}</Fila>
                    </tbody>
                  </table>

                  {/* II - V */}
                  <Titulo numero="II.">FUNDAMENTACIÓN:</Titulo>
                  <div className="fo-fundamentacion">
                    <p className="fo-guia">
                      ¿Por qué se eligió el grupo beneficiario, para qué servirá el proyecto de
                      intervención y cuál será el mecanismo de enseñanza-aprendizaje?
                    </p>
                    {[proyecto.fund_por_que_grupo, proyecto.fund_para_que_proyecto, proyecto.fund_mecanismo_ensenanza]
                      .filter(Boolean)
                      .map((texto, i) => <p key={i} className="fo-respuesta">{texto}</p>)}
                  </div>

                  <Titulo numero="III.">DIAGNÓSTICO SITUACIONAL:</Titulo>
                  <ul className="fo-preguntas">
                    <Pregunta
                      texto="¿En qué estado encontramos el grupo beneficiario (en el campo que se intervendrá)?"
                      respuestas={[proyecto.diag_estado_grupo]}
                    />
                    <Pregunta texto="¿Qué problemas detectamos?" respuestas={[proyecto.diag_problemas_detectados]} />
                    <Pregunta
                      texto="¿Qué aportes podemos realizar desde nuestra formación profesional o a través de la articulación curricular a la mejora de la situación problemática detectada?"
                      respuestas={[proyecto.diag_aportes_formacion, proyecto.diag_justificacion_intervencion]}
                    />
                  </ul>

                  <Titulo numero="IV.">OBJETIVOS</Titulo>
                  <ul className="fo-preguntas">
                    <Pregunta
                      texto="¿Qué queremos lograr con nuestra intervención en el grupo beneficiario?"
                      respuestas={[proyecto.obj_logro_intervencion]}
                    />
                    <Pregunta
                      texto="¿Qué queremos mejorar en el proceso curricular?"
                      respuestas={[proyecto.obj_mejora_curricular]}
                    />
                  </ul>

                  <Titulo numero="V.">RESULTADOS ESPERADOS</Titulo>
                  <ul className="fo-preguntas">
                    <Pregunta
                      texto="¿Tras la aplicación de los cambios efectuados con las sugerencias y/o propuestas realizadas dentro del proceso enseñanza-aprendizaje, qué logros o cambios se espera obtener en el grupo beneficiario?"
                      respuestas={[proyecto.resultado_en_beneficiarios]}
                    />
                    <Pregunta
                      texto="¿Tras la aplicación de los cambios efectuados con las sugerencias y/o propuestas realizadas dentro del proceso enseñanza-aprendizaje, qué logros o cambios se espera obtener en el desarrollo curricular?"
                      respuestas={[proyecto.resultado_en_curriculo]}
                    />
                  </ul>

                  {/* VI. ACTIVIDADES */}
                  <Titulo numero="VI.">DESARROLLO DE LAS ACTIVIDADES:</Titulo>
                  <ul className="fo-preguntas">
                    <li>
                      <span className="fo-guia">
                        Relación de actividades conducentes al logro de los objetivos planteados,
                        señalando de ser preciso qué cursos se vincularon a la ejecución de la intervención.
                      </span>
                      {actividades.map((a, i) => (
                        <p key={a.id || i} className="fo-respuesta">
                          {i + 1}. {a.nombre}
                          {a.descripcion && `: ${a.descripcion}`}
                          {a.curso_vinculado && ` (Curso vinculado: ${a.curso_vinculado})`}
                        </p>
                      ))}
                    </li>
                  </ul>

                  {/* VII. CRONOGRAMA */}
                  <Titulo numero="VII.">CRONOGRAMA</Titulo>
                  <table className="fo-tabla fo-cronograma">
                    <colgroup><col style={{ width: '47.2%' }} /><col /></colgroup>
                    <tbody>
                      <tr>
                        <th>ACCIONES</th>
                        <th className="fo-menor">CRONOGRAMA DE ACCIONES</th>
                      </tr>
                      {acciones.map((accion, i) => (
                        <tr key={accion.id || i}>
                          <td>{accion.descripcion}</td>
                          <td>
                            {[fecha(accion.fecha_inicio), fecha(accion.fecha_fin)].filter(Boolean).join(' al ')}
                          </td>
                        </tr>
                      ))}
                      {acciones.length === 0 && <tr><td>&nbsp;</td><td /></tr>}
                    </tbody>
                  </table>

                  {/* VIII. RECURSOS */}
                  <Titulo numero="VIII.">RECURSOS</Titulo>
                  <div className="fo-recursos">
                    <p><b>5.1. Humanos: Docentes/administrativos/alumnos/alumnos egresados/voluntariado</b></p>
                    <p className="fo-respuesta">
                      {humanos.map(([rotulo, valor]) => `${rotulo}: ${valor ?? 0}`).join(' · ')}
                    </p>
                    <p><b>5.2. Materiales: Afiches/material didáctico/demás útiles necesarios</b></p>
                    {materiales.map(([rotulo, valor]) => (
                      <p key={rotulo} className="fo-respuesta">{rotulo}: {valor}</p>
                    ))}
                  </div>

                  {/* IX. FINANCIAMIENTO */}
                  <Titulo numero="IX.">FINANCIAMIENTO</Titulo>
                  <p className="fo-monto">
                    Monto aproximado del costo del proyecto propuesto: {moneda(total)}
                  </p>

                  {/* FIRMA */}
                  <div className="fo-cierre">
                    <p className="fo-fecha">
                      Arequipa, {fecha(proyecto.fecha_envio_revision) || '__________________'}
                    </p>
                    <div className="fo-firma">
                      {detalleDocente?.firma_digital && (
                        <img src={detalleDocente.firma_digital} alt="Firma del docente responsable" />
                      )}
                      <div>__________________________________</div>
                      <div>{docente}</div>
                      <div>Docente adscrito</div>
                      <div>Departamento académico de {departamento}</div>
                    </div>
                  </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteExpediente;

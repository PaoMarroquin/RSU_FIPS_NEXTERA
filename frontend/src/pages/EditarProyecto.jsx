import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { FiLoader } from 'react-icons/fi';

import NuevoProyecto from './NuevoProyecto'; 

export default function EditarProyecto() {
  const { id } = useParams(); // Obtenemos el ID de la URL
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchProyecto = async () => {
      try {
        const response = await api.get(`/api/v1/proyectos/${id}/`);
        const data = response.data;

        // 1. MAPEAMOS DEL BACKEND AL FORMATO EXACTO DE TU FRONTEND
        const frontendDraft = {
          id: data.id,
          // Paso 1
          facultad: data.facultad || '',
          facultad_nombre: data.facultad_nombre || '',
          escuela: data.escuela || '',
          escuela_nombre: data.escuela_nombre || '',
          departamento: data.departamento || '',
          departamento_nombre: data.departamento_nombre || '',
          periodo: data.periodo || '',
          periodo_nombre: data.periodo_nombre || '',
          semestre: data.semestre_academico || '',
          asignaturas: data.asignaturas?.length > 0 ? data.asignaturas.map(a => a.nombre_asignatura).join(', ') : '',
          titulo: data.titulo || '',
          numDocentes: data.nro_docentes || 0,
          numEstudiantes: data.nro_estudiantes || 0,
          lugar: data.lugar_ejecucion || '',
          beneficiarios: data.benef_otro_detalle || '',
          eje_rsu: data.eje_rsu || null,
          ejes_subitems: data.ejes_subitems || [],
          eje_detalle: data.eje_detalle || "",
          tiposActividad: Array.isArray(data.tipo_actividad) ? data.tipo_actividad : [],
          tipoActividadOtro: data.tipo_actividad_otro || '',
          metas_indicadores: Array.isArray(data.metas_indicadores) ? data.metas_indicadores.map(meta => ({
            id: meta.id || null,
            meta_descripcion: meta.meta_descripcion || '',
            indicador_nombre: meta.indicador_nombre || '',
            unidad_medida: meta.unidad_medida || '',
            linea_base: meta.linea_base ?? '',
            valor_meta: meta.valor_meta ?? '',
            valor_alcanzado: meta.valor_alcanzado ?? '',
            metodo_verificacion: meta.metodo_verificacion || '',
            fuente_verificacion: meta.fuente_verificacion || '',
            orden: meta.orden || 0,
          })) : [],
          fechaInicio: data.fecha_inicio || '',
          fechaEvaluacion: data.fecha_evaluacion_avance || '',
          fechaTermino: data.fecha_termino || '',
          encuestaDocentes: data.fecha_encuesta_docentes || '',
          encuestaEstudiantes: data.fecha_encuesta_alumnos || '',
          encuestaDestinatarios: data.fecha_encuesta_grupo_destinatario || '',

          // Paso 2
          fund_razonGrupo: data.fund_por_que_grupo || '',
          fund_proposito: data.fund_para_que_proyecto || '',
          fund_metodologia: data.fund_mecanismo_ensenanza || '',

          // Paso 3
          diag_estadoActual: data.diag_estado_grupo || '',
          diag_problemas: data.diag_problemas_detectados || '',
          diag_aportes: data.diag_aportes_formacion || '',
          diag_justificacion: data.diag_justificacion_intervencion || '',

          // Paso 4
          obj_lograrBeneficiario: data.obj_logro_intervencion || '',
          obj_mejorarCurricular: data.obj_mejora_curricular || '',
          ods: data.ods || [],

          // Paso 5
          resultado_en_beneficiarios: data.resultado_en_beneficiarios || '',
          resultado_en_curriculo: data.resultado_en_curriculo || '',

          // Paso 6: Actividades
          actividades: data.actividades?.length > 0 ? data.actividades.map(act => ({
            nombre: act.nombre || '',
            descripcion: act.descripcion || '',
            curso_vinculado: act.curso_vinculado || '',
            responsable: act.responsable || '',
            fecha: act.fecha || '',
            evidencia_esperada: act.evidencia_esperada || ''
          })) : [{ nombre: '', descripcion: '', curso_vinculado: '', responsable: '', fecha: '', evidencia_esperada: '' }],

          // Paso 7: Cronograma
          cronogramas: data.cronograma?.length > 0 ? data.cronograma.map(cro => ({
            descripcion: cro.descripcion || '',
            fecha_inicio: cro.fecha_inicio || '',
            fecha_fin: cro.fecha_fin || '',
            responsable: cro.responsable || '',
            estado_avance: cro.estado_avance || 'pendiente'
          })) : [{ descripcion: '', fecha_inicio: '', fecha_fin: '', responsable: '', estado_avance: 'pendiente' }],

          // Paso 8: Recursos
          recursos: {
            rec_hum_docentes: data.rec_hum_docentes || 0,
            rec_hum_administrativos: data.rec_hum_administrativos || 0,
            rec_hum_estudiantes: data.rec_hum_estudiantes || 0,
            rec_hum_egresados: data.rec_hum_egresados || 0,
            rec_hum_voluntarios: data.rec_hum_voluntarios || 0,
            rec_hum_otros: data.rec_hum_otros || 0,
            rec_mat_material_didactico: data.rec_mat_material_didactico || '',
            rec_mat_afiches: data.rec_mat_afiches || '',
            rec_mat_equipos: data.rec_mat_equipos || '',
            rec_mat_utiles: data.rec_mat_utiles || '',
            rec_mat_otros: data.rec_mat_otros || '',
          },

          // Paso 9: Financiamiento
          fuentes_financiamiento: data.fuentes_financiamiento?.length > 0 ? data.fuentes_financiamiento.map(fuente => ({
            id: fuente.id,
            fuente_financiamiento: fuente.fuente || '',
            monto_financiamiento: fuente.monto || '',
            descripcion_fuente: fuente.descripcion || '',
            partidas: fuente.partidas?.length > 0 ? fuente.partidas.map(part => ({
              id: part.id,
              categoria: part.categoria || '',
              tipo_recurso: part.tipo_recurso || 'material',
              descripcion: part.descripcion || '',
              unidad: part.unidad || 'Unidad',
              cantidad: part.cantidad || 1,
              costo_unitario: part.costo_unitario || ''
            })) : []
          })) : []
        };

        // 2. LO GUARDAMOS EN EL LOCALSTORAGE
        // Al guardarlo aquí, cuando NuevoProyecto se monte, su hook leerá esto automáticamente.
        localStorage.setItem('rsu_draft', JSON.stringify(frontendDraft));
        
        // 3. QUITAMOS LA PANTALLA DE CARGA
        setCargando(false);

      } catch (error) {
        console.error("Error al obtener el proyecto para editar:", error);
        alert("No se pudo cargar la información del proyecto.");
        navigate('/proyectos');
      }
    };

    fetchProyecto();
  }, [id, navigate]);

  // "Sala de espera" mientras se descargan los datos
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <FiLoader className="animate-spin text-[#b1122b] text-5xl mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Cargando proyecto...</h2>
        <p className="text-slate-500">Preparando los datos para edición</p>
      </div>
    );
  }

  // ¡MAGIA AQUÍ! 
  // Una vez que cargando es false, simplemente renderizamos tu componente de siempre.
  // Tu vista de NuevoProyecto ni siquiera sabrá que está editando, simplemente leerá
  // el localStorage que acabamos de inyectarle y mostrará todo lleno.
  return <NuevoProyecto />;
}
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
          escuela: data.escuela || '',
          departamento: data.departamento || '',
          semestre: data.semestre_academico || '',
          titulo: data.titulo || '',
          numDocentes: data.nro_docentes || 0,
          numEstudiantes: data.nro_estudiantes || 0,
          lugar: data.lugar_ejecucion || '',
          beneficiarios: data.benef_otro_detalle || '',
          eje_rsu: data.eje_rsu || null,
          ejes_subitems: data.ejes_subitems || [],
          eje_detalle: data.eje_detalle || "",
          tipoActividad: data.tipo_actividad_otro || '',
          meta: data.meta_cuantitativa || '',
          indicador: data.indicador || '',
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
          res_beneficiario: data.resultado_en_beneficiarios || '',
          res_curricular: data.resultado_en_curriculo || '',

          // Paso 6: Actividades
          actividades: data.actividades?.length > 0 ? data.actividades.map(act => ({
            actividad: act.nombre || '',
            descripcion: act.descripcion || '',
            curso: act.curso_vinculado || '',
            responsable: act.responsable || '',
            fecha: act.fecha || '',
            evidencia: act.evidencia_esperada || ''
          })) : [{ actividad: '', descripcion: '', curso: '', responsable: '', fecha: '', evidencia: '' }],

          // Paso 7: Cronograma
          cronograma: data.cronograma?.length > 0 ? data.cronograma.map(cro => ({
            accion: cro.descripcion || '',
            fechaInicio: cro.fecha_inicio || '',
            fechaFin: cro.fecha_fin || '',
            responsable: cro.responsable || '',
            estado: cro.estado_avance || 'Pendiente'
          })) : [{ accion: '', fechaInicio: '', fechaFin: '', responsable: '', estado: 'Pendiente' }],

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
          financiamiento: {
            monto_financiamiento: data.monto_financiamiento || '',
            fuente_financiamiento: data.fuente_financiamiento || '',
            descripcion_gastos: data.descripcion_gastos || '',
            observaciones_financiamiento: data.observaciones_financiamiento || ''
          }
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
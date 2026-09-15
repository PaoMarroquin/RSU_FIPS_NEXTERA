import React from 'react';
import Layout from "../../shared/layout/Layout";
import { useActividades } from './hooks/useActividades';
import ListaProyectos from './components/ListaProyectos';
import TableroProyecto from './components/TableroProyecto';

export default function Actividades() {
  const {
  proyectos,
  proyectoSeleccionado,
  actividades,
  actividadesFiltradas,
  avances,
  evidencias,
  metasIndicadores,
  loading,
  loadingDetalle,
  filtroEstado,
  setFiltroEstado,
  urlInputs,
  totalActividades,
  actividadesCompletadas,
  porcentajeProgreso,
  seleccionarProyecto,
  deseleccionarProyecto,
  cambiarEstadoActividad,
  registrarAvance,
  subirEvidencia,
  guardarUrlEvidencia,
  actualizarUrlInput,
  eliminarEvidencia,
  observarAvance,
  corregirAvance
} = useActividades();

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 max-w-4xl w-full mx-auto space-y-6">
        {!proyectoSeleccionado ? (
          <ListaProyectos 
            proyectos={proyectos} 
            loading={loading} 
            onSelect={seleccionarProyecto} 
          />
        ) : (
          <TableroProyecto
  proyecto={proyectoSeleccionado}
  metasIndicadores={metasIndicadores}
  actividades={actividades}
  actividadesFiltradas={actividadesFiltradas}
  avances={avances}
  evidencias={evidencias}
  loadingDetalle={loadingDetalle}
  filtroEstado={filtroEstado}
  setFiltroEstado={setFiltroEstado}
  urlInputs={urlInputs}
  totalActividades={totalActividades}
  actividadesCompletadas={actividadesCompletadas}
  porcentajeProgreso={porcentajeProgreso}
  onBack={deseleccionarProyecto}
  onCambiarEstado={cambiarEstadoActividad}
  onRegistrarAvance={registrarAvance}
  onSubirEvidencia={subirEvidencia}
  onGuardarUrl={guardarUrlEvidencia}
  onUpdateUrl={actualizarUrlInput}
  onEliminarEvidencia={eliminarEvidencia}
  onObservarAvance={observarAvance}
  onCorregirAvance={corregirAvance}
/>
        )}
      </div>
    </Layout>
  );
}
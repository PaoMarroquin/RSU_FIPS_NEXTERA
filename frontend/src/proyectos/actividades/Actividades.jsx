import React from 'react';
import Layout from "../../shared/layout/Layout";
import { useActividades } from './hooks/useActividades';
import ListaProyectos from './components/ListaProyectos';
import TableroProyecto from './components/TableroProyecto';

export default function Actividades() {
  const {
    proyectos, proyectoSeleccionado, metasIndicadores, actividadesFiltradas,
    loading, loadingDetalle, filtroEstado, setFiltroEstado, urlInputs,
    totalActividades, actividadesCompletadas, porcentajeProgreso,
    seleccionarProyecto, deseleccionarProyecto, cambiarEstadoActividad,
    subirEvidencia, guardarUrlEvidencia, actualizarUrlInput
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
            actividadesFiltradas={actividadesFiltradas}
            loadingDetalle={loadingDetalle}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            urlInputs={urlInputs}
            totalActividades={totalActividades}
            actividadesCompletadas={actividadesCompletadas}
            porcentajeProgreso={porcentajeProgreso}
            onBack={deseleccionarProyecto}
            onCambiarEstado={cambiarEstadoActividad}
            onSubirEvidencia={subirEvidencia}
            onGuardarUrl={guardarUrlEvidencia}
            onUpdateUrl={actualizarUrlInput}
          />
        )}
      </div>
    </Layout>
  );
}
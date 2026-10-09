import React from "react";
import Layout from "../../shared/layout/Layout";
import { useActividades } from "./hooks/useActividades";
import ListaProyectos from "./components/ListaProyectos";
import TableroProyecto from "./components/TableroProyecto";

export default function Actividades() {
  const {
    proyectos,
    proyectoSeleccionado,
    actividadesFiltradas,
    avances,
    evidencias,
    metasIndicadores,
    loading,
    loadingDetalle,
    filtroEstado,
    setFiltroEstado,
    totalActividades,
    actividadesCompletadas,
    porcentajeProgreso,
    seleccionarProyecto,
    deseleccionarProyecto,
    registrarEvidenciaActividad,
    eliminarEvidencia,
    observarAvance,
    corregirAvance,
  } = useActividades();

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
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
            avances={avances}
            evidencias={evidencias}
            loadingDetalle={loadingDetalle}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            totalActividades={totalActividades}
            actividadesCompletadas={actividadesCompletadas}
            porcentajeProgreso={porcentajeProgreso}
            onBack={deseleccionarProyecto}
            onRegistrarEvidencia={registrarEvidenciaActividad}
            onEliminarEvidencia={eliminarEvidencia}
            onObservarAvance={observarAvance}
            onCorregirAvance={corregirAvance}
          />
        )}
      </div>
    </Layout>
  );
}
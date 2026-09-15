import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./shared/context/ToastContext";
import Toast from "./shared/components/Toast";
import ProtectedRoute from "./shared/components/ProtectedRoute";

import Login from "./usuario/login/Login";
import Dashboard from "./proyectos/dashboard/Dashboard";
import Proyectos from "./proyectos/listar/Proyectos";
import NuevoProyecto from "./proyectos/form/NuevoProyecto";
import EditarProyecto from './proyectos/form/EditarProyecto';
import Actividades from "./proyectos/actividades/Actividades";
import RevisionProyectos from "./proyectos/revision/RevisionProyectos";
import Informes from "./proyectos/informes/Informes";
import InformeConsolidado from "./proyectos/informes/components/InformeConsolidado";
import Repositorio from "./proyectos/repositorio/Repositorio";
import Notificaciones from './proyectos/notificaciones/Notificaciones';
import Configuracion from "./usuario/configuracion/MiPerfil";
import GestionUsuarios from './usuario/gestion/GestionUsuarios';
import ImportarUsuarios from './usuario/importar/ImportarUsuarios';
import MatrizOperativa from './planificacion/matriz/MatrizOperativa';
import ProyectosJefatura from './proyectos/jefatura/ProyectosJefatura';

function App() {
  return (
    <ToastProvider>
      <Toast />
      <BrowserRouter>
        <Routes>
          {/* Publica */}
          <Route path="/" element={<Login />} />

          {/* Exclusivas Docente */}
          <Route element={<ProtectedRoute allowedRoles={["docente"]} />}>
            <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
            <Route path="/proyectos/editar/:id" element={<EditarProyecto />} />
            <Route path="/actividades" element={<Actividades />} />
            <Route path="/informes" element={<Informes />} />
          </Route>

          {/* Exclusivas Departamento */}
          <Route element={<ProtectedRoute allowedRoles={["departamento"]} />}>
            <Route path="/evaluacion" element={<RevisionProyectos />} />
          </Route>

          {/* Exclusivas Jefatura RSU */}
          <Route element={<ProtectedRoute allowedRoles={["jefatura rsu"]} />}>
            <Route path="/matriz-operativa" element={<MatrizOperativa />} />
            <Route path="/proyectos-jefatura" element={<ProyectosJefatura />} />
          </Route>

          {/* Exclusivas Administrador */}
          <Route element={<ProtectedRoute allowedRoles={["administrador"]} />}>
            <Route path="/usuarios" element={<GestionUsuarios />} />
            <Route path="/usuarios/importar" element={<ImportarUsuarios />} />
          </Route>

          {/* Compartidas por grupo */}
          <Route path="/dashboard" element={<Dashboard />} />

          <Route element={<ProtectedRoute allowedRoles={["docente", "departamento", "autoridad"]} />}>
            <Route path="/proyectos" element={<Proyectos />} />
          </Route>

          <Route
            element={
              <ProtectedRoute 
               allowedRoles={[
        "departamento",
        "autoridad",
        "jefatura rsu",
        "administrador",
      ]}
              
              />
            }
          >
              <Route path="/informes-consolidado" element={<InformeConsolidado />}  />
          </Route>

          {/* General Autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route path="/repositorio" element={<Repositorio />} />
            <Route path="/notificaciones" element={<Notificaciones />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>

          {/* Redireccion por defecto a rutas inexistentes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
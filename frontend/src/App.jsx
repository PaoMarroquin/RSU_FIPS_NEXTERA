import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./shared/context/ToastContext";
import Toast from "./shared/components/Toast";

import Login from "./usuario/login/Login";
import Dashboard from "./proyectos/dashboard/Dashboard";
import Proyectos from "./proyectos/listar/Proyectos";
import NuevoProyecto from "./proyectos/form/NuevoProyecto";
import EditarProyecto from './proyectos/form/EditarProyecto';
import Actividades from "./proyectos/actividades/Actividades";
import RevisionProyectos from "./proyectos/revision/RevisionProyectos";
import Informes from "./proyectos/informes/Informes";
import Repositorio from "./proyectos/repositorio/Repositorio";
import Notificaciones from './proyectos/notificaciones/Notificaciones';
import Configuracion from "./usuario/configuracion/MiPerfil";
import GestionUsuarios from './usuario/gestion/GestionUsuarios'
import ImportarUsuarios from './usuario/importar/ImportarUsuarios'
import MatrizOperativa from './planificacion/matriz/MatrizOperativa';
import ProyectosJefatura from './proyectos/jefatura/ProyectosJefatura';

function App() {
  return (
    <ToastProvider>
      <Toast />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
          <Route path="/proyectos/editar/:id" element={<EditarProyecto />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/evaluacion" element={<RevisionProyectos />} />
          <Route path="/informes" element={<Informes />} />
          <Route path="/repositorio" element={<Repositorio />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/usuarios" element={<GestionUsuarios />} />
          <Route path="/usuarios/importar" element={<ImportarUsuarios />} />
          <Route path="/configuracion" element={<Configuracion />} />    
          <Route path="/matriz-operativa" element={<MatrizOperativa />} />
          <Route path="/proyectos-jefatura" element={<ProyectosJefatura />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
export default App;
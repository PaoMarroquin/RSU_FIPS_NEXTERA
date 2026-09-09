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
//import Informes from "./pages/Informes";
//import Repositorio from "./pages/Repositorio";
//import Configuracion from "./pages/Configuracion";
//import Notificaciones from './pages/Notificaciones';
//import ListaUsuarios from './pages/usuarios/ListaUsuarios';
//import CrearUsuarios from './pages/usuarios/CrearUsuarios';
//import EditarUsuarios from './pages/usuarios/EditarUsuarios';
//import ImportarUsuarios from './pages/usuarios/ImportarUsuarios';
//import MatrizOperativa from './pages/MatrizOperativa';
//import ProyectosJefatura from './pages/ProyectosJefatura';

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
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
/*
          
          
          <Route path="/informes" element={<Informes />} />
          <Route path="/repositorio" element={<Repositorio />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/usuarios" element={<ListaUsuarios />} />
          <Route path="/usuarios/nuevo" element={<CrearUsuarios />} />
          <Route path="/usuarios/importar" element={<ImportarUsuarios />} />
          <Route path="/usuarios/editar/:id" element={<EditarUsuarios />} />
          <Route path="/matriz-operativa" element={<MatrizOperativa />} />
          <Route path="/proyectos-jefatura" element={<ProyectosJefatura />} />  
*/
export default App;
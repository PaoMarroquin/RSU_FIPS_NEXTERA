import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Proyectos from "./pages/Proyectos";
import Actividades from "./pages/Actividades";
import NuevoProyecto from "./pages/NuevoProyecto";
import Informes from "./pages/Informes";
import Repositorio from "./pages/Repositorio";
import RevisionProyectos from "./pages/RevisionProyectos";
import Configuracion from "./pages/Configuracion";
import EditarProyecto from './pages/EditarProyecto';
import Notificaciones from './pages/Notificaciones';
import ListaUsuarios from './pages/usuarios/ListaUsuarios';
import CrearUsuarios from './pages/usuarios/CrearUsuarios';
import EditarUsuarios from './pages/usuarios/EditarUsuarios';
import ExportarUsuarios from './pages/usuarios/ExportarUsuarios';
import MatrizOperativa from './pages/MatrizOperativa';
import ProyectosJefatura from './pages/ProyectosJefatura';

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
          <Route path="/evaluacion" element={<RevisionProyectos />} />
          <Route path="/actividades" element={<Actividades />} />
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
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
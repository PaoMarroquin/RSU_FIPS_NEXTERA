import { BrowserRouter, Routes, Route } from "react-router-dom";

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


function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
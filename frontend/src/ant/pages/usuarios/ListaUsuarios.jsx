import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { userService } from "../../api/userService";
import { 
  FiUsers, 
  FiUserPlus, 
  FiRefreshCw, 
  FiSearch,
  FiUpload,
  FiChevronLeft,
  FiChevronRight, 
  FiEdit2 
} from "react-icons/fi";

export default function ListaUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Enlaces de navegación devueltos por el backend
  const [hasNext, setHasNext] = useState(null);
  const [hasPrevious, setHasPrevious] = useState(null);

  // Estados para Filtros y Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState("");

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsuarios(currentPage, searchTerm, orderBy);
      setUsuarios(data.results || []);
      setTotalRecords(data.count || 0);
      setHasNext(data.next);
      setHasPrevious(data.previous);
    } catch (error) {
      console.error("Error al cargar los usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validar el rol antes de hacer cualquier petición
    const role = localStorage.getItem("user_role");
    const sanitizedRole = role ? role.toLowerCase() : "";

    if (sanitizedRole !== "departamento") { // SOLO DEPARTAMENTO
      navigate("/dashboard");
    } else {
      fetchUsuarios();
    }
  }, [currentPage, orderBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsuarios();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8 space-y-6">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
                <FiUsers className="text-[#7B1E3A]" /> Gestión de Usuarios
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Administración, filtros avanzados y control de roles de la FIPS
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => navigate("/usuarios/importar")}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiUpload className="text-base" /> Importar desde Excel
              </button>
              <button 
                onClick={() => navigate("/usuarios/nuevo")}
                className="h-10 px-4 bg-[#7B1E3A] hover:bg-[#60172D] text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiUserPlus className="text-base" /> Crear Usuario
              </button>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y ORDENAMIENTO */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
              <input 
                type="text" 
                placeholder="Buscar por nombre, apellido o correo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
              />
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-base" />
            </form>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select 
                value={orderBy} 
                onChange={(e) => { setCurrentPage(1); setOrderBy(e.target.value); }}
                className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A] cursor-pointer"
              >
                <option value="">Ordenar por...</option>
                <option value="nombres">Nombre (A-Z)</option>
                <option value="-nombres">Nombre (Z-A)</option>
                <option value="created_at">Más antiguos</option>
                <option value="-created_at">Más recientes</option>
              </select>

              <button 
                onClick={fetchUsuarios}
                className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* TABLA DE RESULTADOS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center items-center flex-col gap-3">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#7B1E3A] rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500">Cargando registros de usuarios...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500">No se encontraron usuarios con los filtros aplicados.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="p-4 pl-6">Usuario</th>
                        <th className="p-4">Correo Institucional</th>
                        <th className="p-4">Celular</th>
                        <th className="p-4">Rol</th>
                        <th className="p-4">Facultad</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 pr-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 pl-6 font-medium text-slate-900">
                            {usuario.nombres} {usuario.apellidos}
                          </td>
                          <td className="p-4 text-slate-500">
                            {usuario.correo_institucional}
                          </td>
                          <td className="p-4 text-slate-500">
                            {usuario.celular || "—"}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              {usuario.rol_nombre}
                            </span>
                          </td>
                          <td className="p-4 max-w-[200px] truncate text-slate-500" title={usuario.facultad_nombre}>
                            {usuario.facultad_nombre}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              usuario.estado === "activo" 
                                ? "bg-green-50 text-green-700 border border-green-200" 
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${usuario.estado === "activo" ? "bg-green-500" : "bg-red-500"}`}></span>
                              {usuario.estado}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button 
                              onClick={() => navigate(`/usuarios/editar/${usuario.id}`)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-[#7B1E3A] hover:bg-slate-100 transition-colors" 
                              title="Editar usuario"
                            >
                              <FiEdit2 className="text-base" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINACIÓN */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-500 m-0">
                    Mostrando <span className="font-medium text-slate-700">{usuarios.length}</span> registros actuales de un total de <span className="font-medium text-slate-700">{totalRecords}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!hasPrevious}
                      className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                      <FiChevronLeft />
                    </button>
                    <span className="text-xs font-medium text-slate-700 px-2">
                      Página {currentPage}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!hasNext}
                      className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
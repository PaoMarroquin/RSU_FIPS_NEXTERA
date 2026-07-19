import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import PaginatedSelect from "../../components/forms/PaginatedSelect";
import { userService } from "../../api/userService";
import { academicService } from "../../api/academicService";
import { FiUserPlus, FiArrowLeft, FiSave } from "react-icons/fi";

export default function CrearUsuarios() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [data, setData] = useState({
    nombres: "",
    apellidos: "",
    correo_institucional: "",
    password: "",
    celular: "",
    estado: "activo",
    rol: null,
    rol_nombre: "",
    facultad: null,
    facultad_nombre: "",
    escuela: null,
    escuela_nombre: "",
    departamento: null,
    departamento_nombre: ""
  });

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const sanitizedRole = role ? role.toLowerCase() : "";

    if (sanitizedRole !== "departamento") {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const updateData = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await userService.createUsuario(
        data.nombres,
        data.apellidos || "",
        data.correo_institucional,
        data.password,
        data.celular || null,
        data.rol ? parseInt(data.rol) : null,
        data.facultad ? parseInt(data.facultad) : null,
        data.escuela ? parseInt(data.escuela) : null,
        data.departamento ? parseInt(data.departamento) : null,
        data.estado
      );

      navigate("/usuarios");
    } catch (error) {
      console.error("Error al crear el usuario:", error);
      if (error.response && error.response.data) {
        setErrorMessage(JSON.stringify(error.response.data));
      } else {
        setErrorMessage("Ocurrió un error inesperado al intentar registrar al usuario.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
                <FiUserPlus className="text-[#7B1E3A]" /> Registrar Nuevo Usuario
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Completa el formulario utilizando los catálogos institucionales dinámicos de la FIPS
              </p>
            </div>
            
            <button
              onClick={() => navigate("/usuarios")}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 flex items-center gap-2 transition-colors shadow-sm"
            >
              <FiArrowLeft /> Regresar
            </button>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <span className="font-bold">Error en el registro:</span> {errorMessage}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombres *</label>
                  <input
                    type="text"
                    name="nombres"
                    required
                    value={data.nombres}
                    onChange={handleChange}
                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={data.apellidos}
                    onChange={handleChange}
                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Correo Institucional *</label>
                  <input
                    type="email"
                    name="correo_institucional"
                    required
                    value={data.correo_institucional}
                    onChange={handleChange}
                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contraseña *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={data.password}
                    onChange={handleChange}
                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Celular</label>
                  <input
                    type="text"
                    name="celular"
                    value={data.celular}
                    onChange={handleChange}
                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <PaginatedSelect
                  label="Rol del Usuario"
                  name="rol"
                  value={data.rol}
                  selectedName={data.rol_nombre}
                  onChange={(e, nombre) => {
                    handleChange(e);
                    updateData('rol_nombre', nombre);
                  }}
                  fetchFn={userService.getRoles}
                  placeholder="Seleccione un rol"
                />

                <PaginatedSelect
                  label="Facultad"
                  name="facultad"
                  value={data.facultad}
                  selectedName={data.facultad_nombre}
                  onChange={(e, nombre) => {
                    handleChange(e);
                    updateData('facultad_nombre', nombre);

                    updateData('escuela', null);
                    updateData('escuela_nombre', '');
                    updateData('departamento', null);
                    updateData('departamento_nombre', '');
                  }}
                  fetchFn={academicService.getFacultades}
                  placeholder="Seleccione una facultad"
                />

                <PaginatedSelect
                  label="Escuela Profesional"
                  name="escuela"
                  value={data.escuela}
                  selectedName={data.escuela_nombre}
                  onChange={(e, nombre) => {
                    handleChange(e);
                    updateData('escuela_nombre', nombre);
                  }}
                  fetchFn={academicService.getEscuelas}
                  placeholder="Seleccione una escuela"
                  disabled={!data.facultad}
                  dependencia={data.facultad}
                />

                <PaginatedSelect
                  label="Departamento Académico"
                  name="departamento"
                  value={data.departamento}
                  selectedName={data.departamento_nombre}
                  onChange={(e, nombre) => {
                    handleChange(e);
                    updateData('departamento_nombre', nombre);
                  }}
                  fetchFn={academicService.getDepartamentos}
                  placeholder="Seleccione un departamento"
                  disabled={!data.facultad}
                  dependencia={data.facultad}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/usuarios")}
                  className="h-10 px-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 bg-[#7B1E3A] hover:bg-[#60172D] disabled:bg-slate-400 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <FiSave />
                  )}
                  {loading ? "Registrando..." : "Guardar Usuario"}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
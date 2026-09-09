import React, { useState, useEffect } from "react";
import { FiX, FiSave } from "react-icons/fi";
import api from "../../../shared/api/axiosConfig";
import { usuarioApi } from "../../../shared/api/usuario/usuarioApi";
import PaginatedSelect from "../../../shared/components/forms/PaginatedSelect";

export default function ModalUsuarioForm({ usuario, onClose, onSaved }) {
  const isEditing = !!usuario;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fetching, setFetching] = useState(isEditing);

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
    if (isEditing) {
      const loadUsuario = async () => {
        try {
          setFetching(true);
          const u = await usuarioApi.obtenerUsuarioPorId(usuario.id);
          setData({
            nombres: u.nombres || "",
            apellidos: u.apellidos || "",
            correo_institucional: u.correo_institucional || "",
            password: "",
            celular: u.celular || "",
            estado: u.estado || "activo",
            rol: u.rol || null,
            rol_nombre: u.rol_nombre || "",
            facultad: u.facultad || null,
            facultad_nombre: u.facultad_nombre || "",
            escuela: u.escuela || null,
            escuela_nombre: u.escuela_nombre || "",
            departamento: u.departamento || null,
            departamento_nombre: u.departamento_nombre || ""
          });
        } catch (error) {
          console.error("Error al cargar detalle:", error);
          setErrorMessage("No se pudieron recuperar los datos del usuario.");
        } finally {
          setFetching(false);
        }
      };
      loadUsuario();
    }
  }, [isEditing, usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (isEditing) {
        // Payload exacto de tu archivo EditarUsuarios.jsx
        await usuarioApi.actualizarUsuario(usuario.id, {
          nombres: data.nombres,
          apellidos: data.apellidos,
          celular: data.celular || null,
          facultad: data.facultad ? parseInt(data.facultad) : null,
          escuela: data.escuela ? parseInt(data.escuela) : null,
          departamento: data.departamento ? parseInt(data.departamento) : null,
          estado: data.estado
        });
      } else {
        // Payload exacto de tu archivo CrearUsuarios.jsx
        await usuarioApi.crearUsuario({
          nombres: data.nombres,
          apellidos: data.apellidos || "",
          correo_institucional: data.correo_institucional,
          password: data.password,
          celular: data.celular || null,
          rol: data.rol ? parseInt(data.rol) : null,
          facultad: data.facultad ? parseInt(data.facultad) : null,
          escuela: data.escuela ? parseInt(data.escuela) : null,
          departamento: data.departamento ? parseInt(data.departamento) : null,
          estado: data.estado
        });
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      if (error.response && error.response.data) {
        setErrorMessage(JSON.stringify(error.response.data));
      } else {
        setErrorMessage("Ocurrió un error inesperado al guardar.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Funciones de fetch directas (reemplazando academicService/userService)
  const fetchRoles = async (page) => {
    const res = await api.get("/api/v1/roles/", { params: { page } });
    return res.data.results ? res.data : { results: res.data, next: null };
  };
  const fetchFacultades = async (page) => {
    const res = await api.get("/api/v1/facultades/", { params: { page } });
    return res.data.results ? res.data : { results: res.data, next: null };
  };
  const fetchEscuelas = async (page, dep) => {
    const res = await api.get("/api/v1/escuelas/", { params: { page, facultad: dep } });
    return res.data.results ? res.data : { results: res.data, next: null };
  };
  const fetchDepartamentos = async (page, dep) => {
    const res = await api.get("/api/v1/departamentos/", { params: { page, facultad: dep } });
    return res.data.results ? res.data : { results: res.data, next: null };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isEditing ? "Modificar Usuario" : "Registrar Nuevo Usuario"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isEditing ? "Actualiza los datos o el estado" : "Completa el formulario utilizando los catálogos"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <FiX className="text-xl" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 shrink-0">
            <span className="font-bold">Incidencia:</span> {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {fetching ? (
            <div className="p-12 flex justify-center items-center flex-col gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#7B1E3A] rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500">Recuperando registro...</p>
            </div>
          ) : (
            <form id="usuarioForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombres *</label>
                  <input type="text" name="nombres" required value={data.nombres} onChange={handleChange} className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Apellidos</label>
                  <input type="text" name="apellidos" value={data.apellidos} onChange={handleChange} className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${isEditing ? 'text-slate-400' : 'text-slate-600'}`}>
                    Correo Institucional {isEditing ? "(No modificable)" : "*"}
                  </label>
                  <input type="email" name="correo_institucional" required={!isEditing} disabled={isEditing} value={data.correo_institucional} onChange={handleChange}
                    className={`h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none ${isEditing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]'}`} />
                </div>

                {!isEditing && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contraseña *</label>
                    <input type="password" name="password" required minLength={8} value={data.password} onChange={handleChange} className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Celular</label>
                  <input type="text" name="celular" value={data.celular} onChange={handleChange} className="h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]" />
                </div>

                {isEditing && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado *</label>
                    <select name="estado" value={data.estado} onChange={handleChange} className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A]">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isEditing && (
                  <PaginatedSelect
                    label="Rol del Usuario"
                    name="rol"
                    value={data.rol}
                    selectedName={data.rol_nombre}
                    onChange={(e, nombre) => { handleChange(e); updateData("rol_nombre", nombre); }}
                    fetchFn={fetchRoles}
                    placeholder="Seleccione un rol"
                  />
                )}

                <PaginatedSelect
                  label="Facultad"
                  name="facultad"
                  value={data.facultad}
                  selectedName={data.facultad_nombre}
                  onChange={(e, nombre) => {
                    handleChange(e);
                    updateData("facultad_nombre", nombre);
                    updateData("escuela", null);
                    updateData("escuela_nombre", "");
                    updateData("departamento", null);
                    updateData("departamento_nombre", "");
                  }}
                  fetchFn={fetchFacultades}
                  placeholder="Seleccione una facultad"
                />

                <PaginatedSelect
                  label="Escuela Profesional"
                  name="escuela"
                  value={data.escuela}
                  selectedName={data.escuela_nombre}
                  dependencia={data.facultad}
                  disabled={!data.facultad}
                  onChange={(e, nombre) => { handleChange(e); updateData("escuela_nombre", nombre); }}
                  fetchFn={fetchEscuelas}
                  placeholder="Seleccione una escuela"
                />

                <PaginatedSelect
                  label="Departamento Académico"
                  name="departamento"
                  value={data.departamento}
                  selectedName={data.departamento_nombre}
                  dependencia={data.facultad}
                  disabled={!data.facultad}
                  onChange={(e, nombre) => { handleChange(e); updateData("departamento_nombre", nombre); }}
                  fetchFn={fetchDepartamentos}
                  placeholder="Seleccione un departamento"
                />
              </div>
            </form>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="h-10 px-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="usuarioForm" disabled={loading || fetching} className="h-10 px-5 bg-[#7B1E3A] hover:bg-[#60172D] disabled:bg-slate-400 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:cursor-not-allowed">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />}
            {loading ? (isEditing ? "Sincronizando..." : "Registrando...") : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
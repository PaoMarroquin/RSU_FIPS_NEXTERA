import React, { useState, useEffect } from "react";
import { FiUser, FiPhone, FiUpload, FiFileText, FiAward } from "react-icons/fi";
import { authService } from "../api/authService"; // Servicio real
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useToast } from "../context/ToastContext";

export default function MiPerfil() {
  // Estado 1:1 con tu backend Django
  const [formData, setFormData] = useState({
    id: null,
    nombres: "",
    apellidos: "",
    celular: "",
    facultad: "",
    escuela: "",
    departamento: "",
    firma_digital: null,
  });

  // Datos informativos que Django devuelve pero no se editan directamente con números
const [extraUserData, setExtraUserData] = useState({
    correoInstitucional: "",
    rolNombre: "",
    facultadNombre: "",
    escuelaNombre: "",
    departamentoNombre: ""
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // 1. CARGA LOS DATOS DEL PERFIL DESDE DJANGO AL ENTRAR
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoading(true);
        // Llama a tu /api/v1/usuarios/me/ mediante el authService
        const data = await authService.getMiPerfil();
        
        setFormData({
          id: data.id,
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          celular: data.celular || "",
          facultad: data.facultad || "",
          escuela: data.escuela || "",
          departamento: data.departamento || "",
          firma_digital: data.firma_digital || null,
        });

        setExtraUserData({
          correoInstitucional: data.correo_institucional || "",
          rolNombre: data.rol_nombre || "",
          facultadNombre: data.facultad_nombre || "",
          escuelaNombre: data.escuela_nombre || "",
          departamentoNombre: data.departamento_nombre || ""
        });

      } catch (error) {
        console.error("Error al cargar perfil:", error);
        showToast("error", "No se pudieron obtener tus datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        showToast("error", "La firma debe ser una imagen válida (JPG o PNG).");
        return;
      }
      setFormData((prev) => ({ ...prev, firma_digital: file }));
    }
  };

  // 2. ENVÍA LAS ACTUALIZACIONES A DJANGO (PATCH)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Usamos FormData porque hay un archivo binario (la firma)
      const dataPayload = new FormData();

      dataPayload.append("nombres", formData.nombres);
      dataPayload.append("apellidos", formData.apellidos);
      dataPayload.append("celular", formData.celular);

      if (formData.firma_digital instanceof File) {
        dataPayload.append("firma_digital", formData.firma_digital);
      }

      const resultado = await authService.updateMiPerfil(dataPayload);
      showToast("success", "¡Perfil actualizado correctamente en el servidor!");
      
      if (resultado.firma_digital) {
        setFormData((prev) => ({ ...prev, firma_digital: resultado.firma_digital }));
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      showToast("error", "Hubo un problema al intentar guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Margen izquierdo idéntico para respetar el ancho del Sidebar */}
      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        <Topbar />

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] gap-2 text-center">
              <div className="w-9 h-9 border-4 border-[#b1122b] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Cargando tus datos desde Django...</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              
              {/* ENCABEZADO / VISTA PREVIA DEL USUARIO */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white border border-slate-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center font-bold text-xl text-white border border-white/20 capitalize">
                    {formData.nombres ? formData.nombres.charAt(0) : "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold capitalize tracking-tight">
                      {formData.nombres} {formData.apellidos}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{extraUserData.correoInstitucional}</p>
                    {extraUserData.facultadNombre && (
                      <p className="text-[11px] text-[#b1122b] font-medium mt-1 uppercase tracking-wider">{extraUserData.facultadNombre}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#b1122b] px-4 py-2 rounded-lg flex items-center gap-2 self-start sm:self-auto shadow-sm">
                  <FiAward className="text-lg text-white" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-red-200 uppercase font-bold tracking-wider leading-none">Rol</span>
                    <span className="text-xs font-semibold text-white uppercase tracking-wide mt-0.5">{extraUserData.rolNombre}</span>
                  </div>
                </div>
              </div>

              {/* FORMULARIO PARA VER Y ACTUALIZAR DATOS */}
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                  
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Datos Personales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Nombres *</label>
                      <input
                        type="text"
                        name="nombres"
                        required
                        maxLength={150}
                        className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:ring-1 focus:ring-[#b1122b] focus:border-[#b1122b] transition-all"
                        value={formData.nombres}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Apellidos</label>
                      <input
                        type="text"
                        name="apellidos"
                        maxLength={100}
                        className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:ring-1 focus:ring-[#b1122b] focus:border-[#b1122b] transition-all"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Celular</label>
                      <div className="flex items-center gap-2 border border-slate-300 rounded-md px-3 bg-white focus-within:ring-1 focus-within:ring-[#b1122b] focus-within:border-[#b1122b] transition-all">
                        <FiPhone className="text-slate-400 text-sm" />
                        <input
                          type="text"
                          name="celular"
                          maxLength={20}
                          placeholder="Ej. 987654321"
                          className="w-full text-sm border-none outline-none py-2 text-slate-800 bg-transparent"
                          value={formData.celular}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">ID de Cuenta (Lectura)</label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 text-slate-400 font-mono cursor-not-allowed outline-none"
                        value={formData.id || ""}
                      />
                    </div>
                  </div>

<h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pt-4 pb-2">
  Información Académica
</h3>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div>
    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
      Facultad
    </label>
    <input
      type="text"
      readOnly
      disabled
      className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 text-slate-500"
      value={extraUserData.facultadNombre || ""}
    />
  </div>

  <div>
    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
      Escuela Profesional
    </label>
    <input
      type="text"
      readOnly
      disabled
      className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 text-slate-500"
      value={extraUserData.escuelaNombre || ""}
    />
  </div>

  <div>
    <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
      Departamento Académico
    </label>
    <input
      type="text"
      readOnly
      disabled
      className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 text-slate-500"
      value={extraUserData.departamentoNombre || ""}
    />
  </div>
</div>


                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pt-4 pb-2">Firma Digital Autenticadora</h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      
                      {/* Zona de carga */}
                      <div className="border-2 border-dashed border-slate-300 hover:border-[#b1122b] rounded-lg p-5 text-center cursor-pointer bg-slate-50 hover:bg-slate-50/80 transition-colors relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                        />
                        <FiUpload className="text-slate-400 text-xl mx-auto mb-2" />
                        <span className="text-xs font-semibold text-slate-700 block">Subir Nueva Imagen de Firma</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Formatos: JPG o PNG</span>
                      </div>

                      {/* Previsualización */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[96px] flex items-center justify-center">
                        {formData.firma_digital ? (
                          <div className="text-center">
                            {typeof formData.firma_digital === "string" ? (
                              <img 
                                src={formData.firma_digital} 
                                alt="Firma actual" 
                                className="max-h-16 object-contain mx-auto mix-blend-multiply"
                              />
                            ) : (
                              <div className="text-xs text-green-700 font-semibold flex items-center gap-1 justify-center">
                                <FiFileText className="text-sm" /> Cargado listo: {formData.firma_digital.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No registras ninguna firma.</span>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                {/* BOTÓN DE GUARDADO */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#b1122b] hover:bg-[#8f0e22] text-white font-bold text-xs uppercase tracking-wide px-6 py-3 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando en Servidor...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
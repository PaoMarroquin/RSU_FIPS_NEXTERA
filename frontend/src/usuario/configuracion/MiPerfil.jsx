import React, { useState, useEffect } from "react";
import {
  FiPhone,
  FiUpload,
  FiFileText,
  FiAward,
  FiUser,
  FiBriefcase,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import { usuarioApi } from "../../shared/api/usuario/usuarioApi";
import Layout from "../../shared/layout/Layout";
import { useToast } from "../../shared/context/ToastContext";

export default function MiPerfil() {
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

  const [extraUserData, setExtraUserData] = useState({
    correoInstitucional: "",
    rolNombre: "",
    facultadNombre: "",
    escuelaNombre: "",
    departamentoNombre: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoading(true);

        const data = await usuarioApi.obtenerMiPerfil();

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
          departamentoNombre: data.departamento_nombre || "",
        });
      } catch (error) {
        console.error("Error al cargar perfil:", error);
        showToast("error", "No se pudieron obtener tus datos del servidor.");
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast("error", "La firma debe ser una imagen válida en formato JPG o PNG.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      firma_digital: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataPayload = new FormData();

      dataPayload.append("nombres", formData.nombres);
      dataPayload.append("apellidos", formData.apellidos);
      dataPayload.append("celular", formData.celular);

      if (formData.firma_digital instanceof File) {
        dataPayload.append("firma_digital", formData.firma_digital);
      }

      const resultado = await usuarioApi.actualizarMiPerfil(dataPayload);

      showToast("success", "Perfil actualizado correctamente.");

      if (resultado.firma_digital) {
        setFormData((prev) => ({
          ...prev,
          firma_digital: resultado.firma_digital,
        }));
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      showToast("error", "Hubo un problema al guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // HELPERS DE ESTILO (mismos tokens que Repositorio.jsx)
  // =========================================================

  const SectionTitle = ({ title, description }) => (
    <div className="mb-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {title}
      </h4>

      {description && (
        <p className="text-xs text-slate-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );

  const FieldLabel = ({ children, required = false }) => (
    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
      {children}
      {required && <span className="text-[#b1122b] ml-1">*</span>}
    </label>
  );

  const inputClass =
    "w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-all focus:border-[#b1122b] focus:ring-2 focus:ring-[#b1122b]/10 placeholder:text-slate-400";

  const readOnlyClass =
    "w-full h-10 px-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-not-allowed";

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">

        {/* =====================================================
            HEADER (mismo patrón que Repositorio)
        ===================================================== */}

        <div className="mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">
            Mi Perfil
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Información personal, académica y firma digital asociadas
            a tu cuenta institucional.
          </p>
        </div>

        {loading ? (

          <div className="flex flex-col items-center justify-center flex-1 py-12">

            <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />

            <span className="text-slate-500 font-medium">
              Cargando información del perfil...
            </span>

          </div>

        ) : (

          <div className="space-y-4">

            {/* =================================================
                TARJETA DE RESUMEN
            ================================================= */}

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-center gap-4">

                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#b1122b] font-bold text-2xl shrink-0">
                    {formData.nombres
                      ? formData.nombres.charAt(0).toUpperCase()
                      : "U"}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Cuenta institucional
                    </span>

                    <h1 className="text-lg font-bold text-slate-900">
                      {formData.nombres} {formData.apellidos}
                    </h1>

                    <p className="text-xs text-slate-500 mt-1">
                      {extraUserData.correoInstitucional || "Sin correo registrado"}
                    </p>
                  </div>

                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">

                  <FiAward className="text-[#b1122b] w-5 h-5" />

                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Rol en el sistema
                    </span>

                    <span className="text-xs font-bold text-slate-700">
                      {extraUserData.rolNombre || "Sin rol"}
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                FORMULARIO
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >

              <div className="p-6 md:p-8 space-y-8">

                {/* DATOS PERSONALES */}
                <section>

                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <FiUser className="text-[#b1122b] w-4 h-4" />
                    <SectionTitle
                      title="Datos personales"
                      description="Información básica asociada a tu cuenta."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                    <div>
                      <FieldLabel required>Nombres</FieldLabel>
                      <input
                        type="text"
                        name="nombres"
                        required
                        maxLength={150}
                        className={inputClass}
                        value={formData.nombres}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <FieldLabel>Apellidos</FieldLabel>
                      <input
                        type="text"
                        name="apellidos"
                        maxLength={100}
                        className={inputClass}
                        value={formData.apellidos}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <FieldLabel>Celular</FieldLabel>

                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />

                        <input
                          type="text"
                          name="celular"
                          maxLength={20}
                          placeholder="987 654 321"
                          className={`${inputClass} pl-9`}
                          value={formData.celular}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                  </div>
                </section>

                {/* INFORMACIÓN ACADÉMICA */}
                <section className="border-t border-slate-200 pt-6">

                  <div className="flex items-center gap-2 mb-4">
                    <FiBriefcase className="text-[#b1122b] w-4 h-4" />
                    <SectionTitle
                      title="Información académica"
                      description="Datos institucionales asociados a tu cuenta."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>
                      <FieldLabel>Facultad</FieldLabel>
                      <input
                        type="text"
                        readOnly
                        disabled
                        className={readOnlyClass}
                        value={extraUserData.facultadNombre || "—"}
                      />
                    </div>

                    <div>
                      <FieldLabel>Escuela profesional</FieldLabel>
                      <input
                        type="text"
                        readOnly
                        disabled
                        className={readOnlyClass}
                        value={extraUserData.escuelaNombre || "—"}
                      />
                    </div>

                    <div>
                      <FieldLabel>Departamento académico</FieldLabel>
                      <input
                        type="text"
                        readOnly
                        disabled
                        className={readOnlyClass}
                        value={extraUserData.departamentoNombre || "—"}
                      />
                    </div>

                  </div>
                </section>

                {/* FIRMA DIGITAL */}
                <section className="border-t border-slate-200 pt-6">

                  <div className="flex items-center gap-2 mb-4">
                    <FiFileText className="text-[#b1122b] w-4 h-4" />
                    <SectionTitle
                      title="Firma digital"
                      description="Imagen utilizada para la autenticación y documentación institucional."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* CARGA */}
                    <label className="group relative flex flex-col items-center justify-center min-h-[150px] border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-[#b1122b]/50 transition-colors cursor-pointer">

                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />

                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#b1122b] transition-colors">
                        <FiUpload className="w-4 h-4" />
                      </div>

                      <p className="text-sm font-bold text-slate-700 mt-3">
                        Cargar nueva firma
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        JPG o PNG · Selecciona una imagen
                      </p>
                    </label>

                    {/* PREVISUALIZACIÓN */}
                    <div className="min-h-[150px] border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-4">

                      <span className="text-[10px] text-slate-400 font-semibold mb-3">
                        Firma registrada
                      </span>

                      {formData.firma_digital ? (
                        typeof formData.firma_digital === "string" ? (
                          <>
                            <div className="w-full h-20 flex items-center justify-center bg-white rounded-lg border border-slate-200">
                              <img
                                src={formData.firma_digital}
                                alt="Firma actual"
                                className="max-h-16 max-w-[85%] object-contain mix-blend-multiply"
                              />
                            </div>

                            <span className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FiCheckCircle className="w-3 h-3" />
                              FIRMA REGISTRADA
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                              <FiFileText className="w-4 h-4" />
                            </div>

                            <p className="text-xs font-bold text-slate-700 mt-2 max-w-[250px] truncate">
                              {formData.firma_digital.name}
                            </p>

                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              NUEVA IMAGEN SELECCIONADA
                            </span>
                          </div>
                        )
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                            <FiFileText className="w-4 h-4" />
                          </div>

                          <p className="text-xs text-slate-400 mt-2">
                            No hay una firma registrada.
                          </p>
                        </>
                      )}

                    </div>

                  </div>
                </section>

              </div>

              {/* ACCIONES */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <p className="text-xs text-slate-400">
                  Los cambios se guardarán en tu perfil institucional.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 bg-[#b1122b] hover:bg-[#941020] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      Guardar cambios
                    </>
                  )}
                </button>

              </div>
            </form>

          </div>

        )}

      </div>
    </Layout>
  );
}
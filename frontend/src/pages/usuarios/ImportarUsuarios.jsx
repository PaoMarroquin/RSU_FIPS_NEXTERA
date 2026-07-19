import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import api from "../../api/axiosConfig";
import { userService } from "../../api/userService";
import { 
  FiUploadCloud, 
  FiArrowLeft, 
  FiPlay, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiFileText,
  FiLoader,
  FiDownload
} from "react-icons/fi";
import * as XLSX from "xlsx";

export default function ImportarUsuarios() {
  const navigate = useNavigate();
  const [filas, setFilas] = useState([]);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [archivoCargado, setArchivoCargado] = useState(false);
  
  // Catálogos cargados completamente desde la API paginada
  const [catalogos, setCatalogos] = useState({ roles: [], facultades: [], escuelas: [], departamentos: [] });
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Función auxiliar para traer TODOS los registros sorteando las páginas del backend
  const fetchAllPages = async (endpoint) => {
    let resultadosCompletos = [];
    let url = endpoint;
    
    try {
      while (url) {
        const res = await api.get(url);
        // Manejar si viene paginado { results: [] } o como array plano directo
        const data = res.data.results ? res.data.results : res.data;
        if (Array.isArray(data)) {
          resultadosCompletos = [...resultadosCompletos, ...data];
        }
        url = res.data.next ? res.data.next.replace(/^.*\/(api\/v1\/)/, '/$1') : null; // Normalizar URL para Axios
      }
    } catch (e) {
      console.error(`Error trayendo catálogo de ${endpoint}`, e);
    }
    return resultadosCompletos;
  };

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role?.toLowerCase() !== "departamento") {
      navigate("/dashboard");
      return;
    }

    // Traerse todos los catálogos institucionales al iniciar
    const cargarCatalogos = async () => {
      setLoadingCatalogos(true);
      const [r, f, e, d] = await Promise.all([
        fetchAllPages("/api/v1/roles/"),
        fetchAllPages("/api/v1/facultades/"),
        fetchAllPages("/api/v1/escuelas/"),
        fetchAllPages("/api/v1/departamentos/")
      ]);
      setCatalogos({ roles: r, facultades: f, escuelas: e, departamentos: d });
      setLoadingCatalogos(false);
    };

    cargarCatalogos();
  }, [navigate]);

  // Procesar archivo Excel
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataArray = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(dataArray, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const filasDeContenido = arrayData.slice(1); // Omitir primera fila (cabeceras)

      const filasMapeadas = filasDeContenido.map((fila, index) => {
        const txtRol = strNormalize(fila[5]);
        const txtFac = strNormalize(fila[6]);
        const txtEsc = strNormalize(fila[7]);
        const txtDep = strNormalize(fila[8]);

        // Mapear texto a ID numérico usando los catálogos en memoria
        const matchRol = catalogos.roles.find(x => strNormalize(x.nombre) === txtRol);
        const matchFac = catalogos.facultades.find(x => strNormalize(x.nombre) === txtFac);
        // Escuela y Departamento solo cuentan como match válido si además pertenecen a la Facultad de la fila
        const matchEscRaw = catalogos.escuelas.find(x => strNormalize(x.nombre) === txtEsc);
        const matchDepRaw = catalogos.departamentos.find(x => strNormalize(x.nombre) === txtDep);
        const matchEsc = matchEscRaw && matchFac && matchEscRaw.facultad === matchFac.id ? matchEscRaw : null;
        const matchDep = matchDepRaw && matchFac && matchDepRaw.facultad === matchFac.id ? matchDepRaw : null;

        return {
          indexKey: index,
          nombres: fila[0] || "",
          apellidos: fila[1] || "",
          correo_institucional: fila[2] || "",
          password: fila[3] || "",
          celular: fila[4] || "",
          // Si hace match guarda el ID, sino guarda null para forzar error visual en el front
          rol: matchRol ? matchRol.id : "",
          facultad: matchFac ? matchFac.id : "",
          escuela: matchEsc ? matchEsc.id : "",
          departamento: matchDep ? matchDep.id : "",
          // Mantener el texto original enviado por si hay que renderizar advertencias
          rol_raw: fila[5] || "",
          facultad_raw: fila[6] || "",
          escuela_raw: fila[7] || "",
          departamento_raw: fila[8] || "",
          statusCarga: "pendiente",
          mensajeError: ""
        };
      });

      setFilas(filasMapeadas);
      setArchivoCargado(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const strNormalize = (val) => val ? String(val).toLowerCase().trim() : "";

  // Edición directa
  const handleCellEdit = (indexKey, campo, nuevoValor) => {
    setFilas((prev) =>
      prev.map((f) => {
        if (f.indexKey !== indexKey) return f;
        // Al cambiar la Facultad, limpiamos Escuela/Departamento si ya no le pertenecen
        if (campo === "facultad") {
          const nuevaFacultadId = nuevoValor ? parseInt(nuevoValor) : null;
          const escuelaValida = catalogos.escuelas.find(x => x.id === Number(f.escuela))?.facultad === nuevaFacultadId;
          const depValido = catalogos.departamentos.find(x => x.id === Number(f.departamento))?.facultad === nuevaFacultadId;
          return {
            ...f,
            facultad: nuevoValor,
            escuela: escuelaValida ? f.escuela : "",
            departamento: depValido ? f.departamento : "",
          };
        }
        return { ...f, [campo]: nuevoValor };
      })
    );
  };

  // Validar si el lote entero no tiene errores rojos de nulos obligatorios ni llaves foráneas vacías
  const isLoteValido = filas.every(
    (f) => f.nombres.trim() !== "" && f.correo_institucional.trim() !== "" && f.password.trim() !== "" && f.rol && f.facultad
  );

  const handleProcesarMasivo = async () => {
    setProcesandoMasivo(true);

    for (let i = 0; i < filas.length; i++) {
      const filaActual = filas[i];
      if (filaActual.statusCarga === "cargado") continue;

      setFilas((prev) => prev.map((f) => f.indexKey === filaActual.indexKey ? { ...f, statusCarga: "procesando" } : f));

      try {
        await userService.createUsuario(
          filaActual.nombres,
          filaActual.apellidos || "",
          filaActual.correo_institucional,
          filaActual.password,
          filaActual.celular || null,
          filaActual.rol ? parseInt(filaActual.rol) : null,
          filaActual.facultad ? parseInt(filaActual.facultad) : null,
          filaActual.escuela ? parseInt(filaActual.escuela) : null,
          filaActual.departamento ? parseInt(filaActual.departamento) : null,
          "activo"
        );

        setFilas((prev) => prev.map((f) => f.indexKey === filaActual.indexKey ? { ...f, statusCarga: "cargado", mensajeError: "" } : f));
      } catch (error) {
        let errorMsg = "Error de registro";
        if (error.response && error.response.data) errorMsg = JSON.stringify(error.response.data);
        setFilas((prev) => prev.map((f) => f.indexKey === filaActual.indexKey ? { ...f, statusCarga: "error", mensajeError: errorMsg } : f));
      }
    }
    setProcesandoMasivo(false);
    navigate("/usuarios");
  };

  if (loadingCatalogos) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center flex-col gap-4">
        <FiLoader className="text-4xl text-[#7B1E3A] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Sincronizando catálogos institucionales paginados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8 space-y-6">
          
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
                <FiFileText className="text-[#7B1E3A]" /> Importación Masiva Inteligente
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                El sistema valida automáticamente los nombres textuales del Excel contra la base de datos de la FIPS
              </p>
            </div>
            <button onClick={() => navigate("/usuarios")} className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 flex items-center gap-2 transition-colors shadow-sm">
              <FiArrowLeft /> Regresar
            </button>
          </div>

          {/* INPUT EXCEL */}
          {!archivoCargado && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-[#7B1E3A] p-12 text-center transition-colors shadow-sm flex flex-col items-center justify-center relative cursor-pointer">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FiUploadCloud className="text-5xl text-slate-400 mb-4" />
                <p className="text-base font-semibold text-slate-700 m-0">Arrastra tu hoja de usuarios aquí</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700 m-0">El Excel debe tener estas columnas, en este orden:</p>
                  <p className="m-0">
                    Nombres, Apellidos, Correo institucional, Contraseña, Celular, Rol, Facultad, Escuela, Departamento
                  </p>
                  <p className="m-0 text-slate-500">
                    Rol, Facultad, Escuela y Departamento deben coincidir textualmente (sin distinguir mayúsculas) con los catálogos del sistema.
                  </p>
                </div>
                <a
                  href="/plantillas/Plantilla_Usuarios_FIPS.xlsx"
                  download
                  className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 flex items-center gap-2 transition-colors shadow-sm shrink-0"
                >
                  <FiDownload /> Descargar plantilla
                </a>
              </div>
            </div>
          )}

          {/* TABLA DE DETALLES */}
          {archivoCargado && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">Filas procesadas: {filas.length}</span>
                  {!isLoteValido && (
                    <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium">
                      <FiAlertCircle /> Celdas en rojo requieren corrección o selección de catálogo.
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-3 pl-4 w-44">Nombres *</th>
                        <th className="p-3 w-40">Apellidos</th>
                        <th className="p-3 w-48">Correo Inst. *</th>
                        <th className="p-3 w-36">Contraseña *</th>
                        <th className="p-3 w-32">Celular</th>
                        <th className="p-3 w-48">Rol *</th>
                        <th className="p-3 w-56">Facultad *</th>
                        <th className="p-3 w-56">Escuela</th>
                        <th className="p-3 w-56">Departamento</th>
                        <th className="p-3 pr-4 text-center w-36">Carga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                      {filas.map((f) => {
                        const nomError = f.nombres.trim() === "";
                        const corrError = f.correo_institucional.trim() === "";
                        const passError = f.password.trim() === "";
                        
                        return (
                          <tr key={f.indexKey} className="hover:bg-slate-50/50 transition-colors">
                            <td className={`p-2 ${nomError ? "bg-red-50" : ""}`}>
                              <input type="text" value={f.nombres} onChange={(e) => handleCellEdit(f.indexKey, "nombres", e.target.value)} className={`w-full bg-transparent p-1 border rounded ${nomError ? "border-red-400 text-red-900" : "border-transparent focus:border-slate-300"}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={f.apellidos} onChange={(e) => handleCellEdit(f.indexKey, "apellidos", e.target.value)} className="w-full bg-transparent p-1 border border-transparent focus:border-slate-300 rounded" />
                            </td>
                            <td className={`p-2 ${corrError ? "bg-red-50" : ""}`}>
                              <input type="email" value={f.correo_institucional} onChange={(e) => handleCellEdit(f.indexKey, "correo_institucional", e.target.value)} className={`w-full bg-transparent p-1 border rounded ${corrError ? "border-red-400 text-red-900" : "border-transparent focus:border-slate-300"}`} />
                            </td>
                            <td className={`p-2 ${passError ? "bg-red-50" : ""}`}>
                              <input type="text" value={f.password} onChange={(e) => handleCellEdit(f.indexKey, "password", e.target.value)} className={`w-full bg-transparent p-1 border rounded ${passError ? "border-red-400 text-red-900" : "border-transparent focus:border-slate-300"}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={f.celular} onChange={(e) => handleCellEdit(f.indexKey, "celular", e.target.value)} className="w-full bg-transparent p-1 border border-transparent focus:border-slate-300 rounded" />
                            </td>

                            {/* SELECT RELACIONALES DINÁMICOS CON CONTROL VERDE / ROJO */}
                            <td className={`p-2 ${!f.rol ? "bg-red-50" : "bg-green-50/40"}`}>
                              <select value={f.rol || ""} onChange={(e) => handleCellEdit(f.indexKey, "rol", e.target.value)} className={`w-full bg-transparent p-1 border rounded ${!f.rol ? "border-red-400 text-red-900" : "border-green-300 text-green-900"}`}>
                                <option value="">{f.rol ? "✓ Seleccionado" : `No coincide: "${f.rol_raw}"`}</option>
                                {catalogos.roles.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                              </select>
                            </td>

                            <td className={`p-2 ${!f.facultad ? "bg-red-50" : "bg-green-50/40"}`}>
                              <select value={f.facultad || ""} onChange={(e) => handleCellEdit(f.indexKey, "facultad", e.target.value)} className={`w-full bg-transparent p-1 border rounded ${!f.facultad ? "border-red-400 text-red-900" : "border-green-300 text-green-900"}`}>
                                <option value="">{f.facultad ? "✓ Seleccionado" : `No coincide: "${f.facultad_raw}"`}</option>
                                {catalogos.facultades.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                              </select>
                            </td>

                            <td className={`p-2 ${f.escuela_raw && !f.escuela ? "bg-amber-50" : f.escuela ? "bg-green-50/40" : ""}`}>
                              <select value={f.escuela || ""} onChange={(e) => handleCellEdit(f.indexKey, "escuela", e.target.value)} disabled={!f.facultad} className={`w-full bg-transparent p-1 border rounded ${!f.facultad ? "opacity-50 cursor-not-allowed border-transparent" : f.escuela_raw && !f.escuela ? "border-amber-400" : f.escuela ? "border-green-300" : "border-transparent"}`}>
                                <option value="">{!f.facultad ? "Seleccione Facultad primero" : f.escuela ? "✓ Seleccionado" : f.escuela_raw ? `Desconocido: "${f.escuela_raw}"` : "— Seleccione —"}</option>
                                {catalogos.escuelas.filter(x => x.facultad === Number(f.facultad)).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                              </select>
                            </td>

                            <td className={`p-2 ${f.departamento_raw && !f.departamento ? "bg-amber-50" : f.departamento ? "bg-green-50/40" : ""}`}>
                              <select value={f.departamento || ""} onChange={(e) => handleCellEdit(f.indexKey, "departamento", e.target.value)} disabled={!f.facultad} className={`w-full bg-transparent p-1 border rounded ${!f.facultad ? "opacity-50 cursor-not-allowed border-transparent" : f.departamento_raw && !f.departamento ? "border-amber-400" : f.departamento ? "border-green-300" : "border-transparent"}`}>
                                <option value="">{!f.facultad ? "Seleccione Facultad primero" : f.departamento ? "✓ Seleccionado" : f.departamento_raw ? `Desconocido: "${f.departamento_raw}"` : "— Seleccione —"}</option>
                                {catalogos.departamentos.filter(x => x.facultad === Number(f.facultad)).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                              </select>
                            </td>

                            {/* STATUS CARGA */}
                            <td className="p-2 text-center font-semibold whitespace-nowrap">
                              {f.statusCarga === "pendiente" && <span className="text-slate-400">Listo</span>}
                              {f.statusCarga === "procesando" && <span className="text-amber-500 animate-pulse">Guardando...</span>}
                              {f.statusCarga === "cargado" && <span className="text-green-600 flex items-center justify-center gap-1"><FiCheckCircle /> OK</span>}
                              {f.statusCarga === "error" && <span className="text-red-600 flex items-center justify-center gap-1 cursor-help" title={f.mensajeError}><FiAlertCircle /> Falló</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <button type="button" onClick={() => { setFilas([]); setArchivoCargado(false); }} disabled={procesandoMasivo} className="h-10 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                  Cambiar Excel
                </button>
                <button onClick={handleProcesarMasivo} disabled={!isLoteValido || procesandoMasivo || filas.length === 0} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:cursor-not-allowed">
                  <FiPlay /> {procesandoMasivo ? "Insertando..." : "Subir Usuarios Confirmados"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
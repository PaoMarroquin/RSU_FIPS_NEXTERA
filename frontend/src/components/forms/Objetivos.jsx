import React, { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import api from '../../api/axiosConfig';

export default function Objetivos({ data, updateData }) {
  const [odsList, setOdsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar los ODS desde la base de datos
  useEffect(() => {
    const fetchOds = async () => {
      try {
        const response = await api.get('/api/v1/ods/');
        // Ordenamos por número para que el 1 al 17 salgan en orden perfecto
        const odsOrdenados = response.data.results.sort((a, b) => a.numero - b.numero);
        setOdsList(odsOrdenados);
      } catch (error) {
        console.error("Error cargando los ODS:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOds();
  }, []);
  
  const handleChange = (e) => {
    updateData(e.target.name, e.target.value);
  };

  // 2. Manejador para agregar o quitar el ID del ODS al arreglo
  const handleOdsToggle = (odsId) => {
    const currentOds = data.ods || [];
    if (currentOds.includes(odsId)) {
      // Si ya está, lo filtramos (lo quitamos)
      updateData('ods', currentOds.filter(id => id !== odsId));
    } else {
      // Si no está, lo agregamos al arreglo
      updateData('ods', [...currentOds, odsId]);
    }
  };

  return (
    <div className="space-y-8 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">IV.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Objetivos</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 4 de 9</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* PREGUNTA 1 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 leading-snug">
            ¿Qué queremos lograr con nuestra intervención en el grupo beneficiario? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y shadow-inner" 
            name="obj_lograrBeneficiario" 
            placeholder="Describa el impacto esperado en el grupo beneficiario..." 
            value={data.obj_lograrBeneficiario || ''} 
            onChange={handleChange} 
          />
        </div>

        {/* PREGUNTA 2 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 leading-snug">
            ¿Qué queremos mejorar en el proceso curricular? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y shadow-inner" 
            name="obj_mejorarCurricular" 
            placeholder="Describa los aportes y mejoras desde el punto de vista académico..." 
            value={data.obj_mejorarCurricular || ''} 
            onChange={handleChange} 
          />
        </div>

        <hr className="border-slate-100 my-2" />

        {/* SECCIÓN ODS (Múltiple Selección) */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 leading-snug">
              Objetivos de Desarrollo Sostenible (ODS) vinculados <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mt-1">Seleccione uno o más ODS a los que contribuye este proyecto.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FiLoader className="animate-spin text-[#b1122b] text-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {odsList.map((ods) => {
                const isSelected = (data.ods || []).includes(ods.id);
                
                return (
                  <div
                    key={ods.id}
                    onClick={() => handleOdsToggle(ods.id)}
                    className={`cursor-pointer border rounded-lg p-2.5 flex items-center gap-3 transition-all duration-200 ${
                      isSelected 
                        ? 'border-[#b1122b] bg-red-50/20 shadow-sm' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox Oculto para accesibilidad */}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected}
                      readOnly 
                    />
                    
                    {/* Ícono de la API */}
                    <img 
                      src={ods.icono_url} 
                      alt={`ODS ${ods.numero}`} 
                      className={`w-10 h-10 rounded-md object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80'}`} 
                    />
                    
                    {/* Texto y Check visual */}
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <p className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-[#b1122b]' : 'text-slate-700'}`}>
                        {ods.numero}. {ods.nombre}
                      </p>
                      
                      {/* Círculo indicador */}
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'border-[#b1122b] bg-[#b1122b]' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
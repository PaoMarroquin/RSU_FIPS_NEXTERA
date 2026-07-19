import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiLoader } from 'react-icons/fi';

export default function PaginatedSelect({ 
  label, 
  name, 
  value,
  selectedName, 
  onChange, 
  fetchFn, 
  placeholder,
  disabled = false,
  dependencia = null,
  valueKey = 'id',
  labelKey = 'nombre'
}) {
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. EFECTO DE RESOLUCIÓN: Si llega un ID (value) pero no su nombre, ejecuta la recursividad del servicio
  useEffect(() => {
    if (value && !selectedName && !disabled) {
      const alreadyExists = options.some(opt => opt[valueKey] === value);
      
      if (!alreadyExists) {
        const resolveMissingName = async () => {
          setIsLoading(true);
          try {
            // Pasamos 'true' como tercer parámetro para activar el modo recursivo del servicio
            const data = await fetchFn(1, dependencia, true);
            setOptions(data.results || []);
            setHasMore(false); // Ya se trajo todo, no hay más páginas que pedir por scroll
          } catch (error) {
            console.error(`Error resolviendo nombre huérfano para ${name}:`, error);
          } finally {
            setIsLoading(false);
          }
        };
        resolveMissingName();
      }
    }
  }, [value, selectedName, dependencia, disabled, fetchFn, name, valueKey]);

  // 2. EFECTO DE CASCADA: Si cambia el padre (dependencia) o se deshabilita, se resetea por completo
  useEffect(() => {
    setOptions([]);
    setPage(1);
    setHasMore(true);
    
    if (!disabled && isOpen) {
      fetchData(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencia, disabled]);

  // 3. EFECTO DE APERTURA Y PAGINACIÓN
  useEffect(() => {
    if (isOpen && page > 1) {
      fetchData(page);
    } else if (isOpen && options.length === 0) {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isOpen]);

  const fetchData = async (pageNum, reset = false) => {
    if (isLoading || (!hasMore && !reset)) return;
    
    setIsLoading(true);
    try {
      // Paginación normal por defecto (getAll = false)
      const data = await fetchFn(pageNum, dependencia, false);
      const newResults = data.results || [];
      
      setOptions(prev => reset ? newResults : [...prev, ...newResults]);
      setHasMore(data.next !== null);
    } catch (error) {
      console.error(`Error en PaginatedSelect (${name}):`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5 && hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const handleSelect = (option) => {
    onChange({
      target: { name, value: option[valueKey], type: 'select' }
    }, option[labelKey]);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt[valueKey] === value);
  const displayText = selectedOption ? selectedOption[labelKey] : (selectedName || placeholder);

  return (
    <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-600">
        {label} <span className="text-red-500">*</span>
      </label>
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 flex items-center justify-between text-sm transition-all
          ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#b1122b] focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b]'}
        `}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {displayText}
        </span>
        {isLoading && !isOpen ? (
          <FiLoader className="animate-spin text-[#b1122b]" />
        ) : (
          <FiChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[60px] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <ul className="max-h-48 overflow-y-auto p-1" onScroll={handleScroll} ref={listRef}>
            {options.map((opt) => (
              <li 
                key={opt[valueKey]}
                onClick={() => handleSelect(opt)}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors
                  ${value === opt[valueKey] ? 'bg-red-50 text-[#b1122b] font-semibold' : 'text-slate-700 hover:bg-slate-100'}
                `}
              >
                {opt[labelKey]}
              </li>
            ))}
            
            {isLoading && (
              <li className="px-3 py-3 text-center flex justify-center">
                <FiLoader className="animate-spin text-[#b1122b]" />
              </li>
            )}
            
            {!isLoading && options.length === 0 && (
              <li className="px-3 py-3 text-sm text-center text-slate-500">
                No se encontraron resultados
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiLoader } from 'react-icons/fi';
import api from '../../api/axiosConfig';

export default function PaginatedSelect({ 
  label, 
  name, 
  value,
  selectedName, 
  onChange, 
  endpoint, 
  placeholder,
  disabled = false,
  dependencia = null
}) {
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOptions([]);
    setPage(1);
    setHasMore(true);
    if (!disabled && isOpen) {
      fetchData(1, true);
    }
  }, [dependencia, disabled]);

  useEffect(() => {
    if (isOpen && page > 1) {
      fetchData(page);
    } else if (isOpen && options.length === 0) {
      fetchData(1);
    }
  }, [page, isOpen]);

  const fetchData = async (pageNum, reset = false) => {
    if (isLoading || (!hasMore && !reset)) return;
    
    setIsLoading(true);
    try {
      const queryParam = dependencia ? `&facultad=${dependencia}` : '';
      const response = await api.get(`${endpoint}?page=${pageNum}${queryParam}`);
      
      const newResults = response.data.results;
      setOptions(prev => reset ? newResults : [...prev, ...newResults]);
      setHasMore(response.data.next !== null);
    } catch (error) {
      console.error(`Error cargando datos de ${endpoint}:`, error);
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
    // AQUÍ ESTÁ LA MAGIA: Pasamos el evento normal, y como segundo parámetro el NOMBRE real
    onChange({
      target: {
        name: name,
        value: option.id,
        type: 'select'
      }
    }, option.nombre);
    
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.id === value);
  const displayText = selectedOption ? selectedOption.nombre : (selectedName || placeholder);

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
        <FiChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[60px] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <ul 
            className="max-h-48 overflow-y-auto p-1"
            onScroll={handleScroll}
            ref={listRef}
          >
            {options.map((opt) => (
              <li 
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors
                  ${value === opt.id ? 'bg-red-50 text-[#b1122b] font-semibold' : 'text-slate-700 hover:bg-slate-100'}
                `}
              >
                {opt.nombre}
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
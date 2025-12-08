// src/components/common/SearchableSelect.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { icons } from '../../utils/icons'; 

// Ícone de seta para baixo (exemplo)
const ChevronDownIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export function SearchableSelect({
  options = [], // Espera um array de { value: any, label: string }
  value,       // O valor selecionado (ex: patientId)
  onChange,    // Função chamada com o NOVO VALOR selecionado
  placeholder = "Selecione...",
  disabled = false,
  notFoundText = "Nenhum resultado encontrado."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null); // Ref para detectar cliques fora

  // Encontra o label correspondente ao valor atual
  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption ? selectedOption.label : '';
  }, [options, value]);

  // Filtra as opções baseado na busca
  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, searchTerm]);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      // Limpa a busca ao abrir (opcional, mas comum)
      // if (!isOpen) {
      //   setSearchTerm('');
      // }
    }
  };

  const handleSelectOption = (optionValue) => {
    onChange(optionValue); // Chama a função passada por props
    setIsOpen(false);
    setSearchTerm(''); // Limpa busca após selecionar
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
      {/* Botão que abre o dropdown e mostra seleção */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`w-full flex justify-between items-center p-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            !selectedLabel && !placeholder ? 'text-gray-500' : 'text-gray-900'
        } ${disabled ? 'bg-gray-100' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            {ChevronDownIcon}
        </span>
      </button>

      {/* Dropdown com busca e opções */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 animate-fade-in-fast overflow-hidden">
          {/* Campo de Busca Interno */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-1.5 pl-8 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  autoFocus // Foca no campo ao abrir
                />
                <div className="absolute left-2.5 top-2 text-gray-400 w-4 h-4 pointer-events-none">
                    {icons.search || <span>🔍</span>} {/* Fallback caso icons.search falhe */}
                </div>
            </div>
          </div>

          {/* Lista de Opções Rolável */}
          <ul
            className="max-h-60 overflow-y-auto text-sm py-1"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    value === option.value ? 'bg-blue-100 font-medium' : '' // Destaca selecionado
                  }`}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500">{notFoundText}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
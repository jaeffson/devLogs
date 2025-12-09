// src/components/common/Modal.jsx (Arquivo Único)

import React, { useState } from 'react';

// --- Ícones e Componentes Auxiliares ---

const CloseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Componente auxiliar para o Ícone do Spinner
const SpinnerIcon = () => (
  <svg 
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    ></circle>
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- 1. Modal Principal (Componente Base) ---

export function Modal({ children, onClose }) {
  return (
    <div
      // Adicionado p-4 para garantir padding em telas pequenas e centralização
      className="fixed inset-0 bg-[#ececeec2] bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out" 
      role="dialog"
      aria-modal="true"
    >
      <div 
         // FIX: Largura responsiva. w-full no mobile, max-w-lg no desktop.
         // Mantido p-[24px] para preservar o padding original.
         className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-3xl relative animate-fade-in-up overflow-hidden p-[24px]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          aria-label="Fechar modal"
        >
          {CloseIcon}
        </button>
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}

// --- 2. Confirm Modal (Com Lógica do Spinner) ---

export function ConfirmModal({ // Exportação nomeada para ser acessada no arquivo de destino
  message,
  onConfirm,
  onClose,
  title = 'Confirmação',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}) {
  const [isLoading, setIsLoading] = useState(false); 

  const handleConfirm = async () => {
    setIsLoading(true); // Ativa o spinner
    
    try {
      // O 'await' pausa aqui, mantendo o spinner visível
      await onConfirm();
    } catch (error) {
      console.error("Erro na ação de confirmação:", error);
    } finally {
      setIsLoading(false); // Desativa o spinner
    }
  };

  return (
    <Modal onClose={onClose}> {/* Usa o Modal definido acima */}
      <div className="pb-4 border-b border-gray-200 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <p className="text-gray-600 mb-6 text-sm">{message}</p>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        
        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading} 
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        
        {/* Botão Confirmar */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading} 
          className={`px-4 py-2 rounded-md font-medium text-sm text-white transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isLoading && <SpinnerIcon />} 
          <span>{confirmText}</span>
        </button>
      </div>
    </Modal>
  );
}

// Exportação principal do arquivo
export default Modal;
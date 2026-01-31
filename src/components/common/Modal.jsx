// src/components/common/Modal.jsx

import React, { useState } from 'react';

// --- Ícones e Componentes Auxiliares ---

const CloseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
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
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
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
      // ATUALIZADO: Overlay com backdrop-blur para efeito "vidro" moderno
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300 ease-in-out" 
      role="dialog"
      aria-modal="true"
    >
      <div 
         className="bg-white rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg md:max-w-xl lg:max-w-2xl relative animate-fade-in-up overflow-hidden p-6 md:p-8 transform transition-all"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-90"
          aria-label="Fechar modal"
        >
          {CloseIcon}
        </button>
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}

// --- 2. Confirm Modal (CORRIGIDO) ---

export function ConfirmModal({
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
    setIsLoading(true); 
    
    try {
      // 1. Executa a ação (aguarda o backend/api)
      await onConfirm();
      
      // 2. CORREÇÃO: Fecha o modal após o sucesso!
      onClose(); 

    } catch (error) {
      console.error("Erro na ação de confirmação:", error);
      // Aqui você pode adicionar um toast de erro se quiser
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="mb-3">
        <h2 className={`text-xl font-bold tracking-tight ${isDestructive ? 'text-red-600' : 'text-slate-800'}`}>
          {title}
        </h2>
      </div>
      
      <p className="text-slate-600 mb-8 text-base leading-relaxed">
        {message}
      </p>

      <div className="flex justify-end gap-3 pt-0 mt-6">
        
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading} 
          className="cursor-pointer px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 font-medium text-sm transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
        >
          {cancelText}
        </button>
        
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading} 
          className={`cursor-pointer px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-200 focus:ring-red-100'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 focus:ring-indigo-100'
          }`}
        >
          {isLoading && <SpinnerIcon />} 
          <span>{confirmText}</span>
        </button>
      </div>
    </Modal>
  );
}

export default Modal;
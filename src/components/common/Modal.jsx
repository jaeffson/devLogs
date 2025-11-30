// src/components/common/Modal.jsx

import React, { useState } from 'react'; // <-- Importar useState


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
    setIsLoading(true); // 1
    try {
  
      await onConfirm();
    } catch (error) {
      console.error("Erro na confirmação:", error);
    } finally {
    
      setIsLoading(false); 
    }
  };


  const ButtonSpinner = () => (
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

  return (
    <Modal onClose={onClose}>
      <div className="pb-4 border-b border-gray-200 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <p className="text-gray-600 mb-6 text-sm">{message}</p>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        {/* Botão Cancelar: Desabilitado enquanto carrega */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading} // <-- Desabilita
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        {/* Botão Confirmar: Com Spinner e Lógica de Carregamento */}
        <button
          type="button"
          // Mudar a chamada para o novo handler
          onClick={handleConfirm}
          // Desabilita o botão enquanto carrega
          disabled={isLoading}
          className={`px-4 py-2 rounded-md font-medium text-sm text-white transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isLoading && <ButtonSpinner />} {/* <-- Exibe o Spinner */}
          {!isLoading && confirmText}    {/* <-- Exibe o texto se NÃO estiver carregando */}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;
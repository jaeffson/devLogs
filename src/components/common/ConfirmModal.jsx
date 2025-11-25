// src/components/common/ConfirmModal.jsx
import React, { useState } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons'; // Opcional, se quiser usar ícones

export default function ConfirmModal({
  title = "Confirmação",
  message,
  onConfirm,
  onClose,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    // Ativa spinner
    setIsSubmitting(true);
    
    try {
      if (typeof onConfirm === 'function') {
        // Aguarda a execução da função passada (se for async)
        await onConfirm();
      }
      // Nota: Não chamamos onClose() aqui automaticamente porque 
      // geralmente o componente pai fecha o modal após o sucesso.
      // Se quiser fechar automático, descomente a linha abaixo:
      // onClose();
    } catch (error) {
      console.error("Erro na confirmação:", error);
      setIsSubmitting(false); // Para o spinner se der erro e o modal continuar aberto
    }
  };

  return (
    <Modal onClose={onClose}>
      {/* Cabeçalho */}
      <div className="pb-3 border-b border-gray-100 mb-4">
        <h2 className={`text-lg font-bold ${isDestructive ? 'text-red-600' : 'text-gray-800'}`}>
          {title}
        </h2>
      </div>

      {/* Conteúdo */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm leading-relaxed">
          {message}
        </p>
      </div>

      {/* Rodapé com Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className={`
            px-4 py-2 rounded-md font-medium text-sm text-white transition-all shadow-sm flex items-center justify-center gap-2 min-w-[100px]
            ${isDestructive
              ? (isSubmitting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:bg-red-800')
              : (isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800')
            }
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>...</span>
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}
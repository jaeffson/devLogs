// src/components/common/ConfirmModal.jsx

import React, { useState } from 'react';
// IMPORTANTE: Certifique-se de que o caminho para o Modal está correto.
import { Modal } from './Modal'; 

// Componente auxiliar para o Ícone do Spinner
const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


export  function ConfirmModal({
  message,
  onConfirm,
  onClose,
  title = "Confirmação",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false
}) {
  // Estado para controlar se o processo está em andamento
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função assíncrona que gerencia o clique e o estado
  const handleConfirmClick = async () => {
    setIsSubmitting(true);
    try {
      if (typeof onConfirm === 'function') {
        // O 'await' é a chave para o spinner funcionar. Ele pausa o código aqui.
        await onConfirm();
      }
    } catch (error) {
      console.error("Erro na confirmação:", error);
    } finally {
      // O spinner é desligado após a conclusão (sucesso ou falha)
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-gray-200 mb-4">
        <h2 className={`text-lg font-semibold ${isDestructive ? 'text-red-600' : 'text-gray-800'}`}>
          {title}
        </h2>
      </div>

      {/* Conteúdo */}
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        {message}
      </p>

      {/* Rodapé (Botões) */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting} // Desabilita durante o envio
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>

        {/* Botão Confirmar (com Spinner) */}
        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={isSubmitting} // Desabilita durante o envio
          className={`
            px-4 py-2 rounded-md font-medium text-sm text-white transition-all shadow-sm flex items-center justify-center gap-2 min-w-[100px]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isDestructive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' // Destrutivo (Vermelho)
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' // Padrão (Azul)
            }
          `}
        >
          {/* Mostra o spinner se estiver carregando */}
          {isSubmitting && <SpinnerIcon />}
          {/* Sempre mostra o texto do botão */}
          <span>{confirmText}</span>
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
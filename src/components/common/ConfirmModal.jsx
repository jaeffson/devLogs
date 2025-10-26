// src/components/common/ConfirmModal.jsx
import React from 'react';
import { Modal } from '../common/Modal'; // Importa o componente Modal base


export default  function ConfirmModal({
  message,
  onConfirm,
  onClose,
  title = "Confirmação", // Título padrão
  confirmText = "Confirmar", // Texto do botão principal
  cancelText = "Cancelar", // Texto do botão secundário
  isDestructive = false // Deixa o botão principal vermelho se true
}) {
  return (
    // Usa o Modal base para a estrutura
    <Modal onClose={onClose}>
      {/* Cabeçalho do Modal de Confirmação */}
      <div className="pb-4 border-b border-gray-200 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      {/* Mensagem */}
      <p className="text-gray-600 mb-6 text-sm">{message}</p>

      {/* Rodapé com Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm transition-colors duration-150 ease-in-out"
        >
          {cancelText}
        </button>
        {/* Botão Confirmar */}
        <button
          type="button"
          onClick={() => { 
            if(typeof onConfirm === 'function') {
              onConfirm(); 
            }
            // Não fechamos automaticamente aqui, quem chama decide (ex: handleCancelRecordConfirm)
          }}
          // Estilo condicional (vermelho para destrutivo, azul para padrão)
          className={`px-4 py-2 rounded-md font-medium text-sm text-white transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' // Estilo Destrutivo
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' // Estilo Padrão
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

// Nota: Não exportamos como default aqui, pois o arquivo pode conter mais exports no futuro
// E já temos o Modal base exportado como default no outro arquivo.
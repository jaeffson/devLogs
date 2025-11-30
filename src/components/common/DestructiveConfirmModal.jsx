// src/components/common/DestructiveConfirmModal.jsx
// (ATUALIZADO: Adicionado ClipLoader e lógica de isSubmitting)

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons'; 
// NOVO: Importa o ClipLoader
import { ClipLoader } from 'react-spinners'; 

export function DestructiveConfirmModal({
  message,
  confirmText, 
  onConfirm,
  onClose,
}) {
  const [inputValue, setInputValue] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // NOVO: Estado de envio

  useEffect(() => {
    setIsConfirmed(inputValue.toLowerCase() === confirmText.toLowerCase());
  }, [inputValue, confirmText]);

  const handleConfirmAndClose = async () => {
    if (!isConfirmed) return;

    setIsSubmitting(true); 
    try {
        await onConfirm(); // Assume que onConfirm faz a chamada API e fecha o modal no sucesso, ou
        onClose(); // Se onConfirm não fechar o modal
    } catch (error) {
        console.error("Erro na exclusão destrutiva:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-2">
        <div className="flex justify-center mb-4">
          <span className="w-14 h-14 text-red-500 bg-red-100 rounded-full flex items-center justify-center">
            <span className="w-8 h-8">{icons.trash}</span> 
          </span>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-3">Ação Destrutiva</h2>
        <p className="text-center text-gray-600 mb-4">{message}</p>

        <div className="space-y-2">
          <label htmlFor="confirm-input" className="text-sm font-medium text-gray-700">
            Para confirmar, digite "<strong>{confirmText}</strong>" no campo abaixo:
          </label>
          <input
            type="text"
            id="confirm-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
            autoFocus
            disabled={isSubmitting} // Desabilita o input
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting} // Desabilita o Cancelar
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleConfirmAndClose}
            disabled={!isConfirmed || isSubmitting} // Desabilita se não confirmado ou se estiver enviando
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium transition-opacity
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-red-700 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
                <>
                    {/* ClipLoader */}
                    <ClipLoader color="#ffffff" size={20} />
                    <span>Excluindo...</span>
                </>
            ) : (
                <span>Excluir Permanentemente</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
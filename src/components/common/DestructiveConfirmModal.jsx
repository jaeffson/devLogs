// src/components/common/DestructiveConfirmModal.jsx

import React, { useState } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons'; 
import { ClipLoader } from 'react-spinners'; 

export function DestructiveConfirmModal({
  isOpen, // Recebe isOpen caso o Modal precise
  onClose,
  onConfirm,
  title = "Excluir Item", // Valor padrão
  message = "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.", // Valor padrão
  confirmText, 
}) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação em tempo real (sem useEffect para evitar atrasos)
  const isConfirmed = confirmText 
    ? inputValue.toLowerCase() === confirmText.toLowerCase()
    : true; // Se não tiver texto de confirmação, é sempre true

  const handleConfirmAndClose = async () => {
    if (!isConfirmed || isSubmitting) return;

    setIsSubmitting(true); 
    try {
        // 1. Aguarda a exclusão (O pai deve retornar uma Promise!)
        await onConfirm(); 
        
        // 2. Fecha o modal somente após o sucesso
        onClose(); 
    } catch (error) {
        console.error("Erro na exclusão:", error);
        // Se der erro, paramos o loader para o usuário tentar de novo
        setIsSubmitting(false); 
    }
  };

  // Reseta o input quando o modal fecha/abre (opcional, mas boa prática)
  if (!isOpen && inputValue) setInputValue('');

  return (
    <Modal onClose={isSubmitting ? undefined : onClose}>
      <div className="p-4 md:p-6">
        {/* Ícone de Lixeira */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse-slow">
            <span className="text-red-600 w-8 h-8">
                {icons.trash || <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            </span> 
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-3">
            {title}
        </h2>
        
        <p className="text-center text-gray-600 mb-6 leading-relaxed">
            {message}
        </p>

        {/* Input de Confirmação (Só aparece se confirmText for passado) */}
        {confirmText && (
          <div className="space-y-3 mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
            <label htmlFor="confirm-input" className="block text-sm text-red-800">
              Digite <span className="font-bold select-all">"{confirmText}"</span> para confirmar:
            </label>
            <input
              type="text"
              id="confirm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              placeholder={confirmText}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2 border-t border-gray-100 pt-5">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          
          <button 
            type="button" 
            onClick={handleConfirmAndClose}
            disabled={!isConfirmed || isSubmitting}
            className={`
                w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all shadow-sm
                ${(!isConfirmed || isSubmitting)
                    ? 'bg-red-300 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-md active:scale-95'
                }
            `}
          >
            {isSubmitting ? (
                <>
                    <ClipLoader color="#ffffff" size={18} />
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
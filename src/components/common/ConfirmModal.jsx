import React, { useState } from 'react';
import { Modal } from './Modal';

export default function ConfirmModal({
  message,
  onConfirm,
  onClose,
  title = "Confirmação",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmClick = async () => {
    setIsSubmitting(true);
    try {
      if (typeof onConfirm === 'function') {
        // Aguarda a execução caso seja uma função async
        await onConfirm();
      }
      // onClose() geralmente é chamado pelo pai, mas se não for, o botão libera o loading
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="pb-4 border-b border-gray-200 mb-4">
        <h2 className={`text-lg font-semibold ${isDestructive ? 'text-red-600' : 'text-gray-800'}`}>
          {title}
        </h2>
      </div>

      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        {message}
      </p>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>

        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={isSubmitting}
          className={`
            px-4 py-2 rounded-md font-medium text-sm text-white flex items-center justify-center gap-2 min-w-[100px] transition-all shadow-sm
            ${isDestructive
              ? (isSubmitting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700')
              : (isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700')
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
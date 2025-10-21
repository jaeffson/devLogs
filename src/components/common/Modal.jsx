import React from 'react';

// Componente: Modal genérico
export function Modal({ children, onClose }) {
  // Impedir o fechamento ao clicar dentro do modal, permitir fora
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick} // Fecha ao clicar no fundo
    >
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 relative animate-fade-in-up"> {/* Animação simples */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
          aria-label="Fechar modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

// Componente: Modal de Confirmação
export function ConfirmModal({ message, onConfirm, onClose, confirmText = "Sim", cancelText = "Não" }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4">Confirmação</h2>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">{cancelText}</button>
        <button type="button" onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{confirmText}</button>
      </div>
    </Modal>
  );
}
export default Modal
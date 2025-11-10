// src/components/common/Modal.jsx

import React from 'react';

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

export function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-[#ececeec2] bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out "
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl p-[24px] w-[800px] max-w-[700px] m-[16px] relative animate-fade-in-up overflow-hidden">
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

export function ConfirmModal({
  message,
  onConfirm,
  onClose,
  title = 'Confirmação',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}) {
  return (
    <Modal onClose={onClose}>
      <div className="pb-4 border-b border-gray-200 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <p className="text-gray-600 mb-6 text-sm">{message}</p>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm transition-colors duration-150 ease-in-out"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
          }}
          className={`px-4 py-2 rounded-md font-medium text-sm text-white transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;

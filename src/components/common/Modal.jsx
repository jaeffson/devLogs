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

const AlertIcon = () => (
  <svg
    className="h-5 w-5 text-red-500 mr-2"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// --- 1. Modal Principal (Componente Base) ---

export function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300 ease-in-out"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg md:max-w-xl lg:max-w-2xl relative animate-fade-in-up overflow-hidden p-6 md:p-8 transform transition-all">
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

// --- 2. Confirm Modal (ATUALIZADO COM TRATAMENTO DE ERRO) ---

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
  const [errorMsg, setErrorMsg] = useState(null); // Estado para mostrar erro na tela

  const handleConfirm = async () => {
    setIsLoading(true);
    setErrorMsg(null); // Limpa erros anteriores

    try {
      // 1. Executa a ação
      await onConfirm();

      // 2. SUCESSO: Fecha o modal imediatamente
      onClose();
    } catch (error) {
      console.error('Erro no modal:', error);

      // 3. FALHA: Mostra o erro na tela para o usuário saber o que houve
      // Se o backend enviar mensagem, usamos ela, senão uma genérica.
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Ocorreu um erro ao processar.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false); // Para o spinner
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="mb-3">
        <h2
          className={`text-xl font-bold tracking-tight ${isDestructive ? 'text-red-600' : 'text-slate-800'}`}
        >
          {title}
        </h2>
      </div>

      <p className="text-slate-600 mb-6 text-base leading-relaxed">{message}</p>

      {/* Exibe Erro se houver */}
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center animate-pulse">
          <AlertIcon />
          <span className="text-sm text-red-700 font-medium">{errorMsg}</span>
        </div>
      )}

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
          <span>{isLoading ? 'Processando...' : confirmText}</span>
        </button>
      </div>
    </Modal>
  );
}

export default Modal;

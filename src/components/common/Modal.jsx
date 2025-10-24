import React from 'react';

// Ícone de Fechar (SVG)
const CloseIcon = (
  <svg xmlns="http://www.w.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Componente: Modal genérico (MELHORADO)
export function Modal({ children, onClose }) {
  return (
    // Fundo/Overlay: Cinza escuro com 75% de opacidade
    <div
      className="fixed inset-0 #ececeec2 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      // onClick removido para não fechar ao clicar fora
      role="dialog" // Adicionado para acessibilidade
      aria-modal="true" // Adicionado para acessibilidade
    >
      {/* Container do conteúdo do modal: Sombra mais suave, overflow hidden */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 relative animate-fade-in-up overflow-hidden"> {/* Shadow reduzida, overflow added */}

        {/* Botão de Fechar (X): Ícone SVG, melhor estilo e área de clique */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400" // Estilo melhorado
          aria-label="Fechar modal"
        >
          {CloseIcon} {/* Usa o ícone SVG */}
        </button>

        {/* Conteúdo do modal (formulários, etc.) */}
        {/* Adiciona padding interno se o conteúdo não tiver o seu próprio */}
        <div className="pt-2"> {/* Espaço para não colar no botão X */}
          {children}
        </div>
      </div>
    </div>
  );
}

// Componente: Modal de Confirmação (MELHORADO)
export function ConfirmModal({
  message,
  onConfirm,
  onClose,
  title = "Confirmação", // Título padrão adicionado
  confirmText = "Confirmar", // Texto padrão mudado
  cancelText = "Cancelar", // Texto padrão mudado
  isDestructive = false // Para botão de confirmação vermelho
}) {
  return (
    // Usa o Modal MELHORADO acima
    <Modal onClose={onClose}>
      {/* Cabeçalho do Modal de Confirmação */}
      <div className="pb-4 border-b border-gray-200 mb-4"> {/* Divisor e espaçamento */}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2> {/* Tamanho ajustado */}
      </div>

      {/* Mensagem */}
      <p className="text-gray-600 mb-6 text-sm">{message}</p> {/* Tamanho ajustado, cor suavizada */}

      {/* Rodapé com Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6"> {/* Divisor, espaçamento e gap ajustados */}
        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-sm transition-colors duration-150 ease-in-out" // Estilo refinado
        >
          {cancelText}
        </button>
        {/* Botão Confirmar */}
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          // Estilo condicional (vermelho para destrutivo, azul para padrão)
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

// Exporta o Modal principal como default
export default Modal;
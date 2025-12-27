import React from 'react';

// Exportação nomeada
export function FullScreenPreloader() {
  return (
    // Container principal que cobre toda a tela
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-[9999]">
      
      {/* Container para o spinner e o texto */}
      <div className="flex flex-col items-center">
        
        {/* === SPINNER MAIS MODERNO (Anel Duplo Dinâmico) === */}
        <div className="w-16 h-16 border-8 border-transparent border-t-blue-600 border-b-blue-600 rounded-full animate-spin"></div>
        
        {/* Mensagem de Carregamento */}
        <p className="mt-6 text-lg font-semibold text-gray-700 max-w-xs text-center">
         Sistema Carregando, Por favor aguarde...
        </p>
      </div>
    </div>
  );
}

export default FullScreenPreloader
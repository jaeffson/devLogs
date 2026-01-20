// src/components/common/OfflineAlert.jsx
import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WiCloudDown } from 'react-icons/wi'; // Ou outro ícone de sua preferência

export default function OfflineAlert() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null; // Não renderiza nada se tiver internet

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white shadow-lg animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
        {/* Ícone pulsante para chamar atenção */}
        <WiCloudDown className="text-3xl animate-pulse" />
        
        <div className="flex flex-col md:flex-row items-center gap-1 text-center">
          <span className="font-bold text-lg uppercase tracking-wider">
            Sem Conexão
          </span>
          <span className="text-sm md:text-base opacity-90">
            Verifique a sua internet. Algumas funções podem não funcionar.
          </span>
        </div>
      </div>
    </div>
  );
}
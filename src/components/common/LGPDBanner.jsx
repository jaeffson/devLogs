// src/components/common/LGPDBanner.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE: Importar useNavigate

// Ícone Shield (Mantido igual)
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-600 dark:text-indigo-400">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default function LGPDBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate(); // <--- Hook de navegação

  useEffect(() => {
    const consent = localStorage.getItem('medlogs_lgpd_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    setIsClosing(true);
    localStorage.setItem('medlogs_lgpd_consent', 'true');
    localStorage.setItem('medlogs_lgpd_date', new Date().toISOString());
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  const handleReadPolicy = () => {
     // Redireciona para a página que criamos
     navigate('/privacy-policy'); 
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-[60] 
        p-4 md:px-8 md:py-6
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl backdrop-saturate-150
        border-t border-gray-200 dark:border-slate-800
        shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
        transition-all duration-500 ease-in-out transform
        ${isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
      `}
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Proteção de Dados & Privacidade
            </h3>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-justify md:text-left">
            Este sistema utiliza cookies essenciais e processa dados sensíveis de saúde em conformidade com a 
            <strong className="text-slate-700 dark:text-slate-300 ml-1">Lei Geral de Proteção de Dados (LGPD)</strong>. 
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={handleReadPolicy} // <--- Ação atualizada aqui
            className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          >
            Ler Política
          </button>
          
          <button
            onClick={handleAccept}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Compreendo e Concordo
          </button>
        </div>
      </div>
    </div>
  );
}
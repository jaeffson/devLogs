// src/components/common/LGPDBanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function LGPDBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('medlogs_lgpd_consent');
    if (!consent) {
      // Pequeno delay para dar tempo do Preloader terminar antes de mostrar o banner
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const handleAccept = () => {
    setIsClosing(true);
    localStorage.setItem('medlogs_lgpd_consent', 'true');
    localStorage.setItem('medlogs_lgpd_date', new Date().toISOString());
    // Aguarda a animação de saída terminar antes de destruir o componente
    setTimeout(() => setIsVisible(false), 500);
  };

  const handleReadPolicy = () => {
     navigate('/privacy-policy'); 
  };

  if (!isVisible) return null;

  return (
    // Container Invisível que centraliza o card flutuante
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:p-6 pointer-events-none flex justify-center">
      
      {/* O Card Flutuante de Fato */}
      <div
        className={`
          pointer-events-auto w-full sm:max-w-4xl
          bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl backdrop-saturate-150
          sm:border border-slate-200/50 dark:border-slate-700/50
          shadow-[0_-10px_40px_rgba(0,0,0,0.08)] sm:rounded-3xl
          p-5 md:p-6
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isClosing ? 'translate-y-full sm:translate-y-8 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}
        `}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8">

          {/* Área de Texto e Ícone */}
          <div className="flex gap-4 items-start md:items-center">
            {/* Ícone Desktop */}
            <div className="hidden sm:flex p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <ShieldCheck size={24} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
                {/* Ícone Mobile */}
                <ShieldCheck size={18} className="sm:hidden text-indigo-600" />
                Sua Privacidade é Nossa Prioridade
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Utilizamos cookies essenciais para garantir a segurança e o funcionamento do sistema em conformidade com a <strong className="text-slate-700 dark:text-slate-300 font-bold">LGPD</strong>.
              </p>
            </div>
          </div>

          {/* Área dos Botões (Com cursor-pointer bem definido e efeitos hover) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
            <button
              onClick={handleReadPolicy}
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            >
              Ler Política <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleAccept}
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Check size={16} className="group-hover:scale-110 transition-transform" /> 
              Aceitar e Continuar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

export function FullScreenPreloader() {
  // Array com frases para dar a sensação de progresso ativo
  const [loadingText, setLoadingText] = useState('Iniciando o sistema');

  useEffect(() => {
    const messages = [
      'Iniciando o sistema',
      'Sincronizando pacientes',
      'Verificando remessas',
      'Preparando seu painel',
      'Quase lá'
    ];
    let currentIndex = 0;
    
    // Troca a mensagem a cada 1.5 segundos
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingText(messages[currentIndex]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    // Container principal (Suporta Dark/Light mode, alinhado com seu MainLayout)
    <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center z-[9999] transition-colors duration-500">
      
      <div className="flex flex-col items-center">
        
        {/* === LOGO ANIMADA (Enterprise Style) === */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Anel pulsante de fundo (Radar effect) */}
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-indigo-500/20 rounded-3xl animate-ping" style={{ animationDuration: '2.5s' }}></div>
          
          {/* Caixa Principal da Logo */}
          <div className="relative w-24 h-24 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-3xl shadow-2xl flex items-center justify-center text-white overflow-hidden border border-white/10">
            {/* Brilho passando por cima da logo (Shimmer) */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
            
            <Package size={48} className="animate-pulse" strokeWidth={1.5} />
          </div>
        </div>

        {/* NOME DA PLATAFORMA */}
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-8">
          MedLogs<span className="text-indigo-600">.</span>
        </h1>

        {/* FEEDBACK DE CARREGAMENTO */}
        <div className="flex flex-col items-center gap-3">
          {/* Barra de progresso visual simulada */}
          <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
          </div>

          {/* Texto dinâmico com pontinhos animados */}
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-widest">
            {loadingText}
            <span className="flex gap-0.5 ml-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default FullScreenPreloader;
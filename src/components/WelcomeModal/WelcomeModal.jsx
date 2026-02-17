import React from 'react';
import { Package, Users, Pill, ShieldCheck, ArrowRight } from 'lucide-react';

export default function WelcomeModal({ onClose, user }) {
  // 1. LÓGICA INTELIGENTE DE NOME/CARGO
  const userRole = user?.role?.toLowerCase() || '';
  
  let fallbackTitle = 'Profissional';
  if (userRole === 'admin') fallbackTitle = 'Administrador';
  if (userRole === 'secretario') fallbackTitle = 'Secretário';
  if (userRole === 'digitador') fallbackTitle = 'Digitador';

  // Pega o 1º nome. Se não existir, usa o título do cargo!
  const displayName = user?.name ? user.name.split(' ')[0] : fallbackTitle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -translate-x-5 translate-y-5"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl mb-4 transform -rotate-6 hover:rotate-0 transition-transform">
              <Package size={32} strokeWidth={2} />
            </div>
            
            {/* O NOME APARECE AQUI */}
            <h2 className="text-3xl font-black text-white tracking-tight">
              Olá, {displayName}!
            </h2>
            
            <p className="text-blue-100 font-medium mt-2">
              Bem-vindo(a) ao MedLogs Parari.
            </p>
          </div>
        </div>

        <div className="p-8">
          <p className="text-slate-600 dark:text-slate-300 text-center mb-8 font-medium">
            Nossa plataforma foi projetada para simplificar a sua rotina e garantir precisão em cada etapa do atendimento.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Gestão Inteligente</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Controle completo de pacientes e prontuários digitais.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <Pill size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Controle de Saídas</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rastreabilidade ponta a ponta na entrega de medicamentos.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Auditoria e Segurança</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dados criptografados e controle de acesso por níveis.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-full group relative flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 dark:shadow-none hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-[0.98]"
          >
            Acessar o Painel 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
        </div>
      </div>
    </div>
  );
}
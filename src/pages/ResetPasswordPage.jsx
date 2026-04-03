// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// IMPORTANTE: Certifique-se de que a função `resetPassword` existe no seu api.js. 
// Se ela se chamar de outra forma, ajuste a importação.
import api from '../services/api'; 
import {
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
} from 'react-icons/fi';

const Icons = {
  Key: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  Check: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  // 1. EXTRAI O TOKEN DA URL (ex: ?token=12345)
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status: 'idle' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 2. VERIFICA SE O TOKEN EXISTE AO ABRIR A PÁGINA
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Link de redefinição inválido ou expirado. Por favor, solicite um novo e-mail.');
    }
  }, [token]);

  // 3. FUNÇÃO DE ENVIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
  
      await api.post('/auth/reset-password', {
        token: token,
        newPassword: password
      });

      setStatus('success');
      
      // Redireciona para o login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao redefinir a senha:', error);
      setStatus('error');
      setErrorMessage(
        error.response?.data?.message || 
        'Ocorreu um erro ao redefinir a senha. O link pode ter expirado.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-600 shadow-sm border border-blue-100">
              <Icons.Key />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Nova Senha
            </h3>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Crie uma nova senha forte para acessar a sua conta Medlogs.
            </p>
          </div>

          {/* TELA DE SUCESSO */}
          {status === 'success' ? (
            <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl flex flex-col items-center text-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                <FiCheckCircle size={24} />
              </div>
              <h4 className="font-bold text-lg">Senha Redefinida!</h4>
              <p className="text-sm">Sua senha foi alterada com sucesso. Redirecionando para o login...</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all"
              >
                Ir para o Login Agora
              </button>
            </div>
          ) : (
            /* FORMULÁRIO DE NOVA SENHA */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* MENSAGEM DE ERRO */}
              {status === 'error' && (
                <div className="text-red-700 text-sm font-bold bg-red-50 p-3.5 rounded-xl flex items-start gap-2 border border-red-100 animate-in fade-in">
                  <FiAlertCircle className="mt-0.5 shrink-0" size={16} /> 
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nova Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <FiLock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder="••••••••"
                      required
                      disabled={status === 'loading' || !token}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Icons.Check />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder="••••••••"
                      required
                      disabled={status === 'loading' || !token}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !token}
                className="group w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Redefinir Senha <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Cancelar e voltar ao Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validações Básicas
    if (newPassword.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      setStatus('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // 2. Envia para o Backend
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setStatus('success');

      // Redireciona para o login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Erro detalhado:', error); // Veja isso no console!

      // Tenta pegar a mensagem específica enviada pelo backend
      const msg =
        error.response?.data?.message ||
        'Erro ao redefinir senha. O link pode ter expirado.';

      setErrorMessage(msg);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative z-10 p-8 md:p-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 ring-4 ring-blue-50/50">
            {status === 'success' ? <Icons.Check /> : <Icons.Key />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Nova Senha</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Crie uma senha forte para proteger sua conta.
          </p>
        </div>

        {/* Status de Sucesso */}
        {status === 'success' ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center animate-fade-in">
            <FiCheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800 mb-1">
              Senha Alterada!
            </h3>
            <p className="text-green-700 text-sm mb-4">
              Sua senha foi atualizada com sucesso. Você será redirecionado para
              o login.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-green-700 font-bold hover:underline text-sm cursor-pointer"
            >
              Ir para Login agora
            </button>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensagem de Erro (Aparece aqui o motivo do 400) */}
            {status === 'error' && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2 animate-fade-in">
                <FiAlertCircle className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Nova Senha
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <FiLock />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password" // <-- CORREÇÃO DO AVISO DOM
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Confirmar Senha
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <FiLock />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password" // <-- CORREÇÃO DO AVISO DOM
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Redefinir Senha</span>
                  <FiArrowRight />
                </>
              )}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Cancelar e voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

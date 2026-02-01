// src/pages/LoginPage.jsx
// (VERSÃO COMPLETA E FUNCIONAL - INTEGRADA COM BREVO)

import React, { useState } from 'react';
import api, { requestPasswordReset } from '../services/api';
import logo from '../assents/medlogs-logo.png';
import {
  FiX,
  FiCheckCircle,
  FiArrowRight,
  FiAlertCircle,
} from 'react-icons/fi';

// --- Ícones SVG (Mantendo sua estrutura original) ---
const Icons = {
  User: () => (
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Lock: () => (
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  Briefcase: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Shield: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  CheckCircle: () => (
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
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

export default function LoginPage({ onLogin, addToast, addLog }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('profissional');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });

  // Funções de Auxílio (Força de senha, etc)
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Fraca';
    if (passwordStrength === 3) return 'Média';
    return 'Forte';
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    // Lógica simples de força de senha
    let strength = 0;
    if (val.length >= 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    setPasswordStrength(strength);
  };

  // --- LÓGICA DE RECUPERAÇÃO DE SENHA (CORRIGIDA) ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotStatus({ type: '', message: '' });

    try {
      // Chama a função importada do seu api.js
      await requestPasswordReset(forgotEmail);

      setForgotStatus({
        type: 'success',
        message:
          'Se o e-mail estiver cadastrado, as instruções foram enviadas!',
      });

      // Limpa após sucesso
      setTimeout(() => setForgotEmail(''), 2000);
    } catch (err) {
      console.error('Erro na recuperação:', err);
      const msg =
        err.response?.data?.message ||
        'Erro ao conectar com o servidor. Tente mais tarde.';
      setForgotStatus({ type: 'error', message: msg });
    } finally {
      // OBRIGATÓRIO: Desativa o carregamento para parar o loop no botão
      setForgotLoading(false);
    }
  };

  // --- LÓGICA DE LOGIN / REGISTRO ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLoginView) {
        const response = await api.post('/auth/login', { email, password });
        onLogin(response.data);
      } else {
        await api.post('/auth/register', { name, email, password, role });
        addToast('Solicitação enviada! Aguarde aprovação.', 'success');
        setIsLoginView(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10 animate-fade-in-up flex rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Lado Esquerdo - Branding */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-700 to-indigo-900 p-12 flex-col justify-center items-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-8 p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
              <Icons.Shield />
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">MedLogs</h2>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs mb-8">
              Gestão inteligente e segura de medicamentos e registos de saúde
              para profissionais e municípios.
            </p>
            <div className="space-y-4 w-full text-left">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="bg-green-500/20 p-2 rounded-full">
                  <Icons.CheckCircle />
                </div>
                <span className="text-xs font-medium">
                  Controlo de Estoque Real-time
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Form */}
        <div className="w-full lg:w-7/12 bg-white p-8 md:p-12 flex flex-col justify-center relative">
          <div className="flex justify-center lg:hidden mb-6">
            <img
              src={logo}
              alt="MedLogs Logo"
              className="w-12 h-12 object-contain"
            />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
            {isLoginView ? 'Acessar Plataforma' : 'Criar Novo Acesso'}
          </h1>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-3 animate-fade-in">
                <FiAlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {!isLoginView && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Icons.User />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Icons.Mail />
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  placeholder="exemplo@medlogs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Icons.Lock />
                </div>
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer"
                >
                  {passwordVisible ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>

            {isLoginView && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <Spinner />
              ) : isLoginView ? (
                'Entrar no Sistema'
              ) : (
                'Criar Conta'
              )}
              {!isLoading && <FiArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isLoginView ? 'Ainda não tem conta?' : 'Já possui cadastro?'}
              <button
                onClick={() => setIsLoginView(!isLoginView)}
                className="ml-2 font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {isLoginView ? 'Solicitar Acesso' : 'Fazer Login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* --- MODAL ESQUECEU A SENHA --- */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsForgotOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
            <button
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer"
            >
              <FiX size={24} />
            </button>
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <Icons.Lock />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Recuperar Senha
                </h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Digite seu email para receber as instruções.
                </p>
              </div>

              {forgotStatus.type === 'success' ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex flex-col items-center text-center gap-3">
                  <FiCheckCircle size={32} />
                  <p className="text-sm font-medium">{forgotStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      placeholder="exemplo@medlogs.com"
                      required
                    />
                  </div>
                  {forgotStatus.type === 'error' && (
                    <p className="text-red-500 text-xs text-center">
                      {forgotStatus.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Enviar Instruções'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

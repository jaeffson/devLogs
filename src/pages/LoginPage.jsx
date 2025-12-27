// src/pages/LoginPage.jsx
// (VERSÃO FINAL 4.5: Copyright MANUALMENTE Inserido)

import React, { useState } from 'react';
import api from '../services/api';
import logo from '../assents/medlogs-logo.png';

// --- Ícones SVG (Lucide Style) ---
const Icons = {
  // Ícones do formulário
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
  CheckCircle: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  // Ícone de Suporte/Marca (para coluna esquerda)
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
  const [rememberMe, setRememberMe] = useState(false);

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (!isLoginView) checkPasswordStrength(val);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    const emailValue = email.trim().toLowerCase();
    const nameValue = name.trim();

    if (!emailValue) {
      setError('Por favor, introduza o seu e-mail.');
      return;
    }
    if (!isLoginView) {
      if (!nameValue) {
        setError('Por favor, introduza o seu nome completo.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    setIsLoading(true);
    const credentials = {
      email: emailValue,
      password,
      name: nameValue,
      role: role,
    };

    try {
      if (isLoginView) {
        const response = await api.post('/auth/login', {
          email: credentials.email,
          password: credentials.password,
        });
        const user = response.data.user || response.data;
        const token = response.data.token || user.token;
        if (user.token) delete user.token;

        if (user.status === 'pending') {
          setError('A sua conta aguarda aprovação do administrador.');
        } else if (user.status === 'inactive') {
          setError('Conta desativada. Contacte o suporte.');
        } else {
          onLogin({
            ...user,
            token: token || `fake-jwt-token-for-${user._id}`,
          });
          return;
        }
      } else {
        await api.post('/auth/register', credentials);
        addToast('Conta criada! Aguarde aprovação.', 'success');
        addLog?.(
          'Novo Utilizador',
          `${credentials.name} registou-se e aguarda aprovação.`
        );
        setIsLoginView(true);
        setName('');
        setEmail('');
        setPassword('');
        setRole('profissional');
        setError('');
      }
    } catch (apiError) {
      const serverMessage = apiError.response?.data?.message;
      const msg = Array.isArray(serverMessage)
        ? serverMessage[0]
        : serverMessage;
      setError(msg || 'Email ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // --- Visual ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 relative overflow-hidden font-sans">
      {/* Background Decorativo - Simplificado */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[150px]"></div>
      </div>

      {/* CARD PRINCIPAL (Layout Split Screen em Desktop) */}
      <div className="w-full max-w-5xl relative z-10 animate-fade-in-up flex rounded-2xl shadow-2xl overflow-hidden">
        {/* --- COLUNA ESQUERDA (Branding Profissional) --- */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-700 to-indigo-900 p-12 flex-col justify-center items-center text-white relative">
          {/* Elemento flutuante de design */}
          <div
            className="absolute top-0 left-0 w-full h-full opacity-10"
            style={{ backgroundImage: "url('data:image/svg+xml;base64,...')" }}
          ></div>

          <div className="relative z-10 text-center">
            {/* LOGO MEDLOGS COM EFEITO DE BORDA BRANCA E DESTAQUE */}
            <div className="mb-6 relative w-24 h-24 mx-auto">
              {/* Efeito de brilho/borrado branco */}
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse-slow"></div>
              {/* Imagem da Logo */}
              <img
                src={logo}
                alt="MedLogs Logo"
                className="w-full h-full object-contain p-2 relative z-10"
              />
            </div>

            <h2 className="text-4xl font-extrabold mb-1 tracking-wider">
              MEDLOGS
            </h2>
            <p className="text-blue-200 text-lg font-medium">
              Gestão Centralizada para Profissionais de Saúde.
            </p>

            <div className="mt-12 p-4 border border-blue-500/50 bg-blue-600/20 rounded-xl">
              <p className="text-sm font-light italic">
                "A saúde saiu do papel. Seu futuro é digital e focado no
                paciente."
              </p>
            </div>

            <div className="mt-6 text-xs text-blue-300/80">
              &copy; 2025 MedLogs - Todos os direitos reservados.
              <p>Versão 4.2.1</p>
            </div>
          </div>
        </div>

        {/* --- COLUNA DIREITA (Formulário) --- */}
        <div className="w-full lg:w-7/12 bg-white p-8 md:p-12 flex flex-col justify-center">
          {/* Logo no Mobile - MANTIDO PARA O CASO DE TELAS PEQUENAS */}
          <div className="flex justify-center lg:hidden mb-6">
            <img
              src={logo}
              alt="MedLogs Logo"
              className="w-12 h-12 object-contain"
            />
          </div>

          {/* TÍTULO PRINCIPAL COM LOGO */}
          <div className="flex items-center justify-center lg:justify-start mb-2 w-full">
            {/* Título */}
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center lg:text-left">
              {isLoginView ? 'Acessar a Plataforma' : 'Criar Novo Acesso'}
            </h1>
          </div>
          <p className="text-md text-slate-500 mb-8 text-center lg:text-left">
            {isLoginView
              ? 'Insira suas credenciais para continuar.'
              : 'Complete o registo e aguarde aprovação.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Erro */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3 animate-shake shadow-sm">
                <span className="text-lg">🚫</span> {error}
              </div>
            )}

            {/* Input Nome */}
            {!isLoginView && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Icons.User />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-slate-800 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="Ex: Dr. João Silva"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Icons.Mail />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-slate-800 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="nome@clinica.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">
                  Senha
                </label>
                {isLoginView && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Icons.Lock />
                </div>
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-slate-800 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors outline-none"
                  tabIndex="-1"
                >
                  {passwordVisible ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>

              {/* Força da Senha */}
              {!isLoginView && password && (
                <div className="flex items-center gap-2 mt-2 px-1 animate-fade-in">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase min-w-[3rem] text-right">
                    {getStrengthLabel()}
                  </span>
                </div>
              )}
            </div>

            {/* Seletor de Função (Cards) */}
            {!isLoginView && (
              <div className="space-y-2 animate-fade-in pt-2">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">
                  Perfil de Acesso
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: 'profissional',
                      label: 'Profissional',
                      icon: <Icons.User />,
                    },
                    {
                      id: 'secretario',
                      label: 'Secretário(a)',
                      icon: <Icons.Briefcase />,
                    },
                  ].map((option) => {
                    const isSelected = role === option.id;
                    return (
                      <div
                        key={option.id}
                        onClick={() => !isLoading && setRole(option.id)}
                        className={`
                          cursor-pointer relative p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center select-none
                          ${
                            isSelected
                              ? // Estilo aprimorado para seleção profissional
                                'border-blue-600 bg-blue-50 text-blue-800 shadow-md shadow-blue-200/50'
                              : 'border-gray-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-blue-600 scale-75">
                            <Icons.CheckCircle />
                          </div>
                        )}
                        <div
                          className={`transform transition-transform ${isSelected ? 'scale-110' : ''}`}
                        >
                          {option.icon}
                        </div>
                        <span className="text-xs font-bold tracking-wide">
                          {option.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checkbox Manter Conectado */}
            {isLoginView && (
              <label className="flex items-center gap-2.5 cursor-pointer group mt-2">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}
                >
                  {rememberMe && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </div>
                <span className="text-sm text-slate-600 font-medium group-hover:text-slate-800 transition-colors">
                  Manter-me conectado
                </span>
              </label>
            )}

            {/* Botão de Ação Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3.5 px-4 rounded-lg font-bold text-white shadow-lg text-sm tracking-wide uppercase
                flex items-center justify-center gap-3 transition-all duration-300 mt-6 cursor-pointer
                ${
                  isLoading
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-blue-500/40 active:shadow-none'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Aguarde!</span>
                </>
              ) : (
                <span>
                  {isLoginView ? 'Entrar no Sistema' : 'Criar Conta Grátis'}
                </span>
              )}
            </button>

            {/* Alternador Login/Registro */}
            <div className="text-center pt-4">
              <p className="text-sm text-slate-500 font-medium">
                {isLoginView ? 'Ainda não possui conta?' : 'Já tem registo?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginView(!isLoginView);
                    setError('');
                  }}
                  className="ml-2 text-blue-600 font-bold hover:text-indigo-700 hover:underline transition-colors focus:outline-none cursor-pointer"
                >
                  {isLoginView ? 'Criar agora' : 'Entrar'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Minimalista */}
      <div className="absolute bottom-4 text-center text-[11px] text-slate-400 font-medium tracking-wide">
        <p>MEDLOGS • SISTEMA DE GESTÃO INTELIGENTE</p>
      </div>
    </div>
  );
}

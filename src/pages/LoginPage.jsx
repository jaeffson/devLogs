// src/pages/LoginPage.jsx
// (VERSÃO FINAL 4.5: Copyright MANUALMENTE Inserido)

import React, { useState } from 'react';
import api from '../services/api';
import logo from '../assents/medlogs-logo.png';
import { FiX, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'; 
import { requestPasswordReset } from '../services/api';

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
  
  // --- Estados do Modal "Esqueceu a Senha" ---
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });

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

  // --- Função para Enviar Email de Recuperação ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotStatus({ type: '', message: '' });

    try {
      await requestPasswordReset(forgotEmail);
      setForgotStatus({ 
        type: 'success', 
        message: 'Se o e-mail existir, enviamos um link de recuperação!' 
      });
      setForgotEmail(''); 
    } catch (error) {
      console.error(error);
      setForgotStatus({ 
        type: 'error', 
        message: 'Erro ao processar. Tente novamente mais tarde.' 
      });
    } finally {
      setForgotLoading(false);
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
            style={{
              backgroundImage: "url('data:image/svg+xml;base64,...')", // (Seu padrão SVG estava aqui)
            }}
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
                "A saúde saiu do papel. Seu futuro é digital e focado no paciente."
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
          {/* Logo no Mobile */}
          <div className="flex justify-center lg:hidden mb-6">
            <img src={logo} alt="MedLogs Logo" className="w-12 h-12 object-contain" />
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
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Icons.User />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-800"
                    placeholder="Ex: Dr. João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">
                E-mail Profissional
              </label>
              <div className="relative transition-all duration-300 group-focus-within:scale-[1.01]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Icons.Mail />
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-800"
                  placeholder="nome@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Senha com Força e Link Esqueceu a Senha */}
            <div className="space-y-1.5 relative group">
              {/* Header do Input: Label + Link de Recuperação */}
              <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">
                    Senha de Acesso
                  </label>
                  {isLoginView && (
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
              </div>
              
              <div className="relative transition-all duration-300 group-focus-within:scale-[1.01]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Icons.Lock />
                </div>
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
                >
                  {passwordVisible ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>

              {/* Barra de Força da Senha (Apenas Registo) */}
              {!isLoginView && password.length > 0 && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {getStrengthLabel()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className={`text-[10px] flex items-center gap-1 ${password.length >= 6 ? 'text-emerald-600' : 'text-gray-400'}`}>
                       <Icons.CheckCircle /> 6+ Caracteres
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                       <Icons.CheckCircle /> Maiúscula
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 ${/\d/.test(password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                       <Icons.CheckCircle /> Número
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Select Cargo (Apenas Registo) */}
            {!isLoginView && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-widest ml-1">
                  Função / Cargo
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Icons.Briefcase />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none text-gray-800 appearance-none cursor-pointer"
                  >
                    <option value="profissional">Profissional de Saúde</option>
                    <option value="secretario">Secretaria / Recepção</option>
                    <option value="admin">Administrador do Sistema</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Ação */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-[0.98] shadow-lg cursor-pointer flex items-center justify-center gap-3
                ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
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
        <p>&copy; 2025 MedLogs. Todos os direitos reservados.</p>
      </div>

      {/* --- MODAL ESQUECEU A SENHA --- */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                <Icons.Lock />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Recuperar Senha</h3>
              <p className="text-sm text-slate-500 mt-1">
                Digite seu email para receber as instruções.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
               {/* Mensagem de Feedback */}
               {forgotStatus.message && (
                <div className={`p-3 rounded-xl flex items-start gap-2 text-sm ${
                  forgotStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  <span className="mt-0.5 text-base shrink-0">
                    {forgotStatus.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                  </span>
                  <span>{forgotStatus.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">Email Cadastrado</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icons.Mail />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-slate-400"
                      placeholder="exemplo@email.com"
                    />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={forgotLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
              >
                 {forgotLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                    </>
                 ) : (
                    <>
                        <span>Enviar Link</span>
                        <FiArrowRight />
                    </>
                 )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
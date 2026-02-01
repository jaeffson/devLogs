// src/pages/LoginPage.jsx
// (VERSÃO FINAL 4.6: Com Cursor Pointers e Ícones Corrigidos)

import React, { useState } from 'react';
import api, { requestPasswordReset } from '../services/api'; 
import logo from '../assents/medlogs-logo.png';
import { FiX, FiCheckCircle, FiArrowRight, FiAlertCircle } from 'react-icons/fi'; 

// --- Ícones SVG (Lucide Style) ---
const Icons = {
  // Ícones do formulário
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
    
    // Validação simples de email
    if (!forgotEmail || !forgotEmail.includes('@')) {
        setForgotStatus({ type: 'error', message: 'Por favor, digite um email válido.' });
        setForgotLoading(false); // Faltou desligar o loading aqui no caso de erro
        return;
    }

    try {
      await requestPasswordReset(forgotEmail);
      setForgotStatus({ 
        type: 'success', 
        message: 'Se o e-mail existir, enviamos um link de recuperação!' 
      });
      // Limpa o campo apenas no sucesso
      setTimeout(() => {
        if(isForgotOpen) setForgotEmail(''); 
      }, 2000);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Erro ao processar. Tente novamente.';
      setForgotStatus({ 
        type: 'error', 
        message: errorMsg 
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 relative overflow-hidden font-sans">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[150px]"></div>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="w-full max-w-5xl relative z-10 animate-fade-in-up flex rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* --- COLUNA ESQUERDA (Branding) --- */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-700 to-indigo-900 p-12 flex-col justify-center items-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-8 p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
               <Icons.Shield />
            </div>
            
            <h2 className="text-3xl font-bold mb-4 tracking-tight">MedLogs</h2>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs mb-8">
              Gestão inteligente e segura de medicamentos e registos de saúde para profissionais e municípios.
            </p>

            <div className="space-y-4 w-full text-left">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                 <div className="bg-green-500/20 p-2 rounded-full"><Icons.CheckCircle /></div>
                 <span className="text-xs font-medium">Controlo de Estoque Real-time</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                 <div className="bg-blue-500/20 p-2 rounded-full"><Icons.CheckCircle /></div>
                 <span className="text-xs font-medium">Histórico de Pacientes Seguro</span>
              </div>
            </div>

            <div className="mt-12 text-xs text-blue-300/80">
              &copy; 2025 MedLogs - Todos os direitos reservados.
              <p>Versão 4.5.0</p>
            </div>
          </div>
        </div>

        {/* --- COLUNA DIREITA (Formulário) --- */}
        <div className="w-full lg:w-7/12 bg-white p-8 md:p-12 flex flex-col justify-center relative">
          {/* Logo no Mobile */}
          <div className="flex justify-center lg:hidden mb-6">
            <img src={logo} alt="MedLogs Logo" className="w-12 h-12 object-contain" />
          </div>

          <div className="flex items-center justify-center lg:justify-start mb-2 w-full">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center lg:text-left">
              {isLoginView ? 'Acessar a Plataforma' : 'Criar Novo Acesso'}
            </h1>
          </div>
          <p className="text-md text-slate-500 mb-8 text-center lg:text-left">
            {isLoginView ? 'Insira suas credenciais para continuar.' : 'Complete o registo e aguarde aprovação.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Erro */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r flex items-center gap-3 animate-fade-in">
                <FiAlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Nome (Apenas Registro) */}
            {!isLoginView && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Icons.User />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-800"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Corporativo</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Icons.Mail />
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-800"
                  placeholder="exemplo@medlogs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Icons.Lock />
                </div>
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-800"
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
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{getStrengthLabel()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* --- LINK "ESQUECEU A SENHA?" --- */}
            {isLoginView && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Select Role (Apenas Registo) */}
            {!isLoginView && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Perfil</label>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Icons.Briefcase />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none text-gray-700 appearance-none cursor-pointer"
                  >
                    <option value="profissional">Profissional de Saúde</option>
                    <option value="secretario">Secretário de Saúde</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isLoginView ? 'Entrar no Sistema' : 'Criar Conta'}</span>
                  <FiArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Registro */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isLoginView ? 'Ainda não tem conta?' : 'Já possui cadastro?'}
              <button
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setError('');
                  setPassword('');
                }}
                className="ml-2 font-bold text-blue-600 hover:text-blue-800 transition-colors hover:underline cursor-pointer"
              >
                {isLoginView ? 'Solicitar Acesso' : 'Fazer Login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Minimalista Mobile */}
      <div className="absolute bottom-4 text-center text-[11px] text-slate-400 font-medium tracking-wide lg:hidden">
        <p>&copy; 2025 MedLogs. Todos os direitos reservados.</p>
      </div>

      {/* --- MODAL ESQUECEU A SENHA (IMPLEMENTADO) --- */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop Escuro */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsForgotOpen(false)}
          ></div>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 transform transition-all scale-100">
            {/* Botão Fechar */}
            <button 
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 cursor-pointer"
            >
              <FiX size={24} />
            </button>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 ring-4 ring-blue-50/50">
                  <Icons.Lock />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Recuperar Senha</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  Digite seu email cadastrado para receber as instruções de redefinição.
                </p>
              </div>

              {forgotStatus.type === 'success' ? (
                <div className="bg-green-50 text-green-700 p-5 rounded-xl flex flex-col items-center text-center gap-3 mb-2 border border-green-100 animate-fade-in">
                  <FiCheckCircle size={32} className="text-green-600" />
                  <p className="text-sm font-medium">{forgotStatus.message}</p>
                  <button 
                    onClick={() => setIsForgotOpen(false)}
                    className="mt-2 text-green-700 font-bold hover:underline text-sm cursor-pointer"
                  >
                    Voltar ao Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Email Corporativo
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Icons.Mail />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="exemplo@medlogs.com"
                        required
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>
                  
                  {forgotStatus.type === 'error' && (
                    <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">
                      {forgotStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Instruções</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            
            {/* Footer do Modal */}
            <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
              <p className="text-xs text-slate-400">
                Lembrou a senha?{' '}
                <button 
                  onClick={() => setIsForgotOpen(false)}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Voltar para login
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
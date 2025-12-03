// src/pages/LoginPage.jsx
// (REDESIGN: Moderno, Intuitivo e Profissional)

import React, { useState } from 'react';
import api from '../services/api'; 
import logo from '../assents/medlogs-logo.png';

// --- Ícones SVG Modernos (Lucide Style) ---
const Icons = {
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  EyeOff: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  )
};

// --- Componente Spinner Moderno ---
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function LoginPage({ onLogin, addToast, addLog }) {
  // --- Estados de Lógica ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('profissional');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Estados de UI ---
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  // --- Handlers ---
  
  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++; // Aumentei um pouco a regra
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
    const credentials = { email: emailValue, password, name: nameValue, role: role };

    try {
      if (isLoginView) {
        // --- LOGIN ---
        const response = await api.post('/auth/login', {
          email: credentials.email,
          password: credentials.password
        });
        
        const user = response.data.user || response.data;
        const token = response.data.token || user.token;
        if (user.token) delete user.token; // Limpeza do obj user

        if (user.status === 'pending') {
          setError('A sua conta aguarda aprovação do administrador.');
        } else if (user.status === 'inactive') {
          setError('Conta desativada. Contacte o suporte.');
        } else {
          // Sucesso
          onLogin({ ...user, token: token || `fake-jwt-token-for-${user._id}` });
          return;
        }
      } else {
        // --- REGISTO ---
        await api.post('/auth/register', credentials);
        addToast('Conta criada! Aguarde aprovação.', 'success');
        addLog?.('Novo Utilizador', `${credentials.name} registou-se e aguarda aprovação.`);
        
        // Reset e troca para login
        setIsLoginView(true);
        setName(''); setEmail(''); setPassword(''); setRole('profissional'); setError('');
      }
    } catch (apiError) {
      console.error('API Error:', apiError.response || apiError);
      const serverMessage = apiError.response?.data?.message;
      const msg = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;
      setError(msg || 'Erro de autenticação. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helpers de UI ---
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      
      {/* Background Decorativo Moderno */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-white/50 relative z-10 overflow-hidden backdrop-blur-sm animate-fade-in-up">
        
        {/* --- Header com Logo --- */}
        <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-b from-white to-slate-50/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-4 transform transition-transform hover:scale-105 duration-300">
             <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isLoginView ? 'Bem-vindo de volta' : 'Criar Conta'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLoginView 
              ? 'Aceda ao sistema de gestão de medicamentos' 
              : 'Preencha os dados abaixo para começar'}
          </p>
        </div>

        {/* --- Formulário --- */}
        <div className="px-8 pb-8">
          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 animate-shake">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            {/* Nome (Apenas Registo) */}
            {!isLoginView && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Icons.User />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="Ex: João Silva"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Icons.Mail />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="nome@exemplo.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
                {isLoginView && (
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Icons.Lock />
                </div>
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  tabIndex="-1"
                >
                  {passwordVisible ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>

              {/* Indicador de Força (Registo) */}
              {!isLoginView && password && (
                 <div className="flex items-center gap-2 mt-2 px-1 animate-fade-in">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-500 ${getStrengthColor()}`} 
                         style={{ width: `${(passwordStrength / 5) * 100}%` }}
                       ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{getStrengthLabel()}</span>
                 </div>
              )}
            </div>

            {/* Seletor de Função Moderno (Registo) */}
            {!isLoginView && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Eu sou:</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'profissional', label: 'Profissional', icon: <Icons.User /> },
                    { id: 'secretario', label: 'Secretário(a)', icon: <Icons.Briefcase /> }
                  ].map((option) => (
                    <div
                      key={option.id}
                      onClick={() => !isLoading && setRole(option.id)}
                      className={`
                        cursor-pointer relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center
                        ${role === option.id 
                          ? 'border-blue-500 bg-blue-50/50 text-blue-700' 
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}
                      `}
                    >
                      {role === option.id && (
                        <div className="absolute top-2 right-2 text-blue-500"><Icons.CheckCircle /></div>
                      )}
                      <div className={role === option.id ? 'text-blue-500' : 'text-slate-400'}>
                        {option.icon}
                      </div>
                      <span className="text-xs font-bold">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkbox "Manter conectado" (Login) */}
            {isLoginView && (
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                     {rememberMe && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                     <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  </div>
                  <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Manter-me conectado</span>
               </label>
            )}

            {/* Botão de Ação */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30
                flex items-center justify-center gap-2 transition-all duration-300
                ${isLoading 
                  ? 'bg-slate-400 cursor-not-allowed scale-[0.98]' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'}
              `}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Processando...</span>
                </>
              ) : (
                <span>{isLoginView ? 'Entrar no Sistema' : 'Criar Conta'}</span>
              )}
            </button>

            {/* Alternar Modo */}
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                {isLoginView ? 'Ainda não tem conta?' : 'Já possui registo?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginView(!isLoginView);
                    setError('');
                  }}
                  className="ml-1.5 text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors focus:outline-none"
                >
                  {isLoginView ? 'Registe-se aqui' : 'Faça login'}
                </button>
              </p>
            </div>

          </form>
        </div>
      </div>
      
      {/* Footer Discreto */}
      <div className="absolute bottom-4 text-center text-[10px] text-slate-400 font-medium">
        <p>© 2025 MedLogs. Todos os direitos reservados.</p>
      </div>

    </div>
  );
}
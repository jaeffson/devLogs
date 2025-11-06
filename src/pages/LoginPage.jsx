// src/pages/LoginPage.jsx
// (DESIGN ATUALIZADO: Layout "Dark Mode", cartão único e responsivo)
// (LÓGICA MANTIDA: Todas as funções, estados e props foram 100% preservados)
// (SUGESTÃO: Inputs foram componentizados para reduzir repetição)

import React, { useState } from 'react';
import axios from 'axios';

// --- URL BASE DA API (Mantida) ---
const API_BASE_URL = 'https://backendmedlog-4.onrender.com/api';

// --- ÍCONES (Mantidos) ---
const UserIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MailIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LockIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const RoleIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const BrandIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"> {/* Cor ajustada para o dark mode */}
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
    <path d="M12 8v4l3 3"></path>
    <path d="M16 2v4"></path>
    <path d="M8 2v4"></path>
    <path d="M4.22 19.78l1.42-1.42"></path>
    <path d="M18.36 5.64l1.42-1.42"></path>
  </svg>
);
// --- FIM DOS ÍCONES ---


// --- (SUGESTÃO: Componente de Input reutilizável) ---
// Para evitar repetir a estrutura "relative > span > input"
const InputGroup = ({ icon, id, type, placeholder, value, onChange, disabled, autoComplete }) => (
  <div className="relative mb-4">
    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
      {icon}
    </span>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete={autoComplete}
      placeholder={placeholder}
      required
      className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  </div>
);
// --- FIM DO COMPONENTE DE INPUT ---


export default function LoginPage({ onLogin, addToast, addLog }) {
  // --- (LÓGICA 100% MANTIDA) ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('profissional');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    const emailValue = email.trim().toLowerCase();
    const nameValue = name.trim();

    if (!emailValue) {
      setError('O campo E-mail é obrigatório.');
      return;
    }

    if (!isLoginView) {
      if (!nameValue) {
        setError('O campo Nome Completo é obrigatório.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsLoading(true);

    const credentials = {
      email: emailValue,
      password,
      name: nameValue,
      role: role
    };

    try {
      if (isLoginView) {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: credentials.email,
          password: credentials.password
        });

        // Correção de extração (Mantida)
        const user = response.data.user || response.data;
        const token = response.data.token || user.token;
        if (user.token) delete user.token;

        if (user.status === 'pending') {
          setError('Sua conta está pendente de aprovação.');
        } else if (user.status === 'inactive') {
          setError('Sua conta está desativada. Entre em contato.');
        } else {
          onLogin({ ...user, token: token || `fake-jwt-token-for-${user._id}` });
          return;
        }

      } else {
        // Rota de Registro (Mantida)
        await axios.post(`${API_BASE_URL}/auth/register`, credentials);
        addToast('Cadastro realizado! Aguarde aprovação.', 'success');
        addLog?.('Novo Usuário', `${credentials.name} (${credentials.email}) realizou cadastro e aguarda aprovação.`);
        setIsLoginView(true);
        setName(''); setEmail(''); setPassword(''); setRole('profissional');
      }
    } catch (apiError) {
      console.error('API Error:', apiError.response || apiError);
      const serverMessage = apiError.response?.data?.message;
      const specificError = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;
      const msg = specificError || 'Sistema ou credenciais inválidas.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
  };
  // --- (FIM DA LÓGICA MANTIDA) ---


  // --- (INÍCIO DO NOVO DESIGN RESPONSIVO) ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
      
      {/* Cartão Central */}
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl shadow-2xl animate-fade-in">

        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            {BrandIcon} {/* Usando seu Ícone SVG original */}
          </div>
          <h1 className="text-3xl font-bold text-white">MedLogs</h1>
          <p className="text-gray-400 mt-2">
            {isLoginView ? 'Bem-vindo de volta!' : 'Crie sua conta para começar'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAuth} noValidate>
          
          {/* Campo Nome (Aparece só no Cadastro) */}
          {!isLoginView && (
            <InputGroup
              icon={UserIcon}
              id="name"
              type="text"
              placeholder="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
          )}

          {/* Campo de Email */}
          <InputGroup
            icon={MailIcon}
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />

          {/* Campo de Senha */}
          <InputGroup
            icon={LockIcon}
            id="password"
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete={isLoginView ? "current-password" : "new-password"}
          />
          
          {/* Link "Esqueceu a senha" (só no login) */}
          {isLoginView && (
            <div className="text-right mb-4 -mt-2">
              <a href="#" className="text-sm text-blue-400 hover:underline">
                Esqueceu sua senha?
              </a>
            </div>
          )}


          {/* Campo de 'Role' (só no cadastro) */}
          {!isLoginView && (
            <div className="relative mb-6 animate-fade-in">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                {RoleIcon}
              </span>
              {/* Note o 'appearance-none' para esconder a seta padrão do select */}
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                disabled={isLoading}
              >
                <option value="profissional">Profissional (Saúde)</option>
                <option value="secretario">Secretário(a)</option>
              </select>
              {/* Seta customizada para o Select */}
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          )}


          {/* Mensagem de Erro */}
          {error && (
            <p className="text-red-400 text-sm text-center mb-4 animate-shake">{error}</p>
          )}

          {/* Botão Principal (Novo Estilo) */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold py-3 px-4 rounded-lg text-white transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transform ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-[1.02]' // Efeito de gradiente e 'hover'
            }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isLoginView ? 'Entrar' : 'Criar Conta'
            )}
          </button>

          {/* Botão para Alternar Login/Cadastro */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={toggleView}
              disabled={isLoading}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
            >
              {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>

        </form>
        
        {/* Rodapé do Cartão */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Versão 1.0.7</p>
          <p>Todos os direitos reservados @2025</p>
        </div>

      </div>
    </div>
  );
  // --- (FIM DO NOVO DESIGN) ---
}
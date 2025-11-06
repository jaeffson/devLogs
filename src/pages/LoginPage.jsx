// src/pages/LoginPage.jsx
// (DESIGN ATUALIZADO: Tema "Light & Professional")
// (LÓGICA MANTIDA: Todas as funções, estados e props foram 100% preservados)
// (ESTILO: Foco em clareza, minimalismo e usabilidade corporativa)

import React, { useState } from 'react';
import axios from 'axios';

// --- URL BASE DA API (Mantida) ---
const API_BASE_URL = 'https://backendmedlog-4.onrender.com/api';

// --- ÍCONES (Mantidos) ---
// (Cores ajustadas para o tema claro, ex: text-gray-400)
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

// Ícone da Marca (Cor ajustada para o tema)
const BrandIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"> {/* Cor primária */}
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
    <path d="M12 8v4l3 3"></path>
    <path d="M16 2v4"></path>
    <path d="M8 2v4"></path>
    <path d="M4.22 19.78l1.42-1.42"></path>
    <path d="M18.36 5.64l1.42-1.42"></path>
  </svg>
);


// --- LÓGICA DO COMPONENTE (100% MANTIDA) ---
export default function LoginPage({ onLogin, addToast, addLog }) {
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
        
        // (Lógica de extração mantida)
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
  // --- FIM DA LÓGICA ---


  // --- (INÍCIO DO NOVO DESIGN "PROFESSIONAL LIGHT") ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Layout de Cartão
        - Mantém a sombra 'shadow-xl' e 'overflow-hidden'
        - Mantém a quebra responsiva 'lg:flex'
      */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full lg:flex animate-fade-in">

        {/* Coluna Esquerda (Branding)
          - Substituído o gradiente por um 'bg-gray-50' (cinza claro)
          - Texto agora é escuro ('text-gray-800' e 'text-gray-600')
          - Ícone da marca usa a cor primária ('text-blue-600')
        */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-50 p-12 flex-col justify-center items-center">
          <div className="mb-6">
            {BrandIcon} {/* Ícone SVG com a nova cor */}
          </div>
          <h1 className="text-3xl font-bold mb-3 text-gray-800 text-center">
            MedLogs
          </h1>
          <p className="text-center text-gray-600">
            Gestão Inteligente de Pacientes e Medicações.
          </p>
        </div>

        {/* Coluna Direita (Formulário)
          - Fundo 'bg-white'
          - Títulos e textos em tons de cinza escuro
        */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">

          {/* Logo/Título para telas pequenas (quando a coluna esquerda some) */}
          <div className="lg:hidden text-center mb-6">
             <h1 className="text-2xl font-bold text-gray-800">MedLogs</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isLoginView ? 'Acessar Sistema' : 'Criar Nova Conta'}
          </h2>

          <form onSubmit={handleAuth} noValidate>
            
            {/* Campo Nome (Aparece só no Cadastro) */}
            {!isLoginView && (
              <div className="mb-4 animate-fade-in">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    {UserIcon}
                  </span>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Seu nome completo"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Campo de Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  {MailIcon}
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="seuemail@exemplo.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  {LockIcon}
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLoginView ? "current-password" : "new-password"}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Sua senha"
                  disabled={isLoading}
                />
              </div>
              {isLoginView && (
                <div className="text-right mt-2">
                  <a href="#" className="text-xs text-blue-600 hover:underline">
                    Esqueceu sua senha?
                  </a>
                </div>
              )}
            </div>

            {/* Campo de 'Role' (só no cadastro) */}
            {!isLoginView && (
              <div className="mb-6 animate-fade-in">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Qual sua função?
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    {RoleIcon}
                  </span>
                  {/* (Classe 'appearance-none' esconde a seta padrão) */}
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
                    disabled={isLoading}
                  >
                    <option value="profissional">Profissional (Saúde)</option>
                    <option value="secretario">Secretário(a)</option>
                  </select>
                  {/* (Seta customizada para o select) */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem de Erro */}
            {error && (
              <p className="text-red-600 text-sm text-center mb-4 animate-shake">{error}</p>
)}

            {/* Botão Principal (Entrar ou Criar Conta) */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center h-12 cursor-pointer ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                isLoginView ? 'Entrar no Sistema' : 'Criar Conta'
              )}
            </button>

            {/* Botão para Alternar Login/Cadastro */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={toggleView}
                disabled={isLoading}
                className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>
          </form>

          {/* Rodapé (Mantido) */}
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Versão 1.1.1</p>
            <p>Todos os direitos reservados @2025</p>
          </div>

        </div>
      </div>
    </div>
  );
  // --- (FIM DO NOVO DESIGN) ---
}
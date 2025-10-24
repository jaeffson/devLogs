// src/pages/LoginPage.jsx
import React, { useState } from 'react';
// Removido 'Link' pois você usa um botão para alternar
// import { Link } from 'react-router-dom';
import icons from '../utils/icons'; // Certifique-se que este caminho está correto

// Ícones (usando os que sugeri anteriormente para consistência)
const UserIcon = ( // Ícone para o campo Nome
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MailIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LockIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
// Ícone/Ilustração para a coluna esquerda
const BrandIcon = (
    // Seu logo ou ícone principal aqui
    // Exemplo: Ícone SysMed simplificado
   <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
     <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
     <path d="M12 8v4l3 3"></path>
     <path d="M16 2v4"></path>
     <path d="M8 2v4"></path>
     <path d="M4.22 19.78l1.42-1.42"></path>
     <path d="M18.36 5.64l1.42-1.42"></path>
   </svg>
);

export default function LoginPage({ onLogin, setUsers, addToast, addLog, MOCK_USERS }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Mantido para o cadastro
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sua função handleAuth original, sem alterações na lógica
  const handleAuth = (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (isLoginView) {
        // Lógica de Login (igual à sua)
        const user = (MOCK_USERS || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
        if (user) {
            if (user.status === 'pending') {
                setError('Sua conta está pendente de aprovação.'); setIsLoading(false); return;
            }
            if (user.status === 'inactive') {
                setError('Sua conta está desativada. Entre em contato.'); setIsLoading(false); return;
            }
            console.log("1. LoginPage: Usuário encontrado. Chamando onLogin com:", user);
            // Chama onLogin do App.jsx (adicionei um token fake como no seu código)
            onLogin({ ...user, token: `fake-jwt-token-for-${user.id}` });
            // Não precisa setIsLoading(false), pois App.jsx redireciona
        } else {
            setError('Credenciais inválidas.');
            setIsLoading(false);
        }
      } else {
        // Lógica de Cadastro (igual à sua)
        if (!name.trim()) {
            setError('Nome é obrigatório para cadastro.'); setIsLoading(false); return;
        }
        if ((MOCK_USERS || []).some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
            setError('Este e-mail já está em uso.'); setIsLoading(false); return;
        }

        const newUser = {
            id: Date.now(), name: name.trim(), email: email.trim().toLowerCase(),
            password, role: 'profissional', status: 'pending',
        };

        if (typeof setUsers === 'function') {
            setUsers(prev => [...prev, newUser]);
        } else {
            console.error("setUsers não é uma função.");
        }

        addToast('Cadastro realizado! Aguarde aprovação.', 'success');
        addLog?.('Novo Usuário', `${name.trim()} (${email.trim()}) realizou cadastro e aguarda aprovação.`);
        setIsLoginView(true); // Volta para login
        setName(''); setEmail(''); setPassword(''); // Limpa campos
        setIsLoading(false);
      }
    }, 1000); // Simulação
  };

  // Função para alternar a view e limpar erros/campos
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    // Limpar campos ao trocar pode ser opcional, mas geralmente é bom
    // setEmail('');
    // setPassword('');
    // setName('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full lg:flex animate-fade-in">

        {/* --- Coluna Esquerda (Branding - Igual à sugestão anterior) --- */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-center items-center text-white">
          <div className="mb-6">
            {BrandIcon}
          </div>
          {/* Use o nome do seu sistema */}
          <h1 className="text-3xl font-bold mb-3 text-center">SysMed</h1>
          <p className="text-center text-blue-100">Gestão Inteligente de Pacientes e Medicações.</p>
          {/* Você pode adicionar mais informações aqui se desejar */}
        </div>

        {/* --- Coluna Direita (Formulário - Adaptado para Login/Cadastro) --- */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">

          {/* Título Principal (Muda entre Login e Cadastro) */}
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
            {isLoginView ? 'Acessar Sistema' : 'Criar Nova Conta'}
          </h2>

          {/* Logo SysMed para telas pequenas (Opcional) */}
          {/* <div className="lg:hidden text-center mb-6">
             <h1 className="text-2xl font-bold text-blue-700">SysMed</h1>
          </div> */}

          <form onSubmit={handleAuth} noValidate>
            {/* Campo Nome (Aparece só no Cadastro) */}
            {!isLoginView && (
              <div className="mb-4 animate-fade-in"> {/* Animação suave */}
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Seu nome completo"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Campo de Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="seuemail@exemplo.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="mb-6"> {/* Aumentei o espaço abaixo da senha */}
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  // Ajusta o autocomplete baseado na view
                  autoComplete={isLoginView ? "current-password" : "new-password"}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Sua senha"
                  disabled={isLoading}
                />
              </div>
              {/* Link "Esqueci senha" (Aparece só no Login) */}
              {isLoginView && (
                <div className="text-right mt-1">
                  <a href="#" className="text-xs text-blue-600 hover:underline">
                    Esqueceu sua senha?
                  </a>
                </div>
              )}
            </div>

            {/* Mensagem de Erro */}
            {error && (
              // Usando a animação 'shake' que você tinha
              <p className="text-red-500 text-sm text-center mb-4 animate-shake">{error}</p>
            )}

            {/* Botão Principal (Entrar ou Criar Conta) */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center h-10 ${ /* Aumentei padding vertical */
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
                  onClick={toggleView} // Usa a função que limpa erros
                  disabled={isLoading}
                  className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                </button>
            </div>

          </form>

            {/* Rodapé com versão e direitos (como no seu original) */}
           <div className="mt-8 text-center text-xs text-gray-400">
             <p>Versão 1.0.4</p>
             <p>Todos os direitos reservados @2025</p>
           </div>

        </div>
      </div>
    </div>
  );
}
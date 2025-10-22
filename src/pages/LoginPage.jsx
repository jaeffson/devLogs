// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Se precisar de link para "Esqueci senha", etc.
import icons from '../utils/icons';
// Ícones podem ser importados de um local central ou definidos aqui se usados só aqui

// Página de Login (substitui LoginScreen)
export default function LoginPage({ onLogin, setUsers, addToast, addLog, MOCK_USERS }) {
  const [isLoginView, setIsLoginView] = useState(true); // Renomeado de isLogin para clareza
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e) => {
    e.preventDefault();
    if (isLoading) return; // Previne múltiplos submits
    setError('');
    setIsLoading(true);

    // Simulação com setTimeout (substituir por chamada de API real)
    setTimeout(() => {
      if (isLoginView) {
        // Lógica de Login
        // FIX: Add a fallback to an empty array to prevent 'find of undefined' error
        const user = (MOCK_USERS || []).find(u => u.email === email && u.password === password);
        if (user) {
            if (user.status === 'pending') {
              setError('Sua conta está pendente de aprovação.');
              setIsLoading(false); return;
            }
            if (user.status === 'inactive') {
              setError('Sua conta está desativada. Entre em contato.');
              setIsLoading(false); return;
            }
          
          // --- ADICIONADO PARA DEPURAÇÃO ---
          console.log("1. LoginPage: Usuário encontrado. Chamando onLogin com:", user);
          // -----------------------------------

          // Chama a função onLogin passada pelo App.jsx
          onLogin({ ...user, token: `fake-jwt-token-for-${user.id}` });
          // Não precisa setIsLoading(false) aqui, pois a tela vai mudar
        } else {
          setError('Credenciais inválidas.');
          setIsLoading(false);
        }
      } else {
        // Lógica de Cadastro
        // FIX: Add a fallback to an empty array here as well for safety
        if ((MOCK_USERS || []).some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
          setError('Este e-mail já está em uso.');
          setIsLoading(false); return;
        }
        if (!name.trim()) { // Validação básica do nome
            setError('Nome é obrigatório para cadastro.');
            setIsLoading(false); return;
        }

        const newUser = {
          id: Date.now(), // ID temporário
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password, // Em produção, NUNCA armazene senha em texto plano!
          role: 'profissional', // Padrão
          status: 'pending', // Padrão para cadastro
        };

        // Atualiza a lista de usuários (temporário, backend fará isso)
        if (typeof setUsers === 'function') {
            setUsers(prev => [...prev, newUser]);
        } else {
            console.error("setUsers não é uma função. Cadastro não será salvo localmente.");
        }

        addToast('Cadastro realizado! Aguarde aprovação.', 'success');
        addLog('Novo Usuário', `${name.trim()} (${email.trim()}) realizou cadastro e aguarda aprovação.`);
        setIsLoginView(true); // Volta para a tela de login após cadastro
        setName(''); setEmail(''); setPassword('');
        setIsLoading(false);
      }
    }, 1000); // Simulação de 1 segundo
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 flex items-center justify-center p-4"> {/* Fundo melhorado */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]"> {/* Efeito sutil */}
        <div className="text-center mb-8">
          {/* Pode adicionar um logo aqui */}
          <h1 className="text-3xl font-bold text-gray-800">MedLogs </h1>
          <h1 className="text-3xl font-bold text-gray-800">Farmácia Municipal de Parari -PB</h1>
          <p className="text-gray-500 mt-1">Gestão Inteligente de Pacientes</p>
        </div>

        <form onSubmit={handleAuth} noValidate>
          {/* Campo Nome (só no Cadastro) */}
          {!isLoginView && (
            <div className="mb-4 animate-fade-in"> {/* Animação */}
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">Nome Completo</label>
              <input
                id="name" type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="name"
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo" disabled={isLoading}
              />
            </div>
          )}
          {/* Campo Email */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seuemail@exemplo.com" disabled={isLoading}
            />
          </div>
          {/* Campo Senha */}
          <div className="mb-6 relative">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Senha</label>
            <input
              id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isLoginView ? "current-password" : "new-password"}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" // Padding à direita para ícone
              placeholder="Sua senha" disabled={isLoading}
            />
              {/* Ícone (opcional, para mostrar/esconder senha) */}
            <span className="absolute right-3 top-[37px] text-gray-400 cursor-pointer">
              {/* {icons.lock} */}
            </span>
          </div>

          {/* Mensagem de Erro */}
          {error && <p className="text-red-600 text-sm italic mb-4 text-center animate-shake">{error}</p>} {/* Animação de erro */}

          {/* Botão Principal */}
          <div className="flex flex-col items-center justify-between">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 flex items-center justify-center disabled:opacity-75 h-10" // Altura fixa
              type="submit" disabled={isLoading}
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

            {/* Link para Alternar Login/Cadastro */}
            <button
              type="button" onClick={() => { setIsLoginView(!isLoginView); setError(''); /* Limpa erro ao trocar */ }}
              className="inline-block align-baseline font-semibold text-sm text-blue-600 hover:text-blue-800 mt-4 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoginView ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
              {/* Link Esqueci Senha (opcional) */}
              {/* {isLoginView && (
                  <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-blue-600 mt-2">Esqueceu a senha?</Link>
              )} */}
          </div>
        </form>
        <p className="text-center text-xs text-gray-400 mt-8">Versão 1.0.3</p>
      </div>
    </div>
  );
}


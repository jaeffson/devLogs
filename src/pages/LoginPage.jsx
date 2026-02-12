import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { requestPasswordReset } from '../services/api';
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiActivity,
} from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-hot-toast';

// --- IMAGENS DO SLIDESHOW ---
const backgroundImages = [
  // Imagem 1: Farmacêutica atendendo (Foco humano)
  'https://images.unsplash.com/photo-1576091160550-217358c7e618?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  // Imagem 2: Estoque/Prateleira de remédios (Foco logística)
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  // Imagem 3: Tecnologia/Tablet em uso médico (Foco sistema)
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
];

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  // --- LÓGICA DE LOGIN (MANTIDA) ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'profissional',
  });

  // Estados do Modal "Esqueci a Senha"
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });

  // --- LÓGICA DO SLIDESHOW (NOVO) ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); 

    return () => clearInterval(intervalId);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLoginView) {
        // --- LOGIN ---
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });

        const { token, ...userData } = response.data;
        const userToSave = { ...userData, token };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userToSave));

        if (userData.status === 'pending') {
          throw new Error('Sua conta aguarda aprovação do administrador.');
        }
        if (userData.status === 'inativo') {
          throw new Error('Conta desativada. Contacte o suporte.');
        }

        toast.success(`Bem-vindo, ${userData.name.split(' ')[0]}!`);
        if (onLogin) onLogin(userToSave);

        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        // --- REGISTRO ---
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        toast.success('Conta criada! Aguarde aprovação.');
        setIsLoginView(true);
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Erro ao conectar ao servidor.';
      setError(msg);
      toast.error(msg);

      if (isLoginView) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotStatus({ type: '', message: '' });

    try {
      await requestPasswordReset(forgotEmail);
      setForgotStatus({
        type: 'success',
        message: 'Se o e-mail existir, enviamos um link de recuperação!',
      });
      setTimeout(() => setForgotEmail(''), 2000);
    } catch (error) {
      setForgotStatus({
        type: 'error',
        message: 'Erro ao processar solicitação. Tente novamente.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* --- LADO ESQUERDO: FORMULÁRIO (Igual ao anterior) --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white z-10 relative w-full lg:w-[500px] xl:w-[600px]">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in-up">
          <div className="mb-12">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200 mb-6">
              <FiActivity />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {isLoginView ? 'Acesse sua conta' : 'Crie seu acesso'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isLoginView
                ? 'Gerencie seus atendimentos e estoque.'
                : 'Junte-se à plataforma MedLogs.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-pulse">
                <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {!isLoginView && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiUser />
                  </div>
                  <input
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white text-gray-900"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiMail />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white text-gray-900"
                  placeholder="nome@exemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-700">
                  Senha
                </label>
                {isLoginView && (
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white text-gray-900"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {!isLoginView && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Perfil de Acesso
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiBriefcase />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="profissional">Profissional de Saúde</option>
                    <option value="secretario">Secretário de Saúde</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-[0.99] cursor-pointer text-sm"
              >
                {isLoading ? (
                  <ClipLoader size={20} color="#fff" />
                ) : (
                  <>
                    {isLoginView ? 'Entrar' : 'Criar Conta'}
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-sm">
              {isLoginView ? 'Ainda não tem conta?' : 'Já possui cadastro?'}
              <button
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setError('');
                  setFormData({ ...formData, password: '' });
                }}
                className="ml-2 font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {isLoginView ? 'Solicitar Acesso' : 'Fazer Login'}
              </button>
            </p>
          </div>
        </div>
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs text-gray-400">&copy; 2026 MedLogs System</p>
        </div>
      </div>

      {/* --- LADO DIREITO: SLIDESHOW COM FOTOS DE PROFISSIONAIS --- */}
      <div className="hidden lg:block relative flex-1 bg-blue-900 overflow-hidden">
        {/* Container das Imagens */}
        {backgroundImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-40' : 'opacity-0'
            }`}
          />
        ))}

        {/* Overlay Azul Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/95 mix-blend-multiply" />

        {/* Conteúdo de Texto (Sobreposto) */}
        <div className="absolute inset-0 flex flex-col justify-center px-16 xl:px-24 text-white z-20">
          <div className="max-w-xl animate-fade-in-up delay-100">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-wider uppercase text-blue-100">
                Sistema Web v4.5
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight mb-6 leading-tight">
              Gestão Inteligente <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-300">
                Para Farmácias
              </span>
            </h1>

            <p className="text-lg text-blue-100/80 mb-10 leading-relaxed font-light">
              Otimize o fluxo de dispensação, controle o estoque em tempo real e
              garanta a segurança do paciente com nossa plataforma integrada.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="text-cyan-400 text-xl shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white">Prontuário Digital</h3>
                  <p className="text-sm text-blue-200/70">
                    Histórico completo.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiCheckCircle className="text-cyan-400 text-xl shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-white">Controle de Estoque</h3>
                  <p className="text-sm text-blue-200/70">Monitoramento 24h.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL ESQUECI A SENHA --- */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsForgotOpen(false)}
          />

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 transform transition-all scale-100 animate-scale-in border border-gray-100">
            <button
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <FiLock size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Recuperar Acesso
                </h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Informe seu e-mail para receber o link de redefinição.
                </p>
              </div>

              {forgotStatus.type === 'success' ? (
                <div className="bg-green-50 text-green-800 p-6 rounded-xl flex flex-col items-center text-center gap-4 border border-green-100 animate-fade-in">
                  <FiCheckCircle size={32} className="text-green-600" />
                  <p className="font-medium">{forgotStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Email Corporativo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiMail />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white text-gray-900"
                        placeholder="exemplo@medlogs.com"
                        required
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>

                  {forgotStatus.type === 'error' && (
                    <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg flex items-center gap-2">
                      <FiAlertTriangle /> {forgotStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {forgotLoading ? (
                      <>
                        <ClipLoader size={18} color="#fff" />
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

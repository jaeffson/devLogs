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
} from 'react-icons/fi';
import { Package } from 'lucide-react'; 
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-hot-toast';

// --- IMAGENS DO SLIDESHOW ---
const backgroundImages = [
  'https://img.freepik.com/fotos-gratis/cortar-medicamento-doutor-droga-medica_1134-729.jpg?t=st=1771361613~exp=1771365213~hmac=e88adcdc76c6570c03971914e62cc17a9e50b33b7690cb3b91888e617fadb5e6',
  'https://img.freepik.com/fotos-gratis/mao-de-uma-mulher-segurando-um-painel-anticoncepcional-para-evitar-a-gravidez_1150-14212.jpg?t=st=1771362029~exp=1771365629~hmac=026125298fd2ad47fd0d5a87ff292f14aabf2432335ccd457d9b58af04c8e9d7',
  'https://img.freepik.com/fotos-gratis/contente-mulher-de-cabelos-compridos-parecendo-satisfeita-depois-de-comprar-produtos-em-uma-drogaria_259150-57996.jpg?t=st=1771362136~exp=1771365736~hmac=507f36bc34b35471aab2cbb29bfdf47c9a8d7d25c2562fa4166b1ca85bc57edd'
];

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();

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

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });

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
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ========================================== */}
      {/* LADO ESQUERDO: ÁREA DO FORMULÁRIO */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:flex-none lg:w-[500px] xl:w-[600px] bg-white z-10 relative shadow-[20px_0_40px_rgba(0,0,0,0.05)]">
        
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Cabeçalho do Form */}
          <div className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl text-white shadow-xl shadow-indigo-200 mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <Package size={28} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isLoginView ? 'Acesse sua conta' : 'Crie seu acesso'}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {isLoginView
                ? 'Bem-vindo de volta ao sistema MedLogs.'
                : 'Junte-se à plataforma inteligente de gestão.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Aviso de Erro Animado */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm font-bold text-red-800 leading-tight">{error}</p>
              </div>
            )}

            {/* Campo: NOME (Só no Registro) */}
            {!isLoginView && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <FiUser size={18} />
                  </div>
                  <input
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Campo: EMAIL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                E-mail 
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FiMail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="nome@medlogs.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Campo: SENHA */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Senha
                </label>
                {isLoginView && (
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FiLock size={18} />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer focus:outline-none transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Campo: CARGO (Só no Registro) */}
            {!isLoginView && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Perfil de Acesso
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <FiBriefcase size={18} />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-10 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="profissional">Profissional de Saúde</option>
                    <option value="secretario">Secretário de Saúde</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* BOTÃO PRINCIPAL */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent font-black rounded-2xl text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-[0.98] cursor-pointer text-sm overflow-hidden"
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                {isLoading ? (
                  <ClipLoader size={20} color="#fff" />
                ) : (
                  <>
                    <span className="relative z-10">{isLoginView ? 'Acessar Plataforma' : 'Criar Minha Conta'}</span>
                    <FiArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* TROCA DE TELAS (LOGIN/REGISTER) */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {isLoginView ? 'Novo na equipe?' : 'Já possui cadastro?'}
              <button
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setError('');
                  setFormData({ ...formData, password: '' });
                }}
                className="ml-2 font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {isLoginView ? 'Solicite seu acesso' : 'Fazer Login'}
              </button>
            </p>
          </div>
        </div>
        
        {/* Rodapé do Form */}
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} MedLogs System</p>
        </div>
      </div>

      {/* ========================================== */}
      {/* LADO DIREITO: SLIDESHOW */}
      {/* ========================================== */}
      <div className="hidden lg:block relative flex-1 bg-slate-900 overflow-hidden">
        
        {/* Container das Imagens */}
        {backgroundImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Apresentação do Sistema ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-60 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ transitionProperty: 'opacity, transform', transitionDuration: '2s' }}
          />
        ))}

        {/* Overlay Escuro com Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/80 to-slate-900/95 mix-blend-multiply" />
        
        {/* Efeito de Poeira/Ruído (Noise) sutil */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

        {/* Conteúdo de Texto do Slideshow */}
        <div className="absolute inset-0 flex flex-col justify-center px-16 xl:px-24 text-white z-20">
          <div className="max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
            
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black tracking-widest uppercase text-blue-100">
                Sistema Operacional v5.5
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight mb-6 leading-tight">
              Gestão Inteligente <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                Para Saúde Pública.
              </span>
            </h1>

            <p className="text-lg text-blue-100/80 mb-12 leading-relaxed font-medium">
              Otimize o fluxo de dispensação, controle o estoque logístico e
              garanta a segurança do paciente com nossa plataforma integrada de ponta a ponta.
            </p>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <FiCheckCircle className="text-blue-300 text-xl shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Prontuário Digital</h3>
                  <p className="text-xs text-blue-200/70 font-medium leading-relaxed">Histórico blindado e centralizado.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <FiCheckCircle className="text-indigo-300 text-xl shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Controle Ativo</h3>
                  <p className="text-xs text-blue-200/70 font-medium leading-relaxed">Monitoramento de remessas 24h.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: ESQUECI A SENHA (REFINADO) */}
      {/* ========================================== */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsForgotOpen(false)}
          />

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-slate-100">
            <button
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors p-2 rounded-full cursor-pointer active:scale-95"
            >
              <FiX size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-600 shadow-sm border border-indigo-100">
                  <FiLock size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Recuperar Acesso
                </h3>
                <p className="text-slate-500 mt-2 text-sm font-medium">
                  Informe seu e-mail corporativo para receber o link seguro de redefinição.
                </p>
              </div>

              {forgotStatus.type === 'success' ? (
                <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl flex flex-col items-center text-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                  <FiCheckCircle size={36} className="text-emerald-500" />
                  <p className="font-bold">{forgotStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <FiMail size={18} />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        placeholder="nome@medlogs.com"
                        required
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>

                  {forgotStatus.type === 'error' && (
                    <div className="text-red-700 text-sm font-bold bg-red-50 p-3.5 rounded-xl flex items-start gap-2 border border-red-100">
                      <FiAlertTriangle className="mt-0.5 shrink-0" size={16} /> 
                      <p>{forgotStatus.message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="group w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {forgotLoading ? (
                      <ClipLoader size={18} color="#fff" />
                    ) : (
                      <>
                        Enviar Link de Recuperação <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
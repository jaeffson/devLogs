import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiUser, FiMail, FiShield, FiLock, FiEye, FiEyeOff, 
  FiSave, FiAlertCircle, FiCheckCircle, FiCheck, FiKey 
} from 'react-icons/fi';

import { changeUserPassword } from '../services/api'; 

export default function Profile() {
  const { user } = useOutletContext();

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Estados para força da senha
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
    lowercase: false,
  });

  const validatePassword = (password) => {
    const rules = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    };

    setRequirements(rules);

    let score = 0;
    if (rules.length) score++;
    if (rules.number) score++;
    if (rules.special) score++;
    if (rules.uppercase) score++;
    if (rules.lowercase) score++;

    setStrength(score);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
    
    if (name === 'newPassword') {
      validatePassword(value);
    }
    if (status.message) setStatus({ type: '', message: '' });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-rose-500/30',
      secretario: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/30',
      profissional: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-500/30',
    };
    return colors[role] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-400/30';
  };

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
    if (strength === 3) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    if (strength >= 4) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
    return 'bg-gray-200 dark:bg-slate-700';
  };

  const getStrengthText = () => {
    if (!passwords.newPassword) return 'Digite uma senha';
    if (strength <= 2) return 'Senha Fraca';
    if (strength === 3) return 'Senha Média';
    if (strength >= 4) return 'Senha Forte';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setStatus({ type: 'error', message: 'Por favor, preencha todos os campos.' });
      setIsLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas não coincidem.' });
      setIsLoading(false);
      return;
    }

    if (strength < 3) {
      setStatus({ type: 'error', message: 'Sua senha precisa ser mais forte.' });
      setIsLoading(false);
      return;
    }

    try {
      await changeUserPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      setStatus({ type: 'success', message: 'Senha atualizada com sucesso!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStrength(0);
      setRequirements({ length: false, number: false, special: false, uppercase: false, lowercase: false });
    
    } catch (error) {
      const msgErro = error.response?.data?.message || 'Erro ao alterar senha. Verifique a senha atual.';
      setStatus({ type: 'error', message: msgErro });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out pb-10">
      
      {/* Header da Página */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Meu Perfil</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gerencie suas credenciais e segurança.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- CARD 1: PERFIL DO USUÁRIO --- */}
        <div className="lg:col-span-1 h-fit">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-0 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-gray-100 dark:border-slate-800 overflow-hidden relative group transition-all duration-300 hover:shadow-2xl">
            
            {/* Banner Gradiente Animado */}
            <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative px-6 pb-8 flex flex-col items-center text-center -mt-12">
              {/* Avatar com Borda e Sombra */}
              <div className="w-24 h-24 rounded-full border-[6px] border-white dark:border-slate-900 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 shadow-lg mb-4 z-10">
                {user?.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">{user?.email}</p>
              
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </span>

              {/* Lista de Detalhes */}
              <div className="w-full mt-8 space-y-4">
                <ProfileInfoItem icon={FiUser} label="Nome" value={user?.name} />
                <ProfileInfoItem icon={FiMail} label="Email" value={user?.email} />
                <ProfileInfoItem icon={FiShield} label="Acesso" value={user?.role} isCapitalize />
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 2: ALTERAR SENHA --- */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-gray-100 dark:border-slate-800 relative">
            
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm">
                <FiLock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alterar Senha</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Mantenha sua conta segura usando uma senha forte com caracteres variados.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
              
              {/* Mensagem de Feedback */}
              {status.message && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 shadow-sm border ${
                  status.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20' 
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300 border-rose-100 dark:border-rose-500/20'
                }`}>
                  <span className="mt-0.5 text-lg shrink-0">
                    {status.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                  </span>
                  <span className="font-semibold">{status.message}</span>
                </div>
              )}

              {/* Campo: Senha Atual */}
              <div className="space-y-2 group">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Senha Atual</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FiKey />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all duration-300 text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="border-b border-gray-100 dark:border-slate-800"></div>

              {/* Campo: Nova Senha */}
              <div className="space-y-2 group">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Nova Senha</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FiLock />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all duration-300 text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium"
                    placeholder="Mínimo de 8 caracteres"
                  />
                </div>

                {/* Medidor de Força Estilizado */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${passwords.newPassword ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                   <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs font-bold mb-2">
                        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Força da Senha</span>
                        <span className={`transition-colors duration-300 ${strength <= 2 ? 'text-rose-500' : strength === 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      
                      {/* Barra Segmentada */}
                      <div className="flex gap-1.5 h-2 mb-4">
                        {[...Array(5)].map((_, i) => (
                           <div 
                             key={i} 
                             className={`flex-1 rounded-full transition-all duration-500 ${i < strength ? getStrengthColor() : 'bg-gray-200 dark:bg-slate-700'}`}
                           />
                        ))}
                      </div>

                      {/* Checklist Grid */}
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          <RequirementItem met={requirements.length} label="8+ Caracteres" />
                          <RequirementItem met={requirements.uppercase} label="Letra Maiúscula" />
                          <RequirementItem met={requirements.lowercase} label="Letra Minúscula" />
                          <RequirementItem met={requirements.number} label="Número" />
                          <RequirementItem met={requirements.special} label="Símbolo (!@#)" />
                      </div>
                   </div>
                </div>
              </div>

              {/* Campo: Confirmar Senha */}
              <div className="space-y-2 group">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirmar Senha</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FiCheckCircle />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all duration-300 text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || (passwords.newPassword && strength < 3)}
                  className={`
                    relative overflow-hidden group flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300
                    ${isLoading || (passwords.newPassword && strength < 3)
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none text-slate-500' 
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer'}
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Item de Perfil
function ProfileInfoItem({ icon: Icon, label, value, isCapitalize }) {
  return (
    <div className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors duration-200 group cursor-default">
      <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all duration-300">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-bold text-slate-700 dark:text-slate-200 ${isCapitalize ? 'capitalize' : ''}`}>
          {value || 'Não informado'}
        </p>
      </div>
    </div>
  );
}

// Subcomponente de Requisito de Senha
function RequirementItem({ met, label }) {
    return (
        <div className={`flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${met ? 'text-emerald-600 dark:text-emerald-400 translate-x-1' : 'text-slate-400'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${met ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {met && <FiCheck className="w-2.5 h-2.5" />}
            </div>
            <span>{label}</span>
        </div>
    )
}
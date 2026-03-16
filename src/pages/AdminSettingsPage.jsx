import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// --- ÍCONES ---
import {
  FiActivity,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiTruck,
  FiFileText,
  FiSettings,
  FiPieChart,
  FiEdit3,
  FiX,
  FiAlertTriangle,
  FiDollarSign,
  FiBox,
  FiShield
} from 'react-icons/fi';

import UserForm from '../components/forms/UserForm';
import { StatusBadge } from '../components/common/StatusBadge';
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';

export default function AdminSettingsPage({
  user,
  users = [],
  setUsers,
  annualBudget,
  handleUpdateBudget,
  activityLog = [],
  addLog,
}) {
  // --- NAVEGAÇÃO ---
  const [activeSubTab, setActiveSubTab] = useState('global');

  // --- DADOS ---
  const [distributors, setDistributors] = useState([]);
  const [loadingDists, setLoadingDists] = useState(false);

  // --- MODAIS E FORMULÁRIOS ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Estado Fornecedores
  const [isDistributorModalOpen, setIsDistributorModalOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [distributorForm, setDistributorForm] = useState({
    name: '',
    cnpj: '',
    contact: '',
    budget: '',
  });

  // --- ESTADO DO MODAL DE EXCLUSÃO ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    data: null,
    type: null,
  });
  const [deleteInputConfirmation, setDeleteInputConfirmation] = useState('');

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    setLoadingDists(true);
    try {
      const res = await api.get('/distributors');
      setDistributors(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores', error);
    } finally {
      setLoadingDists(false);
    }
  };

  // ==================================================================================
  // LÓGICA DE USUÁRIOS
  // ==================================================================================
  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, userData);
        toast.success('Usuário atualizado com sucesso!');
        if (addLog) addLog('ATUALIZAR_USUARIO', `Editou o usuário: ${userData.name}`, { payload: userData });
      } else {
        await api.post('/users', userData);
        toast.success('Usuário cadastrado com sucesso!');
        if (addLog) addLog('CRIAR_USUARIO', `Novo usuário: ${userData.name}`, { payload: userData });
      }
      setIsUserModalOpen(false);
      if (typeof setUsers === 'function') setUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar o usuário.');
    }
  };

  const handleToggleUserStatus = async (userToToggle) => {
    try {
      const isCurrentlyActive = userToToggle.status === 'active';
      const newStatus = isCurrentlyActive ? 'inactive' : 'active';

      await api.put(`/users/${userToToggle._id}`, {
        ...userToToggle,
        status: newStatus,
      });

      toast.success(!isCurrentlyActive ? 'Usuário Aprovado/Ativado!' : 'Usuário Bloqueado!', {
        icon: !isCurrentlyActive ? '✅' : '🔒',
      });

      if (addLog) addLog('ATUALIZAR_USUARIO', `Alterou o status de ${userToToggle.name} para ${newStatus}`);
      if (typeof setUsers === 'function') setUsers(); 
    } catch (error) {
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  // ==================================================================================
  // LÓGICA DE FORNECEDORES
  // ==================================================================================
  const handleOpenDistributorModal = (dist = null) => {
    if (dist) {
      setEditingDistributor(dist);
      setDistributorForm({
        name: dist.name,
        cnpj: dist.cnpj || '',
        contact: dist.contact || '',
        budget: dist.budget || '',
      });
    } else {
      setEditingDistributor(null);
      setDistributorForm({ name: '', cnpj: '', contact: '', budget: '' });
    }
    setIsDistributorModalOpen(true);
  };

  const handleSaveDistributor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...distributorForm,
        budget: Number(distributorForm.budget) || 0,
      };

      if (editingDistributor) {
        await api.put(`/distributors/${editingDistributor._id}`, payload);
        toast.success('Fornecedor atualizado!');
        if (addLog) addLog('ATUALIZAR_FORNECEDOR', `Atualizou: ${distributorForm.name}`, { payload });
      } else {
        await api.post('/distributors', payload);
        toast.success('Fornecedor cadastrado!');
        if (addLog) addLog('CRIAR_FORNECEDOR', `Novo: ${distributorForm.name}`, { payload });
      }
      setIsDistributorModalOpen(false);
      fetchDistributors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar fornecedor.');
    }
  };

  // ==================================================================================
  // LÓGICA DE EXCLUSÃO SEGURA
  // ==================================================================================
  const openDeleteModal = (data, type) => {
    setDeleteModal({ isOpen: true, data, type });
    setDeleteInputConfirmation('');
  };

  const handleConfirmDelete = async () => {
    const { data, type } = deleteModal;
    if (deleteInputConfirmation !== data.name) {
      toast.error('O nome digitado não confere.');
      return;
    }
    try {
      if (type === 'user') {
        await api.delete(`/users/${data._id}`);
        toast.success('Usuário excluído.');
        if (typeof setUsers === 'function') setUsers();
      } else if (type === 'distributor') {
        await api.delete(`/distributors/${data._id}`);
        toast.success('Fornecedor removido.');
        fetchDistributors();
      }
      setDeleteModal({ isOpen: false, data: null, type: null });
    } catch (error) {
      toast.error('Erro ao excluir. Verifique dependências.');
    }
  };

  // ==================================================================================
  // HELPERS UI & ESTILOS DE LOGS
  // ==================================================================================
  const getLogStyle = (action) => {
    const act = String(action || '').toUpperCase();
    if (act.includes('CRIAR') || act.includes('ADICIONAR') || act.includes('NOVO') || act.includes('APPROVE'))
      return { icon: <FiPlus />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (act.includes('REMOVER') || act.includes('EXCLUIR') || act.includes('CANCELAR') || act.includes('DELETE'))
      return { icon: <FiTrash2 />, color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (act.includes('FECHAR') || act.includes('CONCLUIR') || act.includes('RECEB'))
      return { icon: <FiCheckCircle />, color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (act.includes('EDITAR') || act.includes('ATUALIZAR') || act.includes('UPDATE'))
      return { icon: <FiEdit3 />, color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (act.includes('LOGIN') || act.includes('AUTH'))
      return { icon: <FiShield />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
    
    return { icon: <FiActivity />, color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // --- RENDERIZADOR AVANÇADO DE DETALHES DO LOG ---
  const renderLogDetails = (log) => {
    // 1. Procura o texto base descritivo
    let textDetail = log.details || log.description || log.message || log.observation || log.action_desc;
    
    // 2. Procura objetos de dados que o back-end pode ter enviado ocultos
    const extraData = log.payload || log.metadata || log.data || log.changes || log.requestBody || null;

    // Se o textDetail for um objeto, tentamos transformá-lo
    if (typeof textDetail === 'object') {
      textDetail = JSON.stringify(textDetail);
    }

    return (
      <div className="flex flex-col gap-2">
        {/* Texto principal */}
        {textDetail ? (
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {textDetail}
          </p>
        ) : !extraData ? (
          <p className="text-sm italic text-slate-400">Nenhum detalhe textual registrado.</p>
        ) : null}

        {/* Caixa de Código (Payloads/Metadados) */}
        {extraData && (
          <div className="mt-1 bg-slate-800 rounded-xl p-3 border border-slate-700 overflow-x-auto custom-scrollbar shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FiBox /> Dados da Operação (JSON)
              </span>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400">
              {JSON.stringify(extraData, null, 2)}
            </pre>
          </div>
        )}

        {/* Entidade ID Referência */}
        {log.entity && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-widest rounded-lg w-max mt-1 shadow-sm">
             <FiFileText size={10} /> ID Ref: {log.entity}
          </span>
        )}
      </div>
    );
  };

  // ==================================================================================
  // RENDERIZAÇÃO DAS ABAS
  // ==================================================================================
  const renderSubTabView = () => {
    switch (activeSubTab) {
      case 'global':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8">
              <h3 className="font-black text-xl text-slate-800 mb-2 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FiPieChart size={20} />
                </div>
                Orçamento Anual Global
              </h3>
              <p className="text-slate-500 font-medium text-sm mb-8">
                Este é o teto global de gastos. Você também pode definir limites individuais para cada farmácia/distribuidor na aba "Fornecedores".
              </p>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <AnnualBudgetChart annualBudget={annualBudget} onUpdateBudget={handleUpdateBudget} currentSpending={0} />
              </div>
            </div>
          </div>
        );

      case 'distributors':
        return (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
              <div>
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                  Fornecedores & Orçamentos
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Gerencie os polos e farmácias da sua rede.</p>
              </div>
              <button
                onClick={() => handleOpenDistributorModal()}
                className="bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/30 cursor-pointer active:scale-95"
              >
                <FiPlus size={18} /> Novo Fornecedor
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {loadingDists ? (
                <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center">
                  <FiClock className="animate-spin text-indigo-500 mb-2" size={24} />
                  Carregando Unidades...
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-5">Unidade / Polo</th>
                      <th className="p-5">Teto de Gastos</th>
                      <th className="p-5">Detalhes</th>
                      <th className="p-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {distributors.length > 0 ? (
                      distributors.map((d) => (
                        <tr key={d._id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="p-5">
                            <div className="font-black text-slate-800 flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-sm">
                                <FiTruck size={16} />
                              </div>
                              {d.name}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60 shadow-sm text-sm">
                              {formatCurrency(d.budget)}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="text-xs font-bold text-slate-600">{d.cnpj || 'Sem CNPJ'}</div>
                            <div className="text-xs font-medium text-slate-400 mt-0.5">{d.contact || 'Sem Contato'}</div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenDistributorModal(d)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors" title="Editar">
                                <FiEdit3 />
                              </button>
                              <button onClick={() => openDeleteModal(d, 'distributor')} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors" title="Excluir">
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-400 font-medium">
                          Nenhum fornecedor ou farmácia cadastrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
              <div>
                <h3 className="font-black text-xl text-slate-800">Equipe & Usuários</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Gerencie os acessos ao sistema.</p>
              </div>
              <button
                onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                className="bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/30 cursor-pointer active:scale-95"
              >
                <FiPlus size={18} /> Novo Usuário
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5">Identificação</th>
                    <th className="p-5">Função</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => {
                    const isUserActive = u.status === 'active';
                    return (
                      <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-5">
                          <div className="font-black text-slate-800 text-sm">{u.name}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">{u.email}</div>
                        </td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border shadow-sm ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {u.role === 'admin' ? 'Administrador' : 'Profissional'}
                          </span>
                        </td>
                        <td className="p-5">
                          <StatusBadge active={isUserActive} status={u.status} />
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                            {user.id !== u._id && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`p-2.5 rounded-xl cursor-pointer transition-colors shadow-sm border ${isUserActive ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}
                                title={isUserActive ? 'Bloquear Acesso' : 'Aprovar/Ativar Acesso'}
                              >
                                {isUserActive ? <FiX size={16} /> : <FiCheckCircle size={16} />}
                              </button>
                            )}
                            <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors" title="Editar">
                              <FiEdit3 size={16} />
                            </button>
                            {user.id !== u._id && (
                              <button onClick={() => openDeleteModal(u, 'user')} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors" title="Excluir Definitivamente">
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'log':
        return (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                Auditoria & Logs
              </h3>
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Últimos 100 eventos
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5 w-16 text-center">Tipo</th>
                    <th className="p-5 w-1/5">Autor / Data</th>
                    <th className="p-5 w-1/6">Ação</th>
                    <th className="p-5">Detalhes Completos da Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activityLog.map((log) => {
                    const style = getLogStyle(log.action);
                    return (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-5 text-center align-top">
                          <div className={`w-10 h-10 mx-auto flex items-center justify-center rounded-2xl border shadow-sm transition-transform group-hover:scale-110 ${style.color}`}>
                            {style.icon}
                          </div>
                        </td>
                        <td className="p-5 align-top">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                              <FiUser size={12} className="text-slate-400" /> 
                              {log.user || log.userName || 'Sistema Automático'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                              <FiClock size={10} />
                              {new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 align-top">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${style.color.replace('text-', 'text-opacity-90 ').replace('bg-', 'bg-opacity-40 ')}`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-5 align-top max-w-lg">
                          {/* CHAMA O NOVO RENDERIZADOR DE LOGS INTELIGENTE */}
                          {renderLogDetails(log)}
                        </td>
                      </tr>
                    );
                  })}
                  {activityLog.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-16 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center">
                          <FiShield size={32} className="mb-3 text-slate-300" />
                          Nenhum evento registrado no sistema de auditoria ainda.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col gap-6 animate-in fade-in">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <FiSettings size={20} />
            </div>
            Configurações & Auditoria
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Painel de controle global e histórico de segurança do MedLogs.
          </p>
        </div>
      </header>

      {/* Menu de Abas Premium (Segmented Control / Pills) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm flex overflow-x-auto custom-scrollbar gap-2 shrink-0">
        {[
          { id: 'global', icon: <FiPieChart />, label: 'Painel Geral' },
          { id: 'distributors', icon: <FiTruck />, label: 'Rede & Farmácias' },
          { id: 'users', icon: <FiUser />, label: 'Equipe de Acesso' },
          { id: 'log', icon: <FiShield />, label: 'Auditoria e Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {renderSubTabView()}
      </div>

      {/* --- MODAL DE USUÁRIO --- */}
      {isUserModalOpen && (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setIsUserModalOpen(false)}
          addToast={toast}
        />
      )}

      {/* --- MODAL DE FORNECEDOR PREMIUM --- */}
      {isDistributorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FiTruck size={18} />
                </div>
                {editingDistributor ? 'Editar Unidade' : 'Nova Unidade'}
              </h3>
              <button onClick={() => setIsDistributorModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-200 cursor-pointer transition-colors">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDistributor} className="p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Unidade / Farmácia</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all uppercase shadow-sm"
                    value={distributorForm.name}
                    onChange={(e) => setDistributorForm({ ...distributorForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">CNPJ</label>
                    <input
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all shadow-sm"
                      value={distributorForm.cnpj}
                      onChange={(e) => setDistributorForm({ ...distributorForm, cnpj: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Teto (R$)</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="number"
                        className="w-full py-3 pr-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-800 transition-all shadow-sm"
                        value={distributorForm.budget}
                        onChange={(e) => setDistributorForm({ ...distributorForm, budget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Responsável / Contato</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all shadow-sm"
                    value={distributorForm.contact}
                    onChange={(e) => setDistributorForm({ ...distributorForm, contact: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDistributorModalOpen(false)} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200 cursor-pointer active:scale-95 transition-all">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO SEGURO --- */}
      {deleteModal.isOpen && deleteModal.data && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-rose-100">
            <div className="bg-rose-50 px-8 py-6 border-b border-rose-100 flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm">
                <FiAlertTriangle size={24} />
              </div>
              <h3 className="font-black text-rose-900 text-xl tracking-tight">
                Ação Destrutiva
              </h3>
            </div>

            <div className="p-8">
              <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                Você está prestes a excluir permanentemente o cadastro de <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{deleteModal.data.name}</span> do sistema.
              </p>

              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Confirme digitando o nome exato:
              </p>

              <input
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none font-bold text-slate-800 shadow-sm transition-all"
                placeholder={deleteModal.data.name}
                value={deleteInputConfirmation}
                onChange={(e) => setDeleteInputConfirmation(e.target.value)}
                autoFocus
              />

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, data: null, type: null })}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteInputConfirmation !== deleteModal.data.name}
                  className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black hover:bg-rose-700 shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600 disabled:shadow-none flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <FiTrash2 /> Excluir 
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
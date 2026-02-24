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
        if (addLog)
          addLog('ATUALIZAR_USUARIO', `Editou o usuário: ${userData.name}`);
      } else {
        await api.post('/users', userData);
        toast.success('Usuário cadastrado com sucesso!');
        if (addLog) addLog('CRIAR_USUARIO', `Novo usuário: ${userData.name}`);
      }
      setIsUserModalOpen(false);

      if (typeof setUsers === 'function') {
        setUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar o usuário.');
    }
  };

  // ==================================================================================
  // NOVA LÓGICA: ATIVAR/DESATIVAR (CORRIGIDA PARA O BANCO DE DADOS REAL)
  // ==================================================================================
  const handleToggleUserStatus = async (userToToggle) => {
    try {
      // Verifica se o status atual no banco é "active"
      const isCurrentlyActive = userToToggle.status === 'active';

      // Se está ativo, muda para inactive. Se está pending ou inactive, muda para active.
      const newStatus = isCurrentlyActive ? 'inactive' : 'active';

      // Envia a palavra certa para o campo "status" em vez de mandar um "active" booleano
      await api.put(`/users/${userToToggle._id}`, {
        ...userToToggle,
        status: newStatus,
      });

      toast.success(
        !isCurrentlyActive ? 'Usuário Aprovado/Ativado!' : 'Usuário Bloqueado!',
        {
          icon: !isCurrentlyActive ? '✅' : '🔒',
        }
      );

      if (addLog)
        addLog(
          'ATUALIZAR_USUARIO',
          `Alterou o status de ${userToToggle.name} para ${newStatus}`
        );

      if (typeof setUsers === 'function') setUsers(); // Recarrega a tabela
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
        if (addLog)
          addLog(
            'ATUALIZAR_FORNECEDOR',
            `Atualizou: ${distributorForm.name} (Teto: R$ ${payload.budget})`
          );
      } else {
        await api.post('/distributors', payload);
        toast.success('Fornecedor cadastrado!');
        if (addLog)
          addLog(
            'CRIAR_FORNECEDOR',
            `Novo: ${distributorForm.name} (Teto: R$ ${payload.budget})`
          );
      }
      setIsDistributorModalOpen(false);
      fetchDistributors();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Erro ao salvar fornecedor.'
      );
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
  // HELPERS UI
  // ==================================================================================
  const getLogStyle = (action) => {
    const act = action ? action.toUpperCase() : '';
    if (
      act.includes('CRIAR') ||
      act.includes('ADICIONAR') ||
      act.includes('NOVO')
    )
      return {
        icon: <FiPlus />,
        color: 'text-green-600 bg-green-50 border-green-200',
      };
    if (
      act.includes('REMOVER') ||
      act.includes('EXCLUIR') ||
      act.includes('CANCELAR')
    )
      return {
        icon: <FiTrash2 />,
        color: 'text-red-600 bg-red-50 border-red-200',
      };
    if (
      act.includes('FECHAR') ||
      act.includes('CONCLUIR') ||
      act.includes('RECEB')
    )
      return {
        icon: <FiCheckCircle />,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      };
    if (act.includes('EDITAR') || act.includes('ATUALIZAR'))
      return {
        icon: <FiFileText />,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
      };
    if (act.includes('LOGIN'))
      return {
        icon: <FiUser />,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
      };
    return {
      icon: <FiActivity />,
      color: 'text-gray-600 bg-gray-50 border-gray-200',
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  // ==================================================================================
  // RENDERIZAÇÃO DAS ABAS
  // ==================================================================================
  const renderSubTabView = () => {
    switch (activeSubTab) {
      case 'global':
        return (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FiPieChart className="text-blue-600" /> Orçamento Anual Global
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Este é o teto global de gastos. Você também pode definir limites
                individuais na aba "Fornecedores".
              </p>
              <AnnualBudgetChart
                annualBudget={annualBudget}
                onUpdateBudget={handleUpdateBudget}
                currentSpending={0}
              />
            </div>
          </div>
        );

      case 'distributors':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700">
                Fornecedores & Orçamentos
              </h3>
              <button
                onClick={() => handleOpenDistributorModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <FiPlus /> Novo Fornecedor
              </button>
            </div>
            {loadingDists ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-4">Razão Social / Nome</th>
                    <th className="p-4">Teto de Gastos (Mensal)</th>
                    <th className="p-4">CNPJ / Contato</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {distributors.length > 0 ? (
                    distributors.map((d) => (
                      <tr
                        key={d._id}
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                            <FiTruck size={14} />
                          </div>
                          {d.name}
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                            {formatCurrency(d.budget)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="text-xs font-mono">
                            {d.cnpj || 'S/ CNPJ'}
                          </div>
                          <div className="text-xs">{d.contact}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenDistributorModal(d)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                            >
                              <FiEdit3 />
                            </button>
                            <button
                              onClick={() => openDeleteModal(d, 'distributor')}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        Nenhum fornecedor cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700">Usuários do Sistema</h3>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <FiPlus /> Novo Usuário
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Nome / Email</th>
                  <th className="p-4">Função</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  // NOVO: Lê o status corretamente do banco
                  const isUserActive = u.status === 'active';

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold border ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                        >
                          {u.role === 'admin'
                            ? 'Administrador'
                            : 'Profissional'}
                        </span>
                      </td>
                      <td className="p-4">
                        {/* Passa a leitura do texto pro componente de crachá */}
                        <StatusBadge active={isUserActive} status={u.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.id !== u._id && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-2 rounded-lg cursor-pointer ${isUserActive ? 'text-amber-500 hover:bg-amber-100' : 'text-emerald-600 hover:bg-emerald-100'}`}
                              title={
                                isUserActive
                                  ? 'Bloquear Usuário'
                                  : 'Aprovar/Ativar Usuário'
                              }
                            >
                              {isUserActive ? <FiX /> : <FiCheckCircle />}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setIsUserModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                            title="Editar Dados"
                          >
                            <FiEdit3 />
                          </button>

                          {user.id !== u._id && (
                            <button
                              onClick={() => openDeleteModal(u, 'user')}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <FiTrash2 />
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
        );

      case 'log':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <FiClock className="text-gray-400" /> Histórico de Atividades
              </h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                Últimos 100 registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="p-4 w-16 text-center">Tipo</th>
                    <th className="p-4 w-1/5">Usuário / Data</th>
                    <th className="p-4 w-1/6">Ação</th>
                    <th className="p-4">Detalhes do Evento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activityLog.map((log) => {
                    const style = getLogStyle(log.action);
                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 text-center align-top">
                          <div
                            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full border ${style.color}`}
                          >
                            {style.icon}
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm flex items-center gap-1">
                              <FiUser size={12} className="text-gray-400" />{' '}
                              {log.user || log.userName || 'Sistema'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <FiClock size={10} />
                              {new Date(
                                log.createdAt
                              ).toLocaleDateString()}{' '}
                              {new Date(log.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${style.color.replace('text-', 'text-opacity-80 ').replace('bg-', 'bg-opacity-50 ')}`}
                          >
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {log.details ||
                              log.description ||
                              log.message ||
                              log.observation ||
                              'Sem detalhes fornecidos pelo sistema.'}
                          </p>
                          {log.entity && (
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block">
                              ID Ref: {log.entity}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {activityLog.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-12 text-center text-gray-400"
                      >
                        Nenhum log de atividade registrado no sistema ainda.
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiSettings className="text-gray-600" /> Configurações & Auditoria
        </h1>
        <p className="text-gray-500 text-sm">
          Gerenciamento global do sistema MedLogs
        </p>
      </header>

      {/* Menu de Abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveSubTab('global')}
            className={`${activeSubTab === 'global' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium flex items-center gap-2 cursor-pointer`}
          >
            <FiPieChart /> Geral
          </button>
          <button
            onClick={() => setActiveSubTab('distributors')}
            className={`${activeSubTab === 'distributors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium flex items-center gap-2 cursor-pointer`}
          >
            <FiTruck /> Fornecedores
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`${activeSubTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium flex items-center gap-2 cursor-pointer`}
          >
            <FiUser /> Usuários
          </button>
          <button
            onClick={() => setActiveSubTab('log')}
            className={`${activeSubTab === 'log' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium flex items-center gap-2 cursor-pointer`}
          >
            <FiClock /> Logs
          </button>
        </nav>
      </div>

      <div className="mt-4">{renderSubTabView()}</div>

      {/* --- MODAL DE USUÁRIO --- */}
      {isUserModalOpen && (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setIsUserModalOpen(false)}
          addToast={toast}
        />
      )}

      {/* --- MODAL DE FORNECEDOR --- */}
      {isDistributorModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <FiTruck />{' '}
                {editingDistributor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button
                onClick={() => setIsDistributorModalOpen(false)}
                className="cursor-pointer"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSaveDistributor} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Nome / Farmácia
                  </label>
                  <input
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    value={distributorForm.name}
                    onChange={(e) =>
                      setDistributorForm({
                        ...distributorForm,
                        name: e.target.value,
                      })
                    }
                    required
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      CNPJ
                    </label>
                    <input
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={distributorForm.cnpj}
                      onChange={(e) =>
                        setDistributorForm({
                          ...distributorForm,
                          cnpj: e.target.value,
                        })
                      }
                      placeholder="00.000..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Teto (R$)
                    </label>
                    <div className="relative">
                      <FiDollarSign
                        className="absolute left-2 top-3 text-gray-400"
                        size={12}
                      />
                      <input
                        type="number"
                        className="w-full p-2 pl-6 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={distributorForm.budget}
                        onChange={(e) =>
                          setDistributorForm({
                            ...distributorForm,
                            budget: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Contato
                  </label>
                  <input
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={distributorForm.contact}
                    onChange={(e) =>
                      setDistributorForm({
                        ...distributorForm,
                        contact: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDistributorModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO SEGURO --- */}
      {deleteModal.isOpen && deleteModal.data && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-scale-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-red-100">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <FiAlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-red-900 text-lg">
                Ação Destrutiva
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Você está prestes a excluir permanentemente: <br />
                <span className="font-bold text-gray-800 text-lg block mt-1">
                  {deleteModal.data.name}
                </span>
              </p>

              <p className="text-sm text-gray-500 mb-4">
                Para confirmar, digite o nome exato abaixo:
              </p>

              <input
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-bold text-gray-700"
                placeholder={`Digite "${deleteModal.data.name}"`}
                value={deleteInputConfirmation}
                onChange={(e) => setDeleteInputConfirmation(e.target.value)}
                autoFocus
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({ isOpen: false, data: null, type: null })
                  }
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteInputConfirmation !== deleteModal.data.name}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-all"
                >
                  <FiTrash2 /> EXCLUIR DEFINITIVAMENTE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

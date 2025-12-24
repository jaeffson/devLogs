// src/pages/AdminSettingsPage.jsx
// (ATUALIZADO: Gestão Completa de Farmácias - Criar, Editar Teto, Excluir)

import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api'; 

// --- Imports de Componentes ---
import UserForm from '../components/forms/UserForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { ConfirmModal } from '../components/common/Modal'; // Para Status Toggle e Confirmações simples
import { StatusBadge } from '../components/common/StatusBadge';
import  {AnnualBudgetChart}  from '../components/common/AnnualBudgetChart';
import { icons } from '../utils/icons';

// --- Componente da Página ---
export default function AdminSettingsPage({
    user, users = [], setUsers, // setUsers atua como refetchUsers
    annualBudget, handleUpdateBudget, // Atualiza estado global do Orçamento Geral
    activityLog = [],
    records = [],
    addToast, addLog
}) {
    // --- Estados Internos (Geral) ---
    const [activeSubTab, setActiveSubTab] = useState('users');
    
    // --- Estados: Usuários ---
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, data: null, type: null }); // type: 'user' | 'pharmacy'
    const [statusConfirmation, setStatusConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });

    // --- Estados: Orçamento Global ---
    const [newBudgetValue, setNewBudgetValue] = useState(String(annualBudget || '0'));

    // --- Estados: Farmácias (NOVO) ---
    const [distributors, setDistributors] = useState([]);
    const [editingDistributorValues, setEditingDistributorValues] = useState({});
    const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);
    const [savingDistributorId, setSavingDistributorId] = useState(null);
    
    // Estado para Criar Nova Farmácia
    const [isCreatePharmacyModalOpen, setIsCreatePharmacyModalOpen] = useState(false);
    const [newPharmacyName, setNewPharmacyName] = useState('');
    const [newPharmacyBudget, setNewPharmacyBudget] = useState('');

    // Sincroniza o valor do input de orçamento global
    useEffect(() => {
        const value = (annualBudget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        setNewBudgetValue(String(value));
    }, [annualBudget]);

    // Carrega Farmácias quando a aba 'pharmacies' é ativada
    useEffect(() => {
        if (activeSubTab === 'pharmacies') {
            loadDistributors();
        }
    }, [activeSubTab]);

    // --- LOGICA: Farmácias / Distribuidores ---
    const loadDistributors = async () => {
        setIsLoadingDistributors(true);
        try {
            const response = await api.get('/distributors');
            setDistributors(response.data || []);
            
            // Prepara valores para edição
            const values = {};
            response.data.forEach(d => {
                values[d._id] = d.budget || 0;
            });
            setEditingDistributorValues(values);
        } catch (error) {
            console.error("Erro ao carregar farmácias", error);
            if (addToast) addToast('Erro ao carregar unidades.', 'error');
        } finally {
            setIsLoadingDistributors(false);
        }
    };

    const handleSaveDistributorBudget = async (id) => {
        setSavingDistributorId(id);
        try {
            const newVal = parseFloat(editingDistributorValues[id]);
            if (isNaN(newVal) || newVal < 0) {
                if (addToast) addToast('Valor inválido.', 'warning');
                setSavingDistributorId(null);
                return;
            }

            await api.put(`/distributors/${id}`, { budget: newVal });
            
            if (addToast) addToast('Teto da unidade atualizado!', 'success');
            if (addLog) addLog(user?.name, `atualizou orçamento da unidade ID: ${id}`);

            // Atualiza lista localmente
            setDistributors(prev => prev.map(d => d._id === id ? { ...d, budget: newVal } : d));

        } catch (e) {
            console.error(e);
            if (addToast) addToast('Erro ao salvar.', 'error');
        } finally {
            setSavingDistributorId(null);
        }
    };

    // --- NOVO: Criar Farmácia ---
    const handleCreatePharmacy = async () => {
        if (!newPharmacyName.trim()) {
            addToast('O nome da unidade é obrigatório.', 'warning');
            return;
        }

        try {
            const budgetValue = parseFloat(newPharmacyBudget) || 0;
            await api.post('/distributors', { 
                name: newPharmacyName, 
                budget: budgetValue 
            });

            addToast('Unidade cadastrada com sucesso!', 'success');
            addLog?.(user?.name, `cadastrou nova unidade: ${newPharmacyName}`);
            
            setNewPharmacyName('');
            setNewPharmacyBudget('');
            setIsCreatePharmacyModalOpen(false);
            loadDistributors(); // Recarrega a lista

        } catch (error) {
            console.error(error);
            addToast('Erro ao cadastrar unidade.', 'error');
        }
    };

    // --- NOVO: Excluir Farmácia ---
    const handleDeletePharmacyClick = (dist) => {
        setDeleteConfirmation({ 
            isOpen: true, 
            data: dist, 
            type: 'pharmacy' 
        });
    };

    const handleConfirmDelete = async () => {
        const { data, type } = deleteConfirmation;
        const id = data._id || data.id;

        try {
            if (type === 'user') {
                await api.delete(`/users/${id}`);
                addToast('Usuário excluído.', 'success');
                addLog?.(user?.name, `EXCLUIU usuário ${data.name}`);
                setUsers();
            } else if (type === 'pharmacy') {
                await api.delete(`/distributors/${id}`);
                addToast('Unidade removida com sucesso.', 'success');
                addLog?.(user?.name, `EXCLUIU unidade ${data.name}`);
                loadDistributors();
            }
        } catch (error) {
            console.error(error);
            addToast(`Erro ao excluir ${type === 'user' ? 'usuário' : 'unidade'}.`, 'error');
        } finally {
            setDeleteConfirmation({ isOpen: false, data: null, type: null });
        }
    };

    // --- CÁLCULO DO GASTO TOTAL (Para Gráfico Global) ---
    const totalSpentForYear = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return (records || [])
            .filter(r => new Date(r.entryDate).getFullYear() === currentYear)
            .reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
    }, [records]);

    // --- Funções UI/Modais (Usuários) ---
    const closeStatusConfirmation = () => setStatusConfirmation({ isOpen: false, message: '', data: null, onConfirm: null });

    const handleOpenUserModal = (userToEdit = null) => {
        setEditingUser(userToEdit);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    // --- FUNÇÕES CRUD DE USUÁRIOS ---
    const handleSaveUser = async (userData) => {
        const cleanedUserData = { ...userData, name: userData.name.trim(), email: userData.email.trim().toLowerCase() };
        const userId = cleanedUserData._id || cleanedUserData.id;
        
        try {
            if(userId) {
                await api.put(`/users/${userId}`, cleanedUserData);
                addToast('Usuário atualizado com sucesso!', 'success');
                addLog?.(user?.name, `atualizou usuário ${cleanedUserData.name}`);
            } else {
                await api.post('/users', cleanedUserData);
                addToast('Usuário criado com sucesso!', 'success');
                addLog?.(user?.name, `criou usuário: ${cleanedUserData.name}`);
            }
            setUsers(); 
        } catch (error) {
            console.error('[API Error] Salvar Usuário:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar usuário.';
            addToast(msg, 'error');
        } finally {
            handleCloseUserModal();
        }
    };

    const handleToggleUserStatusClick = (userToToggle) => {
        const isActivating = userToToggle.status !== 'active';
        setStatusConfirmation({
            isOpen: true,
            message: `Deseja ${isActivating ? 'ATIVAR' : 'DESATIVAR'} "${userToToggle.name}"?`,
            data: userToToggle._id || userToToggle.id,
            onConfirm: handleToggleUserStatusConfirm
        });
    };

    const handleToggleUserStatusConfirm = async (userId) => {
        const userToToggle = users.find(u => (u._id || u.id) === userId);
        const newStatus = (userToToggle.status !== 'active') ? 'active' : 'inactive';
        
        try {
            await api.patch(`/users/${userId}/status`, { status: newStatus });
            addToast(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}!`, 'success');
            addLog?.(user?.name, `${newStatus === 'active' ? 'ativou' : 'desativou'} usuário ${userToToggle?.name}`);
            setUsers();
        } catch (error) {
            console.error('[API Error] Toggle Status:', error);
            addToast('Falha ao atualizar status.', 'error');
        } finally {
            closeStatusConfirmation(); 
        }
    };

    const handleDeleteUserClick = (userToDelete) => {
        if ((userToDelete._id || userToDelete.id) === (user._id || user.id)) {
            addToast('Você não pode excluir sua própria conta.', 'error');
            return;
        }
        setDeleteConfirmation({ isOpen: true, data: userToDelete, type: 'user' });
    };

    // --- FUNÇÃO DE ORÇAMENTO GLOBAL ---
    const handleBudgetSave = async () => {
        const cleanedValue = newBudgetValue.replace(/\./g, '').replace(',', '.');
        const value = parseFloat(cleanedValue);

        if (isNaN(value) || value < 0) {
            addToast('Valor de orçamento inválido.', 'error');
            setNewBudgetValue(annualBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
            return;
        }

        try {
            await api.post('/settings/budget', { budget: value });
            handleUpdateBudget(value);
            addToast('Orçamento global atualizado!', 'success');
        } catch (error) {
            console.error('[API Error] Salvar Orçamento:', error);
            addToast('Falha ao salvar orçamento no servidor.', 'error');
        }
    };

    const sortedActivityLog = useMemo(() =>
        [...activityLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [activityLog]
    );

    // --- RENDERIZAÇÃO DAS SUB-ABAS ---
    const renderSubTabView = () => {
        switch (activeSubTab) {
            case 'users':
                return (
                    <div className="animate-fade-in bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {icons.users} Gerenciar Usuários
                            </h3>
                            <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-md mt-3 md:mt-0 cursor-pointer">
                                <span className="w-4 h-4">{icons.plus}</span> Novo Usuário
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white text-sm border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                                        <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                                        <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">Função</th>
                                        <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id || u.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"> 
                                            <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                                            <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{u.email}</td>
                                            <td className="py-3 px-4 text-gray-600 capitalize hidden md:table-cell">{u.role}</td>
                                            <td className="py-3 px-4"><StatusBadge status={u.status} /></td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenUserModal(u)} className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer" title="Editar Usuário"><span className="w-5 h-5 block">{icons.edit}</span></button>
                                                    <button onClick={() => handleToggleUserStatusClick(u)} className={`p-1 rounded ${u.status === 'active' ? 'text-yellow-600 hover:bg-yellow-100' : 'text-green-600 hover:bg-green-100'} transition-colors cursor-pointer`} title={u.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                        <span className="w-5 h-5 block">{u.status === 'active' ? icons.ban : icons.check}</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteUserClick(u)} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-30 transition-colors cursor-pointer" title="Excluir" disabled={(u._id || u.id) === (user._id || user.id)}><span className="w-5 h-5 block">{icons.trash}</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum usuário encontrado.</p>}
                        </div>
                    </div>
                );

            case 'budget':
                return (
                    <div className="animate-fade-in max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            {icons.dollar} Orçamento Global (Padrão)
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Este valor é usado como referência geral caso as farmácias não tenham tetos individuais definidos.</p>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                            <div className="flex justify-center">
                                <AnnualBudgetChart key={annualBudget} totalSpent={totalSpentForYear} budgetLimit={annualBudget} />
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-gray-700 font-semibold mb-2" htmlFor="annual-budget-input">Definir Novo Limite Global (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">R$</span>
                                    <input 
                                        id="annual-budget-input" 
                                        type="text" 
                                        value={newBudgetValue} 
                                        onChange={(e) => setNewBudgetValue(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 transition-colors text-lg font-bold text-gray-800" 
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                            <button onClick={handleBudgetSave} className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2">
                                {icons.save} Salvar Orçamento
                            </button>
                        </div>
                    </div>
                );

            case 'pharmacies':
                // --- ABA: UNIDADES (COM CRUD COMPLETO) ---
                return (
                    <div className="animate-fade-in bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    {icons.organization || <span>🏥</span>} Gestão de Unidades
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Cadastre e defina o orçamento de cada farmácia.</p>
                            </div>
                            
                            <button 
                                onClick={() => setIsCreatePharmacyModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold transition-colors shadow-md cursor-pointer"
                            >
                                <span className="w-4 h-4">{icons.plus}</span> Nova Unidade
                            </button>
                        </div>

                        {isLoadingDistributors ? (
                            <div className="p-10 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {distributors.map((dist) => (
                                    <div key={dist._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-md hover:border-indigo-200 group">
                                        
                                        {/* Info Farmácia */}
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-10 h-10 rounded-full bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-lg shadow-sm">
                                                {dist.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{dist.name}</p>
                                                <p className="text-xs text-gray-500">Teto Atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dist.budget || 0)}</p>
                                            </div>
                                        </div>

                                        {/* Ações: Input e Botões */}
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="relative w-full md:w-40 group-focus-within:ring-2 ring-indigo-100 rounded-lg transition-all">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-800 font-semibold focus:border-indigo-500 outline-none transition-all"
                                                    value={editingDistributorValues[dist._id]}
                                                    onChange={(e) => setEditingDistributorValues({...editingDistributorValues, [dist._id]: e.target.value})}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleSaveDistributorBudget(dist._id)}
                                                disabled={savingDistributorId === dist._id}
                                                className={`p-2 rounded-lg text-white transition-all shadow-sm cursor-pointer
                                                    ${savingDistributorId === dist._id ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}
                                                `}
                                                title="Salvar Teto"
                                            >
                                                {savingDistributorId === dist._id ? (
                                                    <span className="animate-spin block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                                                ) : (
                                                    <span className="w-5 h-5 block">{icons.save}</span>
                                                )}
                                            </button>

                                            <button 
                                                onClick={() => handleDeletePharmacyClick(dist)}
                                                className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                                title="Excluir Unidade"
                                            >
                                                <span className="w-5 h-5 block">{icons.trash}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {distributors.length === 0 && (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 mb-2">Nenhuma unidade cadastrada.</p>
                                        <button onClick={() => setIsCreatePharmacyModalOpen(true)} className="text-indigo-600 font-semibold hover:underline">Cadastrar primeira unidade</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MODAL DE CRIAÇÃO DE FARMÁCIA */}
                        {isCreatePharmacyModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-gray-800 text-lg">Nova Unidade</h3>
                                        <button onClick={() => setIsCreatePharmacyModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Unidade / Farmácia</label>
                                            <input 
                                                type="text" 
                                                value={newPharmacyName}
                                                onChange={(e) => setNewPharmacyName(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                placeholder="Ex: Farmácia Central"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Teto Orçamentário Inicial (R$)</label>
                                            <input 
                                                type="number" 
                                                value={newPharmacyBudget}
                                                onChange={(e) => setNewPharmacyBudget(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                        <button 
                                            onClick={() => setIsCreatePharmacyModalOpen(false)}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={handleCreatePharmacy}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-md transition-colors cursor-pointer"
                                        >
                                            Cadastrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'log':
                return (
                    <div className="animate-fade-in bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            {icons.history} Log de Atividades
                        </h3>
                        <div className="overflow-y-auto max-h-[60vh] bg-gray-50 border border-gray-200 rounded-xl p-4 custom-scrollbar">
                            {sortedActivityLog.length > 0 ? (
                                <ul className="space-y-3">
                                    {sortedActivityLog.map(log => (
                                        <li key={log.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                                            <p className="text-sm text-gray-800">
                                                <span className="font-semibold text-blue-600">{log.user}</span> 
                                                <span className="text-gray-700"> {log.action}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                {icons.clock} {new Date(log.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p className="text-center text-gray-500 py-6">Nenhuma atividade registrada.</p>)}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    // --- Renderização Principal da Página ---
    return (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
                <span className="text-blue-600">{icons.gear}</span> Painel Administrativo
            </h2>
            
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="-mb-px flex space-x-6 md:space-x-8 min-w-max" aria-label="Tabs">
                  <button onClick={() => setActiveSubTab('users')} className={`${activeSubTab === 'users' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer flex items-center gap-2`}>
                      {icons.users} Usuários ({users.length})
                  </button>
                  
                  <button onClick={() => setActiveSubTab('pharmacies')} className={`${activeSubTab === 'pharmacies' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer flex items-center gap-2`}>
                      {icons.organization || <span>🏥</span>} Unidades
                  </button>

                  <button onClick={() => setActiveSubTab('budget')} className={`${activeSubTab === 'budget' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer flex items-center gap-2`}>
                      {icons.dollar} Global
                  </button>
                  
                  <button onClick={() => setActiveSubTab('log')} className={`${activeSubTab === 'log' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer flex items-center gap-2`}>
                      {icons.history} Logs
                  </button>
              </nav>
            </div>

            <div className="mt-4">
                {renderSubTabView()}
            </div>
            
            {/* Modais de Usuário e Confirmação */}
            {isUserModalOpen && (
                <UserForm user={editingUser} onSave={handleSaveUser} onClose={handleCloseUserModal} addToast={addToast} />
            )}
            
            {statusConfirmation.isOpen && (
                <ConfirmModal message={statusConfirmation.message} onConfirm={() => statusConfirmation.onConfirm(statusConfirmation.data)} onClose={closeStatusConfirmation} confirmText="Sim" />
            )}

            {deleteConfirmation.isOpen && deleteConfirmation.data && (
                <DestructiveConfirmModal
                    message={`Excluir permanentemente "${deleteConfirmation.data.name}"? Esta ação é irreversível.`}
                    confirmText="EXCLUIR"
                    onConfirm={handleConfirmDelete}
                    onClose={() => setDeleteConfirmation({ isOpen: false, data: null, type: null })}
                />
            )}
        </div>
    );
}
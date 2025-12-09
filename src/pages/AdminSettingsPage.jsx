// src/pages/AdminSettingsPage.jsx
// (ATUALIZADO: Tema Cartesiano Moderno, Melhorias de UX)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
// CORREÇÃO 1: Importamos 'api' em vez de axios direto
import api from '../services/api'; 

// --- Imports de Componentes ---
import UserForm from '../components/forms/UserForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { ConfirmModal } from '../components/common/Modal'; // Para Status Toggle
import { StatusBadge } from '../components/common/StatusBadge';
import  {AnnualBudgetChart}  from '../components/common/AnnualBudgetChart';
import { icons } from '../utils/icons';

// --- Componente da Página ---
export default function AdminSettingsPage({
    user, users = [], setUsers, // setUsers agora é refetchUsers
    annualBudget, handleUpdateBudget, // handleUpdateBudget é a função do App.jsx que ATUALIZA O ESTADO
    activityLog = [],
    records = [],
    addToast, addLog
}) {
    // --- Estados Internos ---
    const [activeSubTab, setActiveSubTab] = useState('users');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // --- Estado para o novo modal ---
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, userToDelete: null });
    const [statusConfirmation, setStatusConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });

    const [newBudgetValue, setNewBudgetValue] = useState(String(annualBudget || '0'));

    // Sincroniza o estado interno (newBudgetValue) quando a prop annualBudget mudar
    useEffect(() => {
        // Formata o valor recebido da API (ex: 5000.0) para o padrão brasileiro (ex: 5.000,00)
        const value = (annualBudget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        setNewBudgetValue(String(value));
    }, [annualBudget]);


    // --- CÁLCULO DO GASTO TOTAL ---
    const totalSpentForYear = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return (records || [])
            .filter(r => new Date(r.entryDate).getFullYear() === currentYear)
            .reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
    }, [records]);

    // --- Funções UI/Modais ---
    const closeStatusConfirmation = () => setStatusConfirmation({ isOpen: false, message: '', data: null, onConfirm: null });

    const handleOpenUserModal = (userToEdit = null) => {
        setEditingUser(userToEdit);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    // --- FUNÇÕES CRUD DE USUÁRIOS (REESCRITAS PARA API) ---

    // 1. SALVAR USUÁRIO (CREATE/UPDATE)
    const handleSaveUser = async (userData) => {
        const cleanedUserData = { ...userData, name: userData.name.trim(), email: userData.email.trim().toLowerCase() };
        const userId = cleanedUserData._id || cleanedUserData.id;
        
        try {
            let response;
            if(userId) {
                // CORREÇÃO 3: api.put
                response = await api.put(`/users/${userId}`, cleanedUserData);
                addToast('Usuário atualizado com sucesso!', 'success');
                addLog?.(user?.name, `atualizou dados do usuário ${cleanedUserData.name}`);
            } else {
                // CORREÇÃO 4: api.post
                response = await api.post('/users', cleanedUserData);
                addToast('Usuário criado com sucesso!', 'success');
                addLog?.(user?.name, `criou usuário: ${cleanedUserData.name}`);
            }

            // Recarrega o estado global de usuários chamando a prop do App.jsx
            setUsers(); 

        } catch (error) {
            console.error('[API Error] Salvar Usuário:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar usuário.';
            addToast(msg, 'error');
        } finally {
            handleCloseUserModal();
        }
    };

    // 2. TOGGLE STATUS (PATCH)
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
            // CORREÇÃO 5: api.patch
            await api.patch(`/users/${userId}/status`, { status: newStatus });
            
            addToast(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}!`, 'success');
            addLog?.(user?.name, `${newStatus === 'active' ? 'ativou' : 'desativou'} usuário ${userToToggle?.name}`);
            
            setUsers(); // Recarrega para atualizar a lista
            
        } catch (error) {
            console.error('[API Error] Toggle Status:', error);
            addToast('Falha ao atualizar status.', 'error');
        } finally {
            closeStatusConfirmation(); 
        }
    };


    // 3. EXCLUIR USUÁRIO (DELETE)
    const handleDeleteUserClick = (userToDelete) => {
        if ((userToDelete._id || userToDelete.id) === user._id || user.id) {
            addToast('Você não pode excluir sua própria conta.', 'error');
            return;
        }
        setDeleteConfirmation({
            isOpen: true,
            userToDelete: userToDelete
        });
    };

    const handleDeleteUserConfirm = async () => {
        const userToDelete = deleteConfirmation.userToDelete;
        const userId = userToDelete._id || userToDelete.id;

        try {
            // CORREÇÃO 6: api.delete
            await api.delete(`/users/${userId}`);

            addToast(`Usuário excluído.`, 'success');
            addLog?.(user?.name, `EXCLUIU usuário ${userToDelete?.name}`);
            
            setUsers(); // Recarrega para remover da lista
            
        } catch (error) {
            console.error('[API Error] Excluir Usuário:', error);
            addToast('Falha ao excluir usuário.', 'error');
        } finally {
            setDeleteConfirmation({ isOpen: false, userToDelete: null }); 
        }
    };
    // --- FIM DAS FUNÇÕES CRUD DE USUÁRIOS ---


    // --- FUNÇÃO DE ORÇAMENTO (CORRIGIDA) ---
    const handleBudgetSave = async () => {
        // 1. Limpa a string (Ex: "5.000,00" -> "5000.00")
        const cleanedValue = newBudgetValue.replace(/\./g, '').replace(',', '.');
        const value = parseFloat(cleanedValue);

        if (isNaN(value) || value < 0) {
            addToast('Valor de orçamento inválido.', 'error');
            // Reseta o input para o valor antigo (que veio da prop)
            setNewBudgetValue(annualBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
            return;
        }

        try {
            // CORREÇÃO 7: api.post com caminho relativo
            await api.post('/settings/budget', {
                budget: value 
            });

            // 3. (Sucesso) Chama a função do App.jsx para atualizar o estado global
            handleUpdateBudget(value); // Esta função (do App.jsx) já mostra o toast de sucesso

        } catch (error) {
            // 4. (Erro) Mostra o erro da API
            console.error('[API Error] Salvar Orçamento:', error);
            addToast('Falha ao salvar orçamento no servidor.', 'error');
        }
    };

    const sortedActivityLog = useMemo(() =>
        [...activityLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [activityLog]
    );

    // --- Renderização das Sub-Abas ---
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
                                        // Usando _id ou id para garantir a chave
                                        <tr key={u._id || u.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"> 
                                            <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                                            <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{u.email}</td>
                                            <td className="py-3 px-4 text-gray-600 capitalize hidden md:table-cell">{u.role}</td>
                                            <td className="py-3 px-4"><StatusBadge status={u.status} /></td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenUserModal(u)} className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer" title="Editar Usuário"><span className="w-5 h-5 block">{icons.edit}</span></button>
                                                    
                                                    <button onClick={() => handleToggleUserStatusClick(u)} className={`p-1 rounded ${u.status === 'active' ? 'text-yellow-600 hover:bg-yellow-100' : 'text-green-600 hover:bg-green-100'} transition-colors cursor-pointer`} title={u.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                        <span className="w-5 h-5 block">
                                                          {u.status === 'active' ? icons.ban : icons.check}
                                                        </span>
                                                    </button>
                                                    
                                                    <button onClick={() => handleDeleteUserClick(u)} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-30 transition-colors cursor-pointer" title="Excluir" disabled={(u._id || u.id) === (user._id || user.id)}><span className="w-5 h-5 block">{icons.trash}</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* A tabela agora mostra esta mensagem se 'users' estiver vazio */}
                            {users.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum usuário encontrado.</p>}
                        </div>
                    </div>
                );
            case 'budget':
                return (
                    <div className="animate-fade-in max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            {icons.dollar} Orçamento Anual
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                            <div className="flex justify-center">
                                {/* Gráfico de Desempenho vs Orçamento */}
                                <AnnualBudgetChart key={annualBudget} totalSpent={totalSpentForYear} budgetLimit={annualBudget} />
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-gray-700 font-semibold mb-2" htmlFor="annual-budget-input">Definir Novo Limite (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">R$</span>
                                    {/* (Melhoria) Input estilizado como moeda */}
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
                            <button onClick={handleBudgetSave} className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-md cursor-pointer">
                                {icons.save} Salvar Orçamento
                            </button>
                        </div>
                    </div>
                );
            case 'log':
                // Nota: ActivityLog ainda é local e precisa de rotas de API futuras
                return (
                    <div className="animate-fade-in bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            {icons.history} Log de Atividades
                        </h3>
                        <div className="overflow-y-auto max-h-[60vh] bg-gray-50 border border-gray-200 rounded-xl p-4">
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
                <span className="text-blue-600">{icons.gear}</span> Configurações Gerais
            </h2>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6 md:space-x-8" aria-label="Tabs">
                  <button onClick={() => setActiveSubTab('users')} className={`${activeSubTab === 'users' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer`}>Usuários ({users.length})</button>
                  <button onClick={() => setActiveSubTab('budget')} className={`${activeSubTab === 'budget' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer`}>Orçamento</button>
                  <button onClick={() => setActiveSubTab('log')} className={`${activeSubTab === 'log' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors cursor-pointer`}>Log de Atividades</button>
              </nav>
            </div>
            <div className="mt-4">
                {renderSubTabView()}
            </div>
            
            {isUserModalOpen && (
                <UserForm 
                  user={editingUser} 
                  onSave={handleSaveUser} 
                  onClose={handleCloseUserModal} 
                  addToast={addToast} 
                />
            )}
            
            {/* Modal de Status (Simples) */}
            {statusConfirmation.isOpen && (
                <ConfirmModal 
                  message={statusConfirmation.message} 
                  onConfirm={() => statusConfirmation.onConfirm(statusConfirmation.data)} 
                  onClose={closeStatusConfirmation} 
                  confirmText="Sim" 
                />
            )}

            {/* Modal de Exclusão Destrutiva */}
            {deleteConfirmation.isOpen && deleteConfirmation.userToDelete && (
                <DestructiveConfirmModal
                    message={`Excluir permanentemente "${deleteConfirmation.userToDelete.name}"? Esta ação não pode ser desfeita.`}
                    confirmText="EXCLUIR"
                    onConfirm={handleDeleteUserConfirm}
                    onClose={() => setDeleteConfirmation({ isOpen: false, userToDelete: null })}
                />
            )}
        </div>
    );
}
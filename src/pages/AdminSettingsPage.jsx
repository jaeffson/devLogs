// src/pages/AdminSettingsPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios'; // <-- NOVO: Importar Axios

// --- Imports de Componentes ---
import UserForm from '../components/forms/UserForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { ConfirmModal } from '../components/common/Modal'; // Para Status Toggle
import { StatusBadge } from '../components/common/StatusBadge';
import  {AnnualBudgetChart}  from '../components/common/AnnualBudgetChart';
import { icons } from '../utils/icons';

// URL base da API (deve ser a mesma definida no App.jsx)
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Componente da Página ---
export default function AdminSettingsPage({
    user, users = [], setUsers, // setUsers agora é refetchUsers
    annualBudget, handleUpdateBudget,
    activityLog = [],
    records = [],
    addToast, addLog
}) {
    // --- Estados Internos ---
    const [activeSubTab, setActiveSubTab] = useState('users');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // --- MUDANÇA: Estado para o novo modal ---
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, userToDelete: null });
    const [statusConfirmation, setStatusConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });

    const [newBudgetValue, setNewBudgetValue] = useState(String(annualBudget || '0'));

    // --- SINCRONIZAÇÃO DE USUÁRIOS E SINCRONIZAÇÃO GERAL ---
    // NOVO: Função para sincronizar o estado global de usuários (chamada pelo CRUD)
    const refetchUsers = useCallback(async () => {
        // ASSUNÇÃO: A rota /users deve ser implementada no seu backend Node.js
        try {
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data); 
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            addToast('Falha ao carregar usuários.', 'error');
        }
    }, [setUsers, addToast]);

    // O useEffect do App.jsx já cuida da primeira carga, mas se setUsers for chamado,
    // ele deve ser a função de refetch acima.

    // Sincroniza o estado interno (newBudgetValue) quando a prop annualBudget mudar
    useEffect(() => {
        const value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(annualBudget || 0);
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
                // ROTA PUT para atualização
                response = await axios.put(`${API_BASE_URL}/users/${userId}`, cleanedUserData);
                addToast('Usuário atualizado com sucesso!', 'success');
                addLog?.(user?.name, `atualizou dados do usuário ${cleanedUserData.name}`);
            } else {
                // ROTA POST para criação
                response = await axios.post(`${API_BASE_URL}/users`, cleanedUserData);
                addToast('Usuário criado com sucesso!', 'success');
                addLog?.(user?.name, `criou usuário: ${cleanedUserData.name}`);
            }

            // Recarrega o estado global de usuários
            refetchUsers(); 

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
            // ROTA PATCH de status
            await axios.patch(`${API_BASE_URL}/users/${userId}/status`, { status: newStatus });
            
            addToast(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}!`, 'success');
            addLog?.(user?.name, `${newStatus === 'active' ? 'ativou' : 'desativou'} usuário ${userToToggle?.name}`);
            
            refetchUsers(); // Recarrega para atualizar a lista
            
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
            // ROTA DELETE
            await axios.delete(`${API_BASE_URL}/users/${userId}`);

            addToast(`Usuário excluído.`, 'success');
            addLog?.(user?.name, `EXCLUIU usuário ${userToDelete?.name}`);
            
            refetchUsers(); // Recarrega para remover da lista
            
        } catch (error) {
            console.error('[API Error] Excluir Usuário:', error);
            addToast('Falha ao excluir usuário.', 'error');
        } finally {
            setDeleteConfirmation({ isOpen: false, userToDelete: null }); 
        }
    };
    // --- FIM DAS FUNÇÕES CRUD DE USUÁRIOS ---


    const handleBudgetSave = () => {
        const cleanedValue = newBudgetValue.replace(/\./g, '').replace(',', '.');
        const value = parseFloat(cleanedValue);

        if (!isNaN(value) && value >= 0) {
            handleUpdateBudget(value); // Esta função já chama addToast
        } else {
            addToast('Valor de orçamento inválido.', 'error');
            setNewBudgetValue(String(annualBudget));
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
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Gerenciar Usuários</h3>
                            <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors cursor-pointer">
                                <span className="w-4 h-4">{icons.plus}</span> Novo Usuário
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Nome</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Email</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Função</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        // Usando _id ou id para garantir a chave
                                        <tr key={u._id || u.id} className="border-b hover:bg-gray-50 transition-colors"> 
                                            <td className="py-2 px-3 font-medium text-gray-800">{u.name}</td>
                                            <td className="py-2 px-3 text-gray-600">{u.email}</td>
                                            <td className="py-2 px-3 text-gray-600 capitalize">{u.role}</td>
                                            <td className="py-2 px-3"><StatusBadge status={u.status} /></td>
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleOpenUserModal(u)} className="p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer" title="Editar Usuário"><span className="w-4 h-4 block">{icons.edit}</span></button>
                                                    
                                                    <button onClick={() => handleToggleUserStatusClick(u)} className={`p-1 ${u.status === 'active' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} transition-colors cursor-pointer`} title={u.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                        <span className="w-4 h-4 block">
                                                          {u.status === 'active' ? icons.ban : icons.check}
                                                        </span>
                                                    </button>
                                                    
                                                    <button onClick={() => handleDeleteUserClick(u)} className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors cursor-pointer" title="Excluir" disabled={(u._id || u.id) === (user._id || user.id)}><span className="w-4 h-4 block">{icons.trash}</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <p className="text-center text-gray-500 py-6">Nenhum usuário.</p>}
                        </div>
                    </div>
                );
            case 'budget':
                return (
                    <div className="animate-fade-in max-w-lg mx-auto">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Orçamento Anual</h3>
                        <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                            <div className="mb-6 flex justify-center">
                                <AnnualBudgetChart key={annualBudget} totalSpent={totalSpentForYear} budgetLimit={annualBudget} />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1" htmlFor="annual-budget-input">Definir Orçamento (R$)</label>
                                <input id="annual-budget-input" type="text" value={newBudgetValue} onChange={(e) => setNewBudgetValue(e.target.value)} className="w-full p-2 border rounded border-gray-300" placeholder="Ex: 5000.00"/>
                            </div>
                            <button onClick={handleBudgetSave} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors cursor-pointer">Salvar Orçamento</button>
                        </div>
                    </div>
                );
            case 'log':
                // Nota: ActivityLog ainda é local e precisa de rotas de API futuras
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Log de Atividades</h3>
                        <div className="overflow-y-auto max-h-[60vh] bg-gray-50 border rounded p-4">
                            {sortedActivityLog.length > 0 ? (
                                <ul className="space-y-3">
                                    {sortedActivityLog.map(log => (
                                        <li key={log.id} className="border-b pb-2 last:border-b-0">
                                            <p className="text-sm text-gray-800"><span className="font-semibold">{log.user}</span> {log.action}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(log.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p className="text-center text-gray-500 py-6">Nenhuma atividade.</p>)}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    // --- Renderização Principal da Página ---
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 border-b pb-3">Configurações Gerais</h2>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6 md:space-x-8" aria-label="Tabs">
                  <button onClick={() => setActiveSubTab('users')} className={`${activeSubTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer`}>Usuários ({users.length})</button>
                  <button onClick={() => setActiveSubTab('budget')} className={`${activeSubTab === 'budget' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer`}>Orçamento</button>
                  <button onClick={() => setActiveSubTab('log')} className={`${activeSubTab === 'log' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer`}>Log de Atividades</button>
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
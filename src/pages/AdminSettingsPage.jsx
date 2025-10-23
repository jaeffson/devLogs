// src/pages/AdminSettingsPage.jsx
import React, { useState, useMemo } from 'react';

// --- Imports de Componentes ---
import UserForm from '../components/forms/UserForm';
import { ConfirmModal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import  {AnnualBudgetChart}  from '../components/common/AnnualBudgetChart';
import icons from '../utils/icons';

// --- Componente da Página ---
export default function AdminSettingsPage({
    user, users = [], setUsers,
    annualBudget, handleUpdateBudget,
    activityLog = [],
    records = [],
    addToast, addLog
}) {
    // --- Estados Internos ---
    const [activeSubTab, setActiveSubTab] = useState('users');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userConfirmation, setUserConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });
    const [newBudgetValue, setNewBudgetValue] = useState(String(annualBudget || '0'));

    // --- CÁLCULO DO GASTO TOTAL ---
    const totalSpentForYear = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return (records || [])
            .filter(r => new Date(r.entryDate).getFullYear() === currentYear)
            .reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
    }, [records]);

    // --- Funções ---
    const closeUserConfirmation = () => setUserConfirmation({ isOpen: false, message: '', data: null, onConfirm: null });

    const handleOpenUserModal = (userToEdit = null) => {
        setEditingUser(userToEdit);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = (userData) => {
        let message = '';
        const cleanedUserData = { ...userData, name: userData.name.trim(), email: userData.email.trim().toLowerCase() };
        const emailExists = users.some(u => u.id !== cleanedUserData.id && u.email === cleanedUserData.email);

        if (emailExists) {
            addToast('Este e-mail já está em uso.', 'error');
            return;
        }

        if(cleanedUserData.id) {
            setUsers(prevUsers => prevUsers.map(u => u.id === cleanedUserData.id ? { ...u, ...cleanedUserData } : u));
            message = 'Usuário atualizado!';
            addLog?.(user?.name, `atualizou usuário ${cleanedUserData.name}`);
        } else {
            const newUser = { ...cleanedUserData, id: Date.now(), status: 'active' };
            setUsers(prevUsers => [...prevUsers, newUser]);
            message = 'Usuário criado!';
            addLog?.(user?.name, `criou usuário: ${newUser.name}`);
        }
        addToast(message, 'success');
        handleCloseUserModal();
    };

    const handleToggleUserStatusClick = (userToToggle) => {
        const isActivating = userToToggle.status !== 'active';
        setUserConfirmation({
            isOpen: true,
            message: `Deseja ${isActivating ? 'ATIVAR' : 'DESATIVAR'} "${userToToggle.name}"?`,
            data: userToToggle.id,
            onConfirm: handleToggleUserStatusConfirm
        });
    };

    const handleToggleUserStatusConfirm = (userId) => {
        let toggledUser = null;
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === userId) {
                const newStatus = (u.status !== 'active') ? 'active' : 'inactive';
                toggledUser = { ...u, status: newStatus };
                return toggledUser;
            }
            return u;
        }));
        const actionText = toggledUser?.status === 'active' ? 'ativado' : 'desativado';
        addToast(`Usuário ${actionText}!`, 'success');
        addLog?.(user?.name, `${actionText} usuário ${toggledUser?.name}`);
    };

    const handleDeleteUserClick = (userToDelete) => {
        if (userToDelete.id === user.id) {
            addToast('Você não pode excluir sua própria conta.', 'error');
            return;
        }
        setUserConfirmation({
            isOpen: true,
            message: `Excluir PERMANENTEMENTE "${userToDelete.name}"? Essa ação não pode ser desfeita.`,
            data: userToDelete.id,
            onConfirm: handleDeleteUserConfirm,
            confirmText: "Excluir Permanentemente"
        });
    };

    const handleDeleteUserConfirm = (userId) => {
        const userToDelete = users.find(u => u.id === userId);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        addToast(`Usuário excluído.`, 'success');
        addLog?.(user?.name, `EXCLUIU usuário ${userToDelete?.name}`);
    };

    const handleBudgetSave = () => {
        const value = parseFloat(newBudgetValue.replace(',', '.'));
        if (!isNaN(value) && value >= 0) {
            handleUpdateBudget(value);
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
                            <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
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
                                        <tr key={u.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3 font-medium text-gray-800">{u.name}</td>
                                            <td className="py-2 px-3 text-gray-600">{u.email}</td>
                                            <td className="py-2 px-3 text-gray-600 capitalize">{u.role}</td>
                                            <td className="py-2 px-3"><StatusBadge status={u.status} /></td>
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleOpenUserModal(u)} className="p-1 text-blue-600 hover:text-blue-800" title="Editar Usuário"><span className="w-4 h-4 block">{icons.edit}</span></button>
                                                    <button onClick={() => handleToggleUserStatusClick(u)} className={`p-1 ${u.status === 'active' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`} title={u.status === 'active' ? 'Desativar' : 'Ativar'}>
                                                        {u.status === 'active' ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>}
                                                    </button>
                                                    <button onClick={() => handleDeleteUserClick(u)} className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50" title="Excluir" disabled={u.id === user.id}><span className="w-4 h-4 block">{icons.trash}</span></button>
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
                            <button onClick={handleBudgetSave} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Salvar Orçamento</button>
                        </div>
                    </div>
                );
            case 'log':
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
                  <button onClick={() => setActiveSubTab('users')} className={`${activeSubTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Usuários ({users.length})</button>
                  <button onClick={() => setActiveSubTab('budget')} className={`${activeSubTab === 'budget' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Orçamento</button>
                  <button onClick={() => setActiveSubTab('log')} className={`${activeSubTab === 'log' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Log de Atividades</button>
              </nav>
            </div>
            <div className="mt-4">
                {renderSubTabView()}
            </div>
            {isUserModalOpen && (
                <UserForm user={editingUser} onSave={handleSaveUser} onClose={handleCloseUserModal} />
            )}
            {userConfirmation.isOpen && (
                <ConfirmModal message={userConfirmation.message} onConfirm={() => userConfirmation.onConfirm(userConfirmation.data)} onClose={closeUserConfirmation} confirmText={userConfirmation.confirmText || "Sim"} />
            )}
        </div>
    );
}


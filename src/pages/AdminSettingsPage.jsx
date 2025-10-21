// src/pages/AdminSettingsPage.jsx
import React, { useState, useMemo } from 'react';

// --- Imports de Componentes ---
import UserForm from '../components/forms/UserForm';
import { ConfirmModal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import  AnnualBudgetChart  from '../components/common/AnnualBudgetChart'; 
// Importe os ícones necessários
import icons from '../utils/icons'; 

// --- Componente da Página ---
// Recebe props de App.jsx via commonPageProps
export default  function AdminSettingsPage({
    user, // Usuário admin logado
    users = [], setUsers, // Lista de todos os usuários e função para atualizar
    annualBudget, handleUpdateBudget, // Orçamento e função para atualizar
    activityLog = [], // Log de atividades
    addToast, addLog
}) {
    // --- Estados Internos ---
    const [activeSubTab, setActiveSubTab] = useState('users'); // Aba ativa: 'users', 'budget', 'log'
    // Estados para gerenciamento de usuários
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // Usuário sendo editado/criado
    const [userConfirmation, setUserConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });
    // Estado para o campo de orçamento
    const [newBudgetValue, setNewBudgetValue] = useState(String(annualBudget || '0')); // Começa com o valor atual

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

    // Salva/Atualiza Usuário (chamado pelo UserForm)
    const handleSaveUser = (userData) => {
        let message = '';
        // Remove espaços extras e converte email para minúsculo
        const cleanedUserData = {
            ...userData,
            name: userData.name.trim(),
            email: userData.email.trim().toLowerCase(),
        };

        // Verifica duplicidade de email (SIMPLES - Idealmente no backend)
        const emailExists = users.some(u => u.id !== cleanedUserData.id && u.email === cleanedUserData.email);
        if (emailExists) {
            addToast('Este e-mail já está em uso por outro usuário.', 'error');
            // Não fecha o modal
            return;
        }


        if(cleanedUserData.id) {
            // Atualizar
            setUsers(prevUsers => prevUsers.map(u => u.id === cleanedUserData.id ? { ...u, ...cleanedUserData } : u));
            message = 'Usuário atualizado com sucesso!';
            addLog?.(user?.name, `atualizou usuário ${cleanedUserData.name} (ID: ${cleanedUserData.id})`);
        } else {
            // Criar novo
            const newUser = {
                ...cleanedUserData,
                id: Date.now(), // ID Temporário
                status: 'active' // Status padrão para novos usuários criados pelo admin
            };
            setUsers(prevUsers => [...prevUsers, newUser]);
            message = 'Usuário criado com sucesso!';
             addLog?.(user?.name, `criou novo usuário: ${newUser.name}`);
        }
        addToast(message, 'success');
        handleCloseUserModal(); // Fecha o modal
    };

    // Abre confirmação para ativar/desativar usuário
    const handleToggleUserStatusClick = (userToToggle) => {
        const isActivating = userToToggle.status !== 'active';
        setUserConfirmation({
            isOpen: true,
            message: `Tem certeza que deseja ${isActivating ? 'ATIVAR' : 'DESATIVAR'} o usuário "${userToToggle.name}"?`,
            data: userToToggle.id,
            onConfirm: handleToggleUserStatusConfirm // Função a ser chamada
        });
    };

    // Ativa/Desativa Usuário (chamado pelo ConfirmModal)
    const handleToggleUserStatusConfirm = (userId) => {
        let toggledUser = null;
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === userId) {
                // Alterna entre 'active' e 'inactive'. Se for 'pending', ativa.
                const newStatus = (u.status === 'pending' || u.status === 'inactive') ? 'active' : 'inactive';
                toggledUser = { ...u, status: newStatus };
                return toggledUser;
            }
            return u;
        }));
        const actionText = toggledUser?.status === 'active' ? 'ativado' : 'desativado';
        addToast(`Usuário ${actionText} com sucesso!`, 'success');
        addLog?.(user?.name, `${actionText} usuário ${toggledUser?.name || ''} (ID: ${userId})`);
        // closeUserConfirmation(); // Modal já fecha
    };

     // Abre confirmação para EXCLUIR usuário
    const handleDeleteUserClick = (userToDelete) => {
        // Adicionar verificação se é o próprio usuário?
        if (userToDelete.id === user.id) {
            addToast('Você não pode excluir sua própria conta.', 'error');
            return;
        }
        setUserConfirmation({
            isOpen: true,
            message: `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${userToDelete.name}"? Esta ação não pode ser desfeita.`,
            data: userToDelete.id,
            onConfirm: handleDeleteUserConfirm,
            confirmText: "Excluir Permanentemente" // Botão vermelho?
        });
    };

     // EXCLUI Usuário (chamado pelo ConfirmModal)
    const handleDeleteUserConfirm = (userId) => {
        const userToDelete = users.find(u => u.id === userId);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        addToast(`Usuário excluído permanentemente.`, 'success');
        addLog?.(user?.name, `EXCLUIU PERMANENTEMENTE usuário ${userToDelete?.name || ''} (ID: ${userId})`);
    };

    // Salva o novo valor do orçamento (chamado pelo botão na aba Orçamento)
    const handleBudgetSave = () => {
        const value = parseFloat(newBudgetValue.replace(',', '.')); // Aceita vírgula ou ponto
        if (!isNaN(value) && value >= 0) {
            handleUpdateBudget(value); // Chama a função passada pelo App.jsx
        } else {
            addToast('Valor do orçamento inválido. Use apenas números (ex: 5000 ou 5000.00).', 'error');
            // Restaura o campo para o valor atual
            setNewBudgetValue(String(annualBudget));
        }
    };

    // Ordena logs por data mais recente para exibição
    const sortedActivityLog = useMemo(() =>
        [...activityLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [activityLog]
    );

    // --- Renderização das Sub-Abas ---
    const renderSubTabView = () => {
        switch (activeSubTab) {
            // ABA: GERENCIAR USUÁRIOS
            case 'users':
                return (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Gerenciar Usuários</h3>
                            <button
                                onClick={() => handleOpenUserModal()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
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
                                                    <button onClick={() => handleOpenUserModal(u)} className="p-1 text-blue-600 hover:text-blue-800" title="Editar Usuário">
                                                        <span className="w-4 h-4 block">{icons.edit}</span>
                                                    </button>
                                                    <button onClick={() => handleToggleUserStatusClick(u)} className={`p-1 ${u.status === 'active' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`} title={u.status === 'active' ? 'Desativar Usuário' : 'Ativar Usuário'}>
                                                        {/* Ícone diferente para ativar/desativar */}
                                                        {u.status === 'active' ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>}
                                                    </button>
                                                     {/* Botão Excluir (com cuidado) */}
                                                     <button onClick={() => handleDeleteUserClick(u)} className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed" title="Excluir Usuário Permanentemente" disabled={u.id === user.id /* Desabilita para o próprio usuário */}>
                                                        <span className="w-4 h-4 block">{icons.trash}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {users.length === 0 && <p className="text-center text-gray-500 py-6">Nenhum usuário encontrado.</p>}
                        </div>
                    </div>
                );

            // ABA: ORÇAMENTO
            case 'budget':
                return (
                    <div className="animate-fade-in max-w-lg mx-auto"> {/* Centraliza conteúdo */}
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Orçamento Anual</h3>
                        <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                             {/* Mostra o gráfico aqui também */}
                            <div className="mb-6 flex justify-center">
                                <AnnualBudgetChart totalSpent={0} budgetLimit={annualBudget} />
                                {/* TODO: Passar o gasto real (totalSpentForYear) para o gráfico */}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1" htmlFor="annual-budget-input">
                                    Definir Valor do Orçamento (R$)
                                </label>
                                <input
                                    id="annual-budget-input"
                                    type="text" // Usar text para permitir vírgula
                                    value={newBudgetValue}
                                    onChange={(e) => setNewBudgetValue(e.target.value)}
                                    className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ex: 5000.00 ou 5000,00"
                                />
                            </div>
                            <button
                                onClick={handleBudgetSave}
                                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                            >
                                Salvar Orçamento
                            </button>
                        </div>
                    </div>
                );

            // ABA: LOG DE ATIVIDADES
            case 'log':
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Log de Atividades do Sistema</h3>
                        <div className="overflow-y-auto max-h-[60vh] bg-gray-50 border rounded p-4">
                            {sortedActivityLog.length > 0 ? (
                                <ul className="space-y-3">
                                    {sortedActivityLog.map(log => (
                                        <li key={log.id} className="border-b pb-2 last:border-b-0">
                                            <p className="text-sm text-gray-800">
                                                <span className="font-semibold">{log.user || 'Sistema'}</span> {log.action}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(log.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-6">Nenhuma atividade registrada ainda.</p>
                            )}
                        </div>
                    </div>
                );
            default:
                return null; // Caso a aba seja desconhecida
        }
    };

    // --- Renderização Principal da Página ---
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 border-b pb-3">
                Configurações Gerais
            </h2>

            {/* Navegação por Abas */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6 md:space-x-8" aria-label="Tabs">
                  {/* Botão Aba Usuários */}
                  <button
                    onClick={() => setActiveSubTab('users')}
                    className={`${activeSubTab === 'users' ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                    aria-current={activeSubTab === 'users' ? 'page' : undefined}
                  >
                    Usuários ({users.length}) {/* Mostra contagem */}
                  </button>
                  {/* Botão Aba Orçamento */}
                  <button
                    onClick={() => setActiveSubTab('budget')}
                    className={`${activeSubTab === 'budget' ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                     aria-current={activeSubTab === 'budget' ? 'page' : undefined}
                 >
                    Orçamento
                  </button>
                  {/* Botão Aba Log */}
                  <button
                    onClick={() => setActiveSubTab('log')}
                    className={`${activeSubTab === 'log' ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                    aria-current={activeSubTab === 'log' ? 'page' : undefined}
                  >
                    Log de Atividades
                  </button>
              </nav>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="mt-4">
                {renderSubTabView()}
            </div>

             {/* --- Modais --- */}
             {/* Modal para Adicionar/Editar Usuário */}
            {isUserModalOpen && (
                <UserForm
                    user={editingUser}
                    onSave={handleSaveUser}
                    onClose={handleCloseUserModal}
                    // Passar função de checar duplicidade de email se implementada
                />
            )}
             {/* Modal de Confirmação para Usuários */}
            {userConfirmation.isOpen && (
                <ConfirmModal
                    message={userConfirmation.message}
                    onConfirm={() => userConfirmation.onConfirm(userConfirmation.data)}
                    onClose={closeUserConfirmation}
                    confirmText={userConfirmation.confirmText || "Sim"} // Usa texto customizado se houver
                />
            )}
        </div>
    );
}
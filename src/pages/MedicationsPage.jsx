// src/pages/MedicationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ClipLoader } from 'react-spinners';

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { icons } from '../utils/icons'; // Assumindo que icons.refresh, icons.chevronDown, etc existem. Se não, use ícones padrão.

// Hook customizado para atrasar a busca
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function MedicationsPage({ addToast, addLog, user }) {

    // --- Estados de Dados e Configuração ---
    const [medicationData, setMedicationData] = useState({ data: [], totalPages: 0, totalItems: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // CONFIGURAÇÃO: Itens por página
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // CONFIGURAÇÃO: Ordenação

    // --- Estados de UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, medication: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- Debounce ---
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    // --- Permissões ---
    const isAdmin = user?.role === 'admin';
    const isProfissional = user?.role === 'profissional' || user?.role === 'Profissional';
    const canCreateOrEdit = isAdmin || isProfissional;

    // --- Busca de Dados (API) ---
    const fetchMedications = useCallback(async () => {
        setIsLoading(true);
        try {
            // Nota: O backend precisa suportar 'limit', 'sortBy' e 'order' para isso funcionar plenamente.
            const response = await api.get('/medications', {
                params: {
                    page: currentPage,
                    limit: itemsPerPage, // Passando limite
                    search: debouncedSearchTerm,
                    sortBy: sortConfig.key, // Passando ordenação
                    order: sortConfig.direction
                }
            });
            setMedicationData(response.data);
        } catch (error) {
            console.error('Erro ao buscar medicações:', error);
            addToast('Falha ao carregar medicações.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, currentPage, itemsPerPage, debouncedSearchTerm, sortConfig]);

    // Carregamento inicial e quando dependências mudam
    useEffect(() => {
        fetchMedications();
    }, [fetchMedications]);

    // Resetar página ao buscar
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, itemsPerPage]);

    // --- Handlers UI ---
    const handleOpenModal = (medication = null) => {
        if (!medication && !canCreateOrEdit) {
            addToast('Sem permissão para criar.', 'error');
            return;
        }
        setEditingMedication(medication);
        setIsModalOpen(true);
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleRefresh = () => {
        fetchMedications();
        addToast('Lista atualizada.', 'info');
    };

    // --- CRUD Handlers ---
    const handleSaveMedication = async (medData) => {
        const cleanedName = medData.name.trim();
        try {
            const medId = medData._id || medData.id;
            if (medId) {
                await api.put(`/medications/${medId}`, { name: cleanedName });
                addToast('Medicação atualizada!', 'success');
                addLog?.(user?.name, `atualizou: ${cleanedName}`);
            } else {
                await api.post('/medications', { name: cleanedName });
                addToast('Medicação criada!', 'success');
                addLog?.(user?.name, `criou: ${cleanedName}`);
            }
            fetchMedications();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erro ao salvar.';
            addToast(msg, 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        const med = deleteConfirmation.medication;
        const medId = med._id || med.id;
        try {
            await api.delete(`/medications/${medId}`);
            addToast('Excluído com sucesso!', 'success');
            addLog?.(user?.name, `excluiu: ${med?.name}`);
            
            // Lógica inteligente de paginação após exclusão
            if (medicationData.data.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchMedications();
            }
        } catch (error) {
            addToast('Erro ao excluir.', 'error');
        }
        setDeleteConfirmation({ isOpen: false, medication: null });
    };

    // --- Renderização Auxiliar ---
    const formatDate = (isoDate) => {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' });
    };

    // Ícone de ordenação dinâmico
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="text-gray-300 ml-1">⇅</span>;
        return sortConfig.direction === 'asc' ? <span className="text-emerald-600 ml-1">↑</span> : <span className="text-emerald-600 ml-1">↓</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- Cabeçalho Moderno --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gerenciar Medicações</h2>
                    <p className="text-sm text-gray-500 mt-1">Visualize e configure o catálogo de medicamentos do sistema.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Botão de Refresh */}
                    <button 
                        onClick={handleRefresh}
                        className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-emerald-600 transition-colors shadow-sm"
                        title="Atualizar lista"
                    >
                        <span className="w-5 h-5 block">{icons.refresh || 'R'}</span>
                    </button>

                    {canCreateOrEdit && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 text-sm font-medium shadow-sm hover:shadow transition-all"
                        >
                            <span className="w-4 h-4">{icons.plus}</span> Novo
                        </button>
                    )}
                </div>
            </div>

            {/* --- Barra de Ferramentas (Busca e Configuração) --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Busca */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <span className="w-5 h-5">{icons.search}</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>

                {/* Configurações de Visualização */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <label className="text-xs font-medium text-gray-500">Exibir:</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 cursor-pointer outline-none"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* --- Tabela de Dados --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <ClipLoader color="#059669" size={40} />
                        <p className="text-gray-400 text-sm mt-4 animate-pulse">Sincronizando dados...</p>
                    </div>
                ) : medicationData.data.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-gray-400 text-2xl">{icons.pill || icons.alert}</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma medicação encontrada</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                            {searchTerm ? `Não encontramos resultados para "${searchTerm}".` : "O catálogo está vazio no momento."}
                        </p>
                        {!searchTerm && canCreateOrEdit && (
                            <button onClick={() => handleOpenModal()} className="mt-4 text-emerald-600 font-medium text-sm hover:underline">
                                Cadastrar primeira medicação
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                                        ID
                                    </th>
                                    <th 
                                        onClick={() => handleSort('name')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                    >
                                        <div className="flex items-center">
                                            Nome da Medicação
                                            <SortIcon columnKey="name" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('createdAt')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none w-48"
                                    >
                                        <div className="flex items-center">
                                            Cadastro
                                            <SortIcon columnKey="createdAt" />
                                        </div>
                                    </th>
                                    {canCreateOrEdit && (
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                            Ações
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {medicationData.data.map((med) => {
                                    const medId = med._id || med.id;
                                    return (
                                        <tr key={medId} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 font-mono">
                                                    #{String(medId).slice(-4)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{med.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(med.createdAt)}
                                            </td>
                                            {canCreateOrEdit && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenModal(med)}
                                                            className="text-emerald-600 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <span className="w-5 h-5 block">{icons.edit}</span>
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteConfirmation({ isOpen: true, medication: med });
                                                                }}
                                                                className="text-red-400 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <span className="w-5 h-5 block">{icons.trash}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* --- Paginação Estilizada --- */}
                {medicationData.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-sm text-gray-500 hidden md:block">
                            Mostrando página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{medicationData.totalPages}</span>
                        </p>
                        
                        <div className="flex gap-2 mx-auto md:mx-0">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(medicationData.totalPages, p + 1))}
                                disabled={currentPage === medicationData.totalPages || isLoading}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modais permanecem os mesmos */}
            {isModalOpen && (
                <MedicationForm
                    medication={editingMedication}
                    onSave={handleSaveMedication}
                    onClose={() => { setIsModalOpen(false); setEditingMedication(null); }}
                    addToast={addToast}
                />
            )}

            {deleteConfirmation.isOpen && (
                <DestructiveConfirmModal
                    message={
                        <span>
                            Tem certeza que deseja excluir <strong>{deleteConfirmation.medication?.name}</strong>?
                            <br/><span className="text-sm text-gray-500">Essa ação não pode ser desfeita.</span>
                        </span>
                    }
                    confirmText="Sim, excluir"
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setDeleteConfirmation({ isOpen: false, medication: null })}
                />
            )}
        </div>
    );
}
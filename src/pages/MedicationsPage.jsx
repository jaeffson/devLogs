// src/pages/MedicationsPage.jsx 
// (CORRIGIDO: Conexão Local e API Centralizada)

import React, { useState, useEffect, useCallback } from 'react'; 
// CORREÇÃO 1: Importamos a instância 'api' em vez do axios direto
import api from '../services/api'; 

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { icons } from '../utils/icons';

// CORREÇÃO 2: Removemos a constante API_BASE_URL. O api.js gerencia isso.

// Hook customizado simples para "atrasar" a busca
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function MedicationsPage({
    addToast,
    addLog,
    user
}) {
    
    // --- Estados de Paginação e Dados ---
    const [medicationData, setMedicationData] = useState({ data: [], totalPages: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    
    // --- Estados Internos ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, medication: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    // --- Debounce ---
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    // --- Helper de Permissão ---
    const isAdmin = user?.role === 'admin';
    const isProfissional = user?.role === 'profissional' || user?.role === 'Profissional';
    const canCreateOrEdit = isAdmin || isProfissional;

    // --- Lógica de Busca (API) ---
    const fetchMedications = useCallback(async () => {
        setIsLoading(true);
        try {
            // CORREÇÃO 3: Uso de api.get e caminho relativo
            const response = await api.get('/medications', {
                params: {
                    page: currentPage,
                    search: debouncedSearchTerm
                }
            });
            setMedicationData(response.data); 
        } catch (error) {
            console.error('Erro ao buscar medicações:', error);
            addToast('Falha ao carregar medicações do servidor.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, currentPage, debouncedSearchTerm]); 

    // Carregamento inicial
    useEffect(() => {
        fetchMedications();
    }, [fetchMedications]);
    
    // Reseta página na busca
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);
    
    // --- Funções UI ---
    const handleOpenModal = (medication = null) => {
        if (!medication && !canCreateOrEdit) {
            addToast('Você não tem permissão para criar novas medicações.', 'error');
            return;
        }
        setEditingMedication(medication);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMedication(null);
    };

    // --- Lógica de salvamento (API) ---
    const handleSaveMedication = async (medData) => {
        const cleanedName = medData.name.trim();

        try {
            const medId = medData._id || medData.id;
            
            if(medId) {
                // CORREÇÃO 4: api.put com caminho relativo
                await api.put(`/medications/${medId}`, { name: cleanedName });
                addToast('Medicação atualizada com sucesso!', 'success');
                addLog?.(user?.name, `atualizou medicação ${cleanedName} (ID: ${medId})`);
            } else {
                // CORREÇÃO 5: api.post com caminho relativo
                await api.post('/medications', { name: cleanedName });
                addToast('Medicação cadastrada com sucesso!', 'success');
                addLog?.(user?.name, `cadastrou nova medicação: ${cleanedName}`);
            }
            
            await fetchMedications(); 

        } catch (error) {
            console.error("Erro ao salvar medicação:", error);
            const msg = error.response?.data?.message || 'Erro ao salvar dados.';
            addToast(msg, 'error');
        }

        handleCloseModal();
    };

    // --- Lógica de exclusão (API) ---
    const handleDeleteClick = (medication) => {
        if (!isAdmin) {
            addToast('Apenas administradores podem excluir medicações.', 'error');
            return;
        }
        setDeleteConfirmation({
            isOpen: true,
            medication: medication
        });
    };

    const handleDeleteConfirm = async () => {
        const med = deleteConfirmation.medication;
        const medId = med._id || med.id;
        
        try {
            // CORREÇÃO 6: api.delete com caminho relativo
            await api.delete(`/medications/${medId}`);
            addToast('Medicação excluída com sucesso!', 'success');
            addLog?.(user?.name, `excluiu medicação ${med?.name || ''} (ID: ${medId})`);
            
            if (medicationData.data.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await fetchMedications();
            }
        } catch (error) {
            console.error("Erro ao excluir medicação:", error);
            const msg = error.response?.data?.message || 'Falha ao excluir medicação. Tente novamente.';
            addToast(msg, 'error');
        }
        
        setDeleteConfirmation({ isOpen: false, medication: null });
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return '---';
        try {
            return new Date(isoDate).toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }
    
    // Variáveis auxiliares
    const hasMedications = medicationData.data.length > 0;
    const isSearchActive = debouncedSearchTerm.length > 0;

    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-0">
                    Gerenciar Medicações
                </h2>
                
                {canCreateOrEdit && (
                  <button
                      onClick={() => handleOpenModal()}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium w-full md:w-auto transition-all duration-150 ease-in-out cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isLoading}
                  >
                      <span className="w-4 h-4">{icons.plus}</span> Nova Medicação
                  </button>
                )}
            </div>

            {/* Campo de Busca */}
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar medicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-lg pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    aria-label="Buscar medicação"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="w-5 h-5">{icons.search}</span>
                </div>
            </div>

            {/* Lista e Estados */}
            {isLoading ? (
                 <p className="text-center text-gray-500 py-10 text-base">Carregando medicações...</p>
            ) : !hasMedications && isSearchActive ? (
                 <p className="text-center text-gray-500 py-10 text-base">
                    Nenhuma medicação encontrada para "<strong>{debouncedSearchTerm}</strong>".
                </p>
            ) : !hasMedications && !isSearchActive ? (
                <div className="text-center text-gray-500 py-16 px-6">
                    <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">{icons.pill || icons.alert}</div> 
                    <h3 className="font-semibold text-lg text-gray-700 mb-1">Nenhuma Medicação Cadastrada</h3>
                    <p className="text-sm mb-4">Comece cadastrando a primeira medicação no sistema.</p>
                    
                    {canCreateOrEdit && (
                      <button 
                          onClick={() => handleOpenModal()} 
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium mx-auto cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-150 ease-in-out"
                      >
                          <span className="w-4 h-4">{icons.plus}</span> Cadastrar Medicação
                      </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full bg-white text-sm table-auto">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="w-24 text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th> 
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Medicação</th>
                                    <th className="w-36 text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Data Cadastro</th>
                                    
                                    {canCreateOrEdit && (
                                      <th className="w-28 text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                    )}
                                </tr>
                            </thead>
                            
                            <tbody className="divide-y divide-gray-200">
                                {medicationData.data.map(med => {
                                    const medId = med._id || med.id;
                                    return (
                                    <tr key={medId} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="py-3 px-4 text-gray-500 text-xs font-mono whitespace-nowrap">{String(medId).slice(-4)}</td>
                                        <td className="py-3 px-4 font-medium text-gray-800 break-words">{med.name}</td>
                                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(med.createdAt)}</td> 
                                        
                                        {canCreateOrEdit && (
                                          <td className="py-2.5 px-4 whitespace-nowrap">
                                              <div className="flex items-center gap-2">
                                                  
                                                  <button
                                                      onClick={() => handleOpenModal(med)}
                                                      className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors duration-150 cursor-pointer"
                                                      title="Editar Medicação"
                                                  >
                                                      <span className="w-5 h-5 block">{icons.edit}</span>
                                                  </button>
                                                  
                                                  {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteClick(med)}
                                                        className="p-1.5 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                                                        title="Excluir Medicação"
                                                    >
                                                        <span className="w-5 h-5 block">{icons.trash}</span>
                                                    </button>
                                                  )}
                                              </div>
                                          </td>
                                        )}
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    {medicationData.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 text-sm">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Anterior
                            </button>
                            
                            <span className="text-gray-600 font-medium">
                                Página {currentPage} de {medicationData.totalPages}
                            </span>
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, medicationData.totalPages))}
                                disabled={currentPage === medicationData.totalPages || isLoading}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <MedicationForm
                    medication={editingMedication} 
                    onSave={handleSaveMedication}
                    onClose={handleCloseModal}
                    addToast={addToast}
                />
            )}
            
            {deleteConfirmation.isOpen && (
                <DestructiveConfirmModal
                    message={`Excluir permanentemente a medicação "${deleteConfirmation.medication.name}"? Esta ação não pode ser desfeita.`}
                    confirmText="EXCLUIR"
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setDeleteConfirmation({ isOpen: false, medication: null })}
                />
            )}
        </div>
    );
}
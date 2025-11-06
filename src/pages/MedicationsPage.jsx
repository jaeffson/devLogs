// src/pages/MedicationsPage.jsx 
// (ATUALIZADO: Com Paginação e Busca no Servidor)

import React, { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { icons } from '../utils/icons';

// URL base da API
const API_BASE_URL = 'https://backendmedlog-4.onrender.com/api'; 

// --- (MUDANÇA) ---
// Hook customizado simples para "atrasar" a busca (evita uma chamada API a cada tecla)
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
// --- (FIM DA MUDANÇA) ---

export default function MedicationsPage({
    // --- (MUDANÇA) ---
    // Removemos 'medications' e 'setMedications' das props,
    // pois este componente agora gerencia seu próprio estado de dados.
    // medications = [], (REMOVIDO)
    // setMedications, (REMOVIDO)
    // --- (FIM DA MUDANÇA) ---
    addToast,
    addLog,
    user
}) {
    
    // --- (MUDANÇA) ---
    // Novos estados para paginação e dados
    const [medicationData, setMedicationData] = useState({ data: [], totalPages: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    // --- (FIM DA MUDANÇA) ---

    // --- Estados Internos (maioria mantida) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, medication: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    // --- (MUDANÇA) ---
    // Usa o hook de debounce para o termo de busca
    const debouncedSearchTerm = useDebounce(searchTerm, 400); // 400ms de atraso
    // --- (FIM DA MUDANÇA) ---


    // --- Helper de Permissão ---
    const isAdmin = user?.role === 'admin';
    const isProfissional = user?.role === 'profissional' || user?.role === 'Profissional';
    const canCreateOrEdit = isAdmin || isProfissional;


    // --- (MUDANÇA) ---
    // Função de busca agora aceita página e busca
    const fetchMedications = useCallback(async () => {
        setIsLoading(true);
        try {
            // Envia os parâmetros de página e busca para a API
            const response = await axios.get(`${API_BASE_URL}/medications`, {
                params: {
                    page: currentPage,
                    search: debouncedSearchTerm
                }
            });
            // Armazena o objeto de resposta completo (data, totalPages, etc)
            setMedicationData(response.data); 
        } catch (error) {
            console.error('Erro ao buscar medicações:', error);
            addToast('Falha ao carregar medicações do servidor.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, currentPage, debouncedSearchTerm]); // Depende da página e da busca

    // Carregamento inicial e ao mudar de página ou busca
    useEffect(() => {
        fetchMedications();
    }, [fetchMedications]); // fetchMedications já inclui as dependências
    
    // Reseta para a página 1 quando o usuário digita uma nova busca
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);
    // --- (FIM DA MUDANÇA) ---
    

    // --- Funções UI (SEM MUDANÇAS) ---
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
        // A lógica de verificação de duplicata é melhor no backend,
        // mas podemos manter uma verificação simples no frontend.
        const cleanedName = medData.name.trim();

        try {
            let response;
            const medId = medData._id || medData.id;
            
            if(medId) {
                response = await axios.put(`${API_BASE_URL}/medications/${medId}`, { name: cleanedName });
                addToast('Medicação atualizada com sucesso!', 'success');
                addLog?.(user?.name, `atualizou medicação ${cleanedName} (ID: ${medId})`);
            } else {
                response = await axios.post(`${API_BASE_URL}/medications`, { name: cleanedName });
                addToast('Medicação cadastrada com sucesso!', 'success');
                addLog?.(user?.name, `cadastrou nova medicação: ${cleanedName}`);
            }
            
            // --- (MUDANÇA) ---
            // Apenas chama fetchMedications. Ele vai recarregar a página ATUAL.
            await fetchMedications(); 
            // --- (FIM DA MUDANÇA) ---

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
            await axios.delete(`${API_BASE_URL}/medications/${medId}`);
            addToast('Medicação excluída com sucesso!', 'success');
            addLog?.(user?.name, `excluiu medicação ${med?.name || ''} (ID: ${medId})`);
            // --- (MUDANÇA) ---
            // Recarrega a página atual.
            // Se for o último item da página, idealmente voltaria para a pág anterior.
            // Mas por simplicidade, apenas recarregamos.
            if (medicationData.data.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await fetchMedications();
            }
            // --- (FIM DA MUDANÇA) ---
        } catch (error) {
            console.error("Erro ao excluir medicação:", error);
            const msg = error.response?.data?.message || 'Falha ao excluir medicação. Tente novamente.';
            addToast(msg, 'error');
        }
        
        setDeleteConfirmation({ isOpen: false, medication: null }); // Fecha o modal
    };

    // --- (SEM MUDANÇAS) ---
    const formatDate = (isoDate) => {
        if (!isoDate) return '---';
        try {
            return new Date(isoDate).toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }
    // --- (FIM SEM MUDANÇAS) ---

    // --- (MUDANÇA) ---
    // O useMemo 'filteredMedications' FOI REMOVIDO.
    // Nós vamos mapear 'medicationData.data' diretamente.
    // --- (FIM DA MUDANÇA) ---
    
    // --- (MUDANÇA) ---
    // Variáveis auxiliares para os estados
    const hasMedications = medicationData.data.length > 0;
    const isSearchActive = debouncedSearchTerm.length > 0;
    // --- (FIM DA MUDANÇA) ---

    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
            {/* Header da Página (Sem mudanças) */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b pb-3">
                 <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                    Gerenciar Medicações
                </h2>
                {canCreateOrEdit && (
                  <button
                      onClick={() => handleOpenModal()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium w-full md:w-auto transition-colors cursor-pointer"
                      disabled={isLoading}
                  >
                      <span className="w-4 h-4">{icons.plus}</span> Nova Medicação
                  </button>
                )}
            </div>

            {/* Campo de Busca (Sem mudanças no HTML, mas a lógica mudou) */}
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar medicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-lg pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    aria-label="Buscar medicação"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="w-5 h-5">{icons.search}</span>
                </div>
            </div>

            {/* --- (MUDANÇA) --- */}
            {/* Lógica de Carregamento e Estado Vazio Atualizada */}
            {isLoading ? (
                 <p className="text-center text-gray-500 py-8 text-base">Carregando medicações...</p>
            ) : !hasMedications && isSearchActive ? (
                 <p className="text-center text-gray-500 py-8 text-base">
                    Nenhuma medicação encontrada para "<strong>{debouncedSearchTerm}</strong>".
                </p>
            ) : !hasMedications && !isSearchActive ? (
                // Tela Vazia (Nenhuma medicação cadastrada)
                <div className="text-center text-gray-500 py-16 px-6">
                    <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">{icons.pill || icons.alert}</div> 
                    <h3 className="font-semibold text-lg text-gray-700 mb-1">Nenhuma Medicação Cadastrada</h3>
                    <p className="text-sm mb-4">Comece cadastrando a primeira medicação no sistema.</p>
                    {canCreateOrEdit && (
                      <button 
                          onClick={() => handleOpenModal()} 
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium mx-auto cursor-pointer transition-colors"
                      >
                          <span className="w-4 h-4">{icons.plus}</span> Cadastrar Medicação
                      </button>
                    )}
                </div>
            ) : (
                // Tabela de resultados
                <> {/* Fragment adicionado para agrupar Tabela e Paginação */}
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
                        <table className="min-w-full bg-white text-sm table-auto">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="w-24 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">ID</th> 
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Nome da Medicação</th>
                                    <th className="w-36 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Data Cadastro</th>
                                    {canCreateOrEdit && (
                                      <th className="w-28 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {/* Mapeia 'medicationData.data' ao invés de 'filteredMedications' */}
                                {medicationData.data.map(med => {
                                    const medId = med._id || med.id;
                                    return (
                                    <tr key={medId} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="py-3 px-4 text-gray-500 text-xs font-mono whitespace-nowrap">{String(medId).slice(-4)}</td>
                                        <td className="py-3 px-4 font-medium text-gray-800 break-words">{med.name}</td>
                                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(med.createdAt)}</td> 
                                        {canCreateOrEdit && (
                                          <td className="py-3 px-4 whitespace-nowrap">
                                              <div className="flex items-center gap-4">
                                                  <button
                                                      onClick={() => handleOpenModal(med)}
                                                      className="p-1 text-emerald-600 hover:text-emerald-800 transition-colors duration-150 cursor-pointer"
                                                      title="Editar Medicação"
                                                  >
                                                      <span className="w-5 h-5 block">{icons.edit}</span>
                                                  </button>
                                                  {isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteClick(med)}
                                                        className="p-1 text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer"
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

                    {/* --- (NOVO) --- */}
                    {/* Controles de Paginação */}
                    {medicationData.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 text-sm">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="px-3 py-1 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            
                            <span className="text-gray-600">
                                Página {currentPage} de {medicationData.totalPages}
                            </span>
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, medicationData.totalPages))}
                                disabled={currentPage === medicationData.totalPages || isLoading}
                                className="px-3 py-1 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                    {/* --- (FIM NOVO) --- */}
                </>
            )}
            {/* --- (FIM DA MUDANÇA) --- */}


            {/* Modais (Sem mudanças) */}
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
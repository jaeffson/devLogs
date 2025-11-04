// src/pages/MedicationsPage.jsx 
// (ATUALIZADO: Paleta de cores 'blue' trocada para 'emerald')

import React, { useState, useMemo, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { icons } from '../utils/icons';

// URL base da API (deve ser a mesma definida no App.jsx)
const API_BASE_URL = 'https://backendmedlog-4.onrender.com'; 

export default function MedicationsPage({
    medications = [],
    setMedications, // Função de refetch global (API)
    addToast,
    addLog,
    user // <-- Prop 'user' é usada para as permissões
}) {
    // --- Estados Internos ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, medication: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    // --- Helper de Permissão ---
    const isAdmin = user?.role === 'admin';
    const isProfessional = user?.role === 'professional' || user?.role === 'Profissional';
    const canCreateOrEdit = isAdmin || isProfessional;


    // Função de busca
    const fetchMedications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/medications`);
            setMedications(response.data); 
        } catch (error) {
            console.error('Erro ao buscar medicações:', error);
            addToast('Falha ao carregar medicações do servidor.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setMedications, addToast]); 

    // Carregamento inicial
    useEffect(() => {
        fetchMedications();
    }, [fetchMedications]);
    
    useEffect(() => {
        if (medications.length === 0 && !isLoading) {
            fetchMedications();
        }
    }, [medications.length, fetchMedications, isLoading]);
    

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
        
        const isDuplicate = medications.some(
            m => (m._id || m.id) !== (medData._id || medData.id) && m.name.toLowerCase() === cleanedName.toLowerCase()
        );

        if (isDuplicate) {
            addToast('Uma medicação com este nome já existe.', 'error');
            return; 
        }

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
            await axios.delete(`${API_BASE_URL}/medications/${medId}`);
            addToast('Medicação excluída com sucesso!', 'success');
            addLog?.(user?.name, `excluiu medicação ${med?.name || ''} (ID: ${medId})`);
            await fetchMedications();
        } catch (error) {
            console.error("Erro ao excluir medicação:", error);
            addToast('Falha ao excluir medicação. Tente novamente.', 'error');
        }
        
        setDeleteConfirmation({ isOpen: false, medication: null }); // Fecha o modal
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return '---';
        try {
            return new Date(isoDate).toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }

    // --- Filtragem da Lista ---
    const filteredMedications = useMemo(() => {
        if (!searchTerm) {
            return [...medications].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return medications
            .filter(med => (med.name || '').toLowerCase().includes(lowerCaseSearchTerm))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [medications, searchTerm]);
    
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                    Gerenciar Medicações
                </h2>
                
                {/* Botão "Nova Medicação" (Atualizado para Emerald) */}
                {canCreateOrEdit && (
                  // --- (INÍCIO DA MUDANÇA) ---
                  <button
                      onClick={() => handleOpenModal()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium w-full md:w-auto transition-colors cursor-pointer" // Trocado de 'blue' para 'emerald'
                      disabled={isLoading}
                  >
                  {/* --- (FIM DA MUDANÇA) --- */}
                      <span className="w-4 h-4">{icons.plus}</span> Nova Medicação
                  </button>
                )}
                
            </div>

            {/* Campo de Busca (Atualizado para Emerald) */}
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar medicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    // --- (INÍCIO DA MUDANÇA) ---
                    className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-lg pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" // Trocado de 'blue' para 'emerald'
                    // --- (FIM DA MUDANÇA) ---
                    aria-label="Buscar medicação"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="w-5 h-5">{icons.search}</span>
                </div>
            </div>

            {isLoading ? (
                 <p className="text-center text-gray-500 py-8 text-base">Carregando medicações...</p>
            ) : filteredMedications.length === 0 && medications.length > 0 ? (
                 <p className="text-center text-gray-500 py-8 text-base">
                    Nenhuma medicação encontrada para "<strong>{searchTerm}</strong>".
                </p>
            ) : medications.length === 0 ? (
                // Tela Vazia (Nenhuma medicação cadastrada)
                <div className="text-center text-gray-500 py-16 px-6">
                    <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">{icons.pill || icons.alert}</div> 
                    <h3 className="font-semibold text-lg text-gray-700 mb-1">Nenhuma Medicação Cadastrada</h3>
                    <p className="text-sm mb-4">Comece cadastrando a primeira medicação no sistema.</p>
                    
                    {/* Botão "Cadastrar Medicação" (Atualizado para Emerald) */}
                    {canCreateOrEdit && (
                      // --- (INÍCIO DA MUDANÇA) ---
                      <button 
                          onClick={() => handleOpenModal()} 
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium mx-auto cursor-pointer transition-colors" // Trocado de 'blue' para 'emerald'
                      >
                      {/* --- (FIM DA MUDANÇA) --- */}
                          <span className="w-4 h-4">{icons.plus}</span> Cadastrar Medicação
                      </button>
                    )}
                </div>
            ) : (
                // Tabela de resultados
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
                            {filteredMedications.map(med => {
                                const medId = med._id || med.id;
                                return (
                                <tr key={medId} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="py-3 px-4 text-gray-500 text-xs font-mono whitespace-nowrap">{String(medId).slice(-4)}</td>
                                    <td className="py-3 px-4 font-medium text-gray-800 break-words">{med.name}</td>
                                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(med.createdAt)}</td> 
                                    
                                    {/* Célula de Ações (Atualizado para Emerald) */}
                                    {canCreateOrEdit && (
                                      <td className="py-3 px-4 whitespace-nowrap">
                                          <div className="flex items-center gap-4">
                                              
                                              <button
                                                  onClick={() => handleOpenModal(med)}
                                                  // --- (INÍCIO DA MUDANÇA) ---
                                                  className="p-1 text-emerald-600 hover:text-emerald-800 transition-colors duration-150 cursor-pointer" // Trocado de 'blue' para 'emerald'
                                                  // --- (FIM DA MUDANÇA) ---
                                                  title="Editar Medicação"
                                              >
                                                  <span className="w-5 h-5 block">{icons.edit}</span>
                                              </button>
                                              
                                              {/* Botão Excluir (Mantido 'red') */}
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
            )}


            {/* Modais */}
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
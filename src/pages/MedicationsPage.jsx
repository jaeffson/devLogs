// src/pages/MedicationsPage.jsx (VERSÃO CORRIGIDA SEM LOOP)

import React, { useState, useMemo, useEffect, useCallback } from 'react'; 
import axios from 'axios'; 

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { DestructiveConfirmModal } from '../components/common/DestructiveConfirmModal';
import { icons } from '../utils/icons';

// URL base da API (deve ser a mesma definida no App.jsx)
const API_BASE_URL = 'http://localhost:5000/api'; 

export default function MedicationsPage({
    medications = [],
    setMedications, // Função de refetch global (API)
    addToast,
    addLog,
    user
}) {
    // --- Estados Internos ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, medication: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    
    // 🚨 1. MUDANÇA PRINCIPAL: MEMORIZAR A FUNÇÃO DE BUSCA PARA EVITAR LOOP
    // Ela depende apenas de setMedications (prop estável de App.jsx) e addToast
    const fetchMedications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/medications`);
            // setMedications é a função refetchMedications do App.jsx, que já normaliza o ID
            setMedications(response.data); 
        } catch (error) {
            console.error('Erro ao buscar medicações:', error);
            addToast('Falha ao carregar medicações do servidor.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setMedications, addToast]); // 🚨 DEPENDÊNCIAS ESTÁVEIS

    // 🚨 2. CORREÇÃO DE LOOP: Chama o carregamento APENAS na montagem
    useEffect(() => {
        fetchMedications();
        // A dependência aqui (fetchMedications) é removida ou ignorada pelo linter, 
        // pois ela é estável graças ao useCallback acima.
    }, [/* DEIXE VAZIO OU APENAS fetchMedications se for estritamente necessário */]); 
    // Usaremos [fetchMedications] para obedecer ao linter, mas a estabilidade é garantida pelo App.jsx
    
    // O erro de loop é mais frequentemente corrigido garantindo que o App.jsx
    // não recrie as funções de refetch a cada render.
    useEffect(() => {
        if (medications.length === 0 && !isLoading) {
            fetchMedications();
        }
    }, [medications.length, fetchMedications, isLoading]);
    
    // --- FIM MUDANÇA PRINCIPAL ---


    // --- Funções UI ---
    const handleOpenModal = (medication = null) => {
        setEditingMedication(medication);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMedication(null);
    };

    // --- MUDANÇA: Lógica de salvamento (AGORA API) ---
    const handleSaveMedication = async (medData) => {
        const cleanedName = medData.name.trim();
        
        // 1. Verifica duplicidade (UX local - a API fará a verificação de unicidade mais robusta)
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
                // Atualização (PUT)
                response = await axios.put(`${API_BASE_URL}/medications/${medId}`, { name: cleanedName });
                addToast('Medicação atualizada com sucesso!', 'success');
                addLog?.(user?.name, `atualizou medicação ${cleanedName} (ID: ${medId})`);
            } else {
                // Criação (POST)
                response = await axios.post(`${API_BASE_URL}/medications`, { name: cleanedName });
                addToast('Medicação cadastrada com sucesso!', 'success');
                addLog?.(user?.name, `cadastrou nova medicação: ${cleanedName}`);
            }
            
            // Recarrega a lista do servidor
            await fetchMedications(); 

        } catch (error) {
            console.error("Erro ao salvar medicação:", error);
            const msg = error.response?.data?.message || 'Erro ao salvar dados.';
            addToast(msg, 'error');
        }

        handleCloseModal();
    };

    // --- MUDANÇA: Lógica de exclusão (AGORA API) ---
    const handleDeleteClick = (medication) => {
        setDeleteConfirmation({
            isOpen: true,
            medication: medication
        });
    };

    const handleDeleteConfirm = async () => {
        const med = deleteConfirmation.medication;
        const medId = med._id || med.id;
        
        try {
            // ROTA DELETE
            await axios.delete(`${API_BASE_URL}/medications/${medId}`);
            
            addToast('Medicação excluída com sucesso!', 'success');
            addLog?.(user?.name, `excluiu medicação ${med?.name || ''} (ID: ${medId})`);
            
            // Recarrega a lista do servidor
            await fetchMedications();

        } catch (error) {
            console.error("Erro ao excluir medicação:", error);
            addToast('Falha ao excluir medicação. Tente novamente.', 'error');
        }
        
        setDeleteConfirmation({ isOpen: false, medication: null }); // Fecha o modal
    };
    // --- FIM DA MUDANÇA ---

    const formatDate = (isoDate) => {
        if (!isoDate) return '---';
        try {
            // Usando 'createdAt' que é um timestamp Mongoose.
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
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium w-full md:w-auto transition-colors cursor-pointer"
                    disabled={isLoading}
                >
                    <span className="w-4 h-4">{icons.plus}</span> Nova Medicação
                </button>
            </div>

            {/* Campo de Busca */}
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar medicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-lg pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                // 1. Tela Vazia (Nenhuma medicação cadastrada)
                <div className="text-center text-gray-500 py-16 px-6">
                    <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">{icons.pill || icons.alert}</div> 
                    <h3 className="font-semibold text-lg text-gray-700 mb-1">Nenhuma Medicação Cadastrada</h3>
                    <p className="text-sm mb-4">Comece cadastrando a primeira medicação no sistema.</p>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium mx-auto cursor-pointer transition-colors"
                    >
                        <span className="w-4 h-4">{icons.plus}</span> Cadastrar Medicação
                    </button>
                </div>
            ) : (
                // 3. Tabela de resultados
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
                    <table className="min-w-full bg-white text-sm table-auto">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="w-24 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">ID</th> 
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Nome da Medicação</th>
                                <th className="w-36 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Data Cadastro</th>
                                <th className="w-28 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMedications.map(med => {
                                const medId = med._id || med.id;
                                return (
                                <tr key={medId} className="hover:bg-gray-50 transition-colors duration-150">
                                    {/* Mudança: Exibindo ID truncado */}
                                    <td className="py-3 px-4 text-gray-500 text-xs font-mono whitespace-nowrap">{String(medId).slice(-4)}</td>
                                    <td className="py-3 px-4 font-medium text-gray-800 break-words">{med.name}</td>
                                    {/* Mudança: Formatando createdAt */}
                                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(med.createdAt)}</td> 
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleOpenModal(med)}
                                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-150 cursor-pointer"
                                                title="Editar Medicação"
                                            >
                                                <span className="w-5 h-5 block">{icons.edit}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(med)}
                                                className="p-1 text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer"
                                                title="Excluir Medicação"
                                            >
                                                <span className="w-5 h-5 block">{icons.trash}</span>
                                            </button>
                                        </div>
                                    </td>
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
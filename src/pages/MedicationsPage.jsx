// src/pages/MedicationsPage.jsx
import React, { useState } from 'react';

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { ConfirmModal } from '../components/common/Modal'; // Para confirmação de exclusão
// Importe os ícones necessários
import icons from '../utils/icons'; // Ajuste o caminho se necessário

// --- Componente da Página ---
// Recebe props de App.jsx via commonPageProps
export function MedicationsPage({
    medications = [], // Lista de medicações
    setMedications, // Função para atualizar a lista
    addToast, // Para notificações
    addLog, // Para registrar atividade (opcional)
    user // Para registrar quem fez a ação (opcional)
}) {
    // --- Estados Internos ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null); // Medicação sendo editada (ou null para nova)
    const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null }); // Para modal de confirmação

    // --- Funções ---
    const closeConfirmation = () => setConfirmation({ isOpen: false, message: '', data: null, onConfirm: null });

    const handleOpenModal = (medication = null) => {
        setEditingMedication(medication); // Define null para nova, ou o objeto para editar
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMedication(null); // Limpa ao fechar
    };

    // Salva/Atualiza Medicação (chamado pelo MedicationForm via prop onSave)
    const handleSaveMedication = (medData) => {
        let message = '';
        if(medData.id) {
            // Atualizar existente
            setMedications(prevMeds => prevMeds.map(m => m.id === medData.id ? { ...m, ...medData } : m)
                                              .sort((a,b) => a.name.localeCompare(b.name))); // Re-ordena
            message = 'Medicação atualizada com sucesso!';
            addLog?.(user?.name, `atualizou medicação ${medData.name} (ID: ${medData.id})`);
        } else {
            // Adicionar nova
            const newMed = {
                id: Date.now(), // ID temporário
                name: medData.name,
                createdAt: new Date().toISOString().slice(0, 10)
            };
            setMedications(prevMeds => [...prevMeds, newMed].sort((a,b) => a.name.localeCompare(b.name))); // Adiciona e ordena
            message = 'Medicação cadastrada com sucesso!';
             addLog?.(user?.name, `cadastrou nova medicação: ${newMed.name}`);
        }
        addToast(message, 'success');
        // handleCloseModal(); // MedicationForm já chama onClose, que chama esta função indiretamente
    };

    // Abre confirmação para excluir
    const handleDeleteClick = (medication) => {
        setConfirmation({
            isOpen: true,
            message: `Tem certeza que deseja excluir a medicação "${medication.name}"?`,
            data: medication.id, // Guarda o ID para a confirmação
            onConfirm: handleDeleteConfirm // Função a ser chamada ao confirmar
        });
    };

    // Exclui Medicação (chamado pelo ConfirmModal via prop onConfirm)
    const handleDeleteConfirm = (medId) => {
         const medToDelete = medications.find(m => m.id === medId);
        setMedications(prevMeds => prevMeds.filter(m => m.id !== medId));
        addToast('Medicação excluída com sucesso!', 'success');
         addLog?.(user?.name, `excluiu medicação ${medToDelete?.name || ''} (ID: ${medId})`);
        // closeConfirmation(); // ConfirmModal já chama onClose
    };

    // Formata data (pode vir de utils/helpers)
    const formatDate = (isoDate) => {
        if (!isoDate) return '---';
        try {
            return new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }

    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                    Gerenciar Medicações
                </h2>
                <button
                    onClick={() => handleOpenModal()} // Abre modal para nova medicação
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium w-full md:w-auto"
                >
                    <span className="w-4 h-4">{icons.plus}</span> Nova Medicação
                </button>
            </div>

            {/* Tabela de Medicações */}
            <div className="overflow-x-auto">
                {medications.length > 0 ? (
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600">Nome da Medicação</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600">Data de Cadastro</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Ordena medicações por nome para exibição */}
                            {[...medications].sort((a,b) => a.name.localeCompare(b.name)).map(med => (
                                <tr key={med.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium text-gray-800">{med.name}</td>
                                    <td className="py-2 px-3 text-gray-600">{formatDate(med.createdAt)}</td>
                                    <td className="py-2 px-3">
                                        <div className="flex items-center gap-3"> {/* Aumenta o gap */}
                                            <button
                                                onClick={() => handleOpenModal(med)} // Abre modal para editar
                                                className="p-1 text-blue-600 hover:text-blue-800"
                                                title="Editar Medicação"
                                            >
                                                <span className="w-4 h-4 block">{icons.edit}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(med)} // Abre confirmação
                                                className="p-1 text-red-600 hover:text-red-800"
                                                title="Excluir Medicação"
                                            >
                                                <span className="w-4 h-4 block">{icons.trash}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 py-6">Nenhuma medicação cadastrada.</p>
                )}
            </div>

            {/* --- Modais --- */}
            {/* Modal para Adicionar/Editar Medicação */}
            {isModalOpen && (
                <MedicationForm
                    medication={editingMedication}
                    onSave={handleSaveMedication}
                    onClose={handleCloseModal}
                    // Passar função de checar duplicidade se implementada
                />
            )}

            {/* Modal de Confirmação para Excluir */}
            {confirmation.isOpen && (
                <ConfirmModal
                    message={confirmation.message}
                    onConfirm={() => confirmation.onConfirm(confirmation.data)} // Passa o ID guardado
                    onClose={closeConfirmation}
                    confirmText="Excluir" // Texto do botão de confirmação
                />
            )}
        </div>
    );
}
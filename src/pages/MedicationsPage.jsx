// src/pages/MedicationsPage.jsx
import React, { useState, useMemo } from 'react';

// --- Imports de Componentes ---
import MedicationForm from '../components/forms/MedicationForm';
import { ConfirmModal } from '../components/common/Modal';
import { icons } from '../utils/icons';

export default function MedicationsPage({
    medications = [],
    setMedications,
    addToast,
    addLog,
    user
}) {
    // --- Estados Internos ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });
    const [searchTerm, setSearchTerm] = useState('');

    // --- Funções ---
    const closeConfirmation = () => setConfirmation({ isOpen: false, message: '', data: null, onConfirm: null });

    const handleOpenModal = (medication = null) => {
        setEditingMedication(medication);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMedication(null);
    };

    const handleSaveMedication = (medData) => {
        let message = '';
        if(medData.id) {
            setMedications(prevMeds => prevMeds.map(m => m.id === medData.id ? { ...m, ...medData } : m)
                                              .sort((a,b) => a.name.localeCompare(b.name)));
            message = 'Medicação atualizada com sucesso!';
            addLog?.(user?.name, `atualizou medicação ${medData.name} (ID: ${medData.id})`);
        } else {
            const newMed = {
                id: Date.now(), // Usando timestamp como ID temporário
                name: medData.name,
                createdAt: new Date().toISOString().slice(0, 10)
            };
            setMedications(prevMeds => [...prevMeds, newMed].sort((a,b) => a.name.localeCompare(b.name)));
            message = 'Medicação cadastrada com sucesso!';
            addLog?.(user?.name, `cadastrou nova medicação: ${newMed.name}`);
        }
        addToast(message, 'success');
    };

    const handleDeleteClick = (medication) => {
        setConfirmation({
            isOpen: true,
            message: `Tem certeza que deseja excluir a medicação "${medication.name}"?`,
            data: medication.id,
            onConfirm: handleDeleteConfirm
        });
    };

    const handleDeleteConfirm = (medId) => {
        const medToDelete = medications.find(m => m.id === medId);
        setMedications(prevMeds => prevMeds.filter(m => m.id !== medId));
        addToast('Medicação excluída com sucesso!', 'success');
        addLog?.(user?.name, `excluiu medicação ${medToDelete?.name || ''} (ID: ${medId})`);
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return '---';
        try {
            return new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }

    // --- Filtragem da Lista ---
    const filteredMedications = useMemo(() => {
        if (!searchTerm) {
            return [...medications].sort((a, b) => a.name.localeCompare(b.name));
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return medications
            .filter(med => med.name.toLowerCase().includes(lowerCaseSearchTerm))
            .sort((a, b) => a.name.localeCompare(b.name));
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium w-full md:w-auto"
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
                    {icons.search}
                </div>
            </div>

            {/* Tabela de Medicações */}
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
                {filteredMedications.length > 0 ? (
                    <table className="min-w-full bg-white text-sm table-auto"> {/* Mudado para table-auto */}
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                {/* --- COLUNA DE ID ADICIONADA --- */}
                                <th className="w-24 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Nome da Medicação</th>
                                <th className="w-36 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Data Cadastro</th> {/* Largura fixa para data */}
                                <th className="w-28 text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider">Ações</th> {/* Largura fixa para ações */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMedications.map(med => (
                                <tr key={med.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    {/* --- CÉLULA DE ID ADICIONADA --- */}
                                    <td className="py-3 px-4 text-gray-500 text-xs font-mono whitespace-nowrap">{med.id}</td>
                                    <td className="py-3 px-4 font-medium text-gray-800 break-words">{med.name}</td>
                                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(med.createdAt)}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleOpenModal(med)}
                                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-150"
                                                title="Editar Medicação"
                                            >
                                                <span className="w-5 h-5 block">{icons.edit}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(med)}
                                                className="p-1 text-red-600 hover:text-red-800 transition-colors duration-150"
                                                title="Excluir Medicação"
                                            >
                                                <span className="w-5 h-5 block">{icons.trash}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 py-8 text-base">
                        {searchTerm
                            ? <>Nenhuma medicação encontrada para "<strong>{searchTerm}</strong>".</>
                            : 'Nenhuma medicação cadastrada.'
                        }
                    </p>
                )}
            </div>

            {/* Modais */}
            {isModalOpen && (
                <MedicationForm
                    medication={editingMedication}
                    onSave={handleSaveMedication}
                    onClose={handleCloseModal}
                    // allMedications={medications} // Descomente se precisar verificar duplicidade no form
                />
            )}
            {confirmation.isOpen && (
                <ConfirmModal
                    message={confirmation.message}
                    onConfirm={() => confirmation.onConfirm(confirmation.data)}
                    onClose={closeConfirmation}
                    confirmText="Excluir"
                    isDestructive
                />
            )}
        </div>
    );
}

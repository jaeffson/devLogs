// src/pages/SecretarySettingsPage.jsx
import React, { useState, useMemo, useEffect } from 'react'; // Adicionado useEffect

// --- Imports de Componentes ---
import {AnnualBudgetChart} from '../components/common/AnnualBudgetChart';

// --- Componente da Página ---
export default function SecretarySettingsPage({
    annualBudget,
    handleUpdateBudget,
    records = [],
    addToast
}) {
    // --- Estado Interno ---
    // Inicializa com o valor da prop, mas permite edição
    const [newBudgetValue, setNewBudgetValue] = useState(String(annualBudget || '0'));

    // Efeito para atualizar o campo se a prop mudar (ex: após salvar)
    useEffect(() => {
        setNewBudgetValue(String(annualBudget || '0'));
    }, [annualBudget]);


    // --- CÁLCULO DO GASTO TOTAL (para o gráfico) ---
    const totalSpentForYear = useMemo(() => {
        const currentYear = new Date().getFullYear(); // Ou use um seletor de ano
        return (records || [])
            .filter(r => new Date(r.entryDate).getFullYear() === currentYear)
            .reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
    }, [records]);


    // --- Função para Salvar Orçamento ---
    const handleBudgetSave = () => {
        const value = parseFloat(newBudgetValue.replace(',', '.'));
        if (!isNaN(value) && value >= 0) {
            if (typeof handleUpdateBudget === 'function') {
                handleUpdateBudget(value); // Chama a função do App.jsx
                // addToast já é chamado dentro de handleUpdateBudget no App.jsx
            } else {
                addToast?.('Erro: Função de salvar não encontrada.', 'error');
            }
        } else {
            addToast?.('Valor de orçamento inválido.', 'error');
            setNewBudgetValue(String(annualBudget || '0')); // Restaura
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-6 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 border-b pb-3">
                Configurações
            </h2>

            {/* Seção de Orçamento */}
            <div className="max-w-lg mx-auto">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Orçamento Anual</h3>
                <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                    {/* Gráfico para feedback visual */}
                    <div className="mb-6 flex justify-center">
                        <AnnualBudgetChart
                            key={annualBudget} // Força re-renderização
                            totalSpent={totalSpentForYear}
                            budgetLimit={annualBudget}
                        />
                    </div>
                    {/* Campo para alterar o valor */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1" htmlFor="annual-budget-input">
                            Definir Novo Valor do Orçamento (R$)
                        </label>
                        <input
                            id="annual-budget-input"
                            type="text"
                            value={newBudgetValue}
                            onChange={(e) => setNewBudgetValue(e.target.value)}
                            className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Ex: 5000.00 ou 5000,00"
                        />
                    </div>
                    {/* Botão para salvar */}
                    <button
                        onClick={handleBudgetSave}
                        className="w-full px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                        Salvar Orçamento
                    </button>
                </div>
            </div>
            {/* Outras configurações do secretário poderiam vir aqui */}
        </div>
    );
}
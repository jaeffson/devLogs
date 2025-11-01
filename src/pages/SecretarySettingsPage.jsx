// src/pages/SecretarySettingsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios'; // Importado para referência, mas não usado

// --- Imports de Componentes ---
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';
import { SimpleCard } from '../components/common/SimpleCard';
import { icons } from '../utils/icons';

// --- Componente da Página ---
export default function SecretarySettingsPage({
  annualBudget,
  handleUpdateBudget, // Função passada do App.jsx (deve conter a chamada API)
  records = [], // Dados dos registros (agora vindos da API/MongoDB)
  addToast,
}) {
  // Inicializa com o valor da prop, mas permite edição
  const [newBudgetValue, setNewBudgetValue] = useState(
    String(annualBudget || '0')
  );

  // Sincroniza o estado interno (newBudgetValue) quando a prop mudar (ex: após o App.jsx salvar na API)
  useEffect(() => {
    // Formatação amigável para o input
    setNewBudgetValue(
      new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(
        annualBudget || 0
      )
    );
  }, [annualBudget]);

  // --- CÁLCULO OTIMIZADO DE GASTOS DO ANO ---
  const totalSpentForYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return (records || [])
      .filter((r) => {
        // Usa o campo entryDate para filtrar por ano
        return new Date(r.entryDate).getFullYear() === currentYear;
      })
      .reduce((sum, item) => {
        // ATENÇÃO: totalValue deve vir como string da API, mas ser parseado para número
        return sum + (Number(item.totalValue) || 0);
      }, 0);
  }, [records]);

  // --- FUNÇÃO DE SALVAR ORÇAMENTO ---
  const handleBudgetSave = () => {
    // Remove pontuação de milhar (se houver) e substitui vírgula por ponto para parsear
    const cleanedValue = newBudgetValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleanedValue);

    if (!isNaN(value) && value >= 0) {
      if (typeof handleUpdateBudget === 'function') {
        // Esta função chama o App.jsx, que fará (ou simulará) a chamada API de PATCH
        handleUpdateBudget(value); 
      } else {
        addToast?.('Erro: Função de salvar não encontrada.', 'error');
      }
    } else {
      addToast?.('Por favor, insira um valor numérico válido e positivo.', 'error');
    }
  };

  // --- Helpers de Exibição ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const totalRemaining = annualBudget - totalSpentForYear;
  const percentageSpent = annualBudget > 0 ? (totalSpentForYear / annualBudget) * 100 : 0;
  const isOverBudget = totalRemaining < 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Configurações da Secretária
      </h1>

      {/* --- SEÇÃO ORÇAMENTO ANUAL --- */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Orçamento Anual
        </h3>
        <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
          
          {/* Gráfico para feedback visual */}
          <div className="mb-6 flex justify-center">
            <AnnualBudgetChart
              key={annualBudget} // Força re-renderização
              totalSpent={totalSpentForYear}
              budgetLimit={annualBudget}
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
              <SimpleCard 
                  title="Orçamento Total"
                  value={formatCurrency(annualBudget)}
                  icon={icons.money}
                  className="bg-green-100 border-green-300"
              />
              <SimpleCard 
                  title="Gasto Atual"
                  value={formatCurrency(totalSpentForYear)}
                  icon={icons.chart}
                  className="bg-yellow-100 border-yellow-300"
              />
              <SimpleCard 
                  title="Restante Estimado"
                  value={formatCurrency(totalRemaining)}
                  icon={icons.wallet}
                  className={isOverBudget ? "bg-red-100 border-red-300" : "bg-blue-100 border-blue-300"}
              />
          </div>

          {/* Campo para alterar o valor */}
          <div className='pt-4'>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="annual-budget-input"
            >
              Definir Novo Valor do Orçamento (R$)
            </label>
            <input
              id="annual-budget-input"
              type="text"
              value={newBudgetValue}
              onChange={(e) => setNewBudgetValue(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ex: 5000,00"
            />
            <p className="text-xs text-gray-500 mt-1">
                Use vírgula para separar centavos.
            </p>
          </div>
          
          {/* Botão para salvar */}
          <button
            onClick={handleBudgetSave}
            disabled={newBudgetValue.length === 0}
            className="w-full px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Novo Orçamento
          </button>
        </div>
      </section>

      {/* Observação sobre a lógica de atualização */}
      <div className="mt-8 p-4 text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded">
          <p className='font-semibold'>Nota Técnica:</p>
          <p></p>
      </div>

    </div>
  );
}
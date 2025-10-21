// src/pages/AdminReportsPage.jsx
import React, { useState, useMemo } from 'react';

// --- Imports de Componentes (Opcional: Gráficos) ---
import { BarChart } from '../components/common/BarChart'; // Reutiliza o gráfico de barras
import AnnualBudgetChart  from '../components/common/AnnualBudgetChart'; // Reutiliza o gráfico de orçamento
import icons from '../utils/icons';

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers'; // Função helper

// --- Componente da Página ---
// Recebe props de App.jsx via commonPageProps
export  function AdminReportsPage({
    user, // Usuário admin logado
    patients = [],
    records = [],
    medications = [],
    users = [], // Lista de usuários para relatório de atividade
    annualBudget,
    // Add addToast se precisar de notificações aqui
}) {
    // --- Estados Internos (Ex: Para filtros de data) ---
    const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // Ano padrão
    // const [startDate, setStartDate] = useState('');
    // const [endDate, setEndDate] = useState('');

    // --- Memos para Calcular Estatísticas ---

    // Filtra registros pelo ano selecionado
    const recordsThisYear = useMemo(() =>
        records.filter(r => new Date(r.entryDate).getFullYear() === filterYear),
        [records, filterYear]
    );

    // Estatísticas Gerais
    const generalStats = useMemo(() => {
        const totalRecords = recordsThisYear.length;
        const attended = recordsThisYear.filter(r => r.status === 'Atendido').length;
        const pending = recordsThisYear.filter(r => r.status === 'Pendente').length;
        const canceled = recordsThisYear.filter(r => r.status === 'Cancelado').length;
        const totalCost = recordsThisYear.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0);
        const uniquePatientsAttended = new Set(recordsThisYear.filter(r => r.status === 'Atendido').map(r => r.patientId)).size;

        return {
            totalPatients: patients.length, // Total geral de pacientes
            totalRecords,
            attended,
            pending,
            canceled,
            totalCost,
            uniquePatientsAttended,
        };
    }, [patients, recordsThisYear]);

    // Dados para Gráfico de Status dos Registros
    const statusChartData = useMemo(() => [
        { label: 'Atendidos', value: generalStats.attended },
        { label: 'Pendentes', value: generalStats.pending },
        { label: 'Cancelados', value: generalStats.canceled },
    ], [generalStats]);

    // Dados para Gráfico de Custo Mensal vs Orçamento (Simplificado)
    const monthlyCostData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const costByMonth = Array(12).fill(0);

        recordsThisYear.forEach(record => {
            const monthIndex = new Date(record.entryDate).getMonth();
            if (monthIndex >= 0 && monthIndex < 12) {
                costByMonth[monthIndex] += (Number(record.totalValue) || 0);
            }
        });

        return months.map((monthLabel, index) => ({
            label: monthLabel,
            value: costByMonth[index] // Valor aqui é o custo, não contagem
        }));
    }, [recordsThisYear]);

    // Relatório de Uso de Medicações (Contagem Simples)
    const medicationUsage = useMemo(() => {
        const usageCount = {};
        recordsThisYear.forEach(record => {
            record.medications.forEach(medItem => {
                const medId = medItem.medicationId;
                usageCount[medId] = (usageCount[medId] || 0) + 1; // Conta quantas vezes aparece em registros
            });
        });
        // Mapeia para um array ordenado por contagem
        return Object.entries(usageCount)
            .map(([medId, count]) => ({
                id: medId,
                name: getMedicationName(medId, medications),
                count: count
            }))
            .sort((a, b) => b.count - a.count); // Mais usadas primeiro
    }, [recordsThisYear, medications]);


    // --- Renderização ---
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Relatórios Administrativos
                </h2>
                 {/* Seletor de Ano */}
                 <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <label htmlFor="report-year-selector" className="text-sm font-medium text-gray-700">Ano:</label>
                    <select
                        id="report-year-selector"
                        value={filterYear}
                        onChange={e => setFilterYear(parseInt(e.target.value))}
                        className="p-1 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {/* Gera opções de anos dinamicamente (ex: últimos 5 anos) */}
                        {[...Array(5)].map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* Seção de Estatísticas Gerais */}
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Visão Geral ({filterYear})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm text-blue-800 font-semibold">Total Pacientes</div>
                        <div className="text-2xl font-bold text-blue-900">{generalStats.totalPatients}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-800 font-semibold">Total Registros</div>
                        <div className="text-2xl font-bold text-gray-900">{generalStats.totalRecords}</div>
                    </div>
                     <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm text-green-800 font-semibold">Atendidos</div>
                        <div className="text-2xl font-bold text-green-900">{generalStats.attended}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                        <div className="text-sm text-yellow-800 font-semibold">Pendentes</div>
                        <div className="text-2xl font-bold text-yellow-900">{generalStats.pending}</div>
                    </div>
                     <div className="bg-red-50 p-3 rounded">
                        <div className="text-sm text-red-800 font-semibold">Cancelados</div>
                        <div className="text-2xl font-bold text-red-900">{generalStats.canceled}</div>
                    </div>
                     <div className="bg-purple-50 p-3 rounded col-span-2 sm:col-span-1">
                        <div className="text-sm text-purple-800 font-semibold">Pacientes Únicos Atend.</div>
                        <div className="text-2xl font-bold text-purple-900">{generalStats.uniquePatientsAttended}</div>
                    </div>
                    {/* Custo Total */}
                     <div className="bg-indigo-50 p-3 rounded col-span-2 lg:col-span-1">
                         <div className="text-sm text-indigo-800 font-semibold">Custo Total (Registros)</div>
                         <div className="text-xl font-bold text-indigo-900">
                             R$ {generalStats.totalCost.toFixed(2).replace('.',',')}
                         </div>
                    </div>
                     {/* Orçamento */}
                     <div className="bg-teal-50 p-3 rounded col-span-2 lg:col-span-1">
                         <div className="text-sm text-teal-800 font-semibold">Orçamento Anual</div>
                         <div className="text-xl font-bold text-teal-900">
                              R$ {(Number(annualBudget) || 0).toFixed(2).replace('.',',')}
                         </div>
                    </div>
                    {/* Gráfico Orçamento Pequeno */}
                     <div className="bg-white p-3 rounded col-span-2 lg:col-span-2 flex justify-center items-center border">
                        <AnnualBudgetChart totalSpent={generalStats.totalCost} budgetLimit={annualBudget} />
                     </div>
                </div>
            </section>

            {/* Gráficos */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico de Status */}
                <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                    <BarChart data={statusChartData} title={`Status dos Registros (${filterYear})`} />
                </div>
                 {/* Gráfico de Custo Mensal */}
                <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                     <BarChart data={monthlyCostData} title={`Custo Mensal (R$) (${filterYear})`} />
                     {/* Nota: Este BarChart assume que 'value' é contagem, adaptar se necessário */}
                </div>
            </section>

             {/* Relatório de Uso de Medicações */}
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Medicações Mais Utilizadas ({filterYear})</h3>
                <div className="overflow-x-auto max-h-60"> {/* Limita altura e adiciona scroll */}
                    {medicationUsage.length > 0 ? (
                        <table className="min-w-full bg-white text-sm">
                            <thead className="bg-gray-50 sticky top-0"> {/* Cabeçalho fixo */}
                                <tr>
                                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Medicação</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-600">Nº de Registros</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicationUsage.slice(0, 15).map(med => ( // Limita a top 15
                                    <tr key={med.id} className="border-b last:border-b-0">
                                        <td className="py-2 px-3 font-medium text-gray-800">{med.name}</td>
                                        <td className="py-2 px-3 text-gray-600 text-right">{med.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-gray-500 py-4">Nenhum registro encontrado para este ano.</p>
                    )}
                </div>
                {medicationUsage.length > 15 && <p className="text-xs text-gray-500 mt-2 text-center">Exibindo as 15 mais utilizadas.</p>}
            </section>

            {/* Placeholder para outros relatórios */}
            {/*
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Atividade por Profissional ({filterYear})</h3>
                <p className="text-gray-500">Em construção...</p>
            </section>
            */}

        </div>
    );
}
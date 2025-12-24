// src/pages/SecretarySettingsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { icons } from '../utils/icons'; // Assumindo que você tem esse arquivo, senão usará ícones inline

export default function SecretarySettingsPage({ addToast }) {
  const [distributors, setDistributors] = useState([]);
  const [editingValues, setEditingValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null); // Para mostrar loading no botão específico

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/distributors');
      setDistributors(response.data || []);
      
      // Prepara os valores para edição
      const values = {};
      response.data.forEach(d => {
        values[d._id] = d.budget || 0;
      });
      setEditingValues(values);
    } catch (error) {
      if (addToast) addToast('Erro ao carregar farmácias.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (id) => {
    setSavingId(id);
    try {
      const newVal = parseFloat(editingValues[id]);
      if (isNaN(newVal) || newVal < 0) {
        if (addToast) addToast('Por favor, insira um valor válido.', 'warning');
        setSavingId(null);
        return;
      }

      await api.put(`/distributors/${id}`, { budget: newVal });
      
      if (addToast) addToast('Teto orçamentário atualizado com sucesso!', 'success');
      
      // Atualiza a lista localmente para refletir sem precisar recarregar tudo
      setDistributors(prev => prev.map(d => d._id === id ? { ...d, budget: newVal } : d));
      
    } catch (e) {
      if (addToast) addToast('Erro ao salvar alteração.', 'error');
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  // Calcula o total consolidado baseado nos valores que estão sendo editados (tempo real)
  const totalBudget = useMemo(() => {
    return Object.values(editingValues).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [editingValues]);

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Configurações Financeiras</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerenciamento de teto de gastos por unidade distribuidora
          </p>
        </div>
      </div>

      {/* --- CARD DE RESUMO (Totalizador) --- */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
             {/* Ícone de Dinheiro/Gráfico */}
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
             </svg>
          </div>
          <div>
            <h2 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Orçamento Global Consolidado</h2>
            <p className="text-xs text-indigo-200 mt-1">Soma de todos os tetos definidos abaixo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBudget)}
          </p>
        </div>
      </div>

      {/* --- LISTA DE FARMÁCIAS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {/* Ícone Predio/Farmácia */}
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Unidades Cadastradas
            </h3>
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">
                {distributors.length} Unidades
            </span>
        </div>

        {isLoading ? (
            <div className="p-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
            {distributors.length > 0 ? distributors.map((dist) => (
                <div key={dist._id} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-gray-50 transition-colors group">
                    
                    {/* Info da Farmácia */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm">
                            {dist.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-base">{dist.name}</p>
                            <p className="text-xs text-gray-500">ID: {dist._id}</p>
                        </div>
                    </div>

                    {/* Área de Edição */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-48 group-focus-within:ring-2 ring-indigo-100 rounded-lg transition-all">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
                            <input 
                                type="number" 
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                value={editingValues[dist._id]}
                                onChange={(e) => setEditingValues({...editingValues, [dist._id]: e.target.value})}
                                placeholder="0.00"
                            />
                        </div>
                        
                        <button 
                            onClick={() => handleSave(dist._id)}
                            disabled={savingId === dist._id}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer
                                ${savingId === dist._id 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 hover:shadow-md'}
                            `}
                        >
                            {savingId === dist._id ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    {/* Ícone de Save */}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>Salvar Teto</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )) : (
                <div className="p-8 text-center text-gray-500">
                    Nenhuma farmácia encontrada.
                </div>
            )}
            </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-400">
        <p>Os valores definidos aqui impactam diretamente os gráficos de saúde financeira na Dashboard.</p>
      </div>

    </div>
  );
}
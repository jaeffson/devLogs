// src/components/views/secretary/PatientHistoryView.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { PatientRecordsTable } from '../../common/PatientRecordsTable';
import { icons } from '../../../utils/icons'; 
import useDebounce from '../../../hooks/useDebounce';

export function PatientHistoryView({
  patients = [],
  records = [],
  medications = [],
  getMedicationName, 
  initialPatient, 
  onHistoryViewed, 
  onViewReason, 
}) {
  
  // --- Estados ---
  const [searchTermPatient, setSearchTermPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(initialPatient || null); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  // Controle de visualização Mobile
  const [showMobileList, setShowMobileList] = useState(!initialPatient);

  const debouncedSearchTermPatient = useDebounce(searchTermPatient, 300);
  const isSearchingPatient = searchTermPatient !== debouncedSearchTermPatient;

  // --- Efeitos ---
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      setShowMobileList(false);
    }
  }, [initialPatient]);

  // --- Memos ---
  const filteredPatientsForSearch = useMemo(() => {
    if (!Array.isArray(patients)) return [];

    let filtered = patients.filter((p) =>
      (p.name?.toLowerCase() || '').includes(debouncedSearchTermPatient.toLowerCase()) ||
      (p.cpf && String(p.cpf).includes(debouncedSearchTermPatient)) ||
      (p.susCard && String(p.susCard).includes(debouncedSearchTermPatient))
    );

    return filtered.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return sortOrder === 'asc' 
            ? nameA.localeCompare(nameB) 
            : nameB.localeCompare(nameA);
    });
  }, [patients, debouncedSearchTermPatient, sortOrder]);

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient || !Array.isArray(records)) return [];
    const patientId = selectedPatient.id || selectedPatient._id;
    return records
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  const lastVisitDate = useMemo(() => {
      if (selectedPatientRecords.length === 0) return 'Nunca';
      try {
          return new Date(selectedPatientRecords[0].entryDate).toLocaleDateString('pt-BR');
      } catch { return 'N/A'; }
  }, [selectedPatientRecords]);

  // --- Handlers ---
  const handlePatientSelect = (p) => {
      setSelectedPatient(p);
      setShowMobileList(false); 
  };

  const handleBackToList = () => {
      setShowMobileList(true); 
      setSelectedPatient(null);
  };

  const clearSearch = () => {
    setSearchTermPatient('');
  };

  return (
    // Wrapper Principal: Altura fixa calculada para garantir que o scroll interno funcione
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] md:h-[calc(100vh-8rem)] bg-white md:bg-gray-50/50 md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* --- COLUNA 1: LISTA (Sidebar) --- */}
      {/* Lógica de display: Se showMobileList for true, mostra (block), senão esconde (hidden) no mobile */}
      <div className={`
        w-full md:w-1/3 xl:w-1/4 bg-white border-r border-gray-200 flex-col z-10 transition-all duration-300
        ${showMobileList ? 'flex h-full' : 'hidden md:flex h-full'} 
      `}>
        
        {/* Header da Lista */}
        <div className="p-4 border-b border-gray-100 bg-white flex-none">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">{icons.users}</span>
                Pacientes
            </h3>
            
            <div className="relative group">
                <input
                    type="text"
                    placeholder="Buscar Nome, CPF..."
                    className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 cursor-text"
                    value={searchTermPatient}
                    onChange={(e) => setSearchTermPatient(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none">
                    {isSearchingPatient ? <span className="animate-spin block">↻</span> : icons.search}
                </div>
                {searchTermPatient && (
                    <button 
                        onClick={clearSearch}
                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500 cursor-pointer p-0.5 rounded-full hover:bg-red-50 transition-colors"
                        title="Limpar busca"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center mt-3 select-none">
                <span className="text-xs text-gray-400 font-medium">
                    {filteredPatientsForSearch.length} encontrados
                </span>
                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                    Ordem {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    <span className="text-xs">{sortOrder === 'asc' ? '↓' : '↑'}</span>
                </button>
            </div>
        </div>

        {/* Lista Scrollável */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredPatientsForSearch.length > 0 ? (
            filteredPatientsForSearch.map((p) => {
                const isActive = (selectedPatient?.id || selectedPatient?._id) === (p.id || p._id);
                return (
                  <div
                    key={p.id || p._id}
                    onClick={() => handlePatientSelect(p)}
                    // ADICIONADO: cursor-pointer explícito
                    className={`
                        group p-3 rounded-lg cursor-pointer transition-all border select-none relative
                        ${isActive 
                            ? 'bg-blue-50 border-blue-200 shadow-sm pl-4' 
                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 hover:pl-4'}
                    `}
                  >
                    {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <div className="flex justify-between items-start">
                        <p className={`font-semibold text-sm truncate transition-colors ${isActive ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {p.name}
                        </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 group-hover:text-gray-600">
                      <span className="truncate max-w-[150px]">
                        {p.cpf ? `CPF: ${p.cpf}` : (p.susCard ? `SUS: ${p.susCard}` : 'Sem doc')}
                      </span>
                    </p>
                  </div>
                );
            })
          ) : (
            <div className="text-center py-10 px-4">
                <p className="text-gray-300 text-4xl mb-2">¯\_(ツ)_/¯</p>
                <p className="text-gray-500 text-sm font-medium">Nenhum paciente encontrado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* --- COLUNA 2: DETALHES --- */}
      {/* CORREÇÃO DO MOBILE: min-h-0 e flex-1 são essenciais para o scroll interno funcionar no flexbox */}
      <div className={`
         w-full md:w-2/3 xl:w-3/4 bg-gray-50/50 flex-col min-h-0 h-full relative
         ${!showMobileList ? 'flex' : 'hidden md:flex'}
      `}>
        
        {selectedPatient ? (
          <>
            {/* Header Mobile com Botão Voltar */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-20 flex-none">
                <button 
                    onClick={handleBackToList}
                    // ADICIONADO: cursor-pointer
                    className="md:hidden mb-4 text-gray-500 hover:text-blue-600 flex items-center gap-2 text-sm font-semibold p-1 -ml-1 cursor-pointer transition-colors active:scale-95"
                >
                    <span className="bg-gray-100 p-1 rounded-full">{icons.arrowLeft || '←'}</span> 
                    Voltar para lista
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white shrink-0">
                            {selectedPatient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight truncate">{selectedPatient.name}</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-xs font-medium">
                                    CPF: {selectedPatient.cpf || '-'}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-xs font-medium">
                                    SUS: {selectedPatient.susCard || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2 md:mt-0">
                        <div className="flex-1 md:flex-none bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Registros</p>
                            <p className="text-lg font-bold text-blue-700 leading-none">{selectedPatientRecords.length}</p>
                        </div>
                        <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-lg border border-gray-200 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Último</p>
                            <p className="text-sm font-bold text-gray-700 mt-0.5 leading-tight">{lastVisitDate}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container da Tabela com SCROLL FIXO CORRIGIDO */}
            <div className="flex-1 p-2 md:p-6 flex flex-col min-h-0 bg-gray-50/50">
                 <div className="flex-1 border border-gray-200 rounded-xl bg-white shadow-sm relative w-full h-full overflow-hidden">
                    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {/* A tabela renderiza aqui */}
                        <PatientRecordsTable
                            records={selectedPatientRecords}
                            medications={medications}
                            getMedicationName={getMedicationName} 
                            onViewReason={onViewReason}
                        />
                    </div>
                </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-white md:bg-transparent">
            <div className="bg-blue-50 p-8 rounded-full shadow-inner mb-6 animate-pulse-slow">
                 <span className="text-blue-300 text-5xl block">{icons.users}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selecione um Paciente</h2>
            <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
              Clique em um paciente na lista para visualizar o histórico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
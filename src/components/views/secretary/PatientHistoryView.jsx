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

  // Estado de controle visual para Mobile
  const [showMobileList, setShowMobileList] = useState(!initialPatient);

  const debouncedSearchTermPatient = useDebounce(searchTermPatient, 300);
  const isSearchingPatient = searchTermPatient !== debouncedSearchTermPatient;

  // --- Efeitos ---
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      setShowMobileList(false); // Força ir para os detalhes
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
      setShowMobileList(false); // Troca para a tela de detalhes
  };

  const handleBackToList = () => {
      setShowMobileList(true); // Volta para a lista
      setSelectedPatient(null);
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-gray-50/50 rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-fade-in flex flex-col md:flex-row">
      
      {/* --- COLUNA 1: LISTA DE PACIENTES (Sidebar) --- */}
      <div className={`
        w-full md:w-1/3 xl:w-1/4 bg-white border-r border-gray-200 flex flex-col z-10
        ${showMobileList ? '' : 'hidden md:flex'} 
      `}>
        {/* ^ CORREÇÃO: Removido 'block', agora usa apenas 'hidden md:flex' para esconder */}
        
        <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">{icons.users}</span>
                Pacientes
            </h3>
            
            <div className="relative">
                <input
                    type="text"
                    placeholder="Nome, CPF ou SUS..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={searchTermPatient}
                    onChange={(e) => setSearchTermPatient(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">
                    {isSearchingPatient ? <span className="animate-spin block">↻</span> : icons.search}
                </div>
            </div>

            <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400 font-medium">
                    {filteredPatientsForSearch.length} encontrados
                </span>
                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    Ordem {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    <span className="text-xs">{sortOrder === 'asc' ? '↓' : '↑'}</span>
                </button>
            </div>
        </div>

        <div className="overflow-y-auto flex-grow p-2 space-y-1">
          {filteredPatientsForSearch.length > 0 ? (
            filteredPatientsForSearch.map((p) => {
                const isActive = (selectedPatient?.id || selectedPatient?._id) === (p.id || p._id);
                return (
                  <div
                    key={p.id || p._id}
                    onClick={() => handlePatientSelect(p)}
                    className={`
                        group p-3 rounded-lg cursor-pointer transition-all border select-none
                        ${isActive 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                        <p className={`font-semibold text-sm truncate ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                          {p.name}
                        </p>
                        {isActive && <span className="text-blue-500 text-xs font-bold">●</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <span className="truncate max-w-[120px]">
                        {p.cpf ? `CPF: ${p.cpf}` : (p.susCard ? `SUS: ${p.susCard}` : 'Sem doc')}
                      </span>
                    </p>
                  </div>
                );
            })
          ) : (
            <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Nenhum paciente encontrado.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* --- COLUNA 2: DETALHES (Main Content) --- */}
      <div className={`
         w-full md:w-2/3 xl:w-3/4 bg-gray-50/30 flex flex-col min-h-0
         ${!showMobileList ? '' : 'hidden md:flex'}
      `}>
        {/* ^ CORREÇÃO: Mantém o display: flex padrão da classe estática */}
        
        {selectedPatient ? (
          <>
            {/* Header Mobile com Botão Voltar */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-0 flex-shrink-0">
                <button 
                    onClick={handleBackToList}
                    className="md:hidden mb-3 text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium p-1 -ml-1"
                >
                    {icons.arrowLeft || '←'} Voltar
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-200 shrink-0">
                            {selectedPatient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-gray-800 leading-tight truncate">{selectedPatient.name}</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                <span className="whitespace-nowrap"><span className="font-medium text-gray-400">CPF:</span> {selectedPatient.cpf || '-'}</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="whitespace-nowrap"><span className="font-medium text-gray-400">SUS:</span> {selectedPatient.susCard || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2 md:mt-0">
                        <div className="flex-1 md:flex-none bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-center">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Registros</p>
                            <p className="text-lg font-bold text-blue-700 leading-none">{selectedPatientRecords.length}</p>
                        </div>
                        <div className="flex-1 md:flex-none bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Último</p>
                            <p className="text-sm font-bold text-gray-700 mt-0.5 leading-tight">{lastVisitDate}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container da Tabela com Flex-Grow corrigido */}
            <div className="flex-grow p-4 md:p-6 overflow-hidden flex flex-col relative">
                 <div className="flex-grow border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto">
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
          <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
            <div className="bg-white p-6 rounded-full shadow-sm border border-gray-100 mb-6">
                 <span className="text-blue-200 text-4xl block opacity-50">{icons.users}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione um Paciente</h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Toque em um paciente na lista para visualizar o histórico completo de entregas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
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
}) {
  
  // --- Estados (Movidos para cá) ---
  const [searchTermPatient, setSearchTermPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(initialPatient || null); 
  
  const debouncedSearchTermPatient = useDebounce(searchTermPatient, 300);
  const isSearchingPatient = searchTermPatient !== debouncedSearchTermPatient;

  // Efeito para sincronizar e limpar o 'initialPatient' no controlador
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      onHistoryViewed(); 
    }
  }, [initialPatient, onHistoryViewed]);

  // Efeito para limpar a seleção se a busca for limpa
  useEffect(() => {
    if (!searchTermPatient) {
      setSelectedPatient(null);
    }
  }, [searchTermPatient]);


  // --- Memos (Movidos para cá) ---
  const filteredPatientsForSearch = useMemo(
    () =>
      Array.isArray(patients)
        ? patients
            .filter(
              (p) =>
                (p.name?.toLowerCase() || '').includes(
                  debouncedSearchTermPatient.toLowerCase()
                ) ||
                (p.cpf && String(p.cpf).includes(debouncedSearchTermPatient)) ||
                (p.susCard &&
                  String(p.susCard).includes(debouncedSearchTermPatient))
            )
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        : [],
    [patients, debouncedSearchTermPatient]
  );

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient || !Array.isArray(records)) return [];
    return records
      .filter((r) => r.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  // --- Renderização ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-[calc(100vh-8rem)] animate-fade-in">
      
      {/* --- SEÇÃO 1: PAINEL DE BUSCA E SELEÇÃO (1/4 da tela) --- */}
      <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <span className="text-blue-500 w-5 h-5">{icons.users}</span>
            Buscar Paciente
        </h3>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Nome, CPF ou SUS..."
            className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            value={searchTermPatient}
            onChange={(e) => setSearchTermPatient(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">
            {isSearchingPatient ? (
              <svg
                className="animate-spin h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              icons.search
            )}
          </div>
        </div>
        <div className="overflow-y-auto pr-2 -mr-2 flex-grow min-h-0 divide-y divide-gray-100 border border-gray-200 rounded-lg">
          {filteredPatientsForSearch.length > 0 ? (
            filteredPatientsForSearch.map((p) => (
              <div
                key={p.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedPatient?.id === p.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedPatient(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && setSelectedPatient(p)
                }
              >
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {p.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-medium text-gray-600">ID:</span> {p.cpf || p.susCard || 'Não especificado'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4 text-sm">
              Nenhum paciente encontrado.
            </p>
          )}
        </div>
      </div>
      
      {/* --- SEÇÃO 2: DETALHES E HISTÓRICO (3/4 da tela) --- */}
      <div className="lg:col-span-2 xl:col-span-3 bg-white p-4 md:p-6 rounded-lg shadow flex flex-col min-h-0">
        
        {selectedPatient ? (
          <>
            {/* NOVO: Cartão de Informações Rápidas do Paciente */}
            <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-lg shadow-sm">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                    Histórico de: <span className="text-blue-700">{selectedPatient.name}</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs font-semibold text-blue-800 uppercase">CPF</p>
                        <p className="font-medium text-gray-800">{selectedPatient.cpf || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-blue-800 uppercase">Cartão SUS</p>
                        <p className="font-medium text-gray-800">{selectedPatient.susCard || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Registros de Entrada/Entrega ({selectedPatientRecords.length})</h4>
            
            {/* Tabela de Histórico */}
            <div className="flex-grow min-h-0 overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6 border border-gray-200 rounded-lg">
                <PatientRecordsTable
                    records={selectedPatientRecords}
                    medications={medications}
                    getMedicationName={getMedicationName} 
                    // Nota: Se PatientRecordsTable precisar de modificação visual,
                    // ela deve ser feita no arquivo do componente PatientRecordsTable
                    // para manter a modularidade.
                />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="mb-4 text-gray-300 w-16 h-16">{icons.clipboard}</div>
            <h2 className="text-xl font-semibold">Selecione um Paciente</h2>
            <p className="text-sm">
              Escolha um paciente na lista ao lado para ver seu histórico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
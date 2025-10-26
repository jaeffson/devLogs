// src/components/views/secretary/PatientHistoryView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { PatientRecordsTable } from '../../common/PatientRecordsTable';
import { icons } from '../../../utils/icons';
import useDebounce from '../../../hooks/useDebounce';

// Recebemos as props do "Controlador"
export function PatientHistoryView({
  patients = [],
  records = [],
  medications = [],
  getMedicationName, // (Será passado para PatientRecordsTable)
  initialPatient, // Paciente pré-selecionado (ex: vindo da view 'deliveries')
  onHistoryViewed, // Callback para limpar o 'initialPatient' no controlador
}) {
  
 
  const [searchTermPatient, setSearchTermPatient] = useState('');
  // Usamos o 'initialPatient' para definir o estado inicial
  const [selectedPatient, setSelectedPatient] = useState(initialPatient || null); 
  
  const debouncedSearchTermPatient = useDebounce(searchTermPatient, 300);
  const isSearchingPatient = searchTermPatient !== debouncedSearchTermPatient;

  // Efeito para limpar o 'initialPatient' no controlador
  useEffect(() => {
    
    if (initialPatient) {
      onHistoryViewed();
    }
  }, [initialPatient, onHistoryViewed]);

  // Efeito para resetar a seleção se a busca for limpa
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

  // --- Renderização (JSX copiado do 'case: records') ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] animate-fade-in">
      {/* Div de busca */}
      <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Buscar Paciente</h3>
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
        <div className="overflow-y-auto pr-2 -mr-2 flex-grow min-h-0">
          {filteredPatientsForSearch.length > 0 ? (
            filteredPatientsForSearch.map((p, index) => (
              <div
                key={p.id}
                className={`p-3 rounded-lg cursor-pointer border ${
                  selectedPatient?.id === p.id
                    ? 'bg-blue-100 border-blue-300'
                    : 'hover:bg-gray-100 border-transparent hover:border-gray-200'
                } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
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
                  {p.cpf || p.susCard || 'Sem documento'}
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
      {/* Div da tabela de histórico */}
      <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-lg shadow flex flex-col min-h-0">
        {selectedPatient ? (
          <>
            <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800 text-left">
              Histórico:{' '}
              <span className="text-blue-600">{selectedPatient.name}</span>
            </h3>
            <div className="flex-grow min-h-0 overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
              {/* Passamos o getMedicationName para a tabela */}
              <PatientRecordsTable
                records={selectedPatientRecords}
                medications={medications}
                getMedicationName={getMedicationName} 
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="mb-4 text-gray-300 w-16 h-16">{icons.clipboard}</div>
            <h2 className="text-xl font-semibold">Selecione um Paciente</h2>
            <p className="text-sm">
              Escolha um paciente na lista para ver seu histórico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
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
  onViewReason,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(
    initialPatient || null
  );
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fecha a lista e seleciona o paciente
  const handleSelect = (p) => {
    setSelectedPatient(p);
    setSearchTerm(''); // Limpa a busca ao selecionar
  };

  // Filtro inteligente: Só processa se houver texto
  const searchResults = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (term.length < 2) return []; // Só busca com 2 ou mais caracteres

    return patients
      .filter(
        (p) =>
          (p.name?.toLowerCase() || '').includes(term) ||
          (p.cpf && String(p.cpf).includes(term)) ||
          (p.susCard && String(p.susCard).includes(term))
      )
      .slice(0, 10); // Limita a 10 resultados para performance e estética
  }, [patients, debouncedSearch]);

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    const patientId = selectedPatient.id || selectedPatient._id;
    return records
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-50/30 rounded-2xl overflow-hidden border border-gray-200">
      {/* HEADER DE BUSCA ESTILO MODERNO */}
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm z-30">
        <div className="max-w-2xl mx-auto relative">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
            Consultar Histórico de Paciente
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 text-xl">
              {icons.search}
            </div>
            <input
              type="text"
              placeholder="Digite o nome, CPF ou cartão SUS..."
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* RESULTADOS DA BUSCA (DROPDOWN) */}
          {debouncedSearch.length >= 2 && (
            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {searchResults.map((p) => (
                    <button
                      key={p.id || p._id}
                      onClick={() => handleSelect(p)}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-50 rounded-xl transition-colors group text-left"
                    >
                      <div>
                        <p className="font-bold text-gray-800 group-hover:text-blue-700">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          CPF: {p.cpf || '---'} | SUS: {p.susCard || '---'}
                        </p>
                      </div>
                      <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Visualizar Histórico →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-400 font-medium">
                    Nenhum paciente encontrado para "{debouncedSearch}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-hidden relative">
        {selectedPatient ? (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Resumo do Paciente Selecionado */}
            <div className="bg-white/60 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedPatient.name}
                  </h2>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Paciente Selecionado
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">
                    Registros
                  </p>
                  <p className="font-bold text-blue-600">
                    {selectedPatientRecords.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabela */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <PatientRecordsTable
                  records={selectedPatientRecords}
                  medications={medications}
                  getMedicationName={getMedicationName}
                  onViewReason={onViewReason}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Estado Vazio (Quando nada está selecionado) */
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center text-5xl mb-6">
              {icons.search}
            </div>
            <h3 className="text-2xl font-bold text-gray-700">
              Aguardando busca
            </h3>
            <p className="text-gray-500 max-w-xs mt-2">
              Utilize o campo acima para pesquisar o nome ou documento do
              paciente e acessar o histórico completo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

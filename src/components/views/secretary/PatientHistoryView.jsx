import React, { useState, useMemo } from 'react';
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

  // Filtro de Busca (Autocomplete)
  const searchResults = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (term.length < 2) return [];

    return patients
      .filter((p) => {
        const nameMatch = (p.name?.toLowerCase() || '').includes(term);
        const cpfMatch = p.cpf && String(p.cpf).includes(term);
        const susMatch = p.susCard && String(p.susCard).includes(term);
        return nameMatch || cpfMatch || susMatch;
      })
      .slice(0, 10);
  }, [patients, debouncedSearch]);

  // --- CORREÇÃO PRINCIPAL: FILTRO DE REGISTROS ---
  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    const targetId = String(selectedPatient._id || selectedPatient.id);

    return records
      .filter((r) => {
        const recordPatientId =
          typeof r.patientId === 'object'
            ? r.patientId._id || r.patientId.id
            : r.patientId;
        return String(recordPatientId) === targetId;
      })
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-50/30 rounded-2xl overflow-hidden border border-gray-200">
      {/* --- HEADER DE BUSCA --- */}
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm z-30 relative">
        <div className="max-w-2xl mx-auto">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
            Consultar Histórico de Paciente
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 text-xl pointer-events-none">
              {icons.search}
            </div>
            <input
              type="text"
              placeholder="Digite o nome, CPF ou cartão SUS..."
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner outline-none text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}

            {/* DROPDOWN DE RESULTADOS */}
            {debouncedSearch.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <button
                      key={p.id || p._id}
                      onClick={() => handleSelect(p)}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors group text-left cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-gray-800 group-hover:text-blue-700">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          CPF: {p.cpf || '---'} <span className="mx-1">•</span>{' '}
                          SUS: {p.susCard || '---'}
                        </p>
                      </div>
                      <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                        Ver Histórico →
                      </span>
                    </button>
                  ))
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
      </div>

      {/* --- ÁREA DE CONTEÚDO --- */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {selectedPatient ? (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Resumo do Paciente Selecionado */}
            <div className="bg-white/60 backdrop-blur-md px-8 py-6 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 gap-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                    {selectedPatient.name}
                  </h2>
                  <div className="flex gap-3 text-xs text-gray-500 font-medium mt-1">
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                      CPF: {selectedPatient.cpf || 'Não informado'}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                      SUS: {selectedPatient.susCard || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 px-5 py-2 rounded-xl text-center border border-blue-100">
                <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                  Total de Registros
                </p>
                <p className="text-2xl font-black text-blue-600">
                  {selectedPatientRecords.length}
                </p>
              </div>
            </div>

            {/* Tabela */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 custom-scrollbar">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[200px]">
                <PatientRecordsTable
                  records={selectedPatientRecords}
                  medications={medications}
                  onViewReason={onViewReason} 
                />
              </div>
            </div>
          </div>
        ) : (
          /* Estado Vazio */
          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-60">
            <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-5xl mb-6">
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

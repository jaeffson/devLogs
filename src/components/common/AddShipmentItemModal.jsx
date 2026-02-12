import React, { useState, useEffect, useRef } from 'react';
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
  FiUserPlus,
  FiActivity,
  FiSave,
  FiEdit3,
  FiSearch,
  FiCheck,
  FiChevronDown,
  FiFileText,
} from 'react-icons/fi';
import api, { shipmentService } from '../../services/api';
import PatientForm from '../forms/PatientForm';
import MedicationForm from '../forms/MedicationForm';
import { ClipLoader } from 'react-spinners';

export default function AddShipmentItemModal({
  onClose,
  onSuccess,
  initialData,
  currentShipmentId,
}) {
  // --- ESTADOS DE DADOS ---
  const [patients, setPatients] = useState([]);
  const [medicationsList, setMedicationsList] = useState([]);

  // --- ESTADOS DO FORMULÁRIO (PACIENTE) ---
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatientSuggestions, setFilteredPatientSuggestions] = useState(
    []
  );
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  // --- ESTADOS DO FORMULÁRIO (ITENS) ---
  const [items, setItems] = useState([
    { name: '', quantity: 1, unit: 'CX', medicationId: null, observation: '' },
  ]);

  // Controle de Sugestões (Autocomplete Manual Medicamentos)
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [duplicityWarning, setDuplicityWarning] = useState(null);

  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  // Refs para fechar listas ao clicar fora
  const wrapperRef = useRef(null); // Para itens/medicamentos
  const patientWrapperRef = useRef(null); // Para busca de paciente

  useEffect(() => {
    loadInitialData();

    // Fecha as listas de sugestões se clicar fora
    function handleClickOutside(event) {
      // Fechar lista de medicamentos
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveSearchIndex(null);
      }
      // Fechar lista de pacientes
      if (
        patientWrapperRef.current &&
        !patientWrapperRef.current.contains(event.target)
      ) {
        setShowPatientSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // SE FOR EDIÇÃO, PREENCHE OS CAMPOS
  useEffect(() => {
    if (initialData && patients.length > 0) {
      const patId = initialData.patient?._id || initialData.patient;
      const foundPatient = patients.find((p) => p._id === patId);

      if (foundPatient) {
        setSelectedPatientId(patId);
        setPatientSearchTerm(
          `${foundPatient.name} ${foundPatient.cpf ? `(${foundPatient.cpf})` : ''}`
        );
      }

      if (initialData.medications && initialData.medications.length > 0) {
        const formattedItems = initialData.medications.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          unit: m.unit || 'CX',
          medicationId: m.medicationId?._id || m.medicationId,
          observation: m.observation || '',
        }));
        setItems(formattedItems);
      }
    }
  }, [initialData, patients]);

  const loadInitialData = async () => {
    try {
      const [patRes, medRes] = await Promise.all([
        api.get('/patients'),
        api.get('/medications?limit=5000'),
      ]);

      setPatients(Array.isArray(patRes.data) ? patRes.data : []);

      const medData = medRes.data;
      if (Array.isArray(medData)) setMedicationsList(medData);
      else if (medData?.data && Array.isArray(medData.data))
        setMedicationsList(medData.data);
      else setMedicationsList([]);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  };

  // --- LÓGICA DE BUSCA PACIENTE (IGUAL MEDICAMENTOS) ---
  const handlePatientSearch = (e) => {
    const value = e.target.value;
    setPatientSearchTerm(value);
    setSelectedPatientId(''); // Limpa seleção ao digitar para forçar escolha
    setDuplicityWarning(null);

    if (value.trim().length > 0) {
      const lower = value.toLowerCase();
      // Filtra por Nome OU CPF
      const results = patients
        .filter((p) => {
          const nameMatch = p.name.toLowerCase().includes(lower);
          const cpfMatch = p.cpf && p.cpf.includes(lower);
          return nameMatch || cpfMatch;
        })
        .slice(0, 30); // Limita a 30 resultados

      setFilteredPatientSuggestions(results);
      setShowPatientSuggestions(true);
    } else {
      setFilteredPatientSuggestions([]);
      setShowPatientSuggestions(false);
    }
  };

  const selectPatientSuggestion = (patient) => {
    const displayName = `${patient.name} ${patient.cpf ? `(${patient.cpf})` : ''}`;
    setPatientSearchTerm(displayName);
    setSelectedPatientId(patient._id);
    setShowPatientSuggestions(false);

    // Opcional: Se já tiver item preenchido, verifica duplicidade agora
    if (items.length > 0 && items[0].name) {
      checkDuplicity(items[0].name, patient._id);
    }
  };

  // --- LÓGICA DE BUSCA MEDICAMENTOS ---
  const handleNameChange = (index, value) => {
    const newItems = [...items];
    newItems[index].name = value;
    newItems[index].medicationId = null;
    setItems(newItems);

    if (value.trim().length > 0) {
      const lower = value.toLowerCase();
      const results = medicationsList
        .filter((m) => m.name.toLowerCase().includes(lower))
        .slice(0, 30);

      setFilteredSuggestions(results);
      setActiveSearchIndex(index);
    } else {
      setFilteredSuggestions([]);
      setActiveSearchIndex(null);
    }
  };

  const selectSuggestion = (index, med) => {
    const newItems = [...items];
    newItems[index].name = med.name;
    newItems[index].medicationId = med._id;
    setItems(newItems);
    setActiveSearchIndex(null);

    if (selectedPatientId) checkDuplicity(med.name, selectedPatientId);
  };

  const checkDuplicity = async (medName, patientId) => {
    if (!medName || !patientId) return;
    const med = medicationsList.find((m) => m.name === medName);
    if (!med) return;

    try {
      const res = await api.post('/shipments/check-duplicity', {
        patientId,
        medicationId: med._id,
      });

      if (res.data.exists) {
        setDuplicityWarning(
          `⚠️ ATENÇÃO: "${medName}" já foi solicitado em ${new Date(res.data.date).toLocaleDateString()} (Remessa: ${res.data.code}).`
        );
      } else {
        setDuplicityWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'unit') {
      newItems[index][field] = value.toUpperCase();
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId)
      return alert('Selecione um paciente válido da lista.');

    if (items.some((i) => i.quantity <= 0))
      return alert('Quantidade deve ser maior que zero.');

    setLoading(true);
    try {
      const patientObj = patients.find((p) => p._id === selectedPatientId);

      await shipmentService.addItem({
        shipmentId: currentShipmentId,
        itemId: initialData ? initialData._id : null,
        patientId: selectedPatientId,
        patientName: patientObj?.name || 'Desconhecido',
        medications: items,
      });

      if (!initialData) {
        setSelectedPatientId('');
        setPatientSearchTerm('');
        setItems([
          {
            name: '',
            quantity: 1,
            unit: 'CX',
            medicationId: null,
            observation: '',
          },
        ]);
        setDuplicityWarning(null);
        // Foca no input de paciente após salvar
        document.getElementById('patient-search-input')?.focus();
      }

      onSuccess();
    } catch (error) {
      alert(
        'Erro ao salvar: ' + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (showPatientForm) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-scale-in">
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <FiUserPlus /> Novo Paciente
            </h3>
            <button
              onClick={() => setShowPatientForm(false)}
              className="hover:text-red-500 cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>
          <PatientForm
            onClose={() => setShowPatientForm(false)}
            onSave={async (data) => {
              await api.post('/patients', data);
              await loadInitialData();
              setShowPatientForm(false);
              alert('Paciente cadastrado!');
            }}
          />
        </div>
      </div>
    );
  }

  if (showMedForm) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-scale-in">
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <FiActivity /> Nova Medicação
            </h3>
            <button
              onClick={() => setShowMedForm(false)}
              className="hover:text-red-500 cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>
          <MedicationForm
            onClose={() => setShowMedForm(false)}
            onSave={async (data) => {
              await api.post('/medications', data);
              await loadInitialData();
            }}
            addToast={(msg) => alert(msg)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-0 relative animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {initialData ? (
                <>
                  <FiEdit3 className="text-blue-600" /> Editar Receita
                </>
              ) : (
                <>
                  <FiPlus className="text-blue-600" /> Adicionar à Remessa
                </>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              {initialData
                ? 'Altere os itens abaixo'
                : 'Busque o paciente e digite os itens'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {duplicityWarning && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 flex items-start gap-3 animate-pulse">
              <FiAlertTriangle className="text-yellow-600 text-xl mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-bold">
                  Possível Duplicidade Detectada
                </p>
                <p className="text-sm text-yellow-700">{duplicityWarning}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} id="shipment-form">
            {/* SELEÇÃO DE PACIENTE (AGORA COM LÓGICA DE AUTOCOMPLETE) */}
            <div
              className="mb-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100 relative"
              ref={patientWrapperRef}
            >
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-gray-700">
                  Paciente
                </label>
                {!initialData && (
                  <button
                    type="button"
                    onClick={() => setShowPatientForm(true)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  >
                    <FiUserPlus /> Novo Cadastro
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  id="patient-search-input"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                  placeholder="Digite o nome ou CPF para buscar..."
                  value={patientSearchTerm}
                  onChange={handlePatientSearch}
                  onFocus={() => {
                    // Reabre a lista se tiver algo digitado e não estiver selecionado
                    if (patientSearchTerm && !selectedPatientId)
                      handlePatientSearch({
                        target: { value: patientSearchTerm },
                      });
                  }}
                  required
                  disabled={!!initialData}
                  autoComplete="off"
                />

                {/* LISTA DE SUGESTÕES DE PACIENTES */}
                {showPatientSuggestions &&
                  filteredPatientSuggestions.length > 0 && (
                    <ul className="absolute top-12 left-0 w-full bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-down">
                      {filteredPatientSuggestions.map((p) => (
                        <li
                          key={p._id}
                          onClick={() => selectPatientSuggestion(p)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 flex justify-between items-center"
                        >
                          <span className="font-bold text-gray-800">
                            {p.name}
                          </span>
                          {p.cpf && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {p.cpf}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              {selectedPatientId && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1 font-bold animate-pulse">
                  <FiCheck size={12} /> Paciente identificado
                </div>
              )}
            </div>

            {/* LISTA DE MEDICAMENTOS */}
            <div className="space-y-3" ref={wrapperRef}>
              <div className="flex justify-between items-center mb-1 px-1">
                <label className="block text-sm font-bold text-gray-700">
                  Medicamentos Prescritos
                </label>
                <button
                  type="button"
                  onClick={() => setShowMedForm(true)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <FiActivity /> Não achou? Cadastrar
                </button>
              </div>

              {/* HEADER DA TABELA */}
              <div className="grid grid-cols-[1.5fr_80px_100px_40px] gap-2 px-2 text-xs text-gray-500 font-semibold mb-1">
                <span>Nome / Observação</span>
                <span className="text-center">Qtd</span>
                <span>Unidade</span>
                <span></span>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.5fr_80px_100px_40px] gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200 transition-colors hover:border-blue-300 group"
                >
                  {/* COLUNA 1: NOME + OBSERVAÇÃO */}
                  <div className="flex flex-col gap-1 relative">
                    <input
                      placeholder="DIGITE O NOME..."
                      className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase font-bold text-gray-800 placeholder-gray-400"
                      value={item.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      onFocus={() => handleNameChange(index, item.name)}
                      required
                      autoComplete="off"
                    />

                    {/* LISTA DE SUGESTÕES DE MEDICAMENTOS */}
                    {activeSearchIndex === index &&
                      filteredSuggestions.length > 0 && (
                        <ul className="absolute top-10 left-0 w-full bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in-down">
                          {filteredSuggestions.map((med) => (
                            <li
                              key={med._id}
                              onClick={() => selectSuggestion(index, med)}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 font-medium"
                            >
                              {med.name}
                            </li>
                          ))}
                        </ul>
                      )}

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                        <FiFileText size={12} />
                      </div>
                      <input
                        placeholder="Obs (ex: Original, Genérico...)"
                        className="w-full pl-7 p-1.5 border border-gray-300 rounded-md text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white/50 text-gray-600"
                        value={item.observation}
                        onChange={(e) =>
                          updateItem(index, 'observation', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* COLUNA 2: QUANTIDADE */}
                  <div>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-center font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-[42px]"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* COLUNA 3: UNIDADE */}
                  <div className="relative">
                    <input
                      list="units-options"
                      className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase text-center h-[42px]"
                      placeholder="UN"
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(index, 'unit', e.target.value)
                      }
                    />
                    <FiChevronDown
                      className="absolute right-2 top-3 text-gray-400 pointer-events-none"
                      size={12}
                    />
                  </div>

                  {/* COLUNA 4: BOTÃO EXCLUIR */}
                  <button
                    type="button"
                    onClick={() => {
                      if (items.length > 1) {
                        const newItems = items.filter((_, i) => i !== index);
                        setItems(newItems);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer flex justify-center items-center h-[42px] w-full border border-transparent hover:border-red-100"
                    disabled={items.length === 1}
                    title="Remover linha"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setItems([
                  ...items,
                  { name: '', quantity: 1, unit: 'CX', observation: '' },
                ])
              }
              className="mt-4 text-blue-600 font-bold text-sm flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition self-start border border-dashed border-blue-200 w-full justify-center cursor-pointer"
            >
              <FiPlus /> Adicionar outro medicamento
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-medium transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="shipment-form"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center cursor-pointer"
          >
            {loading ? (
              <ClipLoader size={20} color="#fff" />
            ) : (
              <>
                <FiSave /> {initialData ? 'Atualizar' : 'Salvar'}
              </>
            )}
          </button>
        </div>

        <datalist id="units-options">
          <option value="CX">Caixa</option>
          <option value="FR">Frasco</option>
          <option value="UN">Unidade</option>
          <option value="CART">Cartela</option>
          <option value="BISNAGA">Bisnaga</option>
          <option value="PCT">Pacote</option>
          <option value="LATA">Lata</option>
          <option value="AMP">Ampola</option>
          <option value="COMP">Comprimido</option>
        </datalist>
      </div>
    </div>
  );
}

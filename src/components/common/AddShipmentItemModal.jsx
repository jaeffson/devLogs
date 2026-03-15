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
  FiClock,
  FiShield,
  FiMinus,
} from 'react-icons/fi';
import api, { shipmentService } from '../../services/api';
import PatientForm from '../forms/PatientForm';
import MedicationForm from '../forms/MedicationForm';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';

export default function AddShipmentItemModal({
  onClose,
  onSuccess,
  initialData,
  currentShipmentId,
}) {
  // --- ESTADOS DE DADOS ---
  const [patients, setPatients] = useState([]);
  const [medicationsList, setMedicationsList] = useState([]);
  const [allShipments, setAllShipments] = useState([]);

  // --- ESTADOS DO FORMULÁRIO (PACIENTE) ---
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatientSuggestions, setFilteredPatientSuggestions] = useState(
    []
  );
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  // --- ESTADOS DO FORMULÁRIO (ITENS) ---
  // Modificado: unit inicia vazio em vez de 'CX'
  const [items, setItems] = useState([
    { name: '', quantity: 1, unit: '', medicationId: null, observation: '' },
  ]);

  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [duplicityWarning, setDuplicityWarning] = useState(null);

  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  const searchTimeout = useRef(null);
  const wrapperRef = useRef(null);
  const patientWrapperRef = useRef(null);

  useEffect(() => {
    loadInitialData();

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveSearchIndex(null);
      }
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

  const loadInitialData = async () => {
    try {
      const [patRes, medRes, openRes, histRes] = await Promise.all([
        api.get('/patients'),
        api.get('/medications?limit=5000'),
        shipmentService.getOpen().catch(() => ({ data: [] })),
        shipmentService.getHistory().catch(() => ({ data: [] })),
      ]);

      setPatients(Array.isArray(patRes.data) ? patRes.data : []);

      const medData = medRes.data;
      if (Array.isArray(medData)) setMedicationsList(medData);
      else if (medData?.data && Array.isArray(medData.data))
        setMedicationsList(medData.data);
      else setMedicationsList([]);

      const open = Array.isArray(openRes.data)
        ? openRes.data
        : openRes.data
          ? [openRes.data]
          : [];
      const hist = Array.isArray(histRes.data) ? histRes.data : [];
      setAllShipments([...open, ...hist]);
    } catch (e) {
      console.error('Erro ao carregar dados iniciais:', e);
    }
  };

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
          unit: m.unit || '', // Modificado aqui também para aceitar vazio se não houver
          medicationId: m.medicationId?._id || m.medicationId,
          observation: m.observation || '',
        }));
        setItems(formattedItems);
      }
    }
  }, [initialData, patients]);

  // --- MOTOR INTELIGENTE DE CHECAGEM DE DUPLICIDADE ---
  useEffect(() => {
    if (selectedPatientId && items.length > 0 && allShipments.length > 0) {
      runSmartDuplicityCheck();
    } else {
      setDuplicityWarning(null);
    }
  }, [selectedPatientId, items, allShipments]);

  const runSmartDuplicityCheck = () => {
    if (!selectedPatientId || allShipments.length === 0) return;

    let highestWarning = null;

    for (const item of items) {
      if (!item.name || item.name.trim() === '') continue;

      for (const ship of allShipments) {
        const patItems = ship.items.filter(
          (i) =>
            i.patientId === selectedPatientId ||
            (i.patient &&
              (i.patient._id === selectedPatientId ||
                i.patient === selectedPatientId))
        );

        for (const patItem of patItems) {
          if (initialData && patItem._id === initialData._id) continue;

          const hasMed = patItem.medications.find(
            (m) =>
              m.name.toLowerCase() === item.name.toLowerCase() ||
              (m.medicationId &&
                item.medicationId &&
                m.medicationId === item.medicationId)
          );

          if (hasMed) {
            const diffTime = Math.abs(
              new Date() - new Date(ship.createdAt || ship.updatedAt)
            );
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isCurrentDraft = ship._id === currentShipmentId;

            if (isCurrentDraft) {
              highestWarning = {
                level: 'red',
                block: true,
                message: `A medicação "${item.name}" já foi adicionada neste exato pedido (Ref: ${ship.code}).`,
              };
              setDuplicityWarning(highestWarning);
              return;
            }

            if (
              ship.status === 'aberta' ||
              ship.status === 'rascunho' ||
              !ship.status
            ) {
              highestWarning = {
                level: 'red',
                block: true,
                message: `Paciente já possui "${item.name}" em outro rascunho aberto (Ref: ${ship.code}).`,
              };
              setDuplicityWarning(highestWarning);
              return;
            }

            if (
              ship.status === 'aguardando_fornecedor' ||
              ship.status === 'aguardando_conferencia'
            ) {
              highestWarning = {
                level: 'red',
                block: true,
                message: `Pendente! "${item.name}" foi solicitado há ${diffDays} dias e está aguardando entrega (Ref: ${ship.code}).`,
              };
              setDuplicityWarning(highestWarning);
              return;
            }

            if (ship.status === 'finalizado' && diffDays <= 20) {
              highestWarning = {
                level: 'red',
                block: true,
                message: `Bloqueado: Paciente RECEBEU "${item.name}" há apenas ${diffDays} dias. Retorno muito recente.`,
              };
              setDuplicityWarning(highestWarning);
              return;
            }
          }
        }
      }
    }
    setDuplicityWarning(highestWarning);
  };

  const getSmartUnitDisplay = (qty, unit) => {
    if (!unit) return '';
    const u = (unit || '').toUpperCase();
    const q = Number(qty) || 1;
    if (u === 'CX' || u === 'CAIXA') return q > 1 ? 'CAIXAS' : 'CAIXA';
    if (u === 'FR' || u === 'FRASCO') return q > 1 ? 'FRASCOS' : 'FRASCO';
    if (u === 'TB' || u === 'TUBO') return q > 1 ? 'TUBOS' : 'TUBO';
    if (u === 'UN' || u === 'UND') return q > 1 ? 'UNIDADES' : 'UNIDADE';
    if (u === 'AMP') return q > 1 ? 'AMPOLAS' : 'AMPOLA';
    if (u === 'CART' || u === 'CARTELA') return q > 1 ? 'CARTELAS' : 'CARTELA';
    if (u === 'BISNAGA' || u === 'BIS') return q > 1 ? 'BISNAGAS' : 'BISNAGA';
    if (u === 'PCT' || u === 'PACOTE') return q > 1 ? 'PACOTES' : 'PACOTE';
    if (u === 'LATA') return q > 1 ? 'LATAS' : 'LATA';
    if (u === 'COMP') return q > 1 ? 'COMPRIMIDOS' : 'COMPRIMIDO';
    return u;
  };

  const handlePatientSearch = (e) => {
    const value = e.target.value;
    setPatientSearchTerm(value);
    setSelectedPatientId('');

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      if (value.trim().length > 0) {
        const lower = value.toLowerCase();

        const results = patients
          .filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              (p.cpf && p.cpf.includes(lower)) ||
              (p.susCard && p.susCard.includes(lower))
          )
          .slice(0, 30);

        setFilteredPatientSuggestions(results);
        setShowPatientSuggestions(true);
      } else {
        setFilteredPatientSuggestions([]);
        setShowPatientSuggestions(false);
      }
    }, 250);
  };

  const selectPatientSuggestion = (patient) => {
    const displayName = `${patient.name} ${patient.cpf ? `(${patient.cpf})` : ''}`;
    setPatientSearchTerm(displayName);
    setSelectedPatientId(patient._id);
    setShowPatientSuggestions(false);
  };

  const handleNameChange = (index, value) => {
    const newItems = [...items];
    newItems[index].name = value;
    // O pulo do gato: se o usuário digitar qualquer coisa, anula o ID,
    // obrigando ele a selecionar da lista novamente.
    newItems[index].medicationId = null;
    setItems(newItems);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
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
    }, 250);
  };

  const selectSuggestion = (index, med) => {
    const newItems = [...items];
    newItems[index].name = med.name;
    newItems[index].medicationId = med._id;
    setItems(newItems);
    setActiveSearchIndex(null);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'unit') {
      newItems[index][field] = value.toUpperCase();
    } else if (field === 'quantity') {
      newItems[index][field] = Math.max(1, parseInt(value) || 1);
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  // --- SUBMIT DO MODAL PRINCIPAL ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId)
      return toast.error('Selecione um paciente válido da lista.');
    if (items.some((i) => i.quantity <= 0))
      return toast.error('Quantidade deve ser maior que zero.');

    // BLOQUEIO: Não deixa salvar se houver medicamento não selecionado da lista
    if (items.some((i) => !i.medicationId)) {
      return toast.error(
        'Selecione os medicamentos usando a lista suspensa. Digitação livre não é permitida.'
      );
    }

    // BLOQUEIO: Não deixa salvar se a unidade não for escolhida
    if (items.some((i) => !i.unit)) {
      return toast.error(
        'Por favor, selecione o tipo de unidade (Caixa, Frasco, etc.) para todos os medicamentos.'
      );
    }

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
            unit: '', // Retorna pra vazio
            medicationId: null,
            observation: '',
          },
        ]);
        setDuplicityWarning(null);
        document.getElementById('patient-search-input')?.focus();
      }

      onSuccess();
    } catch (error) {
      toast.error(
        'Erro ao salvar: ' + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================================
  // INTEGRAÇÃO PERFEITA COM OS FORMULÁRIOS
  // ==================================================================================

  if (showPatientForm) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                <FiUserPlus />
              </div>
              Novo Paciente
            </h3>
            <button
              onClick={() => setShowPatientForm(false)}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>

          <PatientForm
            onClose={() => setShowPatientForm(false)}
            addToast={(msg, type) =>
              type === 'error' ? toast.error(msg) : toast.success(msg)
            }
            onSave={async (dataToSave) => {
              try {
                const res = await api.post('/patients', dataToSave);
                await loadInitialData();
                const novoPaciente = res.data;
                setSelectedPatientId(novoPaciente._id);
                setPatientSearchTerm(
                  `${novoPaciente.name} ${novoPaciente.cpf ? `(${novoPaciente.cpf})` : ''}`
                );
                toast.success('Paciente cadastrado e selecionado!');
              } catch (error) {
                if (error.response?.status === 409) {
                  const getRes = await api.get('/patients');
                  const pacienteExistente = getRes.data.find(
                    (p) =>
                      (dataToSave.susCard &&
                        p.susCard === dataToSave.susCard) ||
                      (dataToSave.cpf && p.cpf === dataToSave.cpf) ||
                      p.name.toLowerCase() === dataToSave.name.toLowerCase()
                  );

                  if (pacienteExistente) {
                    await loadInitialData();
                    setSelectedPatientId(pacienteExistente._id);
                    setPatientSearchTerm(
                      `${pacienteExistente.name} ${pacienteExistente.cpf ? `(${pacienteExistente.cpf})` : ''}`
                    );
                    toast.success('Paciente auto-selecionado com sucesso!');
                  } else {
                    throw error;
                  }
                } else {
                  throw error;
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (showMedForm) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                <FiActivity />
              </div>
              Nova Medicação
            </h3>
            <button
              onClick={() => setShowMedForm(false)}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>
          <MedicationForm
            onClose={() => setShowMedForm(false)}
            addToast={(msg, type) =>
              type === 'error' ? toast.error(msg) : toast.success(msg)
            }
            onSave={async (dataToSave) => {
              await api.post('/medications', dataToSave);
              await loadInitialData();
            }}
          />
        </div>
      </div>
    );
  }

  // --- MODAL PRINCIPAL ---
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-0 relative animate-in slide-in-from-bottom-4 flex flex-col max-h-[90vh] border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
              {initialData ? (
                <>
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                    <FiEdit3 />
                  </div>{' '}
                  Editar Receita
                </>
              ) : (
                <>
                  <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
                    <FiPlus />
                  </div>{' '}
                  Adicionar à Remessa
                </>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {initialData
                ? 'Altere os itens abaixo com atenção'
                : 'Busque o paciente e digite os itens solicitados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition cursor-pointer relative z-10 active:scale-95"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {duplicityWarning && (
            <div
              className={`mb-6 p-5 rounded-2xl flex items-start gap-4 shadow-sm border ${duplicityWarning.level === 'red' ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-amber-50 border-amber-200'}`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${duplicityWarning.level === 'red' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
              >
                {duplicityWarning.level === 'red' ? (
                  <FiShield size={24} />
                ) : (
                  <FiAlertTriangle size={24} />
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-black uppercase tracking-widest mb-1 ${duplicityWarning.level === 'red' ? 'text-red-800' : 'text-amber-800'}`}
                >
                  {duplicityWarning.level === 'red'
                    ? 'Operação Bloqueada pelo Sistema!'
                    : 'Aviso de Duplicidade'}
                </p>
                <p
                  className={`text-sm font-medium ${duplicityWarning.level === 'red' ? 'text-red-700' : 'text-amber-700'}`}
                >
                  {duplicityWarning.message}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} id="shipment-form">
            <div
              className="mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative"
              ref={patientWrapperRef}
            >
              <div className="flex justify-between items-end mb-3">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                  <span className="text-indigo-500 mr-1">1.</span> Identificação
                  do Paciente
                </label>
                {!initialData && (
                  <button
                    type="button"
                    onClick={() => setShowPatientForm(true)}
                    className="text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                  >
                    <FiUserPlus /> Novo Cadastro
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FiSearch size={18} />
                </div>
                <input
                  id="patient-search-input"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-slate-50 focus:bg-white font-bold text-slate-700 transition-all text-sm"
                  placeholder="Digite o nome, CPF ou Cartão SUS..."
                  value={patientSearchTerm}
                  onChange={handlePatientSearch}
                  onFocus={() => {
                    if (patientSearchTerm && !selectedPatientId)
                      handlePatientSearch({
                        target: { value: patientSearchTerm },
                      });
                  }}
                  required
                  disabled={!!initialData}
                  autoComplete="off"
                />

                {showPatientSuggestions &&
                  filteredPatientSuggestions.length > 0 && (
                    <ul className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 p-2">
                      {filteredPatientSuggestions.map((p) => (
                        <li
                          key={p._id}
                          onClick={() => selectPatientSuggestion(p)}
                          className="px-4 py-3 hover:bg-indigo-50 rounded-lg cursor-pointer text-sm transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                        >
                          <span className="font-bold text-slate-700 group-hover:text-indigo-700">
                            {p.name}
                          </span>
                          {p.cpf && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                              {p.cpf}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              {selectedPatientId && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black tracking-wide border border-emerald-200 shadow-sm animate-in zoom-in">
                  <FiCheck size={14} /> Selecionado
                </div>
              )}
            </div>

            <div
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
              ref={wrapperRef}
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                  <span className="text-indigo-500 mr-1">2.</span> Lista de
                  Medicamentos
                </label>
                <button
                  type="button"
                  onClick={() => setShowMedForm(true)}
                  className="text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                >
                  <FiActivity /> Cadastrar Novo
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_50px] gap-4 items-start bg-slate-50/80 p-4 rounded-xl border border-slate-100 relative group transition-all hover:border-indigo-200 hover:shadow-md"
                  >
                    {/* NOME + OBS */}
                    <div className="flex flex-col gap-2 relative">
                      <div className="relative">
                        {/* FEEDBACK VISUAL SE O MEDICAMENTO FOI SELECIONADO DA LISTA */}
                        <span
                          className={`absolute left-3 top-3.5 transition-colors ${item.medicationId ? 'text-emerald-500' : 'text-slate-400'}`}
                        >
                          {item.medicationId ? (
                            <FiCheck size={16} />
                          ) : (
                            <FiSearch size={16} />
                          )}
                        </span>
                        <input
                          placeholder="BUSCAR MEDICAMENTO..."
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none uppercase font-black text-slate-800 placeholder-slate-400 shadow-sm transition-all ${
                            item.medicationId
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-slate-200 bg-white'
                          }`}
                          value={item.name}
                          onChange={(e) =>
                            handleNameChange(index, e.target.value)
                          }
                          onFocus={() => handleNameChange(index, item.name)}
                          required
                          autoComplete="off"
                        />
                      </div>

                      {activeSearchIndex === index &&
                        filteredSuggestions.length > 0 && (
                          <ul className="absolute top-[3.5rem] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 p-2">
                            {filteredSuggestions.map((med) => (
                              <li
                                key={med._id}
                                onClick={() => selectSuggestion(index, med)}
                                className="px-3 py-2.5 hover:bg-indigo-50 rounded-lg cursor-pointer text-sm text-slate-700 font-bold transition-colors"
                              >
                                {med.name}
                              </li>
                            ))}
                          </ul>
                        )}

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                          <FiFileText size={14} />
                        </div>
                        <input
                          placeholder="Observação extra (Ex: Genérico, Posologia...)"
                          className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none bg-white text-slate-600 transition-all shadow-sm"
                          value={item.observation}
                          onChange={(e) =>
                            updateItem(index, 'observation', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* QUANTIDADE COM CONTROLE + E - */}
                    <div className="flex flex-col h-[46px]">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-full shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(index, 'quantity', item.quantity - 1)
                          }
                          className="w-10 flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer h-full border-r border-slate-100 active:bg-slate-200 transition-colors"
                        >
                          <FiMinus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="w-full h-full text-center font-black text-slate-800 text-sm outline-none bg-transparent"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, 'quantity', e.target.value)
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(index, 'quantity', item.quantity + 1)
                          }
                          className="w-10 flex items-center justify-center hover:bg-slate-100 text-indigo-600 cursor-pointer h-full border-l border-slate-100 active:bg-slate-200 transition-colors"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* UNIDADE INTELIGENTE (AGORA SELECT VAZIO OBRIGATÓRIO) */}
                    <div className="flex flex-col">
                      <div className="relative h-[46px]">
                        <select
                          className="w-full h-full pl-3 pr-8 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none uppercase font-black text-slate-700 bg-white shadow-sm transition-all appearance-none cursor-pointer text-center"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(index, 'unit', e.target.value)
                          }
                          required
                        >
                          <option value="" disabled>
                            UNID...
                          </option>
                          <option value="CX">Caixa</option>
                          <option value="FR">Frasco</option>
                          <option value="TB">Tubo</option>
                          <option value="UN">Unidade</option>
                          <option value="CART">Cartela</option>
                          <option value="BIS">Bisnaga</option>
                          <option value="PCT">Pacote</option>
                          <option value="LATA">Lata</option>
                          <option value="AMP">Ampola</option>
                          <option value="COMP">Comprim</option>
                        </select>
                        <FiChevronDown
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                      </div>
                      {item.unit && (
                        <span className="text-[10px] text-center mt-1.5 font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 py-0.5 rounded-md border border-indigo-100">
                          {item.quantity}{' '}
                          {getSmartUnitDisplay(item.quantity, item.unit)}
                        </span>
                      )}
                    </div>

                    {/* EXCLUIR LINHA */}
                    <div className="flex items-start h-full pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (items.length > 1) {
                            const newItems = items.filter(
                              (_, i) => i !== index
                            );
                            setItems(newItems);
                          }
                        }}
                        className={`w-full h-[42px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${items.length === 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm active:scale-95'}`}
                        disabled={items.length === 1}
                        title="Remover medicamento"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      name: '',
                      quantity: 1,
                      unit: '',
                      medicationId: null,
                      observation: '',
                    },
                  ])
                }
                className="mt-5 w-full bg-slate-50 border-2 border-dashed border-slate-200 text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 py-3.5 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <FiPlus size={18} /> Adicionar outro medicamento nesta receita
              </button>
            </div>
          </form>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-white rounded-b-3xl flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors cursor-pointer active:scale-95 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="shipment-form"
            disabled={loading || (duplicityWarning && duplicityWarning.block)}
            className={`px-8 py-3.5 rounded-xl font-black shadow-xl flex items-center gap-2 min-w-[160px] justify-center transition-all text-sm ${
              duplicityWarning && duplicityWarning.block
                ? 'bg-red-100 text-red-500 shadow-none cursor-not-allowed border border-red-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 cursor-pointer active:scale-95'
            }`}
          >
            {loading ? (
              <ClipLoader size={20} color="#fff" />
            ) : (
              <>
                {duplicityWarning && duplicityWarning.block ? (
                  <FiShield size={18} />
                ) : (
                  <FiSave size={18} />
                )}
                {duplicityWarning && duplicityWarning.block
                  ? 'Bloqueado por Duplicidade'
                  : initialData
                    ? 'Atualizar Pedido'
                    : 'Salvar no Rascunho'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

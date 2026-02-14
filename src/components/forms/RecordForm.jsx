import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import MedicationForm from './MedicationForm';
import { icons } from '../../utils/icons';
import { ClipLoader } from 'react-spinners';
import api from '../../services/api';
import { addToSyncQueue } from '../../services/offlineStorage';

const quantityOptions = [
  '1cx (30cp)',
  '1cx (60cp)',
  '2cxs (total 60cp)',
  '2cxs (total 120cp)',
  '3cxs',
  '4cxs',
  '5cxs',
  '6cxs',
  '7cxs',
  '1 Frasco',
  '2 Frascos',
  '3 Frascos',
  '1 Bisnaga',
  '2 Bisnagas',
  '1 Ampola',
  '1 Seringa',
  '1cx',
  '2cxs',
  '1tb',
];

// Função auxiliar segura
const getQuantityMultiplier = (quantityString) => {
  if (!quantityString) return 1;
  const match = String(quantityString).match(/^(\d+)/);
  return match ? parseFloat(match[0]) : 1;
};

export default function RecordForm({
  patient,
  patients = [],
  profissionalId,
  records = [],
  record,
  recentRecord = null,
  onSave,
  onClose,
  medicationsList = [],
  onNewMedication,
  addToast,
}) {
  const user = JSON.parse(localStorage.getItem('user'));
  const [localPatient, setLocalPatient] = useState(patient || null);
  const [referenceDate, setReferenceDate] = useState('');
  const [observation, setObservation] = useState('');
  const [fornecedor, setFornecedor] = useState(''); 

  const [medications, setMedications] = useState([
    {
      medicationId: '',
      savedName: '', // Novo campo para backup visual
      quantity: quantityOptions[0],
      unitValue: '',
      value: '',
      tempId: Date.now(),
    },
  ]);

  const [farmaciaOrigin, setFarmaciaOrigin] = useState(
    record?.farmacia || record?.pharmacy || ''
  );

  const [distributorList, setDistributorList] = useState([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);

  // Estados de busca/modal
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const [openMedSelectIndex, setOpenMedSelectIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoFilled, setAutoFilled] = useState(false);

  const patientInputRef = useRef(null);
  const listRef = useRef(null);

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchDistributors = async () => {
      setIsLoadingDistributors(true);
      try {
        const response = await api.get('/distributors');
        if (response.data && Array.isArray(response.data)) {
          setDistributorList(response.data);
        }
      } catch (error) {
        setDistributorList([]);
      } finally {
        setIsLoadingDistributors(false);
      }
    };
    fetchDistributors();
  }, []);

  useEffect(() => {
    const today = getLocalDateString();

    if (record) {
      // --- MODO EDIÇÃO ---
      setReferenceDate(
        record.referenceDate
          ? new Date(record.referenceDate).toISOString().slice(0, 10)
          : today
      );
      setObservation(record.observation || '');
      setFornecedor(record.fornecedor || '');
      setLocalPatient(patient || null);
      setFarmaciaOrigin(record.farmacia || record.pharmacy || '');

      const existingMeds =
        record.medications?.map((m, i) => {
          // --- CORREÇÃO 1: Normalização da Quantidade (Evita erro .trim()) ---
          let rawQty = m.quantity;
          if (typeof rawQty === 'number') rawQty = String(rawQty);
          // Adiciona unidade se vier apenas número puro (opcional, melhora visual)
          if (rawQty && !isNaN(rawQty) && m.unit) rawQty = `${rawQty} ${m.unit}`;
          
          const qty = rawQty && rawQty.trim() !== '' ? rawQty : quantityOptions[0];

          // --- CORREÇÃO 2: Extração do ID e Nome (Resolve "Desconhecido") ---
          let realId = '';
          let realName = '';

          // Se medicationId for um objeto (populado pelo backend), extraímos o _id e o nome
          if (m.medicationId && typeof m.medicationId === 'object') {
             realId = m.medicationId._id || m.medicationId.id;
             realName = m.medicationId.name;
          } else {
             realId = m.medicationId; // É apenas a string ID
          }

          // Se não veio nome do populate, tentamos pegar o nome gravado no item (do nosso fix anterior)
          if (!realName && m.name) realName = m.name;
          // -------------------------------------------------------------------

          const multiplier = getQuantityMultiplier(qty);
          const totalVal = parseFloat(m.value) || 0;
          const calculatedUnit =
            multiplier > 0 && totalVal > 0
              ? (totalVal / multiplier).toFixed(2)
              : '';

          return {
            medicationId: realId || '',
            savedName: realName || '', // Guardamos o nome para usar se o ID não for achado na lista
            quantity: qty,
            unitValue: calculatedUnit,
            value: m.value || '',
            tempId: m.recordMedId || m.id || `edit-${i}`,
          };
        }) || [];

      setMedications(
        existingMeds.length > 0
          ? existingMeds
          : [
              {
                medicationId: '',
                savedName: '',
                quantity: quantityOptions[0],
                unitValue: '',
                value: '',
                tempId: Date.now(),
              },
            ]
      );
    } else {
      // --- MODO NOVO ---
      setReferenceDate(today);
      setFornecedor('');
      if (patient) setLocalPatient(patient);
      if (!farmaciaOrigin) setFarmaciaOrigin('');
    }
  }, [record, patient]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        listRef.current &&
        !listRef.current.contains(event.target) &&
        patientInputRef.current &&
        !patientInputRef.current.contains(event.target)
      ) {
        setShowPatientList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm) return patients.slice(0, 20);
    const lower = patientSearchTerm.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          String(p.cpf || '').includes(lower)
      )
      .slice(0, 50);
  }, [patients, patientSearchTerm]);

  const filteredMedications = useMemo(() => {
    if (!medSearchTerm) return medicationsList.slice(0, 50);
    return medicationsList.filter((m) =>
      m.name.toLowerCase().includes(medSearchTerm.toLowerCase())
    );
  }, [medicationsList, medSearchTerm]);

  const handleSelectPatient = (p) => {
    setLocalPatient(p);
    setPatientSearchTerm('');
    setShowPatientList(false);
    setAutoFilled(false);
    setMedications([
      {
        medicationId: '',
        savedName: '',
        quantity: quantityOptions[0],
        unitValue: '',
        value: '',
        tempId: Date.now(),
      },
    ]);
    setErrors({});
  };

  const handleClearForm = () => {
    setLocalPatient(null);
    setMedications([
      {
        medicationId: '',
        savedName: '',
        quantity: quantityOptions[0],
        unitValue: '',
        value: '',
        tempId: Date.now(),
      },
    ]);
    setObservation('');
    setFornecedor('');
    setFarmaciaOrigin('');
    setErrors({});
  };

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        medicationId: '',
        savedName: '',
        quantity: quantityOptions[0],
        unitValue: '',
        value: '',
        tempId: Date.now(),
      },
    ]);
  };

  const removeMedicationRow = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, newValue) => {
    const newMeds = [...medications];
    const currentMed = newMeds[index];

    if (field === 'medicationId') {
        currentMed.medicationId = newValue;
        // Atualiza o nome salvo também se encontrar na lista
        const selected = medicationsList.find(m => (m._id || m.id) === newValue);
        if (selected) currentMed.savedName = selected.name;
    }
    else if (field === 'quantity') {
      currentMed.quantity = newValue;
      const multiplier = getQuantityMultiplier(newValue);
      const uVal = parseFloat(currentMed.unitValue) || 0;
      if (uVal > 0) currentMed.value = (uVal * multiplier).toFixed(2);
    } else if (field === 'unitValue') {
      currentMed.unitValue = newValue;
      const multiplier = getQuantityMultiplier(currentMed.quantity);
      const uVal = parseFloat(newValue) || 0;
      currentMed.value = (uVal * multiplier).toFixed(2);
    } else if (field === 'value') {
      currentMed.value = newValue;
      const multiplier = getQuantityMultiplier(currentMed.quantity);
      const tVal = parseFloat(newValue) || 0;
      if (multiplier > 0 && tVal > 0)
        currentMed.unitValue = (tVal / multiplier).toFixed(2);
    }
    setMedications(newMeds);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    let hasError = false;
    let newErrors = {};

    if (!localPatient) {
      newErrors.patient = 'Selecione um paciente.';
      hasError = true;
    }
    if (!farmaciaOrigin) {
      newErrors.farmacia = 'A origem (farmácia) é obrigatória.';
      hasError = true;
    }

    const validMeds = medications.filter((m) => m.medicationId);
    if (validMeds.length === 0) {
      newErrors.medications = 'Adicione pelo menos um medicamento.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      addToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const payload = {
      patientId: localPatient._id || localPatient.id,
      patientName: localPatient.name,
      profissionalId: user?.id || user?._id || localStorage.getItem('userId') || 'offline-user',
      profissionalName: user?.name || 'Profissional',
      farmacia: farmaciaOrigin,
      fornecedor: fornecedor,
      referenceDate: referenceDate,
      observation: observation,
      medications: validMeds.map((m) => ({
        medicationId: m.medicationId,
        // Envia o nome também para garantir consistência futura
        name: m.savedName || medicationsList.find(ml => (ml._id || ml.id) === m.medicationId)?.name,
        quantity: m.quantity,
        value: parseFloat(m.value) || 0,
      })),
      date: new Date().toISOString(),
    };

    setIsSaving(true);

    try {
      if (navigator.onLine) {
        if (onSave) {
          await onSave(payload);
        } else {
          await api.post('/medications/dispense', payload);
          addToast('Registrado com sucesso!', 'success');
        }
        if (onClose) onClose();
      } else {
        throw new Error('OFFLINE_MODE');
      }
    } catch (error) {
      const isNetworkError =
        error.message === 'Erro de conexão' ||
        error.message === 'OFFLINE_MODE' ||
        error.code === 'ERR_NETWORK';
      if (isNetworkError) {
        try {
          await addToSyncQueue({ type: 'DISPENSE', payload: payload });
          addToast('Salvo localmente (sem internet)!', 'success');
          if (onSave && !record) onSave(payload);
          if (onClose) onClose();
        } catch (dbError) {
          addToast('Erro ao salvar localmente.', 'error');
        }
      } else {
        if (!onSave) {
          const msg = error.response?.data?.message || 'Erro ao salvar.';
          addToast(msg, 'error');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={record ? 'Editar Registro' : 'Novo Registro'}
    >
      <div className="flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]">
        <div className="flex-1 overflow-y-auto px-1 md:px-2 pb-6 custom-scrollbar">
          <div className="space-y-6 pt-2">
            {/* --- SEÇÃO PACIENTE --- */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Paciente <span className="text-red-500">*</span>
              </label>
              {!localPatient ? (
                <div ref={patientInputRef}>
                  <div className="relative group">
                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      {icons.search}
                    </span>
                    <input
                      type="text"
                      className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all ${errors.patient ? 'border-red-500 bg-red-50 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500'}`}
                      placeholder="Buscar por nome, CPF..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientList(true);
                      }}
                      onFocus={() => setShowPatientList(true)}
                    />
                  </div>
                  {showPatientList && (
                    <div
                      ref={listRef}
                      className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar"
                    >
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => (
                          <div
                            key={p.id || p._id}
                            onClick={() => handleSelectPatient(p)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <p className="font-medium text-gray-800">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              CPF: {p.cpf || 'N/A'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Nenhum paciente encontrado.
                        </div>
                      )}
                    </div>
                  )}
                  {errors.patient && (
                    <p className="text-sm text-red-500 mt-1 pl-1">
                      {errors.patient}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {icons.user || '👤'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-base">
                        {localPatient.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        CPF: {localPatient.cpf || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearForm}
                    className="text-gray-400 hover:text-red-500 hover:bg-white p-2 rounded-full transition-all shadow-sm"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* --- DATA E ORIGEM --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data de Referência
                </label>
                <input
                  type="date"
                  value={referenceDate}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-xl px-4 py-3 outline-none cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Origem / Farmácia <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="distributors-list"
                    value={farmaciaOrigin}
                    onChange={(e) => {
                      setFarmaciaOrigin(e.target.value);
                      setErrors((prev) => ({ ...prev, farmacia: null }));
                    }}
                    placeholder="Selecione ou digite..."
                    className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white transition-all ${errors.farmacia ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                  />
                  <datalist id="distributors-list">
                    {distributorList.map((dist, idx) => (
                      <option key={dist._id || idx} value={dist.name} />
                    ))}
                    <option value="Central">Central</option>
                    <option value="Unidade Básica">Unidade Básica</option>
                  </datalist>
                  {errors.farmacia && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {errors.farmacia}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --- FORNECEDOR --- */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fornecedor{' '}
                <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
                placeholder="Ex: Eurofarma"
              />
            </div>

            <hr className="border-gray-100" />

            {/* --- MEDICAMENTOS --- */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  Medicamentos{' '}
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {medications.length}
                  </span>
                </label>
                <button
                  onClick={() => setIsMedicationModalOpen(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  + Novo Item
                </button>
              </div>

              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div
                    key={med.tempId}
                    className="flex flex-col xl:flex-row gap-3 items-start xl:items-center bg-gray-50/80 p-3 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all animate-fadeIn"
                  >
                    <div className="flex-1 w-full relative">
                      <div
                        className={`w-full bg-white border rounded-lg px-3 py-2.5 cursor-pointer flex justify-between items-center shadow-sm hover:border-blue-300 transition-all ${!med.medicationId && errors.medications ? 'border-red-300' : 'border-gray-200'}`}
                        onClick={() => {
                          setOpenMedSelectIndex(
                            openMedSelectIndex === index ? null : index
                          );
                          setMedSearchTerm('');
                        }}
                      >
                        <span
                          className={`block truncate text-sm font-medium ${!med.medicationId ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          {/* CORREÇÃO: Usa o savedName se não achar na lista */}
                          {med.medicationId
                            ? medicationsList.find(
                                (m) => (m._id || m.id) === med.medicationId
                              )?.name || med.savedName || 'Desconhecido'
                            : 'Selecione o medicamento...'}
                        </span>
                        <span className="text-gray-400 text-xs ml-2">▼</span>
                      </div>
                      {openMedSelectIndex === index && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-56 overflow-y-auto custom-scrollbar">
                          <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                            <input
                              autoFocus
                              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                              placeholder="Filtrar..."
                              value={medSearchTerm}
                              onChange={(e) => setMedSearchTerm(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredMedications.map((m) => (
                            <div
                              key={m.id || m._id}
                              className="px-4 py-2.5 hover:bg-blue-50 text-sm text-gray-700 cursor-pointer border-b border-gray-50 last:border-0"
                              onClick={() => {
                                updateMedication(
                                  index,
                                  'medicationId',
                                  m.id || m._id
                                );
                                setOpenMedSelectIndex(null);
                              }}
                            >
                              {m.name}
                            </div>
                          ))}
                          {filteredMedications.length === 0 && (
                            <div className="p-3 text-center text-xs text-gray-400">
                              Nenhum resultado.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full xl:w-auto items-center">
                      <div className="w-full sm:w-32 relative">
                        <input
                          type="text"
                          list={`quantity-options-${index}`}
                          value={med.quantity}
                          onChange={(e) =>
                            updateMedication(index, 'quantity', e.target.value)
                          }
                          placeholder="Qtd..."
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-blue-400 placeholder-gray-400"
                        />
                        <datalist id={`quantity-options-${index}`}>
                          {quantityOptions.map((q) => (
                            <option key={q} value={q} />
                          ))}
                        </datalist>
                      </div>
                      <div className="w-1/2 sm:w-24 relative group/unit">
                        <span className="absolute left-2 top-2.5 text-xs text-gray-400">
                          Uni.
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={med.unitValue}
                          onChange={(e) =>
                            updateMedication(index, 'unitValue', e.target.value)
                          }
                          className="w-full pl-9 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 text-gray-700"
                        />
                      </div>
                      <div className="w-1/2 sm:w-28 relative group/total">
                        <span className="absolute left-2.5 top-2.5 text-xs text-gray-400 font-bold">
                          R$
                        </span>
                        <input
                          type="number"
                          placeholder="Total"
                          value={med.value}
                          onChange={(e) =>
                            updateMedication(index, 'value', e.target.value)
                          }
                          className="w-full pl-8 pr-2 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-800 outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => removeMedicationRow(index)}
                        className={`p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer ${medications.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        title="Remover item"
                      >
                        {icons.trash}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addMedicationRow}
                className="mt-4 w-full py-2 border-2 border-dashed border-blue-100 text-blue-500 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                <span>+</span> Adicionar outro medicamento
              </button>
              {errors.medications && (
                <p className="text-sm text-center text-red-500 mt-2 bg-red-50 py-1 rounded">
                  {errors.medications}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                rows="3"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                placeholder="Insira detalhes..."
              />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 border-t border-gray-100 bg-white rounded-b-xl z-10 flex gap-3 shadow-top">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.99] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <ClipLoader size={18} color="#fff" />
                <span>Salvando...</span>
              </div>
            ) : record ? (
              'Salvar Alterações'
            ) : (
              'Confirmar Registro'
            )}
          </button>
        </div>
      </div>
      {isMedicationModalOpen && (
        <MedicationForm
          onClose={() => setIsMedicationModalOpen(false)}
          onSave={async (newMed) => {
            await onNewMedication(newMed);
            setIsMedicationModalOpen(false);
          }}
        />
      )}
    </Modal>
  );
}
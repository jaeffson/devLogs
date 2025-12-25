import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import MedicationForm from './MedicationForm';
import { icons } from '../../utils/icons';
import { ClipLoader } from 'react-spinners';
import api from '../../services/api';

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
  const [localPatient, setLocalPatient] = useState(patient || null);
  const [referenceDate, setReferenceDate] = useState('');
  const [observation, setObservation] = useState('');
  const [medications, setMedications] = useState([
    {
      medicationId: '',
      quantity: quantityOptions[0],
      value: '',
      tempId: Date.now(),
    },
  ]);

  const [farmaciaOrigin, setFarmaciaOrigin] = useState(
    record?.farmacia || record?.pharmacy || ''
  );

  const [distributorList, setDistributorList] = useState([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);

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
        console.error('Erro ao carregar distribuidoras:', error);
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
      setReferenceDate(
        record.referenceDate
          ? new Date(record.referenceDate).toISOString().slice(0, 10)
          : today
      );
      setObservation(record.observation || '');
      setLocalPatient(patient || null);
      setFarmaciaOrigin(record.farmacia || record.pharmacy || '');

      const existingMeds =
        record.medications?.map((m, i) => ({
          medicationId: m.medicationId || '',
          quantity: m.quantity || quantityOptions[0],
          value: m.value || '',
          tempId: m.recordMedId || m.id || `edit-${i}`,
        })) || [];

      setMedications(
        existingMeds.length > 0
          ? existingMeds
          : [
              {
                medicationId: '',
                quantity: quantityOptions[0],
                value: '',
                tempId: Date.now(),
              },
            ]
      );
    } else {
      setReferenceDate(today);
      if (patient) setLocalPatient(patient);
      if (!farmaciaOrigin) setFarmaciaOrigin('');
    }
  }, [record, patient]);

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

  const activeRecentRecord = useMemo(() => {
    if (!localPatient) return null;
    if (
      recentRecord &&
      recentRecord.patientId === (localPatient._id || localPatient.id)
    ) {
      return recentRecord;
    }
    if (Array.isArray(records)) {
      const targetId = localPatient._id || localPatient.id;
      const patientRecords = records
        .filter((r) => r.patientId === targetId && r.status !== 'Cancelado')
        .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

      if (patientRecords.length > 0) {
        const last = patientRecords[0];
        const diff = new Date().getTime() - new Date(last.entryDate).getTime();
        const days = diff / (1000 * 3600 * 24);
        if (days <= 20) return last;
      }
    }
    return null;
  }, [localPatient, recentRecord, records]);

  const repeatLastPrescription = () => {
    if (!activeRecentRecord || !activeRecentRecord.medications) return;
    const copiedMeds = activeRecentRecord.medications.map((m, i) => ({
      medicationId: m.medicationId || m.id || m._id,
      quantity: m.quantity || quantityOptions[0],
      value: m.value || '',
      tempId: Date.now() + i,
    }));
    setMedications(copiedMeds);
    setAutoFilled(true);
    addToast('Medicações carregadas!', 'success');
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm) return patients.slice(0, 20);
    const lower = patientSearchTerm.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          String(p.cpf || '').includes(lower) ||
          String(p.susCard || '').includes(lower)
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
        quantity: quantityOptions[0],
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
        quantity: quantityOptions[0],
        value: '',
        tempId: Date.now(),
      },
    ]);
    setObservation('');
    setFarmaciaOrigin('');
    setErrors({});
  };

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        medicationId: '',
        quantity: quantityOptions[0],
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

  const updateMedication = (index, field, value) => {
    const newMeds = [...medications];
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const handleSubmit = async () => {
    // Validação básica
    let hasError = false;
    let newErrors = {};

    if (!localPatient) {
      newErrors.patient = 'Selecione um paciente.';
      hasError = true;
    }

    // --- MUDANÇA: Validação Obrigatória da Farmácia ---
    if (!farmaciaOrigin) {
      newErrors.farmacia = 'A origem (farmácia) é obrigatória.';
      hasError = true;
    }
    // --------------------------------------------------

    const validMeds = medications.every((m) => m.medicationId);
    if (!validMeds) {
      newErrors.medications = 'Preencha todos os medicamentos ou remova as linhas vazias.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      // Feedback visual rápido se houver erro
      addToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const calculatedTotal = medications.reduce(
        (acc, curr) => acc + (parseFloat(curr.value) || 0),
        0
      );

      const payload = {
        _id: record?._id || record?.id,
        patientId: localPatient._id || localPatient.id,
        profissionalId,
        referenceDate,
        observation,
        status: record?.status || 'Pendente',
        farmacia: farmaciaOrigin,
        pharmacy: farmaciaOrigin,
        totalValue: calculatedTotal,
        medications: medications.map((m) => ({
          medicationId: m.medicationId,
          quantity: m.quantity,
          value: parseFloat(m.value) || 0,
        })),
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
      addToast('Erro ao salvar registro', 'error');
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
      {/* Estrutura principal: Flex Column
        Topo e Meio: Scrollam
        Fundo: Fixo
      */}
      <div className="flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]">
        
        {/* ÁREA DE CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto px-1 md:px-2 pb-6 custom-scrollbar">
          <div className="space-y-6 pt-2">
            
            {/* 1. SELEÇÃO DE PACIENTE */}
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
                      className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all ${
                        errors.patient
                          ? 'border-red-500 bg-red-50 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Buscar por nome, CPF ou cartão SUS..."
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
                            <p className="font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              CPF: {p.cpf || 'N/A'} • SUS: {p.susCard || 'N/A'}
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
                    title="Remover paciente"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* 2. REPETIR PRESCRIÇÃO (Banner) */}
            {activeRecentRecord && !autoFilled && !record && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <span className="text-emerald-500 text-lg">↺</span>
                  <div>
                    <span className="font-bold">Último registro encontrado:</span>{' '}
                    {new Date(activeRecentRecord.entryDate).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={repeatLastPrescription}
                  className="w-full sm:w-auto text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
                >
                  Repetir Prescrição
                </button>
              </div>
            )}

            {/* 3. DATA E FARMÁCIA */}
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
                  Origem / Farmácia{' '}
                  <span className="text-red-500">*</span> {/* Indicador de Obrigatório */}
                  {isLoadingDistributors && (
                    <span className="text-xs text-blue-500 font-normal ml-1 animate-pulse">
                      (Carregando...)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={farmaciaOrigin}
                    onChange={(e) => {
                      setFarmaciaOrigin(e.target.value);
                      setErrors((prev) => ({ ...prev, farmacia: null }));
                    }}
                    className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 appearance-none bg-white cursor-pointer transition-all ${
                      errors.farmacia
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={isLoadingDistributors}
                  >
                    <option value="">Selecione a Origem...</option>
                    {distributorList.length > 0 ? (
                      distributorList.map((dist, idx) => (
                        <option
                          key={dist._id || dist.id || idx}
                          value={dist.name}
                        >
                          {dist.name}
                        </option>
                      ))
                    ) : (
                      !isLoadingDistributors && <option disabled>Nenhuma farmácia cadastrada</option>
                    )}
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-gray-400">
                    {icons.chevronDown}
                  </div>
                </div>
                {errors.farmacia && (
                  <p className="text-xs text-red-500 mt-1 pl-1">
                    {errors.farmacia}
                  </p>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 4. MEDICAMENTOS */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  Medicamentos
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {medications.length}
                  </span>
                </label>
                <button
                  onClick={() => setIsMedicationModalOpen(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  + Novo Item no Estoque
                </button>
              </div>

              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div
                    key={med.tempId}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50/80 p-3 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all animate-fadeIn"
                  >
                    {/* Select Medicamento */}
                    <div className="flex-1 w-full relative">
                      <div
                        className={`w-full bg-white border rounded-lg px-3 py-2.5 cursor-pointer flex justify-between items-center shadow-sm hover:border-blue-300 transition-all ${
                          !med.medicationId && errors.medications
                            ? 'border-red-300'
                            : 'border-gray-200'
                        }`}
                        onClick={() => {
                          setOpenMedSelectIndex(
                            openMedSelectIndex === index ? null : index
                          );
                          setMedSearchTerm('');
                        }}
                      >
                        <span
                          className={`block truncate text-sm font-medium ${
                            !med.medicationId ? 'text-gray-400' : 'text-gray-700'
                          }`}
                        >
                          {med.medicationId
                            ? medicationsList.find(
                                (m) => (m._id || m.id) === med.medicationId
                              )?.name || 'Desconhecido'
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

                    <div className="flex gap-2 w-full sm:w-auto">
                      {/* Quantidade */}
                      <div className="w-1/2 sm:w-32">
                        <select
                          value={med.quantity}
                          onChange={(e) =>
                            updateMedication(index, 'quantity', e.target.value)
                          }
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm outline-none cursor-pointer focus:border-blue-400"
                        >
                          {quantityOptions.map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Valor */}
                      <div className="w-1/2 sm:w-28 relative">
                        <span className="absolute left-2.5 top-2.5 text-xs text-gray-400">R$</span>
                        <input
                          type="number"
                          placeholder="0,00"
                          value={med.value}
                          onChange={(e) =>
                            updateMedication(index, 'value', e.target.value)
                          }
                          className="w-full pl-7 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                        />
                      </div>

                      {/* Deletar */}
                      <button
                        onClick={() => removeMedicationRow(index)}
                        className={`p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer ${
                          medications.length === 1 ? 'opacity-0 pointer-events-none' : ''
                        }`}
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

            {/* 5. OBSERVAÇÕES */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                rows="3"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                placeholder="Insira detalhes adicionais sobre o atendimento..."
              />
            </div>
          </div>
        </div>

        {/* RODAPÉ FIXO DE AÇÕES */}
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
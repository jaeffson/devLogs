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

    // Se for um novo registro, forçamos a data de hoje.
    // Se for edição, mantemos a data original do registro mas bloqueada.
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
      setReferenceDate(today); // Data travada no dia atual
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
  // ... validações existentes ...

  setIsSaving(true);
  try {
    // CALCULA O VALOR TOTAL SOMANDO TODAS AS MEDICAÇÕES
    const calculatedTotal = medications.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);

    const payload = {
      _id: record?._id || record?.id,
      patientId: localPatient._id || localPatient.id,
      profissionalId,
      referenceDate,
      observation,
      status: record?.status || 'Pendente',
      farmacia: farmaciaOrigin, 
      pharmacy: farmaciaOrigin, 
      totalValue: calculatedTotal, // <--- ADICIONE ESTA LINHA
      medications: medications.map(m => ({
        medicationId: m.medicationId,
        quantity: m.quantity,
        value: parseFloat(m.value) || 0
      }))
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
      <div className="space-y-6">
        {/* 1. SELEÇÃO DE PACIENTE */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paciente
          </label>
          {!localPatient ? (
            <div ref={patientInputRef}>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  {icons.search}
                </span>
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.patient ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
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
                  className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto"
                >
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id || p._id}
                      onClick={() => handleSelectPatient(p)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        CPF: {p.cpf || 'N/A'} • SUS: {p.susCard || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {errors.patient && (
                <p className="text-sm text-red-500 mt-1">{errors.patient}</p>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-blue-900">{localPatient.name}</p>
                <p className="text-sm text-blue-600">
                  CPF: {localPatient.cpf || 'N/A'}
                </p>
              </div>
              <button
                onClick={handleClearForm}
                className="text-blue-400 hover:text-red-500 p-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 2. REPETIR PRESCRIÇÃO */}
        {activeRecentRecord && !autoFilled && !record && (
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center animate-fadeIn">
            <div className="text-sm text-emerald-800">
              <span className="font-bold">Último registro encontrado:</span>{' '}
              {new Date(activeRecentRecord.entryDate).toLocaleDateString()}
            </div>
            <button
              onClick={repeatLastPrescription}
              className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 cursor-pointer"
            >
              Repetir Prescrição
            </button>
          </div>
        )}

        {/* 3. DATA E FARMÁCIA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data (Bloqueada)
            </label>
            <input
              type="date"
              value={referenceDate}
              readOnly // TRAVA A DATA
              className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-4 py-2.5 outline-none cursor-not-allowed"
              title="A data do registro não pode ser alterada manualmente."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origem / Farmácia{' '}
              {isLoadingDistributors && (
                <span className="text-xs text-blue-500">(Carregando...)</span>
              )}
            </label>
            <div className="relative">
              <select
                value={farmaciaOrigin}
                onChange={(e) => {
                  setFarmaciaOrigin(e.target.value);
                  setErrors((prev) => ({ ...prev, farmacia: null }));
                }}
                className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer ${errors.farmacia ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoadingDistributors}
              >
                <option value="">Selecione a Origem...</option>
                {distributorList.length > 0
                  ? distributorList.map((dist, idx) => (
                      <option
                        key={dist._id || dist.id || idx}
                        value={dist.name}
                      >
                        {dist.name}
                      </option>
                    ))
                  : !isLoadingDistributors && (
                      <option disabled>Nenhuma farmácia cadastrada</option>
                    )}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                {icons.chevronDown}
              </div>
            </div>
            {errors.farmacia && (
              <p className="text-xs text-red-500 mt-1">{errors.farmacia}</p>
            )}
          </div>
        </div>

        {/* 4. MEDICAMENTOS */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Medicamentos
            </label>
            <button
              onClick={() => setIsMedicationModalOpen(true)}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              + Cadastrar Novo
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={med.tempId}
                className="flex gap-2 items-start animate-fadeIn"
              >
                <div className="flex-1 relative">
                  <div
                    className={`w-full border rounded-lg px-3 py-2 cursor-pointer flex justify-between items-center ${!med.medicationId && errors.medications ? 'border-red-300' : 'border-gray-300'}`}
                    onClick={() => {
                      setOpenMedSelectIndex(
                        openMedSelectIndex === index ? null : index
                      );
                      setMedSearchTerm('');
                    }}
                  >
                    <span
                      className={`block truncate ${!med.medicationId ? 'text-gray-400' : 'text-gray-800'}`}
                    >
                      {med.medicationId
                        ? medicationsList.find(
                            (m) => (m._id || m.id) === med.medicationId
                          )?.name || 'Desconhecido'
                        : 'Selecione o medicamento...'}
                    </span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </div>

                  {openMedSelectIndex === index && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      <input
                        autoFocus
                        className="w-full p-2 border-b border-gray-100 text-sm outline-none"
                        placeholder="Filtrar..."
                        value={medSearchTerm}
                        onChange={(e) => setMedSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {filteredMedications.map((m) => (
                        <div
                          key={m.id || m._id}
                          className="p-2 hover:bg-blue-50 text-sm cursor-pointer"
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
                    </div>
                  )}
                </div>

                <div className="w-32">
                  <select
                    value={med.quantity}
                    onChange={(e) =>
                      updateMedication(index, 'quantity', e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none cursor-pointer"
                  >
                    {quantityOptions.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    placeholder="R$ 0,00"
                    value={med.value}
                    onChange={(e) =>
                      updateMedication(index, 'value', e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none"
                  />
                </div>

                <button
                  onClick={() => removeMedicationRow(index)}
                  className={`p-2 text-gray-400 hover:text-red-500 cursor-pointer ${medications.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  {icons.trash}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addMedicationRow}
            className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            + Adicionar outro medicamento
          </button>
          {errors.medications && (
            <p className="text-xs text-red-500 mt-2">{errors.medications}</p>
          )}
        </div>

        {/* 5. OBSERVAÇÕES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            rows="3"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detalhes adicionais..."
          />
        </div>

        {/* AÇÕES */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 flex justify-center items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <ClipLoader size={20} color="#fff" />
            ) : record ? (
              'Salvar Alterações'
            ) : (
              'Criar Registro'
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

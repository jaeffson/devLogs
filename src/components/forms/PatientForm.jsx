// src/components/forms/PatientForm.jsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ClipLoader } from 'react-spinners';
import api from '../../services/api';
import {
  FiUser,
  FiCreditCard,
  FiFileText,
  FiInfo,
  FiAlertCircle,
  FiActivity,
} from 'react-icons/fi';

// --- FUNÇÕES UTILITÁRIAS DE MÁSCARA ---

const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = String(cpf).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
  if (!match) return cleaned;
  let formatted = match[1];
  if (match[2]) formatted += `.${match[2]}`;
  if (match[3]) formatted += `.${match[3]}`;
  if (match[4]) formatted += `-${match[4]}`;
  return formatted;
};

const formatSUS = (sus) => {
  if (!sus) return '';
  const cleaned = String(sus).replace(/\D/g, '');
  const limited = cleaned.slice(0, 15);
  return limited
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{4})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{4})\.(\d{4})(\d)/, '$1.$2.$3.$4');
};

const capitalizeName = (name) => {
  if (!name) return '';
  const exceptions = ['de', 'da', 'do', 'dos', 'das'];
  return String(name)
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (!word) return '';
      if (index > 0 && exceptions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export default function PatientForm({ patient, onSave, onClose, addToast }) {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        cpf: formatCPF(patient.cpf) || '',
        susCard: formatSUS(patient.susCard) || '',
        observations: patient.observations || '',
        generalNotes: patient.generalNotes || '',
        id: patient._id || patient.id,
      });
    } else {
      setFormData({
        name: '',
        cpf: '',
        susCard: '',
        observations: '',
        generalNotes: '',
      });
    }
    setErrors({});
  }, [patient]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cpf') value = formatCPF(value);
    if (name === 'susCard') value = formatSUS(value);
    if (name === 'name') value = capitalizeName(value);

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpa o erro ao digitar
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if ((name === 'cpf' || name === 'susCard') && errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'O nome completo é obrigatório.';
    }

    const cleanCPF = String(formData.cpf).replace(/\D/g, '');
    const cleanSUS = String(formData.susCard).replace(/\D/g, '');

    if (cleanCPF.length > 0 && cleanCPF.length !== 11) {
      newErrors.cpf = `CPF incompleto. Digitados: ${cleanCPF.length}/11`;
    }

    if (cleanSUS.length > 0 && cleanSUS.length !== 15) {
      if (!newErrors.cpf) {
        newErrors.cpf = `SUS incompleto. Digitados: ${cleanSUS.length}/15`;
      } else {
        newErrors.cpf += ` | SUS incompleto (${cleanSUS.length}/15)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const cleanCPF = String(formData.cpf).replace(/\D/g, '');
    const cleanSUS = String(formData.susCard).replace(/\D/g, '');

    setIsSaving(true);

    try {
      // 1. Checagem de Duplicidade Manual Elegante
      const res = await api.get('/patients');
      const allPatients = res.data || [];

      const duplicate = allPatients.find((p) => {
        if (patient && (p._id === patient._id || p.id === patient.id))
          return false;
        const isCpfDuplicated = cleanCPF && p.cpf === cleanCPF;
        const isSusDuplicated = cleanSUS && p.susCard === cleanSUS;
        return isCpfDuplicated || isSusDuplicated;
      });

      // Se achar, dedura o nome e bloqueia
      if (duplicate) {
        setErrors({
          cpf: `BLOQUEADO: Este documento já pertence a "${duplicate.name}".`,
        });
        setIsSaving(false);
        return;
      }

      // 2. Prepara os dados (Omitimos o Status)
      const dataToSave = {
        name: formData.name,
        observations: formData.observations,
        generalNotes: formData.generalNotes,
      };

      if (patient?._id) dataToSave._id = patient._id;

      // Se vazio, deleta para o MongoDB assumir como Null
      if (cleanCPF && cleanCPF.length > 0) dataToSave.cpf = cleanCPF;
      if (cleanSUS && cleanSUS.length > 0) dataToSave.susCard = cleanSUS;

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || '';

      if (
        errorMessage.includes('duplicate') ||
        errorMessage.includes('cpf') ||
        error.response?.status === 409
      ) {
        setErrors({
          cpf: 'Este CPF ou Cartão SUS já está cadastrado no sistema.',
        });
      } else {
        addToast?.('Erro ao salvar o paciente.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col w-full max-h-[90dvh] md:max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* HEADER PREMIUM */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-slate-100 bg-slate-50/50 z-10">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
              <FiUser size={22} />
            </div>
            {patient ? 'Atualizar Paciente' : 'Cadastrar Paciente'}
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium ml-[52px]">
            Preencha os dados abaixo para manter o histórico médico atualizado.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* INFO BANNER */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
              <FiInfo className="text-indigo-500 mt-0.5 shrink-0" size={18} />
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-0.5">
                  Documentação Opcional em Emergências
                </h4>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  Caso o paciente não possua CPF ou Cartão SUS no momento do
                  atendimento,{' '}
                  <strong>deixe os campos totalmente em branco</strong>. O
                  sistema permitirá o cadastro apenas pelo nome.
                </p>
              </div>
            </div>

            {/* SEÇÃO 1: IDENTIFICAÇÃO */}
            <div className="space-y-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                1. Identificação Principal
              </h3>

              <div className="relative group">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FiUser size={18} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all shadow-sm outline-none
                      ${
                        errors.name
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                      }`}
                    placeholder="Ex: Maria da Silva Souza"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-bold flex items-center gap-1 animate-in slide-in-from-top-1">
                    <FiAlertCircle /> {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative group">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    CPF
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <FiCreditCard size={18} />
                    </span>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      maxLength={14}
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-slate-800 font-mono font-semibold transition-all shadow-sm outline-none
                        ${
                          errors.cpf
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                        }`}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    Cartão SUS
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <FiActivity size={18} />
                    </span>
                    <input
                      type="text"
                      name="susCard"
                      value={formData.susCard}
                      onChange={handleChange}
                      maxLength={18}
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-slate-800 font-mono font-semibold transition-all shadow-sm outline-none
                        ${
                          errors.cpf
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                        }`}
                      placeholder="000.0000.0000.0000"
                    />
                  </div>
                </div>
              </div>

              {errors.cpf && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-in zoom-in-95">
                  <FiAlertCircle
                    className="text-red-500 shrink-0 mt-0.5"
                    size={16}
                  />
                  <p className="text-sm text-red-700 font-bold leading-tight">
                    {errors.cpf}
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO 2: ANOTAÇÕES */}
            <div className="space-y-5 pt-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                2. Histórico & Anotações
              </h3>

              <div className="relative group">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Observações Clínicas / Alertas
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FiActivity size={18} />
                  </span>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none resize-none shadow-sm leading-relaxed"
                    placeholder="Ex: Diabético tipo 2, Hipertenso, Alérgico a Dipirona..."
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Notas Administrativas{' '}
                  <span className="text-[10px] font-semibold text-slate-400 font-normal uppercase tracking-wider">
                    (Interno)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FiFileText size={18} />
                  </span>
                  <textarea
                    name="generalNotes"
                    value={formData.generalNotes}
                    onChange={handleChange}
                    rows="2"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none resize-none shadow-sm leading-relaxed"
                    placeholder="Ex: Documentação pendente, entregar receita para o filho (João)..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex-shrink-0 px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 z-10 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-slate-600 bg-slate-100 font-bold hover:bg-slate-200 transition-colors cursor-pointer active:scale-95 text-sm"
              disabled={isSaving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className={`
                flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-black shadow-lg transition-all text-sm
                ${
                  isSaving
                    ? 'bg-indigo-400 shadow-none cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-95 cursor-pointer'
                }
              `}
            >
              {isSaving ? (
                <>
                  <ClipLoader size={18} color="#fff" />
                  <span>Salvando...</span>
                </>
              ) : (
                'Confirmar Cadastro'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

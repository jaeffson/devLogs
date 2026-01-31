// src/components/forms/PatientForm.jsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ClipLoader } from 'react-spinners';

// --- FUNÇÕES UTILITÁRIAS DE MÁSCARA ---

// Formata CPF: 000.000.000-00
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

// Formata SUS: 000.0000.0000.0000 (Padrão 15 dígitos)
const formatSUS = (sus) => {
  if (!sus) return '';
  const cleaned = String(sus).replace(/\D/g, '');
  // Limita a 15 caracteres (Padrão CNS)
  const limited = cleaned.slice(0, 15);

  // Aplica máscara progressiva: 000.0000.0000.0000
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

export default function PatientForm({
  patient,
  onSave,
  onClose,
  checkDuplicate, // Mantido para compatibilidade, mas ignorado no submit
  addToast,
}) {
  // --- Estado do Formulário ---
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    status: 'Ativo',
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
        status: patient.status || 'Ativo',
        id: patient._id || patient.id,
      });
    } else {
      setFormData({
        name: '',
        cpf: '',
        susCard: '',
        observations: '',
        generalNotes: '',
        status: 'Ativo',
      });
    }
    setErrors({});
  }, [patient]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Aplica máscaras enquanto digita
    if (name === 'cpf') value = formatCPF(value);
    if (name === 'susCard') value = formatSUS(value);
    if (name === 'name') value = capitalizeName(value);

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpa erros visuais ao digitar
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));

    // Se preencheu um, limpa o erro global de "obrigatório um dos dois"
    if (
      (name === 'cpf' || name === 'susCard') &&
      errors.cpf &&
      errors.cpf.includes('necessário informar')
    ) {
      setErrors((prev) => ({ ...prev, cpf: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Validação de Nome
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'O nome completo é obrigatório.';
    }

    const cleanCPF = String(formData.cpf).replace(/\D/g, '');
    const cleanSUS = String(formData.susCard).replace(/\D/g, '');

    // 2. Validação Estrita de Tamanho (CPF)
    // Se tiver algo digitado, TEM que ter 11 dígitos
    if (cleanCPF.length > 0 && cleanCPF.length !== 11) {
      newErrors.cpf = `CPF incompleto. Digitados: ${cleanCPF.length}/11`;
    }

    // 3. Validação Estrita de Tamanho (SUS)
    // Se tiver algo digitado, TEM que ter 15 dígitos
    if (cleanSUS.length > 0 && cleanSUS.length !== 15) {
      if (!newErrors.cpf) {
        newErrors.cpf = `SUS incompleto. Digitados: ${cleanSUS.length}/15`;
      } else {
        newErrors.cpf += ` | SUS incompleto (${cleanSUS.length}/15)`;
      }
    }

    // 4. Validação de Obrigatoriedade (Pelo menos um)
    if (cleanCPF.length === 0 && cleanSUS.length === 0) {
      // Se ambos estiverem vazios
      newErrors.cpf = 'É necessário informar o CPF ou o Cartão SUS.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const cleanCPF = String(formData.cpf).replace(/\D/g, '');
    const cleanSUS = String(formData.susCard).replace(/\D/g, '');

    // --- CORREÇÃO DO ERRO EM PRODUÇÃO ---
    // A verificação local (checkDuplicate) foi desativada temporariamente.
    // Isso evita que dados em cache (falso positivo) bloqueiem o cadastro.
    // O sistema agora confia exclusivamente na validação do Backend (MongoDB)
    // para garantir unicidade.

    /* if (typeof checkDuplicate === 'function') {
       const isDuplicate = checkDuplicate({
         cpf: cleanCPF,
         susCard: cleanSUS,
         currentId: formData.id,
       });
       if (isDuplicate) {
         setErrors({
           cpf: 'Já existe um paciente cadastrado com este CPF ou Cartão SUS (Verificação Local).',
         });
         return;
       }
    }
    */

    const dataToSave = {
      ...formData,
      cpf: cleanCPF || null, // Envia null se vazio para não quebrar Unique Index Sparse
      susCard: cleanSUS || null,
    };

    if (patient?._id) {
      dataToSave._id = patient._id;
    }

    setIsSaving(true);

    try {
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error(error);
      // Se o backend retornar erro de duplicidade, mostramos aqui:
      if (
        error.response?.data?.message?.includes('duplicate') ||
        error.response?.status === 409
      ) {
        setErrors({
          cpf: 'Erro: Este CPF ou Cartão SUS já existe no banco de dados.',
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
      <div className="flex flex-col w-full max-h-[90dvh] md:max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white z-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            {patient ? 'Editar Paciente' : 'Cadastrar Paciente'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Preencha os dados com atenção. CPF e SUS exigem formato completo.
          </p>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white text-gray-900 transition-colors
                  ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                  }`}
                placeholder="Ex: João da Silva"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500 font-medium animate-pulse">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Grid CPF e SUS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPF */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  maxLength={14}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white text-gray-900 transition-colors
                    ${
                      errors.cpf
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                    }`}
                  placeholder="000.000.000-00"
                />
              </div>

              {/* Cartão SUS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cartão SUS
                </label>
                <input
                  type="text"
                  name="susCard"
                  value={formData.susCard}
                  onChange={handleChange}
                  maxLength={18}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white text-gray-900 transition-colors
                     ${
                       errors.cpf
                         ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                         : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                     }`}
                  placeholder="000.0000.0000.0000"
                />
              </div>
            </div>

            {/* Mensagem de Erro Unificada (CPF/SUS) */}
            {errors.cpf && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600 font-medium text-center">
                  {errors.cpf}
                </p>
              </div>
            )}

            {/* Status (Select) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Óbito">Óbito</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Observações Clínicas / Alertas
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-colors resize-none"
                placeholder="Ex: Diabético, Hipertenso, Alérgico a Dipirona..."
              />
            </div>

            {/* Notas Administrativas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notas Administrativas
              </label>
              <textarea
                name="generalNotes"
                value={formData.generalNotes}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-colors resize-none"
                placeholder="Ex: Documentação pendente, familiar de contato..."
              />
            </div>
          </div>

          {/* Rodapé com Botões */}
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors h-11 cursor-pointer"
              disabled={isSaving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className={`
                flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium h-11 shadow-sm transition-all
                ${
                  isSaving
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer'
                }
              `}
            >
              {isSaving ? (
                <>
                  <ClipLoader size={18} color="#fff" />
                  <span>Salvando...</span>
                </>
              ) : (
                'Salvar Paciente'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

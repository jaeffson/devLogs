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
  checkDuplicate,
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
        susCard: formatSUS(patient.susCard) || '', // Aplica máscara ao carregar
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
      // Se o erro do CPF já não existir, coloca o erro do SUS aqui (ou cria um campo de erro próprio pro SUS se preferir)
      if (!newErrors.cpf) {
        newErrors.cpf = `SUS incompleto. Digitados: ${cleanSUS.length}/15`;
      } else {
        // Se já tem erro no CPF, concatena
        newErrors.cpf += ` | SUS incompleto (${cleanSUS.length}/15)`;
      }
    }

    // 4. Validação de Obrigatoriedade (Pelo menos um)
    if (cleanCPF.length === 0 && cleanSUS.length === 0) {
      newErrors.cpf =
        'É necessário informar um CPF válido ou um Cartão SUS válido.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // 1. Executa validações
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const cleanCPF = String(formData.cpf || '').replace(/\D/g, '');
    const cleanSus = String(formData.susCard || '').replace(/\D/g, '');

    // 2. Prepara NULL se vazio (para o banco online não dar erro)
    const cpfToCheck = cleanCPF.length === 11 ? cleanCPF : null;
    const susToCheck = cleanSus.length === 15 ? cleanSus : null;

    // 3. Verifica Duplicidade (Backend check)
    if (typeof checkDuplicate === 'function') {
      if (cpfToCheck || susToCheck) {
        const isDuplicate = checkDuplicate({
          cpf: cpfToCheck,
          susCard: susToCheck,
          currentId: formData.id,
        });

        if (isDuplicate) {
          setErrors({
            cpf: 'Já existe um paciente cadastrado com este CPF ou Cartão SUS.',
          });
          return;
        }
      }
    }

    // 4. Monta objeto final
    const dataToSave = {
      ...formData,
      cpf: cpfToCheck ? formatCPF(cpfToCheck) : null, // Salva formatado ou null
      susCard: susToCheck ? formatSUS(susToCheck) : null, // Salva formatado ou null
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
      if (error.response?.data?.message?.includes('duplicate')) {
        setErrors({ cpf: 'Erro no servidor: Dados duplicados (CPF/SUS).' });
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
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scroll-smooth custom-scrollbar">
            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Maria da Silva"
                className={`w-full px-4 py-2.5 rounded-lg border text-gray-700 bg-gray-50 focus:bg-white transition-all duration-200 outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-red-300 ring-red-100 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
                disabled={isSaving}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Grid CPF e SUS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  CPF (11 dígitos)
                </label>
                <input
                  type="text"
                  name="cpf"
                  maxLength={14} 
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-2.5 rounded-lg border text-gray-700 bg-gray-50 focus:bg-white transition-all duration-200 outline-none focus:ring-2 ${
                    errors.cpf && errors.cpf.includes('CPF')
                      ? 'border-red-300 ring-red-100 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cartão SUS (15 dígitos)
                </label>
                <input
                  type="text"
                  name="susCard"
                  maxLength={18} 
                  value={formData.susCard}
                  onChange={handleChange}
                  placeholder="000.0000.0000.0000"
                  className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200 ${
                    errors.cpf && errors.cpf.includes('SUS')
                      ? 'border-red-300 ring-red-100'
                      : ''
                  }`}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Mensagem de Erro Unificada para CPF/SUS */}
            {errors.cpf && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                  ⚠️ {errors.cpf}
                </p>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Observações Clínicas
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200 resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Notas Gerais */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notas Administrativas
              </label>
              <textarea
                name="generalNotes"
                value={formData.generalNotes}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200 resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Status */}
            {patient && (
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Status do Paciente
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full appearance-none px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                    disabled={isSaving}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé */}
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

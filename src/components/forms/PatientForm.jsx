// src/components/forms/PatientForm.jsx
// (VISUAL REFACTOR: Altura controlada, Footer fixo, UX Mobile + Cursor Pointer)

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; 
import { ClipLoader } from 'react-spinners'; 

// Funções utilitárias (formatCPF, capitalizeName)
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

// Exportação Default
export default function PatientForm({
    patient, 
    onSave, 
    onClose, 
    checkDuplicate, 
    addToast 
}) {
    // --- Estado do Formulário (LÓGICA INTACTA) ---
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
               cpf: patient.cpf || '', 
               susCard: patient.susCard || '',
               observations: patient.observations || '',
               generalNotes: patient.generalNotes || '',
               status: patient.status || 'Ativo',
               id: patient._id || patient.id 
            });
        } else {
            setFormData({
                name: '', cpf: '', susCard: '', observations: '', generalNotes: '', status: 'Ativo',
            });
        }
        setErrors({});
    }, [patient]);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = formatCPF(value);
        if (name === 'name') value = capitalizeName(value);
        if (name === 'susCard') value = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if ((name === 'cpf' || name === 'susCard') && errors.cpf) {
             setErrors(prev => ({...prev, cpf: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'O nome completo é obrigatório.';
        }
        const hasCPF = formData.cpf && String(formData.cpf).replace(/\D/g, '').trim();
        const hasSUS = formData.susCard && String(formData.susCard).replace(/\D/g, '').trim();
        if (!hasCPF && !hasSUS) {
            newErrors.cpf = 'É necessário informar o CPF ou o Cartão SUS.';
        }
        return newErrors;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        const cleanCPF = (cpf) => String(cpf || '').replace(/\D/g, '');
        const cleanSus = (sus) => String(sus || '').replace(/\D/g, '');
        const cpfToCheck = cleanCPF(formData.cpf);
        const susToCheck = cleanSus(formData.susCard);

        if (typeof checkDuplicate === 'function' && (cpfToCheck || susToCheck)) {
            const isDuplicate = checkDuplicate({
                cpf: cpfToCheck,
                susCard: susToCheck,
                currentId: formData.id 
            });

            if (isDuplicate) {
                setErrors({ cpf: 'Já existe um paciente com este CPF ou Cartão SUS.' });
                return; 
            }
        }

        const dataToSave = {
            ...formData,
            cpf: cleanCPF(formData.cpf),
            susCard: cleanSus(formData.susCard)
        };
        
        dataToSave.cpf = dataToSave.cpf || null; 
        dataToSave.susCard = dataToSave.susCard || null;

        if (patient?._id) {
            dataToSave._id = patient._id;
        }

        setIsSaving(true); 
        try {
            await onSave(dataToSave); 
            onClose(); 
        } catch (error) {
             addToast?.('Erro ao salvar o paciente.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {/* CONTAINER DO CARD [Mobile Fix] */}
            <div className="flex flex-col w-full max-h-[90dvh] md:max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
                
                {/* 1. CABEÇALHO (Fixo) */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        {patient ? 'Editar Paciente' : 'Cadastrar Paciente'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {patient ? 'Atualize os dados do prontuário' : 'Preencha as informações do novo registro'}
                    </p>
                </div>

                {/* 2. FORMULÁRIO (Corpo Flexível) */}
                <form 
                    onSubmit={handleSubmit} 
                    noValidate
                    className="flex flex-col flex-1 min-h-0"
                >
                    {/* CONTEÚDO COM SCROLL */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scroll-smooth custom-scrollbar">
                        
                        {/* Nome Completo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor={`patient-name-${patient?.id || 'new'}`}>
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id={`patient-name-${patient?.id || 'new'}`}
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
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <span>•</span> {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Grid CPF + SUS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* CPF */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor={`patient-cpf-${patient?.id || 'new'}`}>
                                    CPF
                                </label>
                                <input
                                    type="text"
                                    id={`patient-cpf-${patient?.id || 'new'}`}
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    placeholder="000.000.000-00"
                                    className={`w-full px-4 py-2.5 rounded-lg border text-gray-700 bg-gray-50 focus:bg-white transition-all duration-200 outline-none focus:ring-2 ${
                                        errors.cpf 
                                        ? 'border-red-300 ring-red-100 focus:border-red-500 focus:ring-red-200' 
                                        : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                                    }`}
                                    disabled={isSaving}
                                />
                                {errors.cpf && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.cpf}</p>}
                            </div>

                            {/* Cartão SUS */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor={`patient-sus-${patient?.id || 'new'}`}>
                                    Cartão SUS
                                </label>
                                <input
                                    type="text"
                                    id={`patient-sus-${patient?.id || 'new'}`}
                                    name="susCard"
                                    value={formData.susCard}
                                    onChange={handleChange}
                                    placeholder="Número do cartão"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor={`patient-observations-${patient?.id || 'new'}`}>
                                Observações Clínicas
                            </label>
                            <textarea
                                id={`patient-observations-${patient?.id || 'new'}`}
                                name="observations"
                                value={formData.observations}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Histórico, alergias ou condições preexistentes..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200 resize-none"
                                disabled={isSaving}
                            />
                        </div>

                        {/* Notas Gerais */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor={`patient-notes-${patient?.id || 'new'}`}>
                                Notas Administrativas
                            </label>
                            <textarea
                                id={`patient-notes-${patient?.id || 'new'}`}
                                name="generalNotes"
                                value={formData.generalNotes}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Informações de contato ou recados..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-200 resize-none"
                                disabled={isSaving}
                            />
                        </div>

                        {/* Status (Select com cursor-pointer) */}
                        {patient && (
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor={`patient-status-${patient.id}`}>
                                    Status do Paciente
                                </label>
                                <div className="relative">
                                    <select
                                        id={`patient-status-${patient.id}`}
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        // CORRIGIDO: Adicionado cursor-pointer
                                        className="w-full appearance-none px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                                        disabled={isSaving}
                                    >
                                        <option value="Ativo">Ativo</option>
                                        <option value="Inativo">Inativo</option>
                                        <option value="Pendente">Pendente</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. RODAPÉ (Botões com cursor-pointer) */}
                    <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 z-10">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            // CORRIGIDO: Adicionado cursor-pointer
                            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors h-11 cursor-pointer"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>

                        <button 
                            type="submit" 
                            disabled={isSaving}
                            // CORRIGIDO: Lógica de cursor-pointer vs cursor-not-allowed
                            className={`
                                flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium h-11 shadow-sm transition-all
                                ${isSaving 
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
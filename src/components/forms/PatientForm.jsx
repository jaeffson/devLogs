// src/components/forms/PatientForm.jsx
// (ATUALIZADO: Usando ClipLoader da react-spinners)

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; 
// NOVO: Importa o ClipLoader
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
            <h2 className="text-2xl font-bold mb-6">{patient ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}</h2>
            <form onSubmit={handleSubmit} noValidate>

                {/* Campos de Input */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-name-${patient?.id || 'new'}`}>Nome Completo</label>
                    <input
                        type="text"
                        id={`patient-name-${patient?.id || 'new'}`}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required
                        disabled={isSaving}
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>
                {/* ... (outros inputs desabilitados por {isSaving} - omitidos para brevidade) ... */}

                {/* Status */}
                 {patient && (
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-status-${patient.id}`}>Status</label>
                        <select
                            id={`patient-status-${patient.id}`}
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full p-2 border rounded border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSaving}
                        >
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                            <option value="Pendente">Pendente</option>
                        </select>
                    </div>
                )}


                {/* Botões de Ação */}
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 font-medium cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 font-medium cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                {/* NOVO: ClipLoader */}
                                <ClipLoader color="#ffffff" size={20} /> 
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <span>Salvar Paciente</span>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; // Importa Modal da pasta common

// !! IMPORTANTE: Remova a dependência direta de MOCK_PATIENTS daqui
// A validação de duplicidade deve vir do componente pai via props ou ser feita na API
// Por enquanto, vou comentar a validação de duplicidade

// Funções utilitárias (podem ser movidas para utils/ futuramente)
const formatCPF = (cpf) => { /* ... código ... */ };
const capitalizeName = (name) => { /* ... código ... */ };

// Exportação Default
export default function PatientForm({ patient, onSave, onClose /* Adicione prop para verificar duplicidade se necessário: checkDuplicate */ }) {
  const [formData, setFormData] = useState({
    name: '', cpf: '', susCard: '', observations: '', generalNotes: '', status: 'Ativo', // Status padrão
    ...patient // Sobrescreve com dados do paciente se estiver editando
  });
  const [errors, setErrors] = useState({});

  // Efeito para resetar o form ou carregar dados do paciente ao abrir
  useEffect(() => {
    if (patient) {
      setFormData({
         name: patient.name || '',
         cpf: patient.cpf || '',
         susCard: patient.susCard || '',
         observations: patient.observations || '',
         generalNotes: patient.generalNotes || '',
         status: patient.status || 'Ativo',
         id: patient.id // Mantém o ID se estiver editando
      });
    } else {
       // Reset para formulário de novo paciente
       setFormData({ name: '', cpf: '', susCard: '', observations: '', generalNotes: '', status: 'Ativo'});
    }
     setErrors({}); // Limpa erros ao abrir/trocar paciente
  }, [patient]); // Roda quando o 'patient' (prop) muda

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cpf') value = formatCPF(value);
    if (name === 'name') value = capitalizeName(value);
    if (name === 'susCard') value = value.replace(/\D/g, '');

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if ((name === 'cpf' || name === 'susCard') && (errors.cpf || errors.susCard)) {
        setErrors(prev => ({...prev, cpf: null, susCard: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome completo é obrigatório.';
    if (!formData.cpf.trim() && !formData.susCard.trim()) newErrors.cpf = 'É necessário informar o CPF ou o Cartão SUS.';
    // Adicione mais validações se necessário (formato CPF/SUS, etc)
    return newErrors;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // --- Validação de Duplicidade (COMENTADA - Idealmente feita no backend ou via prop 'checkDuplicate') ---
    /*
    const cleanCPF = (cpf) => ('' + cpf).replace(/\D/g, '');
    const cleanSus = (sus) => ('' + sus).replace(/\D/g, '');
    const formCPF = cleanCPF(formData.cpf);
    const formSus = cleanSus(formData.susCard);

    // Exemplo de como usar a prop checkDuplicate (se você a implementar no componente pai)
    // const isDuplicate = checkDuplicate({ cpf: formCPF, susCard: formSus, currentId: formData.id });
    // if (isDuplicate) {
    //   setErrors({ cpf: 'Já existe um paciente com este CPF ou Cartão SUS.' });
    //   return;
    // }
    */

    // Chama a função onSave passada pelo componente pai
    onSave(formData);
    onClose(); // Fecha o modal após salvar
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">{patient ? 'Editar Paciente' : 'Cadastrar Paciente'}</h2>
      <form onSubmit={handleSubmit} noValidate> {/* Adicionado noValidate */}
        {/* Nome */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-name-${patient?.id || 'new'}`}>Nome Completo</label>
          <input type="text" id={`patient-name-${patient?.id || 'new'}`} name="name" value={formData.name} onChange={handleChange} className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} required />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        {/* CPF e SUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-cpf-${patient?.id || 'new'}`}>CPF</label>
            <input type="text" id={`patient-cpf-${patient?.id || 'new'}`} name="cpf" value={formData.cpf} onChange={handleChange} maxLength="14" placeholder="000.000.000-00" className={`w-full p-2 border rounded ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`} />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-sus-${patient?.id || 'new'}`}>Cartão SUS</label>
            <input type="text" id={`patient-sus-${patient?.id || 'new'}`} name="susCard" value={formData.susCard} onChange={handleChange} maxLength="15" placeholder="000 0000 0000 0000" className={`w-full p-2 border rounded ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`} />
          </div>
        </div>
        {errors.cpf && <p className="text-red-500 text-xs -mt-2 mb-4">{errors.cpf}</p>}
        {/* Observações */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-obs-${patient?.id || 'new'}`}>Observações (visível nos registros)</label>
          <textarea id={`patient-obs-${patient?.id || 'new'}`} name="observations" value={formData.observations} onChange={handleChange} className="w-full p-2 border rounded border-gray-300" rows="3"></textarea>
        </div>
        {/* Anotações Gerais */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-notes-${patient?.id || 'new'}`}>Anotações Gerais (fixas do paciente)</label>
          <textarea id={`patient-notes-${patient?.id || 'new'}`} name="generalNotes" value={formData.generalNotes} onChange={handleChange} className="w-full p-2 border rounded border-gray-300" rows="3"></textarea>
        </div>
         {/* Status (Se editando) */}
         {patient && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-status-${patient.id}`}>Status</label>
              <select
                id={`patient-status-${patient.id}`}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded border-gray-300 bg-white"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Pendente">Pendente</option>
                 {/* Adicione outros status se necessário */}
              </select>
            </div>
         )}
        {/* Botões */}
        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
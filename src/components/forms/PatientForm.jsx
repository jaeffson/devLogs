// src/components/forms/PatientForm.jsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; // Importa Modal da pasta common

// Funções utilitárias (podem ser movidas para utils/helpers.js futuramente, mas ok aqui por enquanto)
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
    patient, // Paciente a ser editado (null se for novo)
    onSave, // Função chamada ao salvar (recebe dados do form)
    onClose, // Função para fechar o modal
    // checkDuplicate // Opcional: Função para verificar duplicidade antes de salvar
}) {
    // --- Estado do Formulário ---
    // Inicializa todos os campos como string vazia para evitar erros de 'controlled' vs 'uncontrolled'
    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        susCard: '',
        observations: '',
        generalNotes: '',
        status: 'Ativo', // Status padrão para novos
    });
    const [errors, setErrors] = useState({}); // Estado para erros de validação

    // --- Efeito para Carregar Dados ou Resetar ---
    // Roda quando o modal abre ou a prop 'patient' muda
    useEffect(() => {
        if (patient) {
            // Editando: Preenche o form com dados do paciente, usando '' como fallback
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
            // Novo: Reseta o form para strings vazias
            setFormData({
                name: '',
                cpf: '',
                susCard: '',
                observations: '',
                generalNotes: '',
                status: 'Ativo',
                // Sem ID para novo
            });
        }
        setErrors({}); // Limpa erros ao abrir/trocar paciente
    }, [patient]); // Dependência: Roda quando 'patient' muda

    // --- Manipulador de Mudanças nos Inputs ---
    const handleChange = (e) => {
        let { name, value } = e.target;

        // Aplica formatações específicas
        if (name === 'cpf') value = formatCPF(value);
        if (name === 'name') value = capitalizeName(value);
        if (name === 'susCard') value = value.replace(/\D/g, ''); // Apenas números

        // Atualiza o estado do formulário
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpa erro do campo específico ao ser modificado
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        // Limpa erro combinado de CPF/SUS se um deles for preenchido
        if ((name === 'cpf' || name === 'susCard') && errors.cpf) {
            setErrors(prev => ({...prev, cpf: null }));
        }
    };

    // --- Função de Validação ---
    const validateForm = () => {
        const newErrors = {};
        // CORREÇÃO AQUI: Verifica se formData.name existe ANTES de chamar trim()
        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'O nome completo é obrigatório.';
        }
        // Verifica se pelo menos um documento foi informado (com segurança contra undefined/null)
        const hasCPF = formData.cpf && formData.cpf.trim();
        const hasSUS = formData.susCard && formData.susCard.trim();
        if (!hasCPF && !hasSUS) {
            // Mostra erro no campo CPF, mas poderia ser em ambos ou em um campo genérico
            newErrors.cpf = 'É necessário informar o CPF ou o Cartão SUS.';
        }
        // Adicione mais validações se necessário (formato CPF, etc.)
        return newErrors;
    }

    // --- Manipulador de Submissão ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Previne recarregamento da página
        const formErrors = validateForm(); // Roda a validação
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors); // Se houver erros, atualiza o estado de erros e para
            return;
        }

        // --- Validação de Duplicidade (Opcional - Idealmente no backend) ---
        // Se você passou uma função `checkDuplicate` via props, pode usá-la aqui
        /*
        if (typeof checkDuplicate === 'function') {
            const cleanCPF = (cpf) => String(cpf || '').replace(/\D/g, '');
            const cleanSus = (sus) => String(sus || '').replace(/\D/g, '');
            const isDuplicate = checkDuplicate({
                cpf: cleanCPF(formData.cpf),
                susCard: cleanSus(formData.susCard),
                currentId: formData.id // Passa o ID atual (se houver) para ignorar na verificação
            });
            if (isDuplicate) {
                setErrors({ cpf: 'Já existe um paciente com este CPF ou Cartão SUS.' });
                return;
            }
        }
        */

        // Se passou na validação, chama a função onSave passada pelo componente pai
        onSave(formData); // Envia os dados do formulário
        // onClose(); // O componente pai geralmente fecha o modal após onSave ter sucesso
    };

    // --- Renderização do Componente ---
    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold mb-6">{patient ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}</h2>
            <form onSubmit={handleSubmit} noValidate> {/* noValidate desabilita validação HTML5 */}

                {/* Campo Nome */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-name-${patient?.id || 'new'}`}>Nome Completo</label>
                    <input
                        type="text"
                        id={`patient-name-${patient?.id || 'new'}`}
                        name="name"
                        value={formData.name} // Controlado pelo estado
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required // Para acessibilidade e indicação visual
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Campos CPF e SUS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-cpf-${patient?.id || 'new'}`}>CPF</label>
                        <input
                            type="text"
                            id={`patient-cpf-${patient?.id || 'new'}`}
                            name="cpf"
                            value={formData.cpf} // Controlado
                            onChange={handleChange}
                            maxLength="14"
                            placeholder="000.000.000-00"
                            className={`w-full p-2 border rounded ${errors.cpf ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {/* Mostra erro do CPF apenas se ele for o erro principal (não do SUS) */}
                        {errors.cpf && <p className="text-red-600 text-xs mt-1">{errors.cpf}</p>}
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-sus-${patient?.id || 'new'}`}>Cartão SUS</label>
                        <input
                            type="text"
                            id={`patient-sus-${patient?.id || 'new'}`}
                            name="susCard"
                            value={formData.susCard} // Controlado
                            onChange={handleChange}
                            maxLength="15"
                            placeholder="000 0000 0000 0000"
                            className={`w-full p-2 border rounded ${errors.cpf ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`} // Marca se houver erro no CPF/SUS
                        />
                    </div>
                </div>
                {/* Mostra erro do CPF/SUS abaixo dos campos se existir */}
                {/* {errors.cpf && <p className="text-red-600 text-xs -mt-2 mb-4">{errors.cpf}</p>} */}

                {/* Campo Observações */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-obs-${patient?.id || 'new'}`}>Observações (visível nos registros)</label>
                    <textarea
                        id={`patient-obs-${patient?.id || 'new'}`}
                        name="observations"
                        value={formData.observations} // Controlado
                        onChange={handleChange}
                        className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Ex: Alergias, condições pré-existentes..."
                    ></textarea>
                </div>

                {/* Campo Anotações Gerais */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-notes-${patient?.id || 'new'}`}>Anotações Gerais (fixas do paciente)</label>
                    <textarea
                        id={`patient-notes-${patient?.id || 'new'}`}
                        name="generalNotes"
                        value={formData.generalNotes} // Controlado
                        onChange={handleChange}
                        className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Informações adicionais, contato, etc."
                    ></textarea>
                </div>

                {/* Campo Status (Apenas para Edição) */}
                {patient && (
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-1" htmlFor={`patient-status-${patient.id}`}>Status</label>
                        <select
                            id={`patient-status-${patient.id}`}
                            name="status"
                            value={formData.status} // Controlado
                            onChange={handleChange}
                            className="w-full p-2 border rounded border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                            <option value="Pendente">Pendente</option>
                            {/* Adicione outros status se aplicável */}
                        </select>
                    </div>
                )}

                {/* Botões de Ação */}
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700 font-medium">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Salvar Paciente</button>
                </div>
            </form>
        </Modal>
    );
}
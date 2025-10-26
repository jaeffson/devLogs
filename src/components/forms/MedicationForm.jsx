// src/components/forms/MedicationForm.jsx
import React, { useState, useEffect } from 'react';
// Certifique-se de que o caminho para Modal está correto
import { Modal } from '../common/Modal';

export default function MedicationForm({
  medication,
  onSave,
  onClose,
  // Recebe addToast se quiser mostrar mensagem de sucesso daqui
  addToast
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(medication ? medication.name : '');
    setError(''); // Limpa erro ao abrir/trocar medicação
  }, [medication]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('O nome da medicação é obrigatório.');
      return;
    }

    // --- Validação de Duplicidade (Idealmente feita via prop/backend) ---
    // Exemplo:
    // const isDuplicate = checkDuplicateMed({ name: trimmedName, currentId: medication?.id });
    // if (isDuplicate) {
    //   setError('Esta medicação já existe.');
    //   return;
    // }

    onSave({ id: medication?.id, name: trimmedName });

    if (addToast) {
        addToast(
            medication ? 'Medicação atualizada!' : 'Nova medicação cadastrada!',
            'success'
        );
    }

    onClose(); // Fecha o modal
  };

  return (
    // (ALTERADO) Largura aumentada para max-w-2xl
    <Modal onClose={onClose} modalClasses="max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">
        {medication ? 'Editar Medicação' : 'Nova Medicação'}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-1"
            htmlFor={`med-name-${medication?.id || 'new'}`}
          >
            Nome da Medicação
          </label>
          <input
            type="text"
            id={`med-name-${medication?.id || 'new'}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            className={`w-full p-2 border rounded ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
            autoFocus
            required
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        {/* Rodapé estilizado */}
        <div className="flex justify-end gap-4 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 font-medium cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
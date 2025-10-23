import React, { useState, useEffect } from 'react';
import  Modal  from '../common/Modal'; // Importa Modal

// !! IMPORTANTE: Remova a dependência de MOCK_MEDICATIONS para validação
// Essa validação deve ser feita no backend ou via prop

// Exportação Default
export default function MedicationForm({ medication, onSave, onClose /* Adicione prop checkDuplicateMed */ }) {
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

        // --- Validação de Duplicidade (COMENTADA) ---
        
        // Exemplo usando prop:
        // const isDuplicate = checkDuplicateMed({ name: trimmedName, currentId: medication?.id });
        // if (isDuplicate) {
        //   setError('Esta medicação já existe.');
        //   return;
        // }
        

        // Passa o ID se estiver editando, e o nome limpo
        onSave({ id: medication?.id, name: trimmedName });
        onClose(); // Fecha o modal
    }

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold mb-4">{medication ? 'Editar Medicação' : 'Nova Medicação'}</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1" htmlFor={`med-name-${medication?.id || 'new'}`}>Nome da Medicação</label>
                    <input
                      type="text"
                      id={`med-name-${medication?.id || 'new'}`}
                      value={name}
                      onChange={e => { setName(e.target.value); setError(''); }}
                      className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
                      autoFocus // Foca no campo ao abrir
                      required
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                </div>
            </form>
        </Modal>
    )
}

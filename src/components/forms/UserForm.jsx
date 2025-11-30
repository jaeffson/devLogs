// src/components/forms/UserForm.jsx
// (ATUALIZADO: Adicionado isSaving e Spinner no botão)

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; // Importa Modal

// Componente simples de Spinner (CSS Puro)
const SimpleSpinner = () => (
  <div
    style={{
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid #fff',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      animation: 'spin 1s linear infinite',
      marginRight: '8px',
    }}
  />
);

export default function UserForm({ 
    user, 
    onSave, 
    onClose, 
    addToast
}) {
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'profissional', password: '', status: 'active',
  });
  const [errors, setErrors] = useState({});
  // NOVO: Estado para controle de salvamento
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'profissional',
      password: '', 
      status: user?.status || 'active',
      id: user?.id,
    });
    setErrors({});
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de e-mail inválido.';
    }
    if (!user && !formData.password.trim()) {
        newErrors.password = 'A senha é obrigatória para novos usuários.';
    }
    return newErrors;
  }

  // A função é agora assíncrona
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Inicia o salvamento
    setIsSaving(true);

    const dataToSave = { ...formData };
    if (!dataToSave.password) {
      delete dataToSave.password;
    }
    
    try {
        // Assume que onSave é assíncrona (chamada de API)
        await onSave(dataToSave);

        if (addToast) {
            addToast(
                user ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!',
                'success'
            );
        }
        
        onClose(); // Fecha SÓ APÓS o sucesso

    } catch (err) {
        addToast?.('Erro ao salvar usuário. Tente novamente.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Nome */}
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-name-${user?.id || 'new'}`}>Nome Completo</label>
          <input type="text" id={`user-name-${user?.id || 'new'}`} name="name" value={formData.name} onChange={handleChange} className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} required disabled={isSaving} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        {/* Email */}
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-email-${user?.id || 'new'}`}>Email</label>
          <input type="email" id={`user-email-${user?.id || 'new'}`} name="email" value={formData.email} onChange={handleChange} className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`} required disabled={isSaving} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        {/* Senha (condicional) */}
        <div>
           <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-pass-${user?.id || 'new'}`}>Senha</label>
           <input
             type="password"
             id={`user-pass-${user?.id || 'new'}`}
             name="password"
             value={formData.password}
             onChange={handleChange}
             className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
             placeholder={user ? 'Deixe em branco para não alterar' : ''}
             required={!user} 
             disabled={isSaving}
           />
           {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
         </div>
        {/* Função */}
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-role-${user?.id || 'new'}`}>Função</label>
          <select id={`user-role-${user?.id || 'new'}`} name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded border-gray-300 bg-white" disabled={isSaving}>
            <option value="profissional">Profissional</option>
            <option value="secretario">Secretário(a)</option>
            <option value="admin">Administrador(a)</option>
          </select>
        </div>
         {/* Status (Se editando) */}
         {user && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-status-${user.id}`}>Status</label>
              <select
                id={`user-status-${user.id}`}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded border-gray-300 bg-white"
                disabled={isSaving}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
         )}
        {/* Botões */}
        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? (
                <>
                    <SimpleSpinner />
                    <span>Salvando...</span>
                </>
            ) : (
                <span>Salvar</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; // Importa Modal

// !! IMPORTANTE: Remova a dependência de `users` para validação de email.
// Isso deve ser feito no backend ou via prop checkDuplicateEmail.

// Exportação Default
export default function UserForm({ user, onSave, onClose /* Adicione prop checkDuplicateEmail */ }) {
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'profissional', password: '', status: 'active', // Status padrão
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Carrega dados do usuário ou reseta o formulário
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'profissional',
      password: '', // Senha sempre vazia ao abrir (segurança)
      status: user?.status || 'active',
      id: user?.id, // Mantém ID se editando
    });
    setErrors({}); // Limpa erros
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); // Limpa erro ao digitar
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de e-mail inválido.';
    }
    // Senha obrigatória apenas para *novos* usuários E se o campo estiver vazio
    if (!user && !formData.password.trim()) {
        newErrors.password = 'A senha é obrigatória para novos usuários.';
    }
    // Senha opcional ao editar, mas se preenchida, pode ter validação de força
    // if (user && formData.password && formData.password.length < 6) {
    //     newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    // }

    // --- Validação de Duplicidade de Email (COMENTADA) ---
    /*
    // Exemplo usando prop:
    // const emailExists = checkDuplicateEmail({ email: formData.email.trim().toLowerCase(), currentId: user?.id });
    // if (emailExists) {
    //     newErrors.email = 'Este e-mail já está em uso.';
    // }
    */

    return newErrors;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    // Remove o campo password do objeto se estiver vazio (para não sobrescrever senha ao editar sem querer)
    const dataToSave = { ...formData };
    if (!dataToSave.password) {
      delete dataToSave.password;
    }
    onSave(dataToSave);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Nome */}
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-name-${user?.id || 'new'}`}>Nome Completo</label>
          <input type="text" id={`user-name-${user?.id || 'new'}`} name="name" value={formData.name} onChange={handleChange} className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} required />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        {/* Email */}
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-email-${user?.id || 'new'}`}>Email</label>
          <input type="email" id={`user-email-${user?.id || 'new'}`} name="email" value={formData.email} onChange={handleChange} className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`} required />
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
             required={!user} // Obrigatório apenas se for novo usuário
           />
           {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
         </div>
        {/* Função */}
        <div>
          <label className="block text-gray-700 font-medium mb-1" htmlFor={`user-role-${user?.id || 'new'}`}>Função</label>
          <select id={`user-role-${user?.id || 'new'}`} name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded border-gray-300 bg-white">
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
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
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
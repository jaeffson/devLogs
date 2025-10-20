import React, { useState, useEffect, useMemo } from 'react';

// Ícones SVG para a interface (substitutos para bibliotecas de ícones)
const icons = {
  user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  lock: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  trash: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  pill: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  clipboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
  dollar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  history: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  reports: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
};


// DADOS FALSOS (MOCK) - Substituir por chamadas de API
let MOCK_USERS = [
    { id: 1, name: 'Dr. João Silva', email: 'profissional@email.com', password: '123', role: 'profissional', status: 'active' },
    { id: 2, name: 'Ana Costa (Secretária)', email: 'secretario@email.com', password: '123', role: 'secretario', status: 'active' },
    { id: 3, name: 'Maria Souza (Admin)', email: 'admin@email.com', password: '123', role: 'admin', status: 'active' },
];

let MOCK_PATIENTS = [
    { id: 1, name: 'Jaeffson Sabino', cpf: '123.456.789-00', susCard: '', observations: 'Hipertenso', generalNotes: 'Monitorar pressão arterial semanalmente.', createdAt: '2025-10-18', status: 'Ativo' },
    { id: 2, name: 'Maria Oliveira', cpf: '', susCard: '898001020304050', observations: 'Diabética tipo 2', generalNotes: 'Alergia a penicilina.', createdAt: '2025-09-01', status: 'Ativo' },
    { id: 3, name: 'Carlos Pereira', cpf: '111.222.333-44', susCard: '', observations: 'Asmático', generalNotes: '', createdAt: '2025-10-20', status: 'Pendente' },
];

let MOCK_MEDICATIONS = [
    { id: 1, name: 'Losartana', createdAt: '2025-01-10' },
    { id: 2, name: 'AAS', createdAt: '2025-01-10' },
    { id: 3, name: 'Metformina', createdAt: '2025-02-15' },
    { id: 4, name: 'Salbutamol', createdAt: '2025-03-20' },
    { id: 5, name: 'Glibenclamida', createdAt: '2025-04-05' },
];

let MOCK_RECORDS = [
    { id: 1, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-1-1`, medicationId: 1, quantity: '1 cx', value: 15.00 }, { recordMedId: `rec-med-1-2`, medicationId: 2, quantity: '1 cx', value: 8.50 }], referenceDate: '2025-10-18', observation: 'Pressão controlada', totalValue: 23.50, status: 'Atendido', entryDate: '2025-10-18T10:00:00Z', deliveryDate: '2025-10-18T14:30:00Z' },
    { id: 2, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-2-1`, medicationId: 1, quantity: '1 cx', value: 15.00 }], referenceDate: '2025-09-15', observation: 'Início do tratamento', totalValue: 80.00, status: 'Atendido', entryDate: '2025-09-15T11:00:00Z', deliveryDate: '2025-09-16T09:00:00Z' },
    { id: 3, patientId: 2, professionalId: 1, medications: [{ recordMedId: `rec-med-3-1`, medicationId: 3, quantity: '3 cxs', value: 22.00 }], referenceDate: '2025-10-10', observation: 'Glicemia estável', totalValue: 130.00, status: 'Atendido', entryDate: '2025-10-10T08:00:00Z', deliveryDate: '2025-10-10T08:30:00Z' },
    { id: 4, patientId: 3, professionalId: 1, medications: [{ recordMedId: `rec-med-4-1`, medicationId: 4, quantity: '1 tubo', value: 25.00 }], referenceDate: '2025-10-18', observation: 'Uso em caso de crise', totalValue: 25.00, status: 'Pendente', entryDate: '2025-10-18T15:00:00Z', deliveryDate: null },
    { id: 5, patientId: 2, professionalId: 1, medications: [{ recordMedId: `rec-med-5-1`, medicationId: 5, quantity: '1 cx', value: 12.00 }], referenceDate: '2025-10-17', observation: 'Ajuste de dose', totalValue: 12.00, status: 'Atendido', entryDate: '2025-10-17T09:30:00Z', deliveryDate: '2025-10-17T11:00:00Z' },
    { id: 6, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-6-1`, medicationId: 5, quantity: '1 cx', value: 18.00 }], referenceDate: '2025-08-20', observation: 'Tratamento interrompido', totalValue: 18.00, status: 'Cancelado', entryDate: '2025-08-20T09:00:00Z', deliveryDate: null },
];

// Helper para obter o nome da medicação pelo ID
const getMedicationName = (medicationId, medications) => {
    const idToFind = Number(medicationId);
    return medications.find(m => m.id === idToFind)?.name || 'Desconhecida';
};
// FIM DOS DADOS FALSOS

// --------- COMPONENTES DA APLICAÇÃO ---------

// Componente: Toast (Notificação)
function Toast({ message, type, onClose }) {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`m-2 p-4 text-white rounded-lg shadow-lg ${bgColor}`}>
      {message}
    </div>
  );
}

// Container para os Toasts
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-50">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}


// Componente: Modal genérico
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        {children}
      </div>
    </div>
  );
}

// Componente: Modal de Confirmação
function ConfirmModal({ message, onConfirm, onClose, confirmText = "Sim", cancelText = "Não" }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4">Confirmação</h2>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">{cancelText}</button>
        <button type="button" onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{confirmText}</button>
      </div>
    </Modal>
  );
}


// Componente: Tela de Login e Cadastro
function LoginScreen({ onLogin, setUsers, addToast, addLog }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Lógica de Login (simulada)
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (user) {
          if (user.status === 'pending') {
              setError('Sua conta está pendente de aprovação.');
              return;
          }
          if (user.status === 'inactive') {
              setError('Sua conta está desativada. Entre em contato com o administrador.');
              return;
          }
        onLogin({ ...user, token: `fake-jwt-token-for-${user.id}` });
      } else {
        setError('Credenciais inválidas.');
      }
    } else {
      // Lógica de Cadastro (simulada)
      if (MOCK_USERS.some(u => u.email === email)) {
        setError('Este e-mail já está em uso.');
        return;
      }
      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: 'profissional', // Permissão padrão
        status: 'pending',
      };
      setUsers(prev => [...prev, newUser]);
      addToast('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.', 'success');
      addLog('Novo Usuário', `realizou o cadastro e aguarda aprovação.`);
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">SysMed</h1>
          <p className="text-gray-500">Gestão de Pacientes e Medicações</p>
        </div>
        <form onSubmit={handleAuth}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Nome Completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite seu nome completo"
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu e-mail"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua senha"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex flex-col items-center justify-between">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
              type="submit"
            >
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800 mt-4"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </form>
         <p className="text-center text-xs text-gray-400 mt-8">Versão 1.0.0</p>
      </div>
    </div>
  );
}

// Componente: Formulário de Paciente (em Modal)
function PatientForm({ patient, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    ...patient
  });
  const [errors, setErrors] = useState({});

  const formatCPF = (cpf) => {
    const cleaned = ('' + cpf).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
    if (!match) return cpf;
    return !match[2]
      ? match[1]
      : `${match[1]}.${match[2]}` +
        (!match[3] ? '' : `.${match[3]}`) +
        (!match[4] ? '' : `-${match[4]}`);
  };

  const capitalizeName = (name) => {
    const exceptions = ['de', 'da', 'do', 'dos', 'das'];
    return name
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            if (index > 0 && exceptions.includes(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
  };
  
  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'cpf') {
        value = formatCPF(value);
    }
    if (name === 'name') {
        value = capitalizeName(value);
    }
     if (name === 'susCard') {
        value = value.replace(/\D/g, ''); // Apenas números
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa o erro do campo ao ser modificado
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    // Limpa o erro de CPF/SUS se um deles for preenchido
    if ((name === 'cpf' || name === 'susCard') && (errors.cpf || errors.susCard)) {
        setErrors(prev => ({...prev, cpf: null, susCard: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'O nome completo é obrigatório.';
    }
    if (!formData.cpf.trim() && !formData.susCard.trim()) {
      newErrors.cpf = 'É necessário informar o CPF ou o Cartão SUS.';
    }
    return newErrors;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const cleanCPF = (cpf) => ('' + cpf).replace(/\D/g, '');
    const cleanSus = (sus) => ('' + sus).replace(/\D/g, '');

    const formCPF = cleanCPF(formData.cpf);
    const formSus = cleanSus(formData.susCard);

    const exists = MOCK_PATIENTS.some(p =>
      p.id !== formData.id &&
      ( (formCPF && cleanCPF(p.cpf) === formCPF) || (formSus && cleanSus(p.susCard) === formSus) )
    );
    if(exists) {
      setErrors({ cpf: 'Já existe um paciente com este CPF ou Cartão SUS.' });
      return;
    }

    onSave(formData);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">{patient ? 'Editar Paciente' : 'Cadastrar Paciente'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Nome Completo</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700">CPF</label>
            <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} maxLength="14" className={`w-full p-2 border rounded ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`} />
          </div>
          <div>
            <label className="block text-gray-700">Cartão SUS</label>
            <input type="text" name="susCard" value={formData.susCard} onChange={handleChange} maxLength="15" className={`w-full p-2 border rounded ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`} />
          </div>
        </div>
        {errors.cpf && <p className="text-red-500 text-xs -mt-2 mb-4">{errors.cpf}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Observações (visível em cada registro)</label>
          <textarea name="observations" value={formData.observations} onChange={handleChange} className="w-full p-2 border rounded" rows="3"></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Anotações Gerais (fixas do paciente)</label>
          <textarea name="generalNotes" value={formData.generalNotes} onChange={handleChange} className="w-full p-2 border rounded" rows="3"></textarea>
        </div>
        <div className="flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

// Componente: Formulário de Nova Medicação
function MedicationForm({ medication, onSave, onClose }) {
    const [name, setName] = useState(medication ? medication.name : '');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('O nome da medicação é obrigatório.');
            return;
        }
        if (MOCK_MEDICATIONS.some(m => m.id !== (medication && medication.id) && m.name.toLowerCase() === name.trim().toLowerCase())) {
            setError('Esta medicação já existe.');
            return;
        }
        
        onSave({ ...medication, name: name.trim() });
    }

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold mb-4">{medication ? 'Editar Medicação' : 'Nova Medicação'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">Nome da Medicação</label>
                    <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }} className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`} autoFocus/>
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                </div>
            </form>
        </Modal>
    )
}

// Componente: Formulário de Usuário
function UserForm({ user, onSave, onClose, users }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'profissional',
    password: '',
    ...user,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!formData.email.trim()) newErrors.email = 'O e-mail é obrigatório.';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Formato de e-mail inválido.';
    }
    if (!user && !formData.password) { // Senha obrigatória para novos usuários
        newErrors.password = 'A senha é obrigatória para novos usuários.';
    }
    
    // Verifica se o e-mail já está em uso por outro usuário
    const emailExists = users.some(u => u.id !== (user && user.id) && u.email.toLowerCase() === formData.email.trim().toLowerCase());
    if(emailExists){
        newErrors.email = 'Este e-mail já está em uso.';
    }

    return newErrors;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Nome Completo</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-gray-700">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        {!user && ( // Apenas mostra o campo de senha para novos usuários
             <div>
              <label className="block text-gray-700">Senha</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
        )}
        <div>
          <label className="block text-gray-700">Função</label>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded border-gray-300">
            <option value="profissional">Profissional</option>
            <option value="secretario">Secretário(a)</option>
            <option value="admin">Administrador(a)</option>
          </select>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}


// Componente: Formulário de Registro de Medicação (em Modal)
const quantityOptions = ['1 cx', '3 cxs', '1 tubo', '2 tubos', '1 cx com 60 comp'];

function RecordForm({ patient, professionalId, record, onSave, onClose, medicationsList, onNewMedication }) {
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [observation, setObservation] = useState('');
  const [medications, setMedications] = useState([{ medicationId: '', quantity: quantityOptions[0], value: '' }]);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [addingMedicationIndex, setAddingMedicationIndex] = useState(null);

  useEffect(() => {
    if (record) {
      setReferenceDate(record.referenceDate);
      setObservation(record.observation || '');
      setMedications(record.medications.length > 0 ? record.medications.map(m => ({...m})) : [{ medicationId: '', quantity: quantityOptions[0], value: '' }]);
    }
  }, [record]);

  const handleMedicationChange = (index, field, value) => {
    if (field === 'medicationId' && value === 'new') {
        setAddingMedicationIndex(index);
        setIsMedicationModalOpen(true);
        return;
    }
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const addMedicationField = () => {
      setMedications([...medications, { medicationId: '', quantity: quantityOptions[0], value: '' }]);
  };

  const removeMedicationField = (index) => {
      if(medications.length > 1) {
        setMedications(medications.filter((_, i) => i !== index));
      }
  };

  const handleSaveNewMedication = (newMedData) => {
      const newMed = onNewMedication(newMedData);
      if (newMed && addingMedicationIndex !== null) {
          handleMedicationChange(addingMedicationIndex, 'medicationId', newMed.id);
      }
      setIsMedicationModalOpen(false);
      setAddingMedicationIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalValue = medications.reduce((sum, med) => sum + (Number(med.value) || 0), 0);
    const recordData = {
      ...record,
      patientId: patient.id,
      professionalId,
      referenceDate,
      observation,
      status: record ? record.status : 'Pendente',
      entryDate: record ? record.entryDate : new Date().toISOString(),
      deliveryDate: record ? record.deliveryDate : null,
      medications: medications
        .filter(m => m.medicationId && m.quantity)
        .map(m => ({ ...m, recordMedId: m.recordMedId || `rec-med-${Date.now()}-${Math.random()}` })),
      totalValue
    };
    onSave(recordData);
  };

  return (
    <>
    <Modal onClose={onClose}>
        <h2 className="text-2xl font-bold mb-2">{record ? `Editar Registro` : 'Novo Registro para'} <span className="text-blue-600">{patient.name}</span></h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-700">Data de Referência</label>
                    <input type="date" value={referenceDate} onChange={e => setReferenceDate(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Medicações</h3>
                {medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                        <select value={med.medicationId} onChange={e => handleMedicationChange(index, 'medicationId', e.target.value)} className="col-span-4 p-2 border rounded" required>
                            <option value="" disabled>Selecione...</option>
                            {medicationsList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            <option value="new" className="font-bold text-blue-600">Cadastrar Nova Medicação...</option>
                        </select>
                        <select value={med.quantity} onChange={e => handleMedicationChange(index, 'quantity', e.target.value)} className="col-span-3 p-2 border rounded">
                            {quantityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input type="number" placeholder="Valor (R$)" value={med.value} onChange={e => handleMedicationChange(index, 'value', e.target.value)} className="col-span-3 p-2 border rounded" step="0.01" min="0"/>
                        <button type="button" onClick={() => removeMedicationField(index)} className="col-span-2 text-red-500 hover:text-red-700 disabled:opacity-50" disabled={medications.length <= 1}>Remover</button>
                    </div>
                ))}
                <button type="button" onClick={addMedicationField} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold">+ Adicionar outra medicação</button>
            </div>

            <div>
              <label className="block text-gray-700">Observações Gerais</label>
              <textarea value={observation} onChange={e => setObservation(e.target.value)} className="w-full p-2 border rounded" rows="2"></textarea>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar Registro</button>
            </div>
        </form>
    </Modal>
    {isMedicationModalOpen && <MedicationForm onSave={handleSaveNewMedication} onClose={() => setIsMedicationModalOpen(false)} />}
    </>
  );
}

// Componente: Gráfico de Barras
function BarChart({ data, title }) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]); // Evita divisão por zero

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="flex justify-around items-end h-[220px] p-4 border-l border-b border-gray-300">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center w-full">
            <div className="relative flex-grow flex items-end w-1/2">
                <div
                    className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-300"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                    title={`${item.label}: ${item.value} paciente(s)`}
                >
                </div>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-700">{item.value}</span>
            </div>
            <span className="text-xs mt-2 text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente: Gráfico de Orçamento Anual
function AnnualBudgetChart({ totalSpent, budgetLimit }) {
  const numericTotalSpent = Number(totalSpent) || 0;
  const numericBudgetLimit = Number(budgetLimit) || 0;
  
  const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const percentage = numericBudgetLimit > 0 ? (numericTotalSpent / numericBudgetLimit) * 100 : 0;
  const isOverBudget = percentage > 100;
  const remainingBudget = numericBudgetLimit - numericTotalSpent;

  let colorClass = 'bg-green-500';
  if (isOverBudget) {
    colorClass = 'bg-red-500';
  } else if (percentage > 70) {
    colorClass = 'bg-orange-500';
  }

  return (
    <div className="w-full max-w-xs">
      <h3 className="text-sm font-semibold text-center text-gray-600">Orçamento Anual</h3>
      <div className="space-y-2 mt-1">
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold">Gasto</span>
            <span className="font-mono">{formatCurrency(numericTotalSpent)} / {formatCurrency(numericBudgetLimit)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 relative">
            <div
              className={`${colorClass} h-4 rounded-full transition-all duration-500 flex items-center justify-center text-white font-bold text-xs`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
            </div>
             {isOverBudget && (
               <div className="absolute top-0 left-full ml-2 flex items-center">
                  <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-red-500 -ml-2"></div>
                  <span className="bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-r-md">
                    {formatCurrency(remainingBudget)}
                  </span>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente: Badge de Status
const StatusBadge = ({ status }) => {
    let badgeClass = 'bg-gray-100 text-gray-800';
    switch (status) {
        case 'Atendido':
            badgeClass = 'bg-green-100 text-green-800';
            break;
        case 'Pendente':
            badgeClass = 'bg-yellow-100 text-yellow-800';
            break;
        case 'Cancelado':
            badgeClass = 'bg-red-100 text-red-800';
            break;
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>{status}</span>;
}


// Componente reutilizável para a aba de Entregas Recentes
function RecentDeliveriesTab({ records, patients, medications }) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);


  const recentRecords = records.filter(r =>
    r.status === 'Atendido' && r.deliveryDate && (r.deliveryDate.startsWith(today) || r.deliveryDate.startsWith(yesterday))
  ).sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));

  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Entregas Atendidas de Hoje e Ontem</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-2 px-4">Paciente</th>
              <th className="text-left py-2 px-4">Data da Entrega</th>
              <th className="text-left py-2 px-4">Medicações</th>
              <th className="text-left py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map(record => (
              <tr key={record.id} className="border-b">
                <td className="py-2 px-4 font-semibold">{getPatientNameById(record.patientId)}</td>
                <td className="py-2 px-4">{new Date(record.deliveryDate).toLocaleString('pt-BR')}</td>
                <td className="py-2 px-4 text-sm">
                    {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                </td>
                <td className="py-2 px-4">
                   <StatusBadge status={record.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentRecords.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma entrega atendida nos últimos dois dias.</p>}
      </div>
    </div>
  );
}

// Componente: Tabela de Histórico de Registros do Paciente
function PatientRecordsTable({ records, medications }) {
    if (records.length === 0) {
        return <p className="text-gray-500 mt-4">Nenhum registro encontrado para este paciente.</p>
    }

    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left py-2 px-4">Data Ref.</th>
                        <th className="text-left py-2 px-4">Data de Entrada</th>
                        <th className="text-left py-2 px-4">Data de Entrega</th>
                        <th className="text-left py-2 px-4">Medicações</th>
                        <th className="text-left py-2 px-4">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(record => (
                        <tr key={record.id} className="border-b">
                            <td className="py-2 px-4">{new Date(record.referenceDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="py-2 px-4">{new Date(record.entryDate).toLocaleDateString('pt-BR')}</td>
                            <td className="py-2 px-4">{record.deliveryDate ? new Date(record.deliveryDate).toLocaleDateString('pt-BR') : '---'}</td>
                            <td className="py-2 px-4 text-sm">
                                {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                            </td>
                            <td className="py-2 px-4"><StatusBadge status={record.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Componente: Modal para confirmar data de atendimento
function AttendRecordModal({ record, onConfirm, onClose, getPatientName }) {
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));

    return (
        <Modal onClose={onClose}>
            <h2 className="text-xl font-semibold mb-4">Confirmar Atendimento</h2>
            <p className="mb-4">Confirme ou ajuste a data de entrega para o paciente <strong>{getPatientName(record.patientId)}</strong>.</p>
            <div className="mb-6">
                <label className="block text-gray-700">Data da Entrega</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button type="button" onClick={() => { onConfirm(record.id, deliveryDate); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>
            </div>
        </Modal>
    )
}


// --------- PAINÉIS POR FUNÇÃO ---------

// Painel do Profissional
function ProfessionalDashboard({ user, activeTab, setActiveTab, addToast, ...props }) {
  const { patients, setPatients, records, setRecords, medications, setMedications } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', onConfirm: null });
  const [quickAddPatientId, setQuickAddPatientId] = useState('');
  const [attendingRecord, setAttendingRecord] = useState(null);

  const closeConfirmation = () => setConfirmation({ isOpen: false, message: '', onConfirm: null });

  const filteredPatients = useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm)) ||
      (p.susCard && p.susCard.includes(searchTerm))
    ), [patients, searchTerm]);

  const handleSavePatient = (patientData) => {
    if (patientData.id) {
      setPatients(patients.map(p => p.id === patientData.id ? patientData : p));
       addToast('Paciente atualizado com sucesso!', 'success');
    } else {
      const newPatient = { ...patientData, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10), status: 'Pendente' };
      setPatients([...patients, newPatient]);
       addToast('Paciente cadastrado com sucesso!', 'success');
    }
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = (patientId) => {
      setPatients(patients.filter(p => p.id !== patientId));
      setRecords(records.filter(r => r.patientId !== patientId));
      if(selectedPatient && selectedPatient.id === patientId) {
        setSelectedPatient(null);
      }
      addToast('Paciente excluído com sucesso!', 'success');
  };
  
  const handleDeleteRecord = (recordId) => {
    setRecords(records.filter(r => r.id !== recordId));
    addToast('Registro excluído com sucesso!', 'success');
  };

  const handleSaveRecord = (recordData) => {
    if (recordData.id) {
        setRecords(records.map(r => r.id === recordData.id ? recordData : r));
        addToast('Registro atualizado com sucesso!', 'success');
    } else {
        const newRecord = { ...recordData, id: Date.now() };
        setRecords([...records, newRecord]);
        addToast('Registro salvo com sucesso!', 'success');
    }
    setIsRecordModalOpen(false);
    setEditingRecord(null);
    setQuickAddPatientId('');
  };

  const handleUpdateRecordStatus = (recordId, deliveryDate) => {
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    if (isNaN(utcDate.getTime())) {
        console.error("Invalid date value provided:", deliveryDate);
        addToast('Data de entrega inválida.', 'error');
        setAttendingRecord(null);
        return;
    }

    setRecords(records.map(r =>
        r.id === recordId
        ? { ...r, status: 'Atendido', deliveryDate: utcDate.toISOString() }
        : r
    ));
    setAttendingRecord(null);
  };

  const handleCancelRecordStatus = (recordId) => {
    setRecords(records.map(r =>
        r.id === recordId ? { ...r, status: 'Cancelado', deliveryDate: null } : r
    ));
  };

  const handleAddNewMedication = (medData) => {
      const newMed = {
          id: Date.now(),
          name: medData.name,
          createdAt: new Date().toISOString().slice(0, 10)
      };
      setMedications([...medications, newMed]);
      addToast('Medicação cadastrada com sucesso!', 'success');
      return newMed;
  };

  const patientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records
      .filter(r => r.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, selectedPatient]);

  const pendingRecords = useMemo(() =>
    records.filter(r => r.status === 'Pendente').sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)),
  [records]);

  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };
  
  const handleQuickAddRecord = (e, patient) => {
      e.stopPropagation();
      setSelectedPatient(patient);
      setEditingRecord(null);
      setIsRecordModalOpen(true);
  }
  
  const handleViewPatientHistory = (patientId) => {
      const patient = patients.find(p => p.id === patientId);
      if(patient) {
          setSelectedPatient(patient);
          setActiveTab('patients');
      }
  }

  const openQuickAddModal = () => {
    if(quickAddPatientId) {
        const patient = patients.find(p => p.id === parseInt(quickAddPatientId));
        if(patient) {
            setSelectedPatient(patient);
            setEditingRecord(null);
            setIsRecordModalOpen(true);
        }
    }
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
          return (
             <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Entradas Pendentes</h3>
                        <p className="text-3xl font-bold mt-2">{pendingRecords.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center items-center">
                        <button onClick={() => setActiveTab('patients')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full mb-2">Ver Pacientes</button>
                        <button onClick={() => setActiveTab('historico')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 w-full">Ver Entradas</button>
                    </div>
                </div>
             </div>
          );
      case 'patients':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4">Pacientes</h2>
                <div className="relative mb-4">
                  <input type="text" placeholder="Buscar por nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  <div className="absolute left-3 top-2.5 text-gray-400">{icons.search}</div>
                </div>
                <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {icons.plus} Novo Paciente
                </button>
                <div className="flex-grow overflow-y-auto pr-2">
                  {filteredPatients.map(patient => (
                    <div key={patient.id} className={`p-3 rounded-lg cursor-pointer mb-2 ${selectedPatient?.id === patient.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => setSelectedPatient(patient)}>
                      <div className="flex justify-between items-center">
                          <p className="font-semibold">{patient.name}</p>
                           <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${patient.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{patient.status}</span>
                            <button onClick={(e) => handleQuickAddRecord(e, patient)} title="Novo Registro Rápido" className="text-gray-400 hover:text-blue-600">{icons.plus}</button>
                           </div>
                      </div>
                      <p className="text-sm text-gray-600">{patient.cpf || patient.susCard}</p>
                    </div>
                  ))}
                </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              {selectedPatient ? (
                <div>
                  <div className="flex justify-between items-start mb-4 pb-4 border-b">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                      <p className="text-gray-500">CPF: {selectedPatient.cpf || 'Não informado'}</p>
                      <p className="text-gray-500">SUS: {selectedPatient.susCard || 'Não informado'}</p>
                      <p className="mt-2 text-sm"><strong>Observações:</strong> {selectedPatient.observations || 'Nenhuma'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingPatient(selectedPatient); setIsPatientModalOpen(true); }} className="p-2 text-gray-600 hover:text-blue-600">{icons.edit}</button>
                      <button onClick={() => setConfirmation({ isOpen: true, message: 'Tem certeza que deseja excluir este paciente e todos os seus registros?', onConfirm: () => handleDeletePatient(selectedPatient.id) })} className="p-2 text-gray-600 hover:text-red-600">{icons.trash}</button>
                    </div>
                  </div>
                   <div className="flex justify-between items-center mt-4">
                      <h3 className="text-xl font-semibold">Histórico Completo</h3>
                      <button onClick={() => { setIsRecordModalOpen(true); setEditingRecord(null);}} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                        {icons.plus} Novo Registro
                      </button>
                    </div>
                     <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mt-4">
                        {patientRecords.length > 0 ? patientRecords.map(record => (
                          <div key={record.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">Data Ref: {new Date(record.referenceDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                  <p className="text-xs text-gray-500">Entrada: {new Date(record.entryDate).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={record.status} />
                                  <button onClick={() => { setEditingRecord(record); setIsRecordModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-600">{icons.edit}</button>
                                  <button onClick={() => setConfirmation({ isOpen: true, message: 'Quer mesmo excluir o registro?', onConfirm: () => handleDeleteRecord(record.id) })} className="p-1 text-gray-500 hover:text-red-600">{icons.trash}</button>
                                </div>
                            </div>
                            <ul className="list-disc list-inside mt-2 text-sm pl-2">
                              {record.medications.map((med) => (<li key={med.recordMedId}>{getMedicationName(med.medicationId, medications)} ({med.quantity})</li>))}
                            </ul>
                          </div>
                        )) : (<p className="text-gray-500 mt-4">Nenhum registro encontrado.</p>)}
                      </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <div className="mb-4 text-gray-300 scale-150">{icons.users}</div>
                  <h2 className="text-xl">Selecione um Paciente</h2>
                  <p>Escolha um paciente na lista para ver seus detalhes.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'historico':
        return (
           <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Histórico de Entradas</h3>
             <div className="bg-gray-50 p-4 rounded-lg mb-4">
                 <h4 className="font-semibold mb-2">Adicionar Novo Registro Rápido</h4>
                 <div className="flex items-center gap-4">
                    <select onChange={(e) => setQuickAddPatientId(e.target.value)} value={quickAddPatientId} className="flex-grow p-2 border rounded-lg">
                        <option value="">Selecione um paciente...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={openQuickAddModal} disabled={!quickAddPatientId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                        Adicionar
                    </button>
                 </div>
             </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-2 px-4">Paciente</th>
                            <th className="text-left py-2 px-4">Data de Entrada</th>
                            <th className="text-left py-2 px-4">Medicações</th>
                            <th className="text-left py-2 px-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...records].sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate)).map(record => (
                            <tr key={record.id} className="border-b">
                                <td className="py-2 px-4 font-semibold">
                                    <button onClick={() => handleViewPatientHistory(record.patientId)} className="text-blue-600 hover:underline">
                                      {getPatientNameById(record.patientId)}
                                    </button>
                                </td>
                                <td className="py-2 px-4">{new Date(record.entryDate).toLocaleString('pt-BR')}</td>
                                <td className="py-2 px-4 text-sm">
                                    {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                                </td>
                                <td className="py-2 px-4 flex gap-2 items-center">
                                    {record.status === 'Pendente' ? (
                                        <>
                                            <button onClick={() => setAttendingRecord(record)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Atendido</button>
                                            <button onClick={() => setConfirmation({ isOpen: true, message: 'Quer mesmo cancelar o registro?', onConfirm: () => handleCancelRecordStatus(record.id)})} className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Cancelar</button>
                                        </>
                                    ) : <StatusBadge status={record.status} /> }
                                     <button onClick={() => { 
                                         const patientForRecord = patients.find(p => p.id === record.patientId);
                                         if(patientForRecord) {
                                            setSelectedPatient(patientForRecord);
                                            setEditingRecord(record);
                                            setIsRecordModalOpen(true);
                                         }
                                     }} className="p-1 text-gray-500 hover:text-blue-600">{icons.edit}</button>
                                    <button onClick={() => setConfirmation({ isOpen: true, message: 'Quer mesmo excluir o registro?', onConfirm: () => handleDeleteRecord(record.id)})} className="p-1 text-gray-500 hover:text-red-600">{icons.trash}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {records.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma entrada no momento.</p>}
            </div>
        </div>
        );
      case 'deliveries':
        return <RecentDeliveriesTab records={records} patients={patients} medications={medications} />;
      default:
        return null;
    }
  }

  return (
    <>
      {renderContent()}

      {isPatientModalOpen && <PatientForm patient={editingPatient} onSave={handleSavePatient} onClose={() => setIsPatientModalOpen(false)} />}
      {isRecordModalOpen && selectedPatient && <RecordForm patient={selectedPatient} professionalId={user.id} record={editingRecord} onSave={handleSaveRecord} onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); setQuickAddPatientId(''); setSelectedPatient(null); }} medicationsList={medications} onNewMedication={handleAddNewMedication} />}
      {confirmation.isOpen && <ConfirmModal message={confirmation.message} onConfirm={confirmation.onConfirm} onClose={closeConfirmation} />}
       {attendingRecord && <AttendRecordModal record={attendingRecord} onConfirm={handleUpdateRecordStatus} onClose={() => setAttendingRecord(null)} getPatientName={getPatientNameById} />}
    </>
  );
}

// Painel do Secretário
function SecretaryDashboard({ annualBudget, patients, records, medications, activeTab, filterYear }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  const filteredPatients = useMemo(() => MOCK_PATIENTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.cpf && p.cpf.includes(searchTerm)) || (p.susCard && p.susCard.includes(searchTerm))), [searchTerm]);

  const patientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records.filter(r => r.patientId === selectedPatient.id).sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  const allRecordsSorted = useMemo(() => {
    let filtered = [...records];
    
    if(filterPeriod !== 'all') {
        const days = parseInt(filterPeriod, 10);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filtered = filtered.filter(r => new Date(r.entryDate) >= cutoffDate);
    }
    
    if(filterStatus !== 'all') {
        filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    if (reportSearchTerm) {
        filtered = filtered.filter(r => getPatientNameById(r.patientId).toLowerCase().includes(reportSearchTerm.toLowerCase()));
    }
    
    return filtered.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

  }, [records, patients, filterPeriod, filterStatus, reportSearchTerm, medications]);

  const recordsByYear = useMemo(() => records.filter(r => new Date(r.entryDate).getFullYear() === filterYear), [records, filterYear]);
  
  const monthlyAttendance = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const attendanceByMonth = Array(12).fill(0).map(() => new Set());

      recordsByYear.forEach(record => {
          const recordDate = new Date(record.entryDate);
          if (record.status === 'Atendido') {
              const monthIndex = recordDate.getMonth();
              attendanceByMonth[monthIndex].add(record.patientId);
          }
      });

      return months.map((monthLabel, index) => ({
          label: monthLabel,
          value: attendanceByMonth[index].size
      }));
  }, [recordsByYear]);
  
  const handleExportPDF = () => {
      const reportTitle = "Relatório de Entregas";
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>' + reportTitle + '</title>');
      printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;} table{width: 100%; border-collapse: collapse;} th, td{border: 1px solid #ddd; padding: 8px; text-align: left;} th{background-color: #f2f2f2;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>' + reportTitle + '</h1>');
      printWindow.document.write('<table><thead><tr><th>Paciente</th><th>Data de Entrada</th><th>Data do Atendimento</th><th>Medicações</th><th>Status</th></tr></thead><tbody>');
      
      allRecordsSorted.forEach(record => {
          const patientName = getPatientNameById(record.patientId);
          const entryDate = new Date(record.entryDate).toLocaleString('pt-BR');
          const deliveryDate = record.deliveryDate ? new Date(record.deliveryDate).toLocaleString('pt-BR') : '---';
          const meds = record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ');
          
          printWindow.document.write('<tr>');
          printWindow.document.write(`<td>${patientName}</td>`);
          printWindow.document.write(`<td>${entryDate}</td>`);
          printWindow.document.write(`<td>${deliveryDate}</td>`);
          printWindow.document.write(`<td>${meds}</td>`);
          printWindow.document.write(`<td>${record.status}</td>`);
          printWindow.document.write('</tr>');
      });
      
      printWindow.document.write('</tbody></table></body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 250);
  };
  
  const renderContent = () => {
     switch(activeTab) {
        case 'dashboard':
          return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                <section className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Atendimentos por Mês</h3>
                    </div>
                    <BarChart data={monthlyAttendance} title={`Pacientes Únicos Atendidos por Mês (${filterYear})`} />
                </section>
            </div>
          );
       case 'records':
         return (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow flex flex-col">
                     <h3 className="text-xl font-bold mb-4">Buscar Paciente</h3>
                     <div className="relative mb-4">
                        <input type="text" placeholder="Nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <div className="absolute left-3 top-2.5 text-gray-400">{icons.search}</div>
                     </div>
                     <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 flex-grow">
                        {filteredPatients.map(p => (
                            <div key={p.id} className={`p-3 rounded-lg cursor-pointer ${selectedPatient?.id === p.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => setSelectedPatient(p)}>
                                <p className="font-bold">{p.name}</p>
                                <p className="text-sm text-gray-500">{p.cpf || p.susCard}</p>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                    {selectedPatient ? (
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-left">Histórico de Entregas: {selectedPatient.name}</h3>
                            <PatientRecordsTable records={patientRecords} medications={medications} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <div className="mb-4 text-gray-300 scale-150">{icons.clipboard}</div>
                            <h2 className="text-xl">Selecione um Paciente</h2>
                            <p>Escolha um paciente na lista para ver seu histórico de entregas.</p>
                        </div>
                    )}
                </div>
            </div>
         );
        case 'all_history':
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold">Relatório Avançado de Entradas</h3>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    {icons.download} Exportar para PDF
                </button>
              </div>
               <div className="flex flex-wrap gap-4 items-center mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-grow">
                        <label className="text-sm font-medium text-gray-700">Buscar por Paciente</label>
                        <input type="text" placeholder="Nome do paciente..." value={reportSearchTerm} onChange={e => setReportSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Período</label>
                        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                            <option value="all">Todos</option>
                            <option value="7">Últimos 7 dias</option>
                            <option value="30">Últimos 30 dias</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                            <option value="all">Todos</option>
                            <option value="Atendido">Atendido</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                </div>
              <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="text-left py-2 px-4">Paciente</th>
                              <th className="text-left py-2 px-4">Data de Entrada</th>
                              <th className="text-left py-2 px-4">Medicações</th>
                              <th className="text-left py-2 px-4">Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {allRecordsSorted.map(record => (
                              <tr key={record.id} className="border-b">
                                  <td className="py-2 px-4 font-semibold">{getPatientNameById(record.patientId)}</td>
                                  <td className="py-2 px-4">{new Date(record.entryDate).toLocaleString('pt-BR')}</td>
                                  <td className="py-2 px-4 text-sm">
                                      {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                                  </td>
                                  <td className="py-2 px-4">
                                      <StatusBadge status={record.status} />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {allRecordsSorted.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma entrada encontrada para os filtros selecionados.</p>}
              </div>
          </div>
          );
        case 'deliveries':
        default:
          return <RecentDeliveriesTab records={records} patients={patients} medications={medications} />;
     }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
}


// Painel do Administrador
function AdminDashboard({ user, activeTab, setActiveTab, annualBudget, onUpdateBudget, addToast, ...props }) {
    const { patients, setPatients, records, setRecords, medications, setMedications, users, setUsers, activityLog, filterYear } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', onConfirm: null });
    const [newBudgetValue, setNewBudgetValue] = useState(annualBudget);
    const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [settingsSubTab, setSettingsSubTab] = useState('budget');
    const [attendingRecord, setAttendingRecord] = useState(null);


  const closeConfirmation = () => setConfirmation({ isOpen: false, message: '', onConfirm: null });

  const filteredPatients = useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm)) ||
      (p.susCard && p.susCard.includes(searchTerm))
    ), [patients, searchTerm]);

  const totalOverallSpent = useMemo(() => records.reduce((sum, item) => sum + (item.totalValue || 0), 0), [records]);

  const handleSavePatient = (patientData) => {
    if (patientData.id) {
      setPatients(patients.map(p => p.id === patientData.id ? patientData : p));
      addToast('Paciente atualizado com sucesso!', 'success');
    } else {
      const newPatient = { ...patientData, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10), status: 'Pendente' };
      setPatients([...patients, newPatient]);
      addToast('Paciente cadastrado com sucesso!', 'success');
    }
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = (patientId) => {
    setPatients(patients.filter(p => p.id !== patientId));
    setRecords(records.filter(r => r.patientId !== patientId));
    if(selectedPatient && selectedPatient.id === patientId) {
      setSelectedPatient(null);
    }
    addToast('Paciente excluído com sucesso!', 'success');
  };

  const handleSaveRecord = (recordData) => {
    if (recordData.id) {
        setRecords(records.map(r => r.id === recordData.id ? recordData : r));
        addToast('Registro atualizado com sucesso!', 'success');
    } else {
        const newRecord = { ...recordData, id: Date.now() };
        setRecords([...records, newRecord]);
        addToast('Registro salvo com sucesso!', 'success');
    }
    setIsRecordModalOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (recordId) => {
    setRecords(records.filter(r => r.id !== recordId));
    addToast('Registro excluído com sucesso!', 'success');
  };

  const handleSaveMedication = (medData) => {
      if(medData.id) {
          setMedications(medications.map(m => m.id === medData.id ? medData : m));
          addToast('Medicação atualizada com sucesso!', 'success');
      } else {
          const newMed = {
              id: Date.now(),
              name: medData.name,
              createdAt: new Date().toISOString().slice(0, 10)
          };
          setMedications([...medications, newMed]);
          addToast('Medicação cadastrada com sucesso!', 'success');
      }
      setIsMedicationModalOpen(false);
      setEditingMedication(null);
  }
  
  const handleDeleteMedication = (medId) => {
      setMedications(medications.filter(m => m.id !== medId));
      addToast('Medicação excluída com sucesso!', 'success');
  }
  
  const handleSaveUser = (userData) => {
      if(userData.id) {
          setUsers(users.map(u => u.id === userData.id ? userData : u));
          addToast('Usuário atualizado com sucesso!', 'success');
      } else {
          const newUser = {...userData, id: Date.now(), status: 'active' };
          setUsers([...users, newUser]);
          addToast('Usuário criado com sucesso!', 'success');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
  }
  
  const handleToggleUserStatus = (userId) => {
      setUsers(users.map(u => u.id === userId ? {...u, status: u.status === 'active' ? 'inactive' : 'active'} : u));
      addToast('Status do usuário alterado com sucesso!', 'success');
  }

  const handleUpdateRecordStatus = (recordId, deliveryDate) => {
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    if (isNaN(utcDate.getTime())) {
        console.error("Invalid date value provided:", deliveryDate);
        addToast('Data de entrega inválida.', 'error');
        setAttendingRecord(null);
        return;
    }

    setRecords(records.map(r =>
        r.id === recordId
        ? { ...r, status: 'Atendido', deliveryDate: utcDate.toISOString() }
        : r
    ));
    setAttendingRecord(null);
  };

  const handleCancelRecordStatus = (recordId) => {
    setRecords(records.map(r =>
        r.id === recordId ? { ...r, status: 'Cancelado', deliveryDate: null } : r
    ));
  };
  
  const handleBudgetSave = () => {
      onUpdateBudget(parseFloat(newBudgetValue));
  }
  
  const handleQuickAddRecord = (e, patient) => {
      e.stopPropagation();
      setSelectedPatient(patient);
      setEditingRecord(null);
      setIsRecordModalOpen(true);
  }
  
  const handleViewPatientHistory = (patientId) => {
      const patient = patients.find(p => p.id === patientId);
      if(patient) {
          setSelectedPatient(patient);
          setActiveTab('patients');
      }
  }

  const monthlyAttendance = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const attendanceByMonth = Array(12).fill(0).map(() => new Set());

      records.filter(r => new Date(r.entryDate).getFullYear() === filterYear).forEach(record => {
          const recordDate = new Date(record.entryDate);
          if (record.status === 'Atendido') {
              const monthIndex = recordDate.getMonth();
              attendanceByMonth[monthIndex].add(record.patientId);
          }
      });

      return months.map((monthLabel, index) => ({
          label: monthLabel,
          value: attendanceByMonth[index].size
      }));
  }, [records, filterYear]);

  const patientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records
      .filter(r => r.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, selectedPatient]);

  const pendingRecords = useMemo(() =>
    records.filter(r => r.status === 'Pendente').sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)),
  [records]);

  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'dashboard':
              return (
                 <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold">Usuários no Sistema</h3>
                            <p className="text-3xl font-bold mt-2">{users.length}</p>
                        </div>
                         <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold">Pacientes Ativos</h3>
                            <p className="text-3xl font-bold mt-2">{patients.filter(p => p.status === 'Ativo').length}</p>
                        </div>
                         <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold">Entradas Pendentes</h3>
                            <p className="text-3xl font-bold mt-2">{pendingRecords.length}</p>
                        </div>
                    </div>
                 </div>
              );
          case 'patients':
              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 flex flex-col">
                      <h3 className="text-xl font-bold mb-4">Pacientes</h3>
                      <div className="relative mb-4">
                        <input type="text" placeholder="Buscar por nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <div className="absolute left-3 top-2.5 text-gray-400">{icons.search}</div>
                      </div>
                      <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {icons.plus} Novo Paciente
                      </button>
                      <div className="flex-grow overflow-y-auto pr-2">
                        {filteredPatients.map(patient => (
                          <div key={patient.id} className={`p-3 rounded-lg cursor-pointer mb-2 ${selectedPatient?.id === patient.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => setSelectedPatient(patient)}>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">{patient.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${patient.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{patient.status}</span>
                                  <button onClick={(e) => handleQuickAddRecord(e, patient)} title="Novo Registro Rápido" className="text-gray-400 hover:text-blue-600">{icons.plus}</button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">{patient.cpf || patient.susCard}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                      {selectedPatient ? (
                        <div>
                           <div className="flex justify-between items-start mb-4 pb-4 border-b">
                            <div>
                              <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                              <p className="text-gray-500">CPF: {selectedPatient.cpf || 'Não informado'}</p>
                              <p className="text-gray-500">SUS: {selectedPatient.susCard || 'Não informado'}</p>
                              <p className="mt-2 text-sm"><strong>Observações:</strong> {selectedPatient.observations || 'Nenhuma'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingPatient(selectedPatient); setIsPatientModalOpen(true); }} className="p-2 text-gray-600 hover:text-blue-600">{icons.edit}</button>
                              <button onClick={() => setConfirmation({ isOpen: true, message: 'Tem certeza que deseja excluir este paciente e todos os seus registros?', onConfirm: () => handleDeletePatient(selectedPatient.id) })} className="p-2 text-gray-600 hover:text-red-600">{icons.trash}</button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <h3 className="text-xl font-semibold">Histórico Completo</h3>
                            <button onClick={() => { setIsRecordModalOpen(true); setEditingRecord(null);}} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                              {icons.plus} Novo Registro
                            </button>
                          </div>
                           <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mt-4">
                              {patientRecords.length > 0 ? patientRecords.map(record => (
                                <div key={record.id} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold">Data Ref: {new Date(record.referenceDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                        <p className="text-xs text-gray-500">Entrada: {new Date(record.entryDate).toLocaleString('pt-BR')}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <StatusBadge status={record.status} />
                                        <button onClick={() => { setEditingRecord(record); setIsRecordModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-600">{icons.edit}</button>
                                        <button onClick={() => setConfirmation({ isOpen: true, message: 'Quer mesmo excluir o registro?', onConfirm: () => handleDeleteRecord(record.id) })} className="p-1 text-gray-500 hover:text-red-600">{icons.trash}</button>
                                      </div>
                                  </div>
                                  <ul className="list-disc list-inside mt-2 text-sm pl-2">
                                    {record.medications.map((med) => (<li key={med.recordMedId}>{getMedicationName(med.medicationId, medications)} ({med.quantity})</li>))}
                                  </ul>
                                </div>
                              )) : (<p className="text-gray-500 mt-4">Nenhum registro encontrado.</p>)}
                            </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                          <div className="mb-4 text-gray-300 scale-150">{icons.users}</div>
                          <h2 className="text-xl">Selecione um Paciente</h2>
                          <p>Escolha um paciente na lista para ver e gerenciar seus dados.</p>
                        </div>
                      )}
                    </div>
                </div>
              );
        case 'historico':
           return (
             <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Histórico de Entradas</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-2 px-4">Paciente</th>
                                <th className="text-left py-2 px-4">Data de Entrada</th>
                                <th className="text-left py-2 px-4">Medicações</th>
                                <th className="text-left py-2 px-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...records].sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate)).map(record => (
                                <tr key={record.id} className="border-b">
                                    <td className="py-2 px-4 font-semibold">
                                       <button onClick={() => handleViewPatientHistory(record.patientId)} className="text-blue-600 hover:underline">
                                          {getPatientNameById(record.patientId)}
                                       </button>
                                    </td>
                                    <td className="py-2 px-4">{new Date(record.entryDate).toLocaleString('pt-BR')}</td>
                                    <td className="py-2 px-4 text-sm">
                                        {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                                    </td>
                                    <td className="py-2 px-4 flex items-center gap-2">
                                         {record.status === 'Pendente' ? (
                                        <>
                                            <button onClick={() => setAttendingRecord(record)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Atendido</button>
                                            <button onClick={() => setConfirmation({ isOpen: true, message: 'Quer mesmo cancelar o registro?', onConfirm: () => handleCancelRecordStatus(record.id)})} className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Cancelar</button>
                                        </>
                                    ) : <StatusBadge status={record.status} /> }
                                          <button
                                            onClick={() => {
                                                const patientForRecord = patients.find(p => p.id === record.patientId);
                                                if (patientForRecord) {
                                                  setSelectedPatient(patientForRecord);
                                                  setEditingRecord(record);
                                                  setIsRecordModalOpen(true);
                                                }
                                            }}
                                            className="p-1 text-gray-500 hover:text-blue-600"
                                          >
                                            {icons.edit}
                                          </button>
                                          <button onClick={() => setConfirmation({ isOpen: true, message: 'Quer mesmo excluir o registro?', onConfirm: () => handleDeleteRecord(record.id)})} className="p-1 text-gray-500 hover:text-red-600">{icons.trash}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {records.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma entrada no momento.</p>}
                </div>
            </div>
           );
         case 'medications':
            return (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Gerenciar Medicações</h3>
                        <button onClick={() => { setEditingMedication(null); setIsMedicationModalOpen(true);}} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          {icons.plus} Nova Medicação
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left py-2 px-4">Nome da Medicação</th>
                            <th className="text-left py-2 px-4">Data de Cadastro</th>
                            <th className="text-left py-2 px-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medications.map(med => (
                            <tr key={med.id} className="border-b">
                              <td className="py-2 px-4">{med.name}</td>
                              <td className="py-2 px-4">{new Date(med.createdAt + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                              <td className="py-2 px-4 flex gap-2">
                                <button onClick={() => { setEditingMedication(med); setIsMedicationModalOpen(true);}} className="p-1 text-gray-500 hover:text-blue-600">{icons.edit}</button>
                                <button onClick={() => setConfirmation({isOpen: true, message: 'Deseja excluir esta medicação?', onConfirm: () => handleDeleteMedication(med.id)})} className="p-1 text-gray-500 hover:text-red-600">{icons.trash}</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                     {isMedicationModalOpen && <MedicationForm medication={editingMedication} onSave={handleSaveMedication} onClose={() => setIsMedicationModalOpen(false)} />}
                </div>
            );
        case 'deliveries':
            return <RecentDeliveriesTab records={records} patients={patients} medications={medications} />;
        case 'reports':
            return (
                 <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <BarChart data={monthlyAttendance} title="Pacientes Únicos Atendidos por Mês (2025)" />
                    </div>
                 </div>
            );
        case 'settings':
            return (
              <div className="space-y-6">
                 <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setSettingsSubTab('budget')} className={`${settingsSubTab === 'budget' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                           Orçamento
                        </button>
                        <button onClick={() => setSettingsSubTab('users')} className={`${settingsSubTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                           Usuários
                        </button>
                        <button onClick={() => setSettingsSubTab('log')} className={`${settingsSubTab === 'log' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                           Log de Atividades
                        </button>
                    </nav>
                </div>

                {settingsSubTab === 'budget' && (
                    <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
                        <h3 className="text-xl font-semibold mb-4">Orçamento Anual</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Valor do Orçamento (R$)</label>
                                <input 
                                    type="number"
                                    value={newBudgetValue}
                                    onChange={(e) => setNewBudgetValue(e.target.value)}
                                    className="w-full p-2 border rounded border-gray-300"
                                    placeholder="ex: 5000.00"
                                />
                            </div>
                            <button 
                                onClick={handleBudgetSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salvar Orçamento
                            </button>
                        </div>
                    </div>
                )}
                {settingsSubTab === 'users' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Gerenciar Usuários</h3>
                            <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true);}} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              {icons.plus} Novo Usuário
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left py-2 px-4">Nome</th>
                                <th className="text-left py-2 px-4">Email</th>
                                <th className="text-left py-2 px-4">Função</th>
                                <th className="text-left py-2 px-4">Status</th>
                                 <th className="text-left py-2 px-4">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map(u => (
                                <tr key={u.id} className="border-b">
                                  <td className="py-2 px-4">{u.name}</td>
                                  <td className="py-2 px-4">{u.email}</td>
                                  <td className="py-2 px-4 capitalize">{u.role}</td>
                                  <td className="py-2 px-4">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                                  </td>
                                  <td className="py-2 px-4 flex gap-2">
                                    <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true);}} className="p-1 text-gray-500 hover:text-blue-600">{icons.edit}</button>
                                    <button onClick={() => setConfirmation({ isOpen: true, message: `Deseja ${u.status === 'active' ? 'desativar' : 'reativar'} este usuário?`, onConfirm: () => handleToggleUserStatus(u.id)})} className={`p-1 text-gray-500 ${u.status === 'active' ? 'hover:text-red-600' : 'hover:text-green-600'}`}>{u.status === 'active' ? icons.trash : icons.plus}</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    </div>
                )}
                 {settingsSubTab === 'log' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-semibold mb-4">Log de Atividades do Sistema</h3>
                        <div className="overflow-y-auto max-h-[60vh]">
                            <ul>
                                {activityLog.map(log => (
                                    <li key={log.id} className="border-b py-2">
                                        <p className="text-sm text-gray-800"><span className="font-bold">{log.user}</span> {log.action}</p>
                                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                 )}
              </div>
            );
        default:
            return null;
      }
  }

  return (
    <>
      {renderContent()}

      {isPatientModalOpen && <PatientForm patient={editingPatient} onSave={handleSavePatient} onClose={() => setIsPatientModalOpen(false)} />}
      {isRecordModalOpen && selectedPatient && <RecordForm patient={selectedPatient} professionalId={user.id} record={editingRecord} onSave={handleSaveRecord} onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); }} medicationsList={medications} onNewMedication={(medName) => handleSaveMedication({name: medName})} />}
      {isUserModalOpen && <UserForm user={editingUser} onSave={handleSaveUser} onClose={() => setIsUserModalOpen(false)} users={users} />}
      {confirmation.isOpen && <ConfirmModal message={confirmation.message} onConfirm={confirmation.onConfirm} onClose={closeConfirmation} />}
       {attendingRecord && <AttendRecordModal record={attendingRecord} onConfirm={handleUpdateRecordStatus} onClose={() => setAttendingRecord(null)} getPatientName={getPatientNameById} />}
    </>
  );
}


// --- Componente de Layout Principal ---
const MainLayout = ({ user, handleLogout, ...props }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const { annualBudget, records } = props;
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    const totalSpentForYear = useMemo(() => 
        (records || [])
            .filter(r => new Date(r.entryDate).getFullYear() === filterYear)
            .reduce((sum, item) => sum + (item.totalValue || 0), 0), 
        [records, filterYear]
    );
    
    const getRoleName = (role) => {
        const names = {
            profissional: "Profissional",
            secretario: "Secretário(a)",
            admin: "Administrador(a)"
        };
        return names[role] || role;
    }

    const professionalMenu = [
        { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
        { id: 'deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
        { id: 'historico', label: 'Histórico de Entradas', icon: icons.history },
        { id: 'patients', label: 'Gerenciar Pacientes', icon: icons.users },
    ];
    
    const secretaryMenu = [
        { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
        { id: 'deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
        { id: 'all_history', label: 'Relatório Geral', icon: icons.reports },
        { id: 'records', label: 'Histórico por Paciente', icon: icons.history },
    ];
    
    const adminMenu = [
        { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
        { id: 'deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
        { id: 'historico', label: 'Histórico de Entradas', icon: icons.history },
        { id: 'patients', label: 'Gerenciar Pacientes', icon: icons.users },
        { id: 'medications', label: 'Gerenciar Medicações', icon: icons.pill },
        { id: 'reports', label: 'Relatórios', icon: icons.reports },
        { id: 'settings', label: 'Configurações', icon: icons.settings },
    ];

    const menuItems = {
        profissional: professionalMenu,
        secretario: secretaryMenu,
        admin: adminMenu,
    }[user.role];
    
    const ViewComponent = useMemo(() => {
      const components = {
        profissional: ProfessionalDashboard,
        secretario: SecretaryDashboard,
        admin: AdminDashboard,
      };
      return components[user.role];
    }, [user.role]);

    return (
        <div className="min-h-screen flex bg-gray-100">
            <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">SysMed</h1>
                    <p className="text-sm text-gray-500">Painel de {getRoleName(user.role)}</p>
                </div>
                <nav className="flex-grow p-4">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors mb-2 flex items-center gap-3 ${
                                activeView === item.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t">
                     <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md">
                      {icons.logout}
                      <span>Sair</span>
                    </button>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                 <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-sm">Olá, <strong>{user.name}</strong></span>
                    </div>
                    
                    {(user.role === 'admin' || user.role === 'secretario') && (
                        <div className="flex-grow flex items-center justify-center px-4 gap-4">
                             <AnnualBudgetChart totalSpent={totalSpentForYear} budgetLimit={annualBudget} />
                        </div>
                    )}

                    <div className="w-64 flex justify-end items-center gap-4">
                        { (user.role === 'admin' || user.role === 'secretario') && 
                            <div>
                                <label className="text-xs font-medium text-gray-700 mr-2">Ano:</label>
                                <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} className="p-1 border rounded-lg text-xs">
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                </select>
                            </div>
                        }
                    </div>
                </header>
                <main className="flex-grow p-6 overflow-auto">
                    {ViewComponent && <ViewComponent {...{ user, activeTab: activeView, setActiveTab: setActiveView, filterYear, ...props }} />}
                </main>
            </div>
        </div>
    );
};


// Componente Principal da Aplicação
export default function App() {
  const [user, setUser] = useState(null);
  const [annualBudget, setAnnualBudget] = useState(5000.00);
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [records, setRecords] = useState(MOCK_RECORDS);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [toasts, setToasts] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  };
  
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }

  const addLog = (userName, action) => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      user: userName,
      action: action,
    };
    setActivityLog(prevLog => [newLog, ...prevLog]);
  };

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'true') {
        setShowCookieBanner(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const handleUpdateBudget = (newBudget) => {
      setAnnualBudget(newBudget);
      addToast('Orçamento atualizado com sucesso!', 'success');
      addLog(user.name, `atualizou o orçamento anual para R$ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newBudget)}.`);
  }

    const handleAcceptCookies = () => {
        localStorage.setItem('cookieConsent', 'true');
        setShowCookieBanner(false);
    };

  return (
    <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {!user ? (
            <LoginScreen onLogin={handleLogin} setUsers={setUsers} addToast={addToast} addLog={addLog} />
        ) : (
            <MainLayout user={user} handleLogout={handleLogout} {...{
                annualBudget,
                onUpdateBudget: handleUpdateBudget,
                patients,
                setPatients,
                records,
                setRecords,
                medications,
                setMedications,
                users,
                setUsers,
                addToast,
                activityLog,
                addLog,
            }} />
        )}

        {showCookieBanner && (
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-between items-center z-50">
                <p className="text-sm">Usamos cookies para garantir que você tenha a melhor experiência em nosso site.</p>
                <button onClick={handleAcceptCookies} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Aceitar
                </button>
            </div>
        )}
    </>
  );
}


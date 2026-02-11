import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast'; // Certifique-se que usa essa lib ou ajuste para a sua
import { Plus, Trash, Save, Edit, User, Package } from 'lucide-react';
import api from '../../../services/api';

export function WeeklyShipmentView({ distributors = [], patients = [], medicationsList = [] }) {
  // Estado Geral
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [currentShipment, setCurrentShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado do Formulário Atual
  const [editingItem, setEditingItem] = useState(null); // Se null, é novo cadastro
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientId, setFormPatientId] = useState('');
  const [formMeds, setFormMeds] = useState([
    { name: '', quantity: 1, unit: 'cx', observation: '' }
  ]);

  // Carregar remessa ao selecionar fornecedor
  useEffect(() => {
    if (selectedSupplier) {
      loadShipment();
    } else {
      setCurrentShipment(null);
    }
  }, [selectedSupplier]);

  const loadShipment = async () => {
    setLoading(true);
    try {
      // Codifica o nome para evitar erro com espaços ou caracteres especiais
      const res = await api.get(`/shipments/current?supplier=${encodeURIComponent(selectedSupplier)}`);
      setCurrentShipment(res.data);
    } catch (error) {
      console.error("Erro ao carregar remessa", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DO FORMULÁRIO DE MEDICAMENTOS ---
  const addMedField = () => {
    setFormMeds([...formMeds, { name: '', quantity: 1, unit: 'cx', observation: '' }]);
  };

  const removeMedField = (index) => {
    const newMeds = formMeds.filter((_, i) => i !== index);
    setFormMeds(newMeds);
  };

  const updateMedField = (index, field, value) => {
    const newMeds = [...formMeds];
    newMeds[index][field] = value;
    setFormMeds(newMeds);
  };

  // --- AUTOCOMPLETE DE PACIENTE ---
  const handlePatientSelect = (e) => {
    const val = e.target.value;
    setFormPatientName(val);
    const found = patients.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (found) setFormPatientId(found._id);
    else setFormPatientId('');
  };

  // --- SALVAR ITEM NA LISTA ---
  const handleSaveItem = async () => {
    if (!selectedSupplier) return toast.error("Selecione um fornecedor");
    if (!formPatientName) return toast.error("Nome do paciente obrigatório");
    if (formMeds.some(m => !m.name || m.quantity <= 0)) return toast.error("Preencha os medicamentos corretamente");

    try {
      await api.post('/shipments/save-item', {
        supplier: selectedSupplier,
        patientName: formPatientName,
        patientId: formPatientId,
        medications: formMeds
      });
      
      toast.success("Receita adicionada à remessa!");
      loadShipment(); // Recarrega a lista
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormPatientName('');
    setFormPatientId('');
    setFormMeds([{ name: '', quantity: 1, unit: 'cx', observation: '' }]);
    setEditingItem(null);
  };

  // --- EDITAR ITEM JÁ CADASTRADO ---
  const handleEditClick = (item) => {
    setFormPatientName(item.patientName);
    setFormPatientId(item.patientId);
    setFormMeds(item.medications);
    setEditingItem(item);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Remessa da Semana</h1>
        <p className="text-gray-500">Cadastre as receitas para envio ao fornecedor.</p>
      </header>

      {/* SELEÇÃO DE FORNECEDOR (CORRIGIDO) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Fornecedor</label>
        
        <select 
          value={selectedSupplier} 
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
          style={{ color: '#111827' }} // Garante cor escura
        >
          <option value="" className="text-gray-500">-- Escolha um Fornecedor --</option>
          
          {Array.isArray(distributors) && distributors.map((d, index) => (
            <option key={d._id || index} value={d.name} className="text-gray-900 font-medium">
              {d.name}
            </option>
          ))}
        </select>

        {distributors.length === 0 && (
           <p className="text-xs text-red-500 mt-2">Nenhum fornecedor encontrado. Verifique o cadastro no painel Admin.</p>
        )}
      </div>

      {selectedSupplier && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- COLUNA 1: FORMULÁRIO DE CADASTRO --- */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500 h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Plus className="w-5 h-5 text-blue-500" />
              {editingItem ? 'Editar Receita' : 'Nova Receita'}
            </h2>

            {/* Nome do Paciente */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Paciente</label>
              <input 
                list="patients-list"
                value={formPatientName}
                onChange={handlePatientSelect}
                className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-gray-900"
                placeholder="Digite o nome do paciente..."
              />
              <datalist id="patients-list">
                {patients.map(p => <option key={p._id} value={p.name} />)}
              </datalist>
            </div>

            {/* Lista Dinâmica de Medicamentos */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Medicamentos</label>
              {formMeds.map((med, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100 relative group">
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-8">
                      <input 
                        placeholder="Nome do Medicamento"
                        value={med.name}
                        list="meds-list"
                        onChange={(e) => updateMedField(index, 'name', e.target.value)}
                        className="w-full text-sm p-1.5 border rounded text-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number"
                        placeholder="Qtd"
                        value={med.quantity}
                        onChange={(e) => updateMedField(index, 'quantity', e.target.value)}
                        className="w-full text-sm p-1.5 border rounded text-center text-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={med.unit}
                        onChange={(e) => updateMedField(index, 'unit', e.target.value)}
                        className="w-full text-sm p-1.5 border rounded text-gray-900"
                      >
                        <option value="cx">Cx</option>
                        <option value="un">Un</option>
                        <option value="fr">Fr</option>
                        <option value="tb">Tb</option>
                      </select>
                    </div>
                  </div>
                  
                  <input 
                    placeholder="Observações (opcional)"
                    value={med.observation}
                    onChange={(e) => updateMedField(index, 'observation', e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white text-gray-600 mb-1"
                  />

                  {/* Botão Remover Medicamento */}
                  {formMeds.length > 1 && (
                    <button 
                      onClick={() => removeMedField(index)}
                      className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 shadow hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addMedField} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 mb-6">
              + Adicionar outro medicamento
            </button>

            <button 
              onClick={handleSaveItem}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              <Save size={18} />
              {editingItem ? 'Atualizar Receita' : 'Salvar na Remessa'}
            </button>
            
            {editingItem && (
               <button onClick={resetForm} className="w-full mt-2 py-2 text-gray-500 text-sm hover:underline">
                 Cancelar Edição
               </button>
            )}
          </div>

          {/* --- COLUNA 2: LISTA DA REMESSA ATUAL --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Remessa em Aberto
                {currentShipment && <span className="ml-2 text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">Semana {currentShipment.weekNumber}</span>}
              </h2>
            </div>

            {!currentShipment || !currentShipment.items || currentShipment.items.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum item adicionado nesta semana para este fornecedor.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {currentShipment.items.map((item) => (
                  <div key={item._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                           <User size={16} />
                        </div>
                        <h3 className="font-bold text-gray-800">{item.patientName}</h3>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                         {/* Botão de delete placeholder - implementaremos depois se precisar */}
                         <button className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash size={16}/></button>
                      </div>
                    </div>
                    
                    <ul className="text-sm text-gray-600 space-y-1 ml-9">
                      {item.medications.map((med, idx) => (
                        <li key={idx} className="flex justify-between border-b border-gray-100 last:border-0 pb-1">
                          <span>{med.name}</span>
                          <span className="font-medium text-gray-900">{med.quantity} {med.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
      
      {/* Datalist para Medicamentos */}
      <datalist id="meds-list">
         {medicationsList && medicationsList.map(m => <option key={m._id} value={m.name} />)}
      </datalist>
    </div>
  );
}
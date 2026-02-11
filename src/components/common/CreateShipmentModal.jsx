import React, { useState, useEffect } from 'react';
import {
  FiTruck,
  FiX,
  FiCheck,
  FiPlus,
  FiAlertCircle,
  FiDatabase,
  FiEdit2,
  FiCalendar,
} from 'react-icons/fi';
import { shipmentService } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';

export default function CreateShipmentModal({ onClose, onSuccess }) {
  const [supplier, setSupplier] = useState('');
  const [distributors, setDistributors] = useState([]);

  // Estados de Interface
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [isManual, setIsManual] = useState(false);

  // Data de hoje para contexto visual
  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
  });

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    try {
      setLoadingList(true);
      const res = await api.get('/distributors');
      const data = Array.isArray(res.data) ? res.data : [];
      setDistributors(data);

      if (data.length === 0) {
        setIsManual(true);
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setIsManual(true);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplier.trim()) return toast.error('Informe o nome do Fornecedor!');

    setLoading(true);
    try {
      await shipmentService.create({ supplier: supplier.toUpperCase() });
      toast.success('Remessa criada! Iniciando digitação...');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao criar remessa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden border border-gray-100">
        {/* Cabeçalho com Gradiente */}
        <div className="p-6 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-blue-200 shadow-md">
                <FiTruck size={20} />
              </div>
              Nova Remessa
            </h3>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100 w-fit shadow-sm">
              <FiCalendar className="text-blue-500" /> {today}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-gray-700">
                Fornecedor / Origem
              </label>

              {/* Botão de Alternância Melhorado */}
              {!loadingList && distributors.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsManual(!isManual);
                    setSupplier('');
                  }}
                  className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer border hover:shadow-sm 
                  bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                >
                  {isManual ? (
                    <>
                      <FiDatabase /> Usar Lista Salva
                    </>
                  ) : (
                    <>
                      <FiEdit2 /> Digitar Manualmente
                    </>
                  )}
                </button>
              )}
            </div>

            {loadingList ? (
              <div className="flex items-center gap-3 text-gray-500 text-sm py-3 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 animate-pulse">
                <ClipLoader size={18} color="#666" />
                <span>Buscando fornecedores...</span>
              </div>
            ) : (
              <div className="relative group">
                {/* MODO SELEÇÃO (COMBOBOX) */}
                {!isManual && distributors.length > 0 ? (
                  <>
                    <select
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none bg-white font-bold text-gray-700 transition-all cursor-pointer hover:border-blue-300"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      required
                      autoFocus
                    >
                      <option value="">Selecione na lista...</option>
                      {distributors.map((dist) => (
                        <option key={dist._id} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                      <FiDatabase size={18} />
                    </div>
                  </>
                ) : (
                  /* MODO MANUAL (INPUT TEXTO) */
                  <>
                    <input
                      autoFocus
                      type="text"
                      placeholder="DIGITE O NOME..."
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none uppercase font-bold text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      required
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiEdit2 size={18} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Aviso se a lista estiver vazia */}
            {distributors.length === 0 && !loadingList && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Nenhum fornecedor cadastrado no banco. Digite o nome
                  manualmente acima para prosseguir.
                </p>
              </div>
            )}
          </div>

          {/* Rodapé com Botões */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-xl font-bold text-sm transition-colors cursor-pointer w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              {loading ? (
                <ClipLoader size={18} color="#fff" />
              ) : (
                <>
                  <FiCheck size={18} /> Criar Rascunho
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

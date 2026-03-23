// src/components/views/secretary/GeneralReportView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from '../../common/StatusBadge';
import { icons } from '../../../utils/icons';
import useDebounce from '../../../hooks/useDebounce';
import {
  FiX,
  FiCalendar,
  FiUser,
  FiPackage,
  FiMapPin,
  FiInfo,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

// --- CORREÇÃO DE DATA (FUSO HORÁRIO) ---
const formatSafeDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  const d = new Date(dateString);

  // Se a data for válida
  if (!isNaN(d.getTime())) {
    // Para datas "puras" (sem hora importante, ex: Recebido em), ajustamos o fuso
    // Isso evita que dia 10 vire dia 09 às 21h (Problema do "Ontem")
    if (!includeTime) {
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d.toLocaleDateString('pt-BR');
    }
    // Para datas com hora (Entrada), usamos o local string normal
    return d.toLocaleString('pt-BR');
  }
  return '-';
};

// --- SUBCOMPONENTE: MODAL DE DETALHES ---
const RecordDetailModal = ({
  record,
  onClose,
  resolvePatientName,
  getMedicationName,
  medications,
  distributors,
}) => {
  if (!record) return null;

  // Usa a função blindada para pegar o nome
  const patientName = resolvePatientName(record);

  // Datas formatadas com correção de fuso
  const entryDate = formatSafeDate(record.entryDate, true); // Com hora

  // Lógica para Data de Recebimento ou Status
  let deliveryDateDisplay = 'Pendente';
  if (record.deliveryDate) {
    deliveryDateDisplay = formatSafeDate(record.deliveryDate, false);
  } else if (record.status === 'Cancelado') {
    deliveryDateDisplay = 'Cancelado';
  }

  const farmacia = getFarmaciaName(record, distributors);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-in">
        {/* Header Elegante */}
        <div
          className={`p-6 flex justify-between items-start text-white ${record.status === 'Cancelado' ? 'bg-gradient-to-r from-red-700 to-red-900' : 'bg-gradient-to-r from-gray-900 to-gray-800'}`}
        >
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FiUser className="text-white/80" /> {patientName}
            </h3>
            <p className="text-white/60 text-xs mt-1 font-mono uppercase tracking-wide">
              Ref: {record._id.slice(-6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer text-white"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Grid de Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <FiClock /> Data Entrada
              </span>
              <span className="text-sm font-bold text-gray-800">
                {entryDate}
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border flex flex-col gap-1 ${record.deliveryDate ? 'bg-green-50 border-green-100' : record.status === 'Cancelado' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${record.deliveryDate ? 'text-green-600' : record.status === 'Cancelado' ? 'text-red-600' : 'text-orange-600'}`}
              >
                <FiCheckCircle />{' '}
                {record.deliveryDate ? 'Recebido em' : 'Situação'}
              </span>
              <span
                className={`text-sm font-bold ${record.deliveryDate ? 'text-green-800' : record.status === 'Cancelado' ? 'text-red-800' : 'text-orange-800'}`}
              >
                {deliveryDateDisplay}
              </span>
            </div>
          </div>

          {/* --- ÁREA DE CANCELAMENTO (NOVO) --- */}
          {record.status === 'Cancelado' && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-pulse-slow">
              <h4 className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-2">
                <FiAlertTriangle /> Motivo do Cancelamento
              </h4>
              <p className="text-sm text-red-800 font-medium">
                {record.cancelReason || 'Nenhum motivo informado.'}
              </p>
            </div>
          )}

          {/* Farmácia */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <FiMapPin /> Origem / Farmácia
            </h4>
            <div className="bg-white px-4 py-3 rounded-xl text-gray-800 border border-gray-200 font-bold shadow-sm">
              {farmacia}
            </div>
          </div>

          {/* Medicações */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <FiPackage /> Medicamentos Solicitados
            </h4>
            <div className="space-y-2">
              {record.medications?.map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-semibold text-gray-700 text-sm">
                      {m.name || getMedicationName(m.medicationId, medications)}
                    </span>
                  </div>
                  <span className="bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200 shadow-sm">
                    {m.dosage || m.quantity || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          {record.observation && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <FiInfo /> Observações Gerais
              </h4>
              <p className="text-sm text-gray-600 bg-yellow-50 p-4 rounded-xl border border-yellow-100 italic leading-relaxed">
                "{record.observation}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={onClose}
            className="text-blue-600 font-bold text-sm hover:underline cursor-pointer"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- FUNÇÕES AUXILIARES ---

// Recupera nome da farmácia de forma segura
const getFarmaciaName = (record, distributors = []) => {
  if (record?.distributor?.name) return record.distributor.name;
  if (record?.unidade?.name) return record.unidade.name;
  if (record?.farmacia) return record.farmacia;
  if (record?.pharmacy) return record.pharmacy;

  if (distributors && distributors.length > 0) {
    const possibleId =
      record?.distributorId || record?.distributor || record?.location;
    const found = distributors.find(
      (d) =>
        d._id === possibleId || d.id === possibleId || d.name === possibleId
    );
    if (found) return found.name;
  }

  let raw = record?.location || record?.origin || record?.unidade || '';
  const loc = String(raw).toLowerCase().trim();
  if (loc.includes('campina grande') || loc.includes('cg'))
    return 'Campina Grande';
  if (loc.includes('joao paulo') || loc.includes('jp')) return 'João Paulo';

  return raw || 'Não Identificada';
};

export function GeneralReportView({
  user,
  records = [],
  medications = [],
  distributors = [],
  addToast,
  getPatientNameById, // Esta é a função que vem do pai
  getMedicationName,
  initialFilterStatus,
  onBack,
}) {
  // --- ESTADOS ---
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState(
    initialFilterStatus || 'all'
  );
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const debouncedReportSearchTerm = useDebounce(reportSearchTerm, 300);

  useEffect(() => {
    if (initialFilterStatus) setFilterStatus(initialFilterStatus);
  }, [initialFilterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterPeriod,
    filterStatus,
    debouncedReportSearchTerm,
    selectedPharmacy,
    filterYear,
  ]);

  // --- RESOLUÇÃO BLINDADA DO NOME DO PACIENTE ---
  const resolvePatientName = (record) => {
    // 1. Prioridade Máxima: Nome salvo no próprio registro (Backup do banco)
    if (
      record.patientName &&
      record.patientName !== 'Paciente sem nome' &&
      record.patientName !== 'Desconhecido'
    ) {
      return record.patientName;
    }

    // 2. Se patientId for um objeto populado (veio do populate do backend)
    if (
      record.patientId &&
      typeof record.patientId === 'object' &&
      record.patientId.name
    ) {
      return record.patientId.name;
    }

    // 3. Tenta buscar na lista de pacientes via função do pai (se disponível)
    if (typeof getPatientNameById === 'function') {
      const id =
        record.patientId && typeof record.patientId === 'object'
          ? record.patientId._id || record.patientId.id
          : record.patientId;

      if (id) {
        const found = getPatientNameById(id);
        if (found && found !== 'Desconhecido') return found;
      }
    }

    return 'Paciente Não Identificado';
  };

  const statusOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Todos' },
      { value: 'Atendido', label: 'Atendido' },
      { value: 'Pendente', label: 'Pendente' },
      { value: 'Cancelado', label: 'Cancelado' },
    ];
    if (initialFilterStatus === 'Vencido' || filterStatus === 'Vencido') {
      options.push({ value: 'Vencido', label: 'Vencido (30d+)' });
    }
    return options;
  }, [initialFilterStatus, filterStatus]);

  // --- FILTRAGEM ---
  const filteredRecordsForReport = useMemo(() => {
    let filtered = Array.isArray(records) ? [...records] : [];

    if (filterYear) {
      filtered = filtered.filter((r) => {
        try {
          return new Date(r.entryDate).getFullYear() === parseInt(filterYear);
        } catch (e) {
          return false;
        }
      });
    }

    if (filterPeriod !== 'all') {
      const days = parseInt(filterPeriod, 10);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => {
          try {
            return new Date(r.entryDate) >= cutoffDate;
          } catch (e) {
            return false;
          }
        });
      }
    }

    const now = new Date().getTime();
    if (filterStatus !== 'all') {
      if (filterStatus === 'Vencido') {
        filtered = filtered.filter((r) => {
          if (r.status !== 'Pendente' || !r.entryDate) return false;
          try {
            return now - new Date(r.entryDate).getTime() > 30 * MS_IN_DAY;
          } catch (e) {
            return false;
          }
        });
      } else {
        filtered = filtered.filter((r) => r.status === filterStatus);
      }
    }

    if (selectedPharmacy) {
      filtered = filtered.filter(
        (r) => getFarmaciaName(r, distributors) === selectedPharmacy
      );
    }

    const searchTermLower = debouncedReportSearchTerm.toLowerCase();
    if (searchTermLower) {
      filtered = filtered.filter(
        (r) =>
          resolvePatientName(r).toLowerCase().includes(searchTermLower) ||
          getFarmaciaName(r, distributors)
            .toLowerCase()
            .includes(searchTermLower)
      );
    }

    return filtered.length > 0
      ? filtered.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
      : [];
  }, [
    records,
    filterPeriod,
    filterStatus,
    selectedPharmacy,
    debouncedReportSearchTerm,
    filterYear,
    distributors,
  ]);

  const totalPages = useMemo(
    () => Math.ceil(filteredRecordsForReport.length / itemsPerPage),
    [filteredRecordsForReport, itemsPerPage]
  );
  const currentRecordsForReport = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecordsForReport.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecordsForReport, currentPage, itemsPerPage]);

  // --- EXPORTAR PDF ---
  const handleExportPDF = () => {
    if (!filteredRecordsForReport.length) {
      addToast?.('Sem dados.', 'error');
      return;
    }
    try {
      const doc = new jsPDF();
      const userName = user?.name || 'Sistema';
      const dateNow = new Date().toLocaleDateString('pt-BR');
      const timeNow = new Date().toLocaleTimeString('pt-BR');

      // Cabeçalho Centralizado
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('UNIDADE BÁSICA DE SAÚDE PARARI - PB', 105, 15, {
        align: 'center',
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório Geral de Movimentações', 105, 22, {
        align: 'center',
      });

      doc.setLineWidth(0.5);
      doc.line(14, 26, 196, 26);

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Gerado por: ${userName}`, 14, 32);
      doc.text(`Data: ${dateNow} às ${timeNow}`, 196, 32, { align: 'right' });

      const tableRows = filteredRecordsForReport.map((record) => {
        const patientName = resolvePatientName(record);
        const farmacia = getFarmaciaName(record, distributors);
        const date = formatSafeDate(record.entryDate, false);
        const receivedDate = record.deliveryDate
          ? formatSafeDate(record.deliveryDate, false)
          : record.status === 'Cancelado'
            ? 'CANCELADO'
            : 'PENDENTE';

        const items = Array.isArray(record.medications)
          ? record.medications
              .map((m) => {
                const name =
                  m.name || getMedicationName(m.medicationId, medications);
                const qtd = m.dosage || m.quantity || '';
                return qtd ? `${name} (${qtd})` : name;
              })
              .join(', ')
          : '-';

        // Colunas
        return [patientName, items, date, receivedDate, farmacia];
      });

      autoTable(doc, {
        head: [['PACIENTE', 'MEDICAÇÕES', 'ENTRADA', 'RECEBIDO', 'FARMÁCIA']],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 30, halign: 'center' },
        },
        didDrawPage: function (data) {
          doc.setFontSize(7);
          doc.setTextColor(150);
          doc.text(
            'Página ' + data.pageNumber,
            196,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
          );
        },
      });

      doc.save(`relatorio_medlog_${Date.now()}.pdf`);
      addToast?.('PDF gerado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast?.('Erro ao gerar PDF.', 'error');
    }
  };

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 2; i++) years.push(i);
    return years.reverse();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex-none p-5 border-b border-gray-200 bg-gray-50/50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-600 transition-all shadow-sm cursor-pointer"
                title="Voltar"
              >
                {icons.arrowLeft || '<'}
              </button>
            )}
            <div>
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2 tracking-tight">
                Relatório Geral
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Total de {filteredRecordsForReport.length} registros
              </span>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={!filteredRecordsForReport.length}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black text-sm font-bold transition-all shadow-lg hover:shadow-gray-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {icons.download} SALVAR PDF
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative flex-grow min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar paciente, farmácia..."
              value={reportSearchTerm}
              onChange={(e) => setReportSearchTerm(e.target.value)}
              className="w-full pl-9 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
            <span className="absolute left-3 top-3 text-gray-400 text-sm">
              {icons.search}
            </span>
          </div>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer transition-all"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer max-w-[180px]"
          >
            <option value="">Todas Unidades</option>
            {distributors.map((dist) => (
              <option key={dist._id || dist.id} value={dist.name}>
                {dist.name}
              </option>
            ))}
          </select>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
          >
            <option value="all">Todo Histórico</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>

          <div className="flex bg-gray-100 rounded-lg p-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer
                    ${
                      filterStatus === opt.value
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="flex-grow overflow-auto bg-white custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                Entrada
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center bg-blue-50/30">
                Recebido
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                Medicações
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                Origem
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
       <tbody className="divide-y divide-gray-100">
  {/* Remova qualquer .filter() que estivesse aqui antes do .map! O secretário precisa ver TUDO */}
  {(selectedShipment?.items || selectedShipment?.medications || []).map((item, index) => {
    
    // 1. Captura as quantidades (Adapte os nomes das variáveis se o seu backend usar nomes diferentes)
    const requested = item.requestedQuantity || item.quantity || 0;
    const sent = item.sentQuantity || item.deliveredQuantity || item.enviado || 0;
    
    // 2. Inteligência para definir o Status e a Cor da Badge do Item automaticamente
    let itemStatus = 'Pendente';
    let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'; // Amarelo
    
    // Lógica Sênior: Se enviou tudo que pediu
    if (sent >= requested && requested > 0) {
      itemStatus = 'Enviado';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Verde
    } 
    // Lógica Sênior: Se enviou algo, mas menos do que o pedido (Parcial)
    else if (sent > 0 && sent < requested) {
      itemStatus = 'Enviado Parcial';
      badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200'; // Azul/Indigo
    } 
    // Lógica Sênior: Se o sistema ou o farmacêutico marcou explicitamente como em falta
    else if (item.status === 'Em Falta' || item.status === 'Falta' || item.outOfStock) {
      itemStatus = 'Em Falta';
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-200'; // Vermelho
    }

    return (
      <tr key={item._id || index} className="hover:bg-gray-50/80 transition-colors">
        {/* NOME DO MEDICAMENTO */}
        <td className="py-4 px-4">
          <p className="font-bold text-gray-800">
            {item.medicationName || item.medication?.name || item.name || 'Item não especificado'}
          </p>
        </td>
        
        {/* QUANTIDADE SOLICITADA NA RECEITA */}
        <td className="py-4 px-4 text-center">
          <span className="text-gray-500 font-medium">
            {requested} un.
          </span>
        </td>
        
        {/* QUANTIDADE REALMENTE ENVIADA */}
        <td className="py-4 px-4 text-center">
          <span className={`font-black ${sent > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
            {sent} un.
          </span>
        </td>
        
        {/* BADGE VISUAL DE STATUS DO ITEM */}
        <td className="py-4 px-4 text-center">
          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
            {itemStatus}
          </span>
        </td>
      </tr>
    );
  })}
  
  {/* Blindagem caso o pedido venha vazio da API */}
  {!(selectedShipment?.items?.length || selectedShipment?.medications?.length) && (
    <tr>
      <td colSpan="4" className="py-8 text-center text-gray-400 font-medium italic">
        Nenhum medicamento encontrado neste registro.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex-none p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
          <span className="text-gray-600 ml-2 font-medium">
            Página <b>{currentPage}</b> de <b>{totalPages}</b>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer text-sm font-bold shadow-sm transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer text-sm font-bold shadow-sm transition-all"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        resolvePatientName={resolvePatientName}
        getMedicationName={getMedicationName}
        medications={medications}
        distributors={distributors}
      />
    </div>
  );
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export const generateShipmentPDF = async (shipment, type = 'conference') => {
  try {
    if (!shipment) return;

    // 1. CONFIGURAÇÃO DO MODO (Retrato ou Paisagem)
    // Se for 'conference' (Secretaria), usa Paisagem (Landscape - 'l')
    // Se for 'vendor' (Fornecedor), usa Retrato (Portrait - 'p')
    const orientation = type === 'conference' ? 'l' : 'p';
    const doc = new jsPDF(orientation, 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const isLandscape = type === 'conference';

    // 2. PREPARAR DADOS
    const linkUrl = `${window.location.origin}/pedidos/ver/${shipment.accessToken}`;
    const dataFechamento = new Date(shipment.closedAt || new Date()).toLocaleDateString('pt-BR');
    
    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(linkUrl);
    } catch (err) { console.warn(err); }

    // 3. CABEÇALHO (Dinâmico para ajustar a largura)
    doc.setFillColor(245, 245, 245); 
    doc.rect(0, 0, pageWidth, 40, 'F'); // Fundo cinza cobrindo toda a largura

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("SECRETARIA DE SAÚDE DE PARARI", pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("CONTROLE DE ENTREGA E CONFERÊNCIA DE MEDICAMENTOS", pageWidth / 2, 22, { align: 'center' });
    
    // Título do Relatório Específico
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); // Vermelho escuro para diferenciar
    const subTitulo = type === 'vendor' ? "PEDIDO DE COMPRA (FORNECEDOR)" : "LISTA DE CONFERÊNCIA E RECEBIMENTO";
    doc.text(subTitulo, pageWidth / 2, 32, { align: 'center' });

    // 4. BOX DE INFORMAÇÕES
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    // Ajusta o tamanho da caixa dependendo da orientação
    doc.roundedRect(14, 45, isLandscape ? 200 : 130, 25, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("FORNECEDOR:", 18, 52);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text((shipment.supplier || "").toUpperCase(), 18, 57);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text("CÓDIGO:", 18, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(shipment.code, 35, 64);

    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text("DATA DO PEDIDO:", 80, 64);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(dataFechamento, 110, 64);

    // QR Code no canto direito
    if (qrCodeDataUrl) {
      const qrX = pageWidth - 45; // Posiciona sempre no canto direito
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, 42, 30, 30);
    }

    // 5. PREPARAR LINHAS DA TABELA
    // Ordenar alfabeticamente por nome do paciente
    const sortedItems = [...shipment.items].sort((a, b) => 
        a.patientName.localeCompare(b.patientName)
    );

    const tableRows = [];

    sortedItems.forEach(item => {
        // Formata a lista de medicamentos
        const meds = item.medications
            .map(m => {
                let text = `• ${m.name} (${m.quantity} ${m.unit})`;
                
                // SE FOR RELATÓRIO DE CONFERÊNCIA E ESTIVER EM FALTA
                if (type === 'conference' && m.status === 'falta') {
                    return `(EM FALTA) ${m.name} - NÃO VEIO`; // Texto explícito
                }
                return text;
            })
            .join('\n');

        if (type === 'vendor') {
            // RELATÓRIO DO FORNECEDOR: Só Nome e Medicação
            tableRows.push([
                item.patientName.toUpperCase(),
                meds
            ]);
        } else {
            // RELATÓRIO DA SECRETARIA: Completo com Data e Assinatura
            tableRows.push([
                item.patientName.toUpperCase(),
                meds,
                '', // Espaço para data manual
                ''  // Espaço para assinatura manual
            ]);
        }
    });

    // 6. CONFIGURAÇÃO DAS COLUNAS (Depende do tipo)
    let columns = [];
    let colStyles = {};

    if (type === 'vendor') {
        columns = [['PACIENTE', 'MEDICAMENTOS SOLICITADOS']];
        colStyles = {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 'auto' }
        };
    } else {
        columns = [['NOME DO PACIENTE', 'MEDICAÇÃO / STATUS', 'DATA REC.', 'ASSINATURA DO RECEBEDOR']];
        colStyles = {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 110 }, // Mais espaço para medicamentos na horizontal
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' }
        };
    }

    // 7. GERAR TABELA
    autoTable(doc, {
        startY: 80,
        head: columns,
        body: tableRows,
        theme: 'grid',
        styles: { 
            fontSize: 9, 
            cellPadding: 4, 
            valign: 'middle', 
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        headStyles: { 
            fillColor: [0, 51, 102], 
            textColor: 255, 
            fontStyle: 'bold', 
            halign: 'center'
        },
        columnStyles: colStyles,
        // Customização para destacar itens em FALTA
        didParseCell: function (data) {
            if (type === 'conference' && data.section === 'body' && data.column.index === 1) {
                const text = data.cell.raw;
                if (text && text.includes('(EM FALTA)')) {
                    data.cell.styles.textColor = [220, 53, 69]; // Vermelho
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },
        // Linha de assinatura
        didDrawCell: (data) => {
            if (type === 'conference' && data.column.index === 3 && data.section === 'body') {
                const y = data.cell.y + data.cell.height - 5;
                doc.setDrawColor(150);
                doc.line(data.cell.x + 2, y, data.cell.x + data.cell.width - 2, y);
            }
        }
    });

    // 8. RODAPÉ
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Prefeitura de Parari - Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // Nome do arquivo diferente para cada tipo
    const suffix = type === 'vendor' ? 'PEDIDO' : 'CONFERENCIA';
    doc.save(`${suffix}_${shipment.code}.pdf`);

  } catch (error) {
    console.error("ERRO PDF:", error);
    alert("Erro ao gerar PDF: " + error.message);
  }
};
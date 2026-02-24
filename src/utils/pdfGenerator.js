import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export const generateShipmentPDF = async (shipment, type = 'conference') => {
  try {
    if (!shipment) return;

    // 1. CONFIGURAÇÃO DO MODO (Retrato ou Paisagem)
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

    // 3. CABEÇALHO
    doc.setFillColor(245, 245, 245); 
    doc.rect(0, 0, pageWidth, 40, 'F'); 

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("SECRETARIA DE SAÚDE DE PARARI", pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("CONTROLE DE ENTREGA E CONFERÊNCIA DE MEDICAMENTOS", pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); 
    const subTitulo = type === 'vendor' ? "PEDIDO DE COMPRA (FORNECEDOR)" : "LISTA DE CONFERÊNCIA E RECEBIMENTO";
    doc.text(subTitulo, pageWidth / 2, 32, { align: 'center' });

    // 4. BOX DE INFORMAÇÕES
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 45, isLandscape ? 200 : 130, 25, 2, 2, 'FD');

    doc.setFontSize(9);
    
    // LINHA 1: FORNECEDOR E DATA DO PEDIDO
    doc.setTextColor(100);
    doc.text("FORNECEDOR:", 18, 52);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    let supplierName = (shipment.supplier || "").toUpperCase();
    const maxSuppLen = isLandscape ? 70 : 35;
    if (supplierName.length > maxSuppLen) supplierName = supplierName.substring(0, maxSuppLen) + "...";
    doc.text(supplierName, 18, 57);

    const dateX = isLandscape ? 175 : 100;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text("DATA DO PEDIDO:", dateX, 52);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(dataFechamento, dateX, 57);

    // LINHA 2: CÓDIGO 
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text("CÓDIGO:", 18, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    let printCode = shipment.code || "";
    const maxCodeLen = isLandscape ? 90 : 55;
    if (printCode.length > maxCodeLen) printCode = printCode.substring(0, maxCodeLen) + "...";
    doc.text(printCode, 35, 64);

    if (qrCodeDataUrl) {
      const qrX = pageWidth - 45; 
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, 42, 30, 30);
    }

    // INJEÇÃO DINÂMICA DE OBSERVAÇÕES E NOME DO RESPONSÁVEL
    let tableStartY = 80; 

    if (shipment.observations) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 102, 204); 
        doc.text("RESPONSÁVEL / OBSERVAÇÕES:", 14, 76);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const splitObs = doc.splitTextToSize(shipment.observations, isLandscape ? 260 : 180);
        doc.text(splitObs, 14, 81);
        
        tableStartY = 82 + (splitObs.length * 4) + 2;
    }

    // 5. PREPARAR LINHAS DA TABELA (NOVA LÓGICA DE ROWSPAN)
    const sortedItems = [...shipment.items].sort((a, b) => 
        a.patientName.localeCompare(b.patientName)
    );

    const tableRows = [];

    sortedItems.forEach(item => {
        const medsCount = item.medications.length;
        
        item.medications.forEach((m, idx) => {
            let medText = `• ${m.name} (${m.quantity} ${m.unit})`;
            if (type === 'conference' && m.status === 'falta') {
                medText = `(EM FALTA) ${m.name} - NÃO VEIO`; 
            }

            if (type === 'vendor') {
                if (idx === 0) {
                    tableRows.push([
                        { content: item.patientName.toUpperCase(), rowSpan: medsCount },
                        medText
                    ]);
                } else {
                    tableRows.push([medText]);
                }
            } else {
                if (idx === 0) {
                    tableRows.push([
                        { content: item.patientName.toUpperCase(), rowSpan: medsCount },
                        medText,
                        { content: '', rowSpan: medsCount }, 
                        { content: '', rowSpan: medsCount }  
                    ]);
                } else {
                    tableRows.push([medText]);
                }
            }
        });
    });

    // 6. CONFIGURAÇÃO DAS COLUNAS
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
            1: { cellWidth: 110 },
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' }
        };
    }

    // 7. GERAR TABELA
    autoTable(doc, {
        startY: tableStartY, 
        head: columns,
        body: tableRows,
        theme: 'grid',
        styles: { 
            fontSize: 9, 
            // ---> AQUI FOI REDUZIDO O ESPAÇAMENTO (PADDING) DAS LINHAS <---
            cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 }, 
            valign: 'middle', 
            lineColor: [200, 200, 200], 
            lineWidth: 0.1
        },
        headStyles: { 
            fillColor: [0, 51, 102], 
            textColor: 255, 
            fontStyle: 'bold', 
            halign: 'center',
            cellPadding: 3 // Cabeçalho mantém um tamanho normal
        },
        columnStyles: colStyles,
        didParseCell: function (data) {
            if (type === 'conference' && data.section === 'body' && data.column.index === 1) {
                const text = data.cell.raw;
                if (typeof text === 'string' && text.includes('(EM FALTA)')) {
                    data.cell.styles.textColor = [220, 53, 69]; 
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },
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

    const suffix = type === 'vendor' ? 'PEDIDO' : 'CONFERENCIA';
    doc.save(`${suffix}_${shipment.code}.pdf`);

  } catch (error) {
    console.error("ERRO PDF:", error);
    alert("Erro ao gerar PDF: " + error.message);
  }
};
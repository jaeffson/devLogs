import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export const generateShipmentPDF = async (shipment, type = 'conference') => {
  try {
    if (!shipment) return;

    //1. CONFIGURAÇÃO DO MODO (Retrato ou Paisagem)
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

    // 5. PREPARAR LINHAS DA TABELA (NOVA LÓGICA COMPACTA E OTIMIZADA)
    const sortedItems = [...shipment.items].sort((a, b) => 
        a.patientName.localeCompare(b.patientName)
    );

    const tableRowsMeta = []; // Armazena os dados e os metadados de layout
    let isAlternate = false;

    sortedItems.forEach((item) => {
        isAlternate = !isAlternate; 
        const medsCount = item.medications.length;
        
        item.medications.forEach((m, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === medsCount - 1;

            let medText = `• ${m.name} (${m.quantity} ${m.unit})`;
            if (type === 'conference' && m.status === 'falta') {
                medText = `(EM FALTA) ${m.name} - NÃO VEIO`; 
            }

            let rowData = [];
            if (type === 'vendor') {
                rowData = [
                    isFirst ? item.patientName.toUpperCase() : '',
                    medText
                ];
            } else {
                rowData = [
                    isFirst ? item.patientName.toUpperCase() : '',
                    medText,
                    '', 
                    ''  
                ];
            }

    
            tableRowsMeta.push({
                data: rowData,
                isAlternate: isAlternate,
                isFirst: isFirst,
                isLast: isLast,
                isFalta: (type === 'conference' && m.status === 'falta')
            });
        });
    });

    
    let columns = [];
    let colStyles = {};

    if (type === 'vendor') {
        columns = [['PACIENTE', 'MEDICAMENTOS SOLICITADOS']];
        colStyles = {
            0: { cellWidth: 55, fontStyle: 'bold' },
            1: { cellWidth: 'auto' }
        };
    } else {
        columns = [['NOME DO PACIENTE', 'MEDICAÇÃO / STATUS', 'DATA REC.', 'ASSINATURA DO RECEBEDOR']];
        colStyles = {
            0: { cellWidth: 55, fontStyle: 'bold' },
            1: { cellWidth: 115 }, 
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' }
        };
    }

    // Extrai apenas os arrays de dados para o corpo da tabela
    const bodyData = tableRowsMeta.map(r => r.data);

    // 7. GERAR TABELA
    autoTable(doc, {
        startY: tableStartY, 
        head: columns,
        body: bodyData,
        theme: 'grid',
        styles: { 
            fontSize: 8, // Fonte levemente menor para economizar muito espaço
            // Espaçamento (padding) super enxuto para caber mais itens na folha
            cellPadding: { top: 1, bottom: 1, left: 2, right: 2 }, 
            valign: 'middle', 
            lineColor: [200, 200, 200], 
            lineWidth: 0.1
        },
        headStyles: { 
            fillColor: [0, 51, 102], 
            textColor: 255, 
            fontStyle: 'bold', 
            halign: 'center',
            fontSize: 9,
            cellPadding: 3 
        },
        columnStyles: colStyles,
        
        // Lógica de Renderização Visual das Células (O "Pulo do Gato")
        didParseCell: function (data) {
            if (data.section === 'body') {
                const meta = tableRowsMeta[data.row.index];
                
                // 1. FUNDO ZEBRA POR PACIENTE: Agrupa visualmente o paciente sem usar rowSpan
                data.cell.styles.fillColor = meta.isAlternate ? [248, 250, 252] : [255, 255, 255];

                // 2. TEXTO VERMELHO PARA FALTA
                if (meta.isFalta && data.column.index === 1) {
                    data.cell.styles.textColor = [220, 53, 69]; 
                    data.cell.styles.fontStyle = 'bold';
                }

               
                // Remove as linhas horizontais internas para as colunas de Paciente, Data e Assinatura
                if (data.column.index === 0 || (type === 'conference' && (data.column.index === 2 || data.column.index === 3))) {
                    let topBorder = meta.isFirst ? 0.2 : 0; 
                    let bottomBorder = meta.isLast ? 0.2 : 0; 
                    data.cell.styles.lineWidth = { top: topBorder, bottom: bottomBorder, left: 0.1, right: 0.1 };
                } else {
                    // Coluna de medicações mantem um tracejado sutil para separar itens
                    data.cell.styles.lineWidth = { top: meta.isFirst ? 0.2 : 0.1, bottom: meta.isLast ? 0.2 : 0.1, left: 0.1, right: 0.1 };
                }
            }
        },
        
        // Desenha a linha de assinatura fisicamente na última linha de cada paciente
        didDrawCell: (data) => {
            if (data.section === 'body') {
                const meta = tableRowsMeta[data.row.index];
                if (type === 'conference' && data.column.index === 3 && meta.isLast) {
                    const y = data.cell.y + data.cell.height - 3; // Linha um pouco acima do final da célula
                    doc.setDrawColor(150);
                    // Deixa uma pequena margem (5px) nas laterais da linha de assinatura
                    doc.line(data.cell.x + 5, y, data.cell.x + data.cell.width - 5, y);
                }
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
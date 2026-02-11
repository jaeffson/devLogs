import React from 'react';
import { FiCheckCircle, FiPrinter, FiShare2, FiX, FiPackage } from 'react-icons/fi';
import { generateShipmentPDF } from '../../utils/pdfGenerator';

export default function ShipmentSuccessModal({ isOpen, onClose, shipment }) {
  if (!isOpen || !shipment) return null;

  const handleWhatsApp = () => {
    const link = `${window.location.origin}/pedidos/ver/${shipment.accessToken}`;
    const text = `Olá ${shipment.supplier}, segue o link para o pedido *${shipment.code}* da Secretaria de Saúde de Parari:\n\n${link}\n\nPor favor, preencha os valores e disponibilidade.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative transform transition-all scale-100">
        
        {/* Botão Fechar (X) */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        >
            <FiX size={24} />
        </button>

        <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-green-600 text-4xl" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Remessa Fechada!</h2>
            <p className="text-gray-600 mb-6">
                O pedido <strong>{shipment.code}</strong> foi gerado com sucesso. Selecione o relatório desejado:
            </p>

            <div className="space-y-3">
                {/* 1. BOTÃO PEDIDO (FORNECEDOR) - AZUL */}
                <button 
                    onClick={() => generateShipmentPDF(shipment, 'vendor')}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-transform active:scale-95 shadow-lg cursor-pointer"
                >
                    <FiPackage size={20} />
                    Imprimir Pedido (Fornecedor)
                </button>

                {/* 2. BOTÃO CONFERÊNCIA (INTERNO) - CINZA ESCURO */}
                <button 
                    onClick={() => generateShipmentPDF(shipment, 'conference')}
                    className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-3.5 rounded-xl font-bold hover:bg-gray-900 transition-transform active:scale-95 shadow-lg cursor-pointer"
                >
                    <FiPrinter size={20} />
                    Imprimir Conferência (Interno)
                </button>

                {/* 3. BOTÃO WHATSAPP - VERDE */}
                <button 
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-transform active:scale-95 shadow-lg cursor-pointer"
                >
                    <FiShare2 size={20} />
                    Enviar Link via WhatsApp
                </button>
            </div>

            <button 
                onClick={onClose}
                className="mt-6 text-gray-400 text-sm hover:text-gray-600 hover:underline cursor-pointer"
            >
                Pular e ir para o histórico
            </button>
        </div>
      </div>
    </div>
  );
}
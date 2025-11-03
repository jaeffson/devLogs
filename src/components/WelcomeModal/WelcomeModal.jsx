import React from 'react';
import './WelcomeModal.css'; 
import { useId } from 'react';

/**
 * Componente do Modal de Boas-Vindas.
 * Recebe uma prop 'onClose' que é a função a ser chamada
 * quando o usuário clica no botão de fechar.
 */
function WelcomeModal({ onClose }) {
  return (
    // O 'overlay' é o fundo escuro que cobre a tela
    <div className="modal-overlay">
      
      {/* O 'content' é a caixa branca do modal */}
      <div className="modal-content">
        
        {/* Lembre-se de trocar [Nome do seu Sistema] pelo nome real */}
        <h2>Bem-vindo(a){useId.id} ao MedLogs - Parari!</h2>
        
        <p className="modal-subtitle">
          <strong>Nosso objetivo:</strong> Simplificar a gestão de pacientes e o 
          controle de medicamentos.
        </p>
        
        <div className="modal-body">
          <p>Com esta plataforma, você pode:</p>
          <ul>
            <li>Registrar e gerenciar dados completos de pacientes.</li>
            <li>Controlar o histórico e a administração de medicamentos.</li>
            <li>Acessar informações de forma rápida e segura.</li>
          </ul>
        </div>
        
        <button onClick={onClose} className="modal-close-btn">
          Começar a Usar
        </button>
        
      </div>
    </div>
  );
}

export default WelcomeModal;
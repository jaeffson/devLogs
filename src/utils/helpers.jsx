// utils/helpers.jsx 

/**
 * Busca o nome de uma medicação na lista de medicações pelo seu ID.
 * @param {string} medicationId - O ID da medicação (string ObjectId).
 * @param {Array<Object>} medicationsList - Lista de objetos de medicação (vindo da API).
 * @returns {string} O nome da medicação ou 'ID Inválido'.
 */
export const getMedicationName = (medicationId, medicationsList = []) => {
    // Retorna um nome padrão se o ID estiver ausente
    if (!medicationId) return 'Medicação Ausente';
    
    // CORREÇÃO: Compara IDs como strings (m.id é o ID normalizado do App.jsx)
    const medication = medicationsList.find(
        (m) => m.id === medicationId 
    );
    
    // Retorna o nome da medicação se for encontrado, senão retorna o erro de exibição
    return medication ? medication.name : 'ID Inválido';
};

/**
 * Retorna o nome de um paciente dado seu ID.
 * @param {string} patientId - O ID do paciente (string ObjectId).
 * @param {Array<Object>} patientsList - Lista de pacientes.
 * @returns {string} O nome do paciente ou 'Paciente Desconhecido'.
 */
export const getPatientName = (patientId, patientsList = []) => {
    if (!patientId) return 'Paciente Ausente';

    const patient = patientsList.find(
        (p) => p.id === patientId
    );
    
    return patient ? patient.name : 'Paciente Desconhecido';
};

/**
 * 🚨 FUNÇÃO ADICIONADA: Formata o nome do usuário (Placeholder)
 * @param {string} fullName - Nome completo do usuário.
 * @returns {string} O nome formatado (ex: apenas o primeiro nome).
 */
export const formatUserName = (fullName) => {
    if (!fullName) return 'Usuário';
    
    // Implemente a lógica real de formatação aqui.
    // Exemplo: Retorna apenas o primeiro nome.
    return fullName.split(' ')[0];
};

// Se você tiver outras funções, exporte-as aqui.
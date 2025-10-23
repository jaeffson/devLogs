// src/utils/helpers.js

/**
 * Pega o nome de uma medicação pelo seu ID.
 */
export const getMedicationName = (medicationId, medications = []) => {
    const idToFind = Number(medicationId);
    if (isNaN(idToFind)) return 'ID Inválido';
    const medication = medications.find(m => m.id === idToFind);
    return medication?.name || 'Medicação Desconhecida';
};

/**
 * Formata um CPF para o padrão 000.000.000-00.
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = String(cpf).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
  if (!match) return cleaned;
  let formatted = match[1];
  if (match[2]) formatted += `.${match[2]}`;
  if (match[3]) formatted += `.${match[3]}`;
  if (match[4]) formatted += `-${match[4]}`;
  return formatted;
};

/**
 * Capitaliza um nome completo, tratando exceções como 'de', 'da', etc.
 */
export const capitalizeName = (name) => {
  if (!name) return '';
  const exceptions = ['de', 'da', 'do', 'dos', 'das'];
  return String(name)
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
          if (!word) return '';
          if (index > 0 && exceptions.includes(word)) {
              return word;
          }
          return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
};

/**
 * Formata uma data ISO para o padrão brasileiro (data e hora).
 */
export const formatDate = (isoString) => {
    if (!isoString) return '---';
    try {
        return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        try {
            return new Date(isoString + 'T00:00:00').toLocaleDateString('pt-BR');
        } catch (err) {
            return 'Data inválida';
        }
    }
};

/**
 * Formata um nome completo para um formato de exibição mais limpo (Primeiro e Último nome).
 * Remove títulos (Dr., Dra.) e parênteses.
 * @param {string} fullName - O nome completo do usuário.
 * @returns {string} - O nome formatado para exibição.
 */
export const formatUserName = (fullName) => {
    if (!fullName) return 'Usuário';
    // Remove parênteses e o conteúdo dentro deles, ex: "Ana Costa (Secretária)" -> "Ana Costa"
    let cleanName = fullName.replace(/\s*\(.*\)\s*/g, '');
    // Remove títulos comuns, ex: "Dr. João Silva" -> "João Silva"
    cleanName = cleanName.replace(/^(Dr\.|Dra\.|Sr\.|Sra\.)\s*/i, '');
    const nameParts = cleanName.trim().split(' ').filter(Boolean); // filter(Boolean) remove espaços vazios

    if (nameParts.length > 1) {
        return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`; // Retorna "Primeiro Último"
    }
    return nameParts[0] || 'Usuário'; // Retorna apenas o primeiro nome se for único
};

// A linha 'export default' foi removida para manter apenas exportações nomeadas.


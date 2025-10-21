// src/utils/helpers.jsx

// Helper para obter o nome da medicação pelo ID
export const getMedicationName = (medicationId, medications = []) => { // Adicionado valor padrão
    // Garante que estamos comparando números
    const idToFind = Number(medicationId);
    if (isNaN(idToFind)) return 'ID Inválido'; // Retorna se o ID não for um número

    const medication = medications.find(m => m.id === idToFind);
    return medication?.name || 'Medicação Desconhecida'; // Usa optional chaining
};

// Funções de formatação (movidas do PatientForm para serem reutilizáveis)
export const formatCPF = (cpf) => {
  if (!cpf) return ''; // Retorna string vazia se cpf for nulo ou undefined
  const cleaned = String(cpf).replace(/\D/g, ''); // Converte para string antes
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
  if (!match) return cleaned; // Retorna só números se não der match (ex: incompleto)
  // Monta a formatação progressivamente
  let formatted = match[1];
  if (match[2]) formatted += `.${match[2]}`;
  if (match[3]) formatted += `.${match[3]}`;
  if (match[4]) formatted += `-${match[4]}`;
  return formatted;
};

export const capitalizeName = (name) => {
  if (!name) return '';
  const exceptions = ['de', 'da', 'do', 'dos', 'das'];
  return String(name) // Garante que é string
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
          if (!word) return ''; // Pula palavras vazias (espaços duplos)
          if (index > 0 && exceptions.includes(word)) {
              return word;
          }
          return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
};

// Adicione outras funções helper que você possa precisar aqui
// Exemplo: formatar data, validar email, etc.
export const formatDate = (isoString) => {
    if (!isoString) return '---';
    try {
        // Tenta usar data e hora
        return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        // Se falhar (ex: só data), usa apenas a data
        try {
            return new Date(isoString + 'T00:00:00').toLocaleDateString('pt-BR');
        } catch (err) {
            return 'Data inválida';
        }
    }
};
export default getMedicationName
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * @param {any} value - 
 * @param {number} delay - O tempo em milissegundos do atraso (ex: 300ms).
 * @returns {any} - O valor "atrasado".
 */
export function useDebounce(value, delay) {
  // Estado para guardar o valor "atrasado"
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura um timer que só vai atualizar o 'debouncedValue'
    // depois que o 'delay' (tempo) passar
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Isso é crucial: se o 'value' mudar (usuário digitou de novo),
    // o 'useEffect' vai rodar de novo e limpar o timer anterior.
    // Isso "reseta" a contagem.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Só re-executa se o valor ou o delay mudarem

  return debouncedValue;
}
export default useDebounce
import React, { useMemo } from 'react';

// Exportação nomeada
export function BarChart({ data = [], title }) { // Valor padrão para data
  // Garante que maxValue seja pelo menos 1, mesmo com dados vazios ou negativos
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  return (
    <div className="w-full bg-white p-4 rounded shadow"> {/* Adicionado fundo e sombra */}
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      {data.length > 0 ? (
        <div className="flex justify-around items-end h-[220px] p-4 border-l border-b border-gray-300">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center w-full px-1"> {/* Adicionado padding x */}
              <div className="relative flex-grow flex items-end w-3/4 md:w-1/2"> {/* Largura responsiva da barra */}
                  <div
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(0, (item.value / maxValue) * 100)}%` }} // Garante altura >= 0
                      title={`${item.label}: ${item.value} paciente(s)`}
                  >
                  </div>
                  {/* Mostra valor apenas se > 0 */}
                  {item.value > 0 && (
                     <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-700">{item.value}</span>
                  )}
              </div>
              <span className="text-xs mt-2 text-gray-600 text-center break-words">{item.label}</span> {/* Quebra de palavra */}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 h-[220px] flex items-center justify-center">Sem dados para exibir.</p>
      )}
    </div>
  );
}

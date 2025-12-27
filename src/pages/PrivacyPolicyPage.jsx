// src/pages/PrivacyPolicyPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        
        {/* Header da Página */}
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-white/50 cursor-pointer"
          >
            <ArrowLeftIcon />
            <span className="font-medium text-sm">Voltar</span>
          </button>
          
          <div className="flex items-center gap-2">
             <ShieldIcon />
             <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Documento Oficial</span>
          </div>
        </div>

        {/* Conteúdo do Documento */}
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
          
          {/* Cabeçalho do Documento */}
          <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-10 border-b border-slate-100 dark:border-slate-800 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Política de Privacidade e Proteção de Dados
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Saiba como o <span className="font-semibold text-indigo-600">MedLogs</span> coleta, utiliza e protege suas informações sensíveis de acordo com a LGPD.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              Atualizado em: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          {/* Corpo do Texto */}
          <div className="p-8 md:p-12 space-y-10 text-slate-600 dark:text-slate-300 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                1. Introdução e Objetivo
              </h2>
              <p className="mb-4 text-justify">
                Esta Política de Privacidade tem como objetivo informar aos usuários (profissionais de saúde, administradores e pacientes) como os dados pessoais são tratados dentro da plataforma MedLogs. 
                Nós levamos a sério a sua privacidade e a confidencialidade das informações médicas, em estrita conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                2. Coleta de Dados
              </h2>
              <p className="mb-4 text-justify">
                O sistema coleta apenas os dados estritamente necessários para a prestação dos serviços de gestão de saúde:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-indigo-500">
                <li><strong>Dados de Identificação:</strong> Nome completo, CPF, data de nascimento e endereço.</li>
                <li><strong>Dados Sensíveis (Saúde):</strong> Histórico de medicações, registros de atendimentos, diagnósticos e evoluções clínicas.</li>
                <li><strong>Dados de Acesso:</strong> Logs de acesso ao sistema, endereço IP e tipo de dispositivo (para fins de auditoria e segurança).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                3. Finalidade do Tratamento
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-indigo-600 mb-2">Assistência à Saúde</h3>
                  <p className="text-sm">Garantir o acompanhamento correto do paciente, dispensação de medicamentos e continuidade do tratamento.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-indigo-600 mb-2">Auditoria e Segurança</h3>
                  <p className="text-sm">Monitorar quem acessa os prontuários para prevenir acessos não autorizados e fraudes.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                4. Compartilhamento de Dados
              </h2>
              <p className="mb-4 text-justify">
                Os dados dos pacientes são sigilosos e não são vendidos ou comercializados. O compartilhamento ocorre apenas nas seguintes situações:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-indigo-500">
                <li>Entre profissionais de saúde da própria equipe para continuidade do tratamento.</li>
                <li>Por determinação legal ou regulatória (ex: Ministério da Saúde, Vigilância Sanitária).</li>
                <li>Em caso de emergência médica, para proteção da vida do titular.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                5. Segurança da Informação
              </h2>
              <p className="text-justify">
                Adotamos medidas técnicas robustas, incluindo criptografia de dados em trânsito e em repouso, controle estrito de acesso baseado em níveis (Admin, Profissional, Secretaria) e monitoramento contínuo de vulnerabilidades.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                6. Seus Direitos (Titular dos Dados)
              </h2>
              <p className="mb-4">Você tem o direito de solicitar a qualquer momento:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-indigo-500">
                <li>A confirmação da existência de tratamento de seus dados.</li>
                <li>O acesso aos dados mantidos pelo sistema.</li>
                <li>A correção de dados incompletos, inexatos ou desatualizados.</li>
                <li>A revogação do consentimento, nos limites técnicos e legais.</li>
              </ul>
            </section>

          </div>

          {/* Footer do Documento */}
          <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-t border-slate-100 dark:border-slate-800 text-center">
             <p className="text-sm text-slate-500">
               Em caso de dúvidas sobre esta política, entre em contato com o Encarregado de Dados (DPO) através do suporte administrativo.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
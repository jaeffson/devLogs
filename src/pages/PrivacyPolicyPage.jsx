// src/pages/PrivacyPolicyPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Printer,
  Scale,
  CheckCircle2,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  // Função nativa do navegador para imprimir ou salvar em PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto">
        {/* === HEADER DE NAVEGAÇÃO (Fica invisível na impressão) === */}
        <div className="mb-6 flex items-center justify-between print:hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all px-4 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer active:scale-95"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-bold text-sm">Voltar ao Sistema</span>
          </button>

          <button
            onClick={handlePrint}
            className="group flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all px-4 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer active:scale-95"
            title="Imprimir ou Salvar em PDF"
          >
            <span className="font-bold text-sm hidden sm:block">
              Imprimir Documento
            </span>
            <Printer
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
        </div>

        {/* === DOCUMENTO OFICIAL === */}
        <div className="bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/40 dark:shadow-none rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Cabeçalho do Documento */}
          <div className="relative bg-slate-50 dark:bg-slate-900 px-8 py-12 md:px-16 md:py-16 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Decoração de Fundo */}
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Scale size={200} strokeWidth={1} />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-6 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                Política de Privacidade
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
                Transparência e segurança sobre como o{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  MedLogs
                </span>{' '}
                coleta, utiliza e protege suas informações sensíveis.
              </p>

              <div className="mt-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Em conformidade com a LGPD • Atualizado em:{' '}
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Corpo do Texto */}
          <div className="p-8 md:p-16 space-y-12 text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed font-medium">
            <section className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                1. Introdução e Objetivo
              </h2>
              <p className="text-justify">
                Esta Política de Privacidade tem como objetivo informar aos
                usuários (profissionais de saúde, administradores e pacientes)
                como os dados pessoais são tratados dentro da plataforma
                MedLogs. Nós levamos a sério a sua privacidade e a
                confidencialidade das informações médicas, em estrita
                conformidade com a{' '}
                <strong className="text-slate-800 dark:text-slate-100 font-black">
                  Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)
                </strong>
                .
              </p>
            </section>

            <section className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                2. Coleta de Dados
              </h2>
              <p className="mb-6 text-justify">
                O sistema coleta apenas os dados estritamente necessários para a
                prestação dos serviços de gestão de saúde:
              </p>
              <div className="space-y-4">
                <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2
                    size={20}
                    className="text-indigo-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-100">
                      Dados de Identificação:
                    </strong>{' '}
                    Nome completo, CPF, data de nascimento e endereço.
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2
                    size={20}
                    className="text-indigo-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-100">
                      Dados Sensíveis (Saúde):
                    </strong>{' '}
                    Histórico de medicações, registros de atendimentos,
                    diagnósticos e evoluções clínicas.
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle2
                    size={20}
                    className="text-indigo-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-100">
                      Dados de Acesso:
                    </strong>{' '}
                    Logs de acesso ao sistema, endereço IP e tipo de dispositivo
                    (para fins de auditoria).
                  </div>
                </div>
              </div>
            </section>

            <section className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                3. Finalidade do Tratamento
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                  <h3 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">
                    Assistência à Saúde
                  </h3>
                  <p className="text-sm">
                    Garantir o acompanhamento correto do paciente, dispensação
                    de medicamentos e continuidade do tratamento seguro.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                  <h3 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">
                    Auditoria e Segurança
                  </h3>
                  <p className="text-sm">
                    Monitorar quem acessa os prontuários para prevenir acessos
                    não autorizados, fraudes e garantir rastreabilidade.
                  </p>
                </div>
              </div>
            </section>

            <section className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                4. Compartilhamento de Dados
              </h2>
              <p className="mb-4 text-justify">
                Os dados dos pacientes são estritamente sigilosos e não são
                vendidos ou comercializados. O compartilhamento ocorre apenas
                nas seguintes situações legais:
              </p>
              <ul className="list-disc pl-5 space-y-3 marker:text-indigo-500 text-slate-600 dark:text-slate-400">
                <li>
                  Entre profissionais de saúde da própria equipe para
                  continuidade do tratamento.
                </li>
                <li>
                  Por determinação legal ou regulatória (ex: Ministério da
                  Saúde, Vigilância Sanitária).
                </li>
                <li>
                  Em caso de emergência médica, para proteção exclusiva da vida
                  do titular.
                </li>
              </ul>
            </section>

            <section className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                5. Segurança da Informação
              </h2>
              <p className="text-justify">
                Adotamos medidas técnicas robustas, incluindo criptografia de
                dados em trânsito e em repouso, controle estrito de acesso
                baseado em níveis (Administrador, Profissional, Secretário) e
                monitoramento contínuo de vulnerabilidades do servidor.
              </p>
            </section>

      <section className="relative pl-6 md:pl-8">
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                6. Seus Direitos (Titular dos Dados)
              </h2>
              <p className="mb-4">Você tem o direito de solicitar à nossa equipe a qualquer momento:</p>
              <ul className="list-disc pl-5 space-y-3 marker:text-indigo-500 text-slate-600 dark:text-slate-400">
                <li>A confirmação da existência de tratamento de seus dados.</li>
                <li>O acesso integral aos dados mantidos pelo sistema.</li>
                <li>A correção de dados incompletos, inexatos ou desatualizados.</li>
                <li>A revogação do consentimento, respeitando os limites técnicos e legais da saúde pública.</li>
              </ul>
            </section>

          </div>

          {/* ========================================== */}
          {/* FOOTER DO DOCUMENTO (DENTRO DO CARD BRANCO) */}
          {/* ========================================== */}
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-8 md:px-8 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
             <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 max-w-2xl">
               Em caso de dúvidas sobre esta política, entre em contato com o Suporte Administrativo do MedLogs.
             </p>
             
             {/* Linha Divisória e Assinatura */}
             <div className="w-full max-w-sm border-t border-slate-200 dark:border-slate-800 pt-6">
               <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black leading-relaxed">
                 Idealizado e Desenvolvido por <br className="sm:hidden" />
                 <span className="text-indigo-600 dark:text-indigo-400 sm:ml-1">Js Sistemas</span> <br className="sm:hidden" />
                 &copy; {new Date().getFullYear()}
               </p>
             </div>
          </div>
          {/* FIM DO FOOTER */}

        </div> 
      </div>
    </div>
  );
}
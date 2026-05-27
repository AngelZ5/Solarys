import React from "react";
import { Link } from "react-router-dom";

function Beneficios() {
  const cards = [
    // Benefícios (Time e Gratuidade)
    {
      titulo: "Time Profissional",
      desc: "Faça parte de uma estrutura de elite com uniformes, equipamentos e suporte completo de equipe.",
      tipo: "beneficio",
      cor: "border-blue-500/50 text-blue-400",
    },
    {
      titulo: "100% Gratuito",
      desc: "Acesso total a treinamentos e competições sem custo nenhum para o aluno ou família.",
      tipo: "beneficio",
      cor: "border-purple-500/50 text-purple-400",
    },
    {
      titulo: "Competições Reais",
      desc: "Inscrições garantidas nos principais campeonatos de Salvador e região para testar seu talento.",
      tipo: "beneficio",
      cor: "border-red-500/50 text-red-400",
    },
    // Requisitos (Comprometimento)
    {
      titulo: "Frequência Blindada",
      desc: "É obrigatório manter uma presença constante nas aulas. O esporte e a sala de aula andam juntos.",
      tipo: "requisito",
      cor: "border-gray-600 text-gray-300",
    },
    {
      titulo: "Foco na Aprovação",
      desc: "Para permanecer no Solarys, o aluno não pode repetir de ano. Evolução acadêmica é prioridade.",
      tipo: "requisito",
      cor: "border-gray-600 text-gray-300",
    },
    {
      titulo: "Sua Melhor Versão",
      desc: "Exigimos disciplina e respeito. O objetivo é superar seus limites físicos e mentais todos os dias.",
      tipo: "requisito",
      cor: "border-gray-600 text-gray-300",
    },
  ];

  return (
    <section
      id="regras"
      className="py-16 sm:py-20 md:py-24 bg-black relative overflow-hidden scroll-mt-24"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-3 sm:mb-4 px-2">
            Caminho para a <span className="text-purple-500">Vitória</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto uppercase text-[11px] sm:text-sm tracking-widest px-4 leading-relaxed">
            Equilíbrio perfeito entre alto rendimento esportivo e compromisso
            educacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`p-6 sm:p-8 rounded-2xl border bg-white/5 backdrop-blur-sm transition-all duration-500 sm:hover:scale-[1.03] active:scale-[0.99] group ${card.cor}`}
            >
              <div className="mb-4 flex justify-between items-start">
                <span
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${card.cor} opacity-70`}
                >
                  {card.tipo === "beneficio" ? "Vantagem" : "Regra"}
                </span>
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    card.tipo === "beneficio" ? "bg-purple-500" : "bg-gray-500"
                  }`}
                ></div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 uppercase tracking-tight">
                {card.titulo}
              </h3>

              <p className="text-gray-400 leading-relaxed text-sm sm:text-sm">
                {card.desc}
              </p>

              <div className="mt-6 w-full h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 sm:mt-16 normal-case">
          <p className="text-gray-500 text-sm mb-4 uppercase tracking-widest text-[10px] sm:text-xs">
            Pronto para o próximo passo?
          </p>
          <Link
            to="/inscrever"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase tracking-widest transition-colors active:scale-[0.98] shadow-[0_0_24px_rgba(147,51,234,0.35)]"
          >
            Inscrever-se agora
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Beneficios;

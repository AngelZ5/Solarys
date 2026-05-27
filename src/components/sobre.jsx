import React from "react";
import { Link } from "react-router-dom";

function Sobre() {
  const nucleos = [
    {
      nome: "FALXTRA",
      slug: "falxtra",
      esporte: "Futsal",
      cor: "text-purple-500",
      border: "border-purple-500/30",
      bg: "bg-purple-500/5",
      desc: "Agilidade e estratégia nas quadras.",
    },
    {
      nome: "MATIRA",
      slug: "matira",
      esporte: "Vôlei",
      cor: "text-blue-500",
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      desc: "Trabalho em equipe e alcance vertical.",
    },
    {
      nome: "NEXON",
      slug: "nexon",
      esporte: "Basquete",
      cor: "text-red-500",
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      desc: "Precisão e foco sob pressão.",
    },
  ];

  return (
    <section
      id="sobre"
      className="py-16 sm:py-20 md:py-24 bg-black text-white relative overflow-hidden scroll-mt-24"
    >
      {/* Elementos de Decoração */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_transparent_70%)] opacity-50"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Coluna de Texto */}
          <div>
            <h2 className="text-purple-500 font-bold tracking-widest uppercase mb-3 sm:mb-4 text-xs sm:text-sm">
              Nossa Missão em Salvador
            </h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 sm:mb-8 leading-[1.1] sm:leading-tight">
              Onde o talento encontra a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-red-500">
                {" "}
                Oportunidade.
              </span>
            </h3>

            <div className="space-y-5 sm:space-y-6 text-gray-400 text-base sm:text-lg leading-relaxed">
              <p>
                O <span className="text-white font-semibold">Solarys</span>{" "}
                nasceu da convicção de que a escola pública deve ser um polo de
                sonhos. Atualmente focados em nossa cidade,{" "}
                <span className="text-white font-semibold">Salvador</span>,
                transformamos colégios em campos de esportes inclusivos.
              </p>
              <p>
                Mais do que medalhas, nosso maior troféu é ver adolescentes{" "}
                <span className="text-white font-semibold">
                  frequentando as aulas e progredindo nos estudos
                </span>
                . Através do esporte, combatemos a evasão escolar e oferecemos
                um ambiente seguro e profissional.
              </p>
              <p className="border-l-4 border-purple-600 pl-4 italic">
                "Nossos professores não formam apenas atletas, mas líderes
                preparados para campeonatos e para a vida."
              </p>
            </div>
          </div>

          {/* Coluna dos Núcleos de Esporte */}
          <div className="grid grid-cols-1 gap-4">
            {nucleos.map((item) => (
              <Link
                key={item.nome}
                to={`/inscrever/${item.slug}`}
                aria-label={`Inscrever-se no ${item.nome} — ${item.esporte}`}
                className={`block p-5 sm:p-6 rounded-2xl border ${item.border} ${item.bg} backdrop-blur-sm active:scale-[0.99] sm:hover:scale-[1.02] transition-all duration-300 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <h4
                      className={`text-xl sm:text-2xl font-black tracking-tighter ${item.cor}`}
                    >
                      {item.nome}
                    </h4>
                    <p className="text-white font-medium text-sm sm:text-base">
                      {item.esporte}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      {item.desc}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-3 group-hover:text-purple-400 transition-colors">
                      Inscrever-se →
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center border ${item.border} group-hover:bg-white/10 transition-all group-hover:border-white/30`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Sobre;

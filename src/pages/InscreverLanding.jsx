import React from "react";
import { Link } from "react-router-dom";
import { TEAMS } from "../constants/teams";

export default function InscreverLanding() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header
        className="border-b border-white/10 bg-black/80 backdrop-blur-md px-4 py-4 sm:px-6"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="text-lg font-black tracking-tighter">
            SOLARYS<span className="text-purple-500">.</span>
          </Link>
          <Link
            to="/"
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <p className="text-purple-400 text-xs font-bold tracking-[0.3em] uppercase mb-4">
            Inscrição
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
            Escolha seu <span className="text-purple-500">time</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed normal-case">
            Cada núcleo tem uma vaga limitada. Selecione o projeto esportivo que combina com você e
            preencha o formulário com atenção.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Object.values(TEAMS).map((team) => (
            <Link
              key={team.slug}
              to={`/inscrever/${team.slug}`}
              className={`group relative rounded-2xl border ${team.border} bg-white/[0.03] p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${team.glow} flex flex-col`}
            >
              <div
                className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${team.accent} mb-6 group-hover:w-24 transition-all`}
              />
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">{team.label}</h2>
              <p className={`text-sm font-bold mb-4 bg-gradient-to-r ${team.accent} bg-clip-text text-transparent`}>
                {team.esporte}
              </p>
              <p className="text-gray-500 text-sm leading-relaxed normal-case flex-1 mb-6">
                {team.desc}
              </p>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white group-hover:text-purple-300">
                Inscrever-se
                <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

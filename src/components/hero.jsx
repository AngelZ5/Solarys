import React from "react";
import { Link } from "react-router-dom";
import Carrousel from "./carrousel";

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] min-h-screen flex items-center bg-black text-white overflow-hidden uppercase max-lg:items-stretch max-lg:flex-col max-lg:justify-start">
      <style>
        {`
          @keyframes colorChange {
            0% { color: #3b82f6; }
            33% { color: #a855f7; }
            66% { color: #ef4444; }
            100% { color: #3b82f6; }
          }
          .animate-glow-text {
            animation: colorChange 8s ease-in-out infinite;
          }
        `}
      </style>

      {/* Carrossel: no mobile fica na parte inferior; no desktop, metade direita */}
      <div className="absolute right-0 z-0 w-full lg:w-1/2 lg:top-0 lg:h-full h-[min(42vh,22rem)] max-lg:top-auto max-lg:bottom-0">
        <Carrousel />
      </div>

      {/* Gradiente: no mobile escurece o topo para leitura; no desktop funde com o texto à esquerda */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black/25 max-lg:pointer-events-none lg:bg-gradient-to-r lg:from-black lg:via-black/50 lg:to-transparent pointer-events-none z-[5]" />

      <div className="absolute top-[-10%] left-[-10%] w-[min(100vw,500px)] h-[min(100vw,500px)] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none z-[6]" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pointer-events-none w-full flex-1 max-lg:flex max-lg:flex-col max-lg:justify-center max-lg:pt-[calc(5rem+env(safe-area-inset-top))] max-lg:pb-4 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center w-full min-h-0 max-lg:min-h-[calc(100dvh-min(42vh,22rem)-6rem)] lg:min-h-screen">
          <div className="space-y-5 sm:space-y-8 pointer-events-auto max-w-2xl max-lg:max-w-none">
            <div className="inline-block px-3 py-1 sm:px-4 sm:py-1 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-400 text-xs sm:text-sm font-medium tracking-wider uppercase">
              O Futuro do Esporte chegou
            </div>

            <h1 className="text-[clamp(2.75rem,12vw,4.5rem)] sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] animate-glow-text">
              SOLARYS<span className="opacity-80">.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-lg leading-relaxed normal-case">
              Acreditamos que o talento não escolhe CEP. Conectamos jovens de
              escolas públicas a oportunidades reais de evolução{" "}
              <span className="text-white font-semibold">
                física, mental e social.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Link
                to="/inscrever"
                className="w-full sm:w-auto text-center px-6 sm:px-8 py-3.5 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(147,51,234,0.4)]"
              >
                FAZER PARTE DO TIME
              </Link>
              <Link
                to="/#sobre"
                className="w-full sm:w-auto text-center px-6 sm:px-8 py-3.5 sm:py-4 border border-gray-700 hover:border-purple-500 text-white font-bold rounded-xl transition-colors active:scale-[0.98]"
              >
                SABER MAIS
              </Link>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-30" />
    </section>
  );
}

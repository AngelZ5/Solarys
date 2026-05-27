import React, { useState } from "react";
import { Link } from "react-router-dom";
import Angel from "../imgs/Angel.jpg";
import Diego from "../imgs/Diego.png";
import Joselito from "../imgs/Joselito.jpg";
import ceepLogo from "../imgs/ceep.png";
import eptecLogo from "../imgs/eptec.png";
import gerandoFalcoesLogo from "../imgs/gerandofalcoes.png";
import govbaLogo from "../imgs/Govba.png";
import institutoVidaLogo from "../imgs/institutovida.png";
import iworldLogo from "../imgs/iworld.png";
import fagnersobral from "../imgs/fagnersobral.png";

function Equipe() {
  // Estado para controlar qual logo está aberta no momento (null = fechada)
  const [logoFocada, setLogoFocada] = useState(null);

  const parceiroPrincipal = {
    src: institutoVidaLogo,
    alt: "Instituto Vida",
  };

  const patrocinadores = [
    { src: ceepLogo, alt: "CEEP" },
    { src: eptecLogo, alt: "EPTEC" },
    { src: gerandoFalcoesLogo, alt: "Gerando Falcões" },
    { src: govbaLogo, alt: "Governo da Bahia" },
    { src: iworldLogo, alt: "IWorld" },
    { src: fagnersobral, alt: "Fagner Sobral" },
  ];

  const faixaPatrocinadores = [
    ...patrocinadores,
    ...patrocinadores,
    ...patrocinadores,
    ...patrocinadores,
  ];

  const time = [
    {
      nome: "Angel Santana",
      cargo: "Idealizador & Lead Developer of systems",
      desc: "Arquiteto de sistemas e mente por trás da infraestrutura tecnológica do Solarys. Transforma visão em código, garantindo que o esporte e a tecnologia corram no mesmo ritmo.",
      foto: Angel,
      borda: "hover:border-blue-500",
    },
    {
      nome: "Diego Silva",
      cargo: "Founder & Creative Director",
      desc: "Responsável pelo DNA visual e estratégico. Une design de vanguarda e marketing de impacto para dar voz e identidade única ao projeto Solarys.",
      foto: Diego,
      borda: "hover:border-purple-500",
    },
    {
      nome: "Joselito Pereira",
      cargo: "Fundador do Instituto Vida",
      desc: "A força institucional que tirou o projeto solarys do papel. Especialista em articulação e gestão, é o pilar que viabiliza nossas reuniões e conexões estratégicas.",
      foto: Joselito,
      borda: "hover:border-red-500",
    },
  ];

  return (
    <section
      id="equipe"
      className="py-16 sm:py-20 md:py-24 bg-black text-white overflow-hidden uppercase scroll-mt-24"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-10 sm:mb-16 border-l-4 border-purple-600 pl-4 sm:pl-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight">
            Mentes por trás do <span className="text-purple-500">Jogo.</span>
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-sm mt-2 tracking-widest">
            A fundação do Solarys em Salvador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24 md:mb-32">
          {time.map((membro, index) => (
            <div
              key={index}
              className={`group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 ${membro.borda}`}
            >
              <div className="aspect-[4/5] max-md:aspect-[3/4] overflow-hidden">
                <img
                  src={membro.foto}
                  alt={membro.nome}
                  className="w-full h-full object-cover object-top grayscale max-md:grayscale-0 sm:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <div className="p-5 sm:p-6 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 w-full">
                <h3 className="text-xl sm:text-2xl font-black tracking-tighter leading-none">
                  {membro.nome}
                </h3>
                <p className="text-purple-500 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 mt-1 tracking-widest line-clamp-2 sm:line-clamp-none">
                  {membro.cargo}
                </p>
                <p className="text-gray-400 text-xs leading-relaxed normal-case max-md:line-clamp-4 md:opacity-0 md:max-h-0 md:overflow-hidden md:group-hover:opacity-100 md:group-hover:max-h-[220px] transition-all duration-500">
                  {membro.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 normal-case">
          <Link
            to="/inscrever"
            className="inline-flex w-full sm:w-auto justify-center px-8 py-3.5 rounded-full border border-white/20 text-sm font-black uppercase tracking-widest text-white hover:border-purple-500 hover:bg-purple-500/10 transition-colors"
          >
            Escolher meu time
          </Link>
        </div>

        <div
          id="patrocinadores"
          className="pt-8 sm:pt-12 border-t border-white/5 scroll-mt-24"
        >
          <p className="text-center text-gray-600 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] sm:tracking-[0.3em] mb-6 sm:mb-8 px-2">
            PROJETADO POR QUEM ACREDITA NO FUTURO
          </p>

          {/* Patrocinador Principal */}
          <div className="mb-8 sm:mb-12 flex flex-col items-center">
            <p className="mb-4 sm:mb-6 text-center text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-purple-400/90 normal-case">
              Patrocinador principal
            </p>
            <div 
              onClick={() => setLogoFocada(parceiroPrincipal)}
              className="flex w-full max-w-md sm:max-w-lg md:max-w-xl items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-8 sm:px-10 sm:py-10 md:py-12 cursor-pointer hover:border-purple-500/50 transition-colors group/main"
            >
              <img
                src={parceiroPrincipal.src}
                alt={parceiroPrincipal.alt}
                className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-[85%] object-contain object-center smooth-render group-hover/main:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Mobile: Grid de Parceiros */}
          <div className="lg:hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 sm:px-6">
            <p className="text-center text-[10px] text-gray-500 font-bold tracking-widest mb-6 normal-case">
              Parceiros que impulsionam o projeto
            </p>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {patrocinadores.map((p, index) => (
                <div
                  key={`${p.alt}-${index}`}
                  onClick={() => setLogoFocada(p)}
                  className="flex items-center justify-center min-h-[5rem] sm:min-h-[6rem] rounded-xl bg-black/40 border border-white/5 px-4 py-4 cursor-pointer hover:border-purple-500/40 transition-colors"
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    className="max-h-13 sm:max-h-16 w-auto max-w-[85%] object-contain smooth-render"
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="hidden lg:block text-center text-[10px] text-gray-500 font-bold tracking-widest mb-8 normal-case">
            Parceiros que impulsionam o projeto
          </p>

          {/* Desktop: Carrossel Infinito */}
          <div className="relative hidden lg:flex overflow-x-hidden group min-h-[8rem]">
            <div className="flex animate-marquee whitespace-nowrap py-10 items-center">
              {faixaPatrocinadores.map((p, i) => (
                <div
                  key={`a-${i}-${p.alt}`}
                  onClick={() => setLogoFocada(p)}
                  className="mx-12 xl:mx-16 flex items-center justify-center shrink-0 opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer hover:scale-110"
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    className="h-14 xl:h-16 w-auto max-w-[200px] xl:max-w-[240px] object-contain grayscale hover:grayscale-0 transition-[filter] duration-300 smooth-render"
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap py-10 items-center">
              {faixaPatrocinadores.map((p, i) => (
                <div
                  key={`b-${i}-${p.alt}`}
                  onClick={() => setLogoFocada(p)}
                  className="mx-12 xl:mx-16 flex items-center justify-center shrink-0 opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer hover:scale-110"
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    className="h-14 xl:h-16 w-auto max-w-[200px] xl:max-w-[240px] object-contain grayscale hover:grayscale-0 transition-[filter] duration-300 smooth-render"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / OVERLAY DA IMAGEM EM DESTAQUE */}
      {logoFocada && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300 p-4 normal-case animate-fadeIn"
          onClick={() => setLogoFocada(null)} // Fecha ao clicar em qualquer lugar do fundo
        >
          {/* Botão Fechar (Xzinho) */}
          <button 
            className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl font-light w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => setLogoFocada(null)}
          >
            ✕
          </button>

          {/* Container da Imagem com Animação de Entrada */}
          <div 
            className="max-w-[90vw] max-h-[70vh] flex items-center justify-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl shadow-2xl animate-zoomIn"
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar na imagem propriamente dita
          >
            <img 
              src={logoFocada.src} 
              alt={logoFocada.alt} 
              className="max-w-full max-h-[60vh] object-contain smooth-render"
            />
          </div>

          {/* Texto (Alt) Embaixo */}
          <p className="mt-6 text-sm font-bold tracking-[0.2em] text-purple-400 uppercase text-center px-4">
            {logoFocada.alt}
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes marquee2 {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0%); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes zoomIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-marquee { animation: marquee 28s linear infinite; }
          .animate-marquee2 { animation: marquee2 28s linear infinite; }
          .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
          .animate-zoomIn { animation: zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          
          .smooth-render {
            image-rendering: auto;
            transform: translateZ(0);
            backface-visibility: hidden;
          }
        `}
      </style>
    </section>
  );
}

export default Equipe;
import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black text-white pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-12 overflow-hidden uppercase">
      {/* Elemento Decorativo: Texto Gigante de Fundo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 text-[20vw] font-black opacity-[0.03] select-none pointer-events-none whitespace-nowrap">
        SOLARYS_FUTURE
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Frase de Impacto */}
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter max-w-3xl mb-8 sm:mb-12 leading-[1.05] px-2">
            O TALENTO NÃO ESCOLHE CEP. <br />
            <span className="text-purple-500">O FUTURO ESCOLHE VOCÊ.</span>
          </h2>

          {/* Botão de Inscrição Único */}
          <Link
            to="/inscrever"
            className="group relative w-full max-w-sm sm:max-w-none px-8 sm:px-12 py-4 sm:py-5 bg-white text-black text-sm sm:text-base font-black rounded-full overflow-hidden transition-all sm:hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10">ESCOLHA SEU TIME!</span>
            <div className="absolute inset-0 bg-purple-600 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300"></div>
          </Link>

          {/* Divisor Minimalista */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-12 sm:my-20"></div>

          {/* Rodapé Inferior */}
          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] font-bold text-gray-500 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>SALVADOR • BAHIA • BRASIL</span>
            </div>

            <div className="text-center md:text-right">
              <p>
                © {currentYear} SOLARYS INSTITUTO VIDA. TODOS OS DIREITOS
                RESERVADOS.
              </p>
              <p className="mt-1 opacity-50">
                DESIGN & DEV BY ANGEL SILVA DE SANTANA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Glow de acabamento */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
    </footer>
  );
}

export default Footer;

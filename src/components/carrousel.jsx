import React, { useState, useEffect } from "react";
import soccer from "../imgs/soccer.png";
import volleyball from "../imgs/volleyball.png";
import basket from "../imgs/basket.png";

function Carrousel() {
  const images = [soccer, volleyball, basket];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* - object-contain: garante que a imagem apareça INTEIRA.
            - brightness-[0.8]: deixa ela um pouco mais escura que o original, mas visível.
            - contrast-[1.2]: faz as cores "saltarem".
          */}
          <img
            src={img}
            alt="Solarys Atletas"
            className="w-full h-full max-lg:object-cover lg:object-contain max-lg:object-center z-10 brightness-[0.85] contrast-[1.08] lg:brightness-[0.8] lg:contrast-[1.1] transition-transform duration-[4000ms]"
            style={{
              transform: index === currentIndex ? "scale(1.05)" : "scale(1)",
            }}
          />

          {/* Brilho atrás da imagem (Spotlight) 
              Isso faz com que o atleta apareça, mas o resto da seção continue dark.
          */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.15)_0%,_transparent_70%)] z-0"></div>
        </div>
      ))}

      <div className="absolute inset-y-0 left-0 w-1/3 max-lg:w-full max-lg:bg-gradient-to-t max-lg:from-black/60 max-lg:to-transparent lg:bg-gradient-to-r lg:from-black lg:to-transparent z-20 pointer-events-none" />

      <div className="absolute inset-x-0 top-0 h-[38%] lg:h-1/4 bg-gradient-to-b from-black via-black/40 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />
    </div>
  );
}

export default Carrousel;

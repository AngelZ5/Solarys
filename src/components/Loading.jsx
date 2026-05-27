import React, { useState, useEffect } from "react";

const Loading = ({ onFinished }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const words = ["A NOVA GERAÇÃO", "O FUTURO", "A INOVAÇÃO"];

  useEffect(() => {
    // Troca de palavras sincronizada com o progresso
    const wordInterval = setInterval(() => {
      setTextIndex((prev) => (prev < words.length - 1 ? prev + 1 : prev));
    }, 1000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onFinished, 600);
          return 100;
        }
        return prev + 1;
      });
    }, 25); // Velocidade do boot

    return () => {
      clearInterval(wordInterval);
      clearInterval(progressInterval);
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Neon Glow - Intensificado */}
      <div className="absolute w-[min(100vw,600px)] h-[min(100vw,600px)] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />

      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <div className="relative mb-6 sm:mb-8">
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-[0.15em] sm:tracking-[0.3em] text-white uppercase italic">
            SOLARYS
            <span className="text-purple-500 shadow-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
              .
            </span>
          </h1>
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-[0.15em] sm:tracking-[0.3em] text-white uppercase italic absolute top-0 left-0 blur-sm opacity-40 select-none pointer-events-none">
            SOLARYS.
          </h1>
        </div>

        {/* Bloco de Texto Inferior */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-purple-500 font-bold tracking-[0.5em] text-[10px] uppercase">
            Nós somos
          </p>

          <div className="h-10 flex items-center justify-center">
            {words.map((word, i) => (
              <span
                key={i}
                className={`absolute text-2xl md:text-4xl font-black italic tracking-tighter transition-all duration-500 uppercase ${
                  i === textIndex
                    ? "opacity-100 scale-100 blur-0"
                    : "opacity-0 scale-110 blur-md"
                }`}
                style={{ color: i === textIndex ? "#fff" : "transparent" }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Container da Barra de Progresso - Mais "Brutalista" */}
        <div className="mt-12 sm:mt-20 flex flex-col items-center gap-4 w-full max-w-[300px]">
          <div className="w-full h-[4px] bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between w-full gap-2 font-mono text-[8px] sm:text-[10px] tracking-tighter">
            <span className="text-gray-500 truncate">ESTABLISHING_CONNECTION...</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Ruído de fundo (Noise) apenas para o loading */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none"></div>

      {/* Overlay de fecho final */}
      {progress === 100 && (
        <div className="absolute inset-0 bg-white animate-out fade-out duration-500 z-[100]"></div>
      )}
    </div>
  );
};

export default Loading;

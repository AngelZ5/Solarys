import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Sobre o Solarys", sectionId: "sobre" },
  { label: "Equipe", sectionId: "equipe" },
  { label: "Patrocinadores", sectionId: "patrocinadores" },
  { label: "Regras", sectionId: "regras" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-black/60"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 min-h-16 sm:h-20 flex items-center justify-between gap-3 py-3 sm:py-0">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 group shrink-0 min-w-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-tr from-blue-600 via-purple-600 to-red-600 rounded-lg transform group-hover:rotate-45 transition-transform duration-500 shrink-0" />
            <span className="text-lg sm:text-2xl font-black tracking-tighter text-white truncate">
              SOLARYS<span className="text-purple-500">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.sectionId}
                to={`/#${item.sectionId}`}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group whitespace-nowrap"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-purple-600 transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/inscrever"
              className="inline-flex px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-black text-xs sm:text-sm font-bold rounded-full hover:bg-purple-600 hover:text-white transition-all active:scale-95 whitespace-nowrap"
            >
              <span className="sm:hidden">INSCREVER</span>
              <span className="hidden sm:inline">QUERO ME INSCREVER</span>
            </Link>

            <button
              type="button"
              className="md:hidden text-white p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile em tela cheia */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden transition-[visibility,opacity] duration-300 ${
          menuOpen
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          aria-label="Fechar menu"
          onClick={closeMenu}
        />
        <nav
          className={`absolute top-0 right-0 h-full w-[min(100%,20rem)] bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col pt-[calc(4.5rem+env(safe-area-inset-top))] px-6 pb-8 gap-1 transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        >
          {navItems.map((item) => (
            <Link
              key={item.sectionId}
              to={`/#${item.sectionId}`}
              onClick={closeMenu}
              className="py-4 text-base font-bold text-white border-b border-white/5 hover:text-purple-400 transition-colors tracking-tight"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/inscrever"
            onClick={closeMenu}
            className="mt-8 w-full py-4 bg-purple-600 text-white font-black rounded-xl text-sm tracking-wide hover:bg-purple-500 transition-colors text-center"
          >
            QUERO ME INSCREVER
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Header;

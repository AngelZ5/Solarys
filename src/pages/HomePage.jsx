import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/header";
import Hero from "../components/hero";
import Sobre from "../components/sobre";
import Beneficios from "../components/beneficios";
import Equipe from "../components/equipe";
import Footer from "../components/footer";
import Loading from "../components/Loading";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const raw = location.hash?.replace(/^#/, "");
    if (!raw) return;
    const t = window.setTimeout(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [isLoading, location.hash]);

  return (
    <div className="bg-black min-h-screen">
      {isLoading ? (
        <Loading onFinished={() => setIsLoading(false)} />
      ) : (
        <div className="animate-in fade-in duration-1000">
          <Header />
          <Hero />
          <Sobre />
          <Beneficios />
          <Equipe />
          <Footer />
        </div>
      )}
    </div>
  );
}

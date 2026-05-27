/** Slug da URL → valor salvo no Firestore (campo `time`), alinhado aos documentos existentes */
export const TEAMS = {
  falxtra: {
    slug: "falxtra",
    time: "Falxtra",
    label: "Falxtra",
    esporte: "Futsal",
    desc: "Agilidade e estratégia nas quadras.",
    accent: "from-purple-600 to-violet-600",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/20",
  },
  nexon: {
    slug: "nexon",
    time: "Nexon",
    label: "Nexon",
    esporte: "Basquete",
    desc: "Precisão e foco sob pressão.",
    accent: "from-red-600 to-orange-600",
    border: "border-red-500/40",
    glow: "shadow-red-500/20",
  },
  matira: {
    slug: "matira",
    time: "Matira",
    label: "Matira",
    esporte: "Vôlei",
    desc: "Trabalho em equipe e alcance vertical.",
    accent: "from-blue-600 to-cyan-600",
    border: "border-blue-500/40",
    glow: "shadow-blue-500/20",
  },
};

export const TEAM_SLUGS = Object.keys(TEAMS);

export function getTeamBySlug(slug) {
  if (!slug) return null;
  const key = String(slug).toLowerCase();
  return TEAMS[key] ?? null;
}

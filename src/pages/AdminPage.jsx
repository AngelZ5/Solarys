import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, deleteDoc, updateDoc, doc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { TEAMS } from "../constants/teams";
import { GENEROS, GENERO_FILTER_SEM_INFO } from "../constants/enrollment";

function formatTimestamp(ts) {
  if (!ts) return "—";
  try {
    const d = typeof ts.toDate === "function" ? ts.toDate() : null;
    if (!d) return "—";
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

const TEAM_META = {
  Falxtra: {
    label: "Falxtra",
    short: "FX",
    esporte: "Futsal",
    bar: "bg-gradient-to-r from-violet-600 to-purple-500",
    badge: "bg-purple-500/15 text-purple-200 border-purple-500/35",
    ring: "ring-purple-500/30",
  },
  Nexon: {
    label: "Nexon",
    short: "NX",
    esporte: "Basquete",
    bar: "bg-gradient-to-r from-red-600 to-orange-500",
    badge: "bg-red-500/15 text-red-200 border-red-500/35",
    ring: "ring-red-500/30",
  },
  Matira: {
    label: "Matira",
    short: "MT",
    esporte: "Vôlei",
    bar: "bg-gradient-to-r from-blue-600 to-cyan-500",
    badge: "bg-blue-500/15 text-blue-200 border-blue-500/35",
    ring: "ring-blue-500/30",
  },
};

function teamBadge(time) {
  const m = TEAM_META[time];
  if (!m)
    return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  return m.badge;
}

function isMatriculaSuspensa(row) {
  return row?.matriculaSuspensa === true;
}

function rowDisciplineClass(row) {
  return isMatriculaSuspensa(row)
    ? "opacity-45 grayscale-[0.85] hover:opacity-55"
    : "";
}

function exportCsv(rows, filename) {
  const headers = [
    "nomeCompleto",
    "email",
    "numeroTelefone",
    "dataNascimento",
    "anoEscolar",
    "sala",
    "turno",
    "horarioTreino",
    "problemaSaude",
    "genero",
    "tratamento",
    "time",
    "dataEnvio",
  ];
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    const dataEnvio =
      r.dataEnvio?.toDate?.()?.toISOString?.() ?? "";
    lines.push(
      headers
        .map((h) =>
          escape(
            h === "dataEnvio" ? dataEnvio : r[h]
          )
        )
        .join(",")
    );
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [rows, setRows] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [filter, setFilter] = useState("all");
  /** Manhã / Tarde — filtra pelo campo `turno` (horário de aula no sentido escolar) */
  const [turnoFilter, setTurnoFilter] = useState("all");
  const [generoFilter, setGeneroFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const teamMenuRef = useRef(null);
  const horarioMenuRef = useRef(null);
  const generoMenuRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const whatsappModalRef = useRef(null);
  const [disciplineRow, setDisciplineRow] = useState(null);
  const [draftAmarelos, setDraftAmarelos] = useState(0);
  const [draftVermelhos, setDraftVermelhos] = useState(0);
  const [draftObservacoes, setDraftObservacoes] = useState("");
  const [disciplineSaving, setDisciplineSaving] = useState(false);
  const disciplineModalRef = useRef(null);

  // Estados para lista de presença
  const [showPresencaModal, setShowPresencaModal] = useState(false);
  const [presencaDate, setPresencaDate] = useState("");
  const [presencas, setPresencas] = useState({});
  const [presencaId, setPresencaId] = useState(null);
  const presencaModalRef = useRef(null);
  const [presencaTeamFilter, setPresencaTeamFilter] = useState("all");
  
  // Configuração de horário para lista de presença (13:00 - 18:00)
  const [presencaHoraInicio, setPresencaHoraInicio] = useState(13);
  const [presencaHoraFim, setPresencaHoraFim] = useState(18);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados para matrícula
  const [showMatriculaModal, setShowMatriculaModal] = useState(false);
  const [alunosMatriculados, setAlunosMatriculados] = useState([]);
  const matriculaModalRef = useRef(null);

  // Estados para contagem de presenças
  const [presencasRegistros, setPresencasRegistros] = useState([]);
  const [presencasLoading, setPresencasLoading] = useState(false);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError("");
    try {
      const snap = await getDocs(collection(db, "inscricoes"));
      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      list.sort((a, b) => {
        const ma = a.dataEnvio?.toMillis?.() ?? 0;
        const mb = b.dataEnvio?.toMillis?.() ?? 0;
        return mb - ma;
      });
      setRows(list);
    } catch (e) {
      console.error(e);
      setDataError(
        "Não foi possível carregar as inscrições. Verifique autenticação e regras do Firestore."
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
    else setRows([]);
  }, [user, loadData]);

  // Atualiza o tempo a cada segundo para o contador da lista de presença
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Função para verificar se está no horário permitido para lista de presença
  const isHorarioPresenca = () => {
    const hora = currentTime.getHours();
    return hora >= presencaHoraInicio && hora < presencaHoraFim;
  };

  // Função para calcular tempo restante até o horário de início ou fim
  const getTimeUntilPresenca = () => {
    const hora = currentTime.getHours();
    const minutos = currentTime.getMinutes();
    const segundos = currentTime.getSeconds();
    
    if (hora >= presencaHoraInicio && hora < presencaHoraFim) {
      // Está no horário, calcular tempo até o fim
      const totalSegundosFim = presencaHoraFim * 3600;
      const totalSegundosAtual = hora * 3600 + minutos * 60 + segundos;
      const restante = totalSegundosFim - totalSegundosAtual;
      const h = Math.floor(restante / 3600);
      const m = Math.floor((restante % 3600) / 60);
      const s = restante % 60;
      return `${h}h ${m}m ${s}s`;
    } else if (hora < presencaHoraInicio) {
      // Ainda não começou, calcular tempo até o início
      const totalSegundosInicio = presencaHoraInicio * 3600;
      const totalSegundosAtual = hora * 3600 + minutos * 60 + segundos;
      const restante = totalSegundosInicio - totalSegundosAtual;
      const h = Math.floor(restante / 3600);
      const m = Math.floor((restante % 3600) / 60);
      const s = restante % 60;
      return `${h}h ${m}m ${s}s`;
    } else {
      // Já passou do horário
      return "Encerrado";
    }
  };

  const counts = useMemo(() => {
    const c = { all: rows.length, Falxtra: 0, Nexon: 0, Matira: 0 };
    for (const r of rows) {
      const t = r.time;
      if (t === "Falxtra") c.Falxtra += 1;
      else if (t === "Nexon") c.Nexon += 1;
      else if (t === "Matira") c.Matira += 1;
    }
    return c;
  }, [rows]);

  const pct = (n) => (counts.all ? Math.round((n / counts.all) * 100) : 0);

  const latestRow = rows[0];

  const turnosUnicos = useMemo(() => {
    const s = new Set();
    for (const r of rows) {
      const t = r.turno != null ? String(r.turno).trim() : "";
      if (t) s.add(t);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rows]);

  useEffect(() => {
    function handleClickOutside(e) {
      const t = e.target;
      if (
        openFilterMenu === "team" &&
        teamMenuRef.current &&
        !teamMenuRef.current.contains(t)
      ) {
        setOpenFilterMenu(null);
      }
      if (
        openFilterMenu === "horario" &&
        horarioMenuRef.current &&
        !horarioMenuRef.current.contains(t)
      ) {
        setOpenFilterMenu(null);
      }
      if (
        openFilterMenu === "genero" &&
        generoMenuRef.current &&
        !generoMenuRef.current.contains(t)
      ) {
        setOpenFilterMenu(null);
      }
      if (
        showWhatsappModal &&
        whatsappModalRef.current &&
        !whatsappModalRef.current.contains(t)
      ) {
        setShowWhatsappModal(false);
      }
      if (
        disciplineRow &&
        disciplineModalRef.current &&
        !disciplineModalRef.current.contains(t)
      ) {
        setDisciplineRow(null);
      }
      if (
        showPresencaModal &&
        presencaModalRef.current &&
        !presencaModalRef.current.contains(t)
      ) {
        setShowPresencaModal(false);
      }
      if (
        showMatriculaModal &&
        matriculaModalRef.current &&
        !matriculaModalRef.current.contains(t)
      ) {
        setShowMatriculaModal(false);
      }
    }
    if (openFilterMenu || showWhatsappModal || disciplineRow || showPresencaModal || showMatriculaModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openFilterMenu, showWhatsappModal, disciplineRow, showPresencaModal, showMatriculaModal]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") {
      list = list.filter((r) => r.time === filter);
    }
    if (turnoFilter !== "all") {
      list = list.filter(
        (r) =>
          (r.turno != null ? String(r.turno).trim() : "") === turnoFilter
      );
    }
    if (generoFilter !== "all") {
      if (generoFilter === GENERO_FILTER_SEM_INFO) {
        list = list.filter((r) => !r.genero);
      } else {
        list = list.filter((r) => r.genero === generoFilter);
      }
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const blob = [
          r.nomeCompleto,
          r.email,
          r.numeroTelefone,
          r.sala,
          r.time,
          r.turno,
          r.horarioTreino,
          r.genero,
          r.tratamento,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    const sorted = [...list];
    if (sortBy === "recent") {
      sorted.sort(
        (a, b) =>
          (b.dataEnvio?.toMillis?.() ?? 0) - (a.dataEnvio?.toMillis?.() ?? 0)
      );
    } else if (sortBy === "name") {
      sorted.sort((a, b) =>
        (a.nomeCompleto || "").localeCompare(b.nomeCompleto || "", "pt-BR")
      );
    } else if (sortBy === "team") {
      sorted.sort((a, b) =>
        (a.time || "").localeCompare(b.time || "") ||
        (b.dataEnvio?.toMillis?.() ?? 0) - (a.dataEnvio?.toMillis?.() ?? 0)
      );
    }
    return sorted;
  }, [rows, filter, turnoFilter, generoFilter, search, sortBy]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      await login(email.trim(), password);
    } catch {
      setLoginError("E-mail ou senha inválidos.");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedRows.size} inscrição(ões)?`)) return;
    
    try {
      for (const id of selectedRows) {
        await deleteDoc(doc(db, "inscricoes", id));
      }
      setSelectedRows(new Set());
      loadData();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir inscrições.");
    }
  };

  const handleToggleRow = (id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleWhatsappContact = (phone) => {
    const cleanPhone = phone?.replace(/\D/g, "");
    const message = encodeURIComponent(whatsappMessage || "Olá! Gostaria de falar sobre sua inscrição no projeto Solarys.");
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  const openDisciplineModal = (row) => {
    setDisciplineRow(row);
    setDraftAmarelos(row.cartoesAmarelos ?? 0);
    setDraftVermelhos(row.cartoesVermelhos ?? 0);
    setDraftObservacoes(row.observacoesAdmin ?? "");
  };

  const patchDisciplineLocal = (id, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    setDisciplineRow((prev) =>
      prev?.id === id ? { ...prev, ...patch } : prev
    );
  };

  const saveDisciplineFields = async () => {
    if (!disciplineRow) return;
    setDisciplineSaving(true);
    try {
      const patch = {
        cartoesAmarelos: draftAmarelos,
        cartoesVermelhos: draftVermelhos,
        observacoesAdmin: draftObservacoes.trim(),
      };
      await updateDoc(doc(db, "inscricoes", disciplineRow.id), patch);
      patchDisciplineLocal(disciplineRow.id, patch);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar advertências e observações.");
    } finally {
      setDisciplineSaving(false);
    }
  };

  const setMatriculaSuspensa = async (suspensa) => {
    if (!disciplineRow) return;
    const msg = suspensa
      ? `Suspender a matrícula de ${disciplineRow.nomeCompleto || "este aluno"}?`
      : `Remover a suspensão de ${disciplineRow.nomeCompleto || "este aluno"}?`;
    if (!confirm(msg)) return;
    setDisciplineSaving(true);
    try {
      await updateDoc(doc(db, "inscricoes", disciplineRow.id), {
        matriculaSuspensa: suspensa,
      });
      patchDisciplineLocal(disciplineRow.id, { matriculaSuspensa: suspensa });
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar status da matrícula.");
    } finally {
      setDisciplineSaving(false);
    }
  };

  // Função para carregar registro de presença do dia atual
  const loadPresencaDoDia = async (date) => {
    try {
      const q = query(
        collection(db, "presencas"),
        where("data", "==", date)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const doc = snap.docs[0];
        setPresencaId(doc.id);
        setPresencas(doc.data().presencas || {});
      } else {
        setPresencaId(null);
        setPresencas({});
      }
    } catch (e) {
      console.error(e);
      setPresencaId(null);
      setPresencas({});
    }
  };

  // Função para salvar presenças no Firestore
  const savePresencas = async () => {
    try {
      const presencaData = {
        data: presencaDate,
        presencas: presencas,
        criadoEm: serverTimestamp(),
      };
      
      if (presencaId) {
        // Atualizar registro existente
        await updateDoc(doc(db, "presencas", presencaId), presencaData);
      } else {
        // Criar novo registro
        const docRef = await addDoc(collection(db, "presencas"), presencaData);
        setPresencaId(docRef.id);
      }
      
      alert("Lista de presença salva com sucesso!");
      setShowPresencaModal(false);
      loadPresencas();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar lista de presença.");
    }
  };

  // Função para matricular aluno
  const matricularAluno = async (row) => {
    try {
      // Verifica se já está matriculado
      if (alunosMatriculados.some(a => a.id === row.id)) {
        alert("Este aluno já está matriculado.");
        return;
      }
      
      // Adiciona à lista de matriculados localmente
      setAlunosMatriculados(prev => [...prev, row]);
      
      // Atualiza no Firestore
      await updateDoc(doc(db, "inscricoes", row.id), {
        matriculado: true,
        dataMatricula: serverTimestamp(),
      });
      
      // Atualiza localmente
      setRows(prev => prev.map(r => 
        r.id === row.id ? { ...r, matriculado: true, dataMatricula: new Date() } : r
      ));
      
      alert(`${row.nomeCompleto} matriculado com sucesso!`);
    } catch (e) {
      console.error(e);
      alert("Erro ao matricular aluno.");
    }
  };

  // Função para remover matrícula
  const removerMatricula = async (row) => {
    if (!confirm(`Remover matrícula de ${row.nomeCompleto}?`)) return;
    
    try {
      setAlunosMatriculados(prev => prev.filter(a => a.id !== row.id));
      
      await updateDoc(doc(db, "inscricoes", row.id), {
        matriculado: false,
        dataMatricula: null,
      });
      
      setRows(prev => prev.map(r => 
        r.id === row.id ? { ...r, matriculado: false, dataMatricula: null } : r
      ));
      
      alert("Matrícula removida com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao remover matrícula.");
    }
  };

  // Carregar alunos matriculados ao montar
  useEffect(() => {
    if (user && rows.length > 0) {
      const matriculados = rows.filter(r => r.matriculado === true);
      setAlunosMatriculados(matriculados);
    }
  }, [user, rows]);

  // Carregar registros de presença
  const loadPresencas = useCallback(async () => {
    setPresencasLoading(true);
    try {
      const snap = await getDocs(collection(db, "presencas"));
      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setPresencasRegistros(list);
    } catch (e) {
      console.error(e);
    } finally {
      setPresencasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadPresencas();
  }, [user, loadPresencas]);

  // Calcular contagem de presenças por aluno
  const presencasPorAluno = useMemo(() => {
    const contagem = {};
    
    // Inicializar contagem para todos os alunos matriculados
    for (const aluno of alunosMatriculados) {
      contagem[aluno.id] = 0;
    }
    
    // Contar presenças baseado nos registros
    for (const registro of presencasRegistros) {
      if (registro.presencas) {
        for (const [alunoId, presente] of Object.entries(registro.presencas)) {
          // Aceita tanto boolean true quanto string "presente"
          if ((presente === true || presente === "presente") && contagem.hasOwnProperty(alunoId)) {
            contagem[alunoId] = (contagem[alunoId] || 0) + 1;
          }
        }
      }
    }
    
    return contagem;
  }, [alunosMatriculados, presencasRegistros]);

  // Calcular contagem de faltas por aluno
  const faltasPorAluno = useMemo(() => {
    const contagem = {};
    
    // Inicializar contagem para todos os alunos matriculados
    for (const aluno of alunosMatriculados) {
      contagem[aluno.id] = 0;
    }
    
    // Contar faltas baseado nos registros
    for (const registro of presencasRegistros) {
      if (registro.presencas) {
        for (const [alunoId, status] of Object.entries(registro.presencas)) {
          if (status === "falta" && contagem.hasOwnProperty(alunoId)) {
            contagem[alunoId] = (contagem[alunoId] || 0) + 1;
          }
        }
      }
    }
    
    return contagem;
  }, [alunosMatriculados, presencasRegistros]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#030306] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-500">
            Autenticando
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030306] text-white relative overflow-hidden flex flex-col">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/25 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15]" />
        </div>

        <header className="relative z-10 border-b border-white/5 px-4 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl justify-between items-center">
            <Link
              to="/"
              className="text-xl font-black tracking-tighter transition hover:opacity-80"
            >
              SOLARYS<span className="text-purple-500">.</span>
            </Link>
            <Link
              to="/"
              className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition"
            >
              Voltar ao site
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 text-center">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-purple-400">
                Área restrita
              </p>
              <h1 className="text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                Painel <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Solarys</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-500 normal-case leading-relaxed">
                Use o mesmo e-mail e senha do sistema legado (Firebase Auth).
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-px shadow-2xl shadow-purple-950/50 backdrop-blur-xl">
              <div className="rounded-[22px] bg-zinc-950/80 p-8 sm:p-10">
                <form onSubmit={handleLogin} className="space-y-6 normal-case">
                  {loginError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {loginError}
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      E-mail
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      placeholder="admin@..."
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      Senha
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginBusy}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-4 text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-purple-900/40 transition hover:brightness-110 disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {loginBusy ? "Entrando…" : "Entrar no painel"}
                    </span>
                    <div className="absolute inset-0 translate-y-full bg-white/10 transition group-hover:translate-y-0" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030306] text-zinc-100 flex flex-col">
      <style>{`
        @keyframes admin-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .admin-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(168, 85, 247, 0.08) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: admin-shimmer 8s linear infinite;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[60vh] w-[60vh] rounded-full bg-purple-600/12 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-[50vh] w-[50vh] rounded-full bg-fuchsia-600/10 blur-[90px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12]" />
      </div>

      <header
        className="relative z-20 sticky top-0 border-b border-white/[0.06] bg-[#030306]/85 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-900/40">
              <span className="text-lg font-black italic text-white">S</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black uppercase tracking-tight text-white">
                Comando Solarys
              </h1>
              <p className="truncate text-[10px] font-mono text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:max-w-[62%] lg:justify-end">
            <button
              type="button"
              onClick={loadData}
              disabled={dataLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-purple-500/40 hover:bg-purple-500/10 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {dataLoading ? "…" : "Atualizar"}
            </button>
            <button
              type="button"
              onClick={() =>
                exportCsv(
                  filtered,
                  `solarys-inscricoes-${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              type="button"
              onClick={() => setShowWhatsappModal(true)}
              title="Atualizar mensagem padrão do WhatsApp"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/10 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-green-300 transition hover:bg-green-500/20 xl:px-4"
            >
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="hidden xl:inline">Mensagem WhatsApp</span>
              <span className="xl:hidden">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const date = new Date().toISOString().split('T')[0];
                setPresencaDate(date);
                await loadPresencaDoDia(date);
                setShowPresencaModal(true);
              }}
              disabled={!isHorarioPresenca()}
              title={`Lista de presença disponível das ${presencaHoraInicio}:00 às ${presencaHoraFim}:00`}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition xl:px-4 ${
                isHorarioPresenca()
                  ? "border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                  : "border-zinc-500/25 bg-zinc-500/10 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="hidden xl:inline">Lista de Presença</span>
              <span className="xl:hidden">Presença</span>
              <span className="ml-1 text-[10px] font-mono opacity-70">
                {getTimeUntilPresenca()}
              </span>
            </button>
            {selectedRows.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir ({selectedRows.size})
              </button>
            )}
            <Link
              to="/"
              className="rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 transition hover:text-white"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-red-300/90 transition hover:bg-red-500/15"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
        <div className="mb-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-purple-400/90">
            Visão geral
          </p>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white sm:text-3xl">
            Alunos inscritos no projeto
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-500 normal-case">
            Dados em tempo real da coleção <span className="font-mono text-zinc-400">inscricoes</span>, separados pelos núcleos Falxtra, Nexon e Matira.
          </p>
        </div>

        {latestRow && !dataLoading && (
          <div className="admin-shimmer mb-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-transparent p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                  Última inscrição
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {latestRow.nomeCompleto || "—"}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatTimestamp(latestRow.dataEnvio)} ·{" "}
                  <span className={teamBadge(latestRow.time)}>{latestRow.time}</span>
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">E-mail</p>
                  <p className="font-mono text-xs text-zinc-300">{latestRow.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">Tel.</p>
                  <p className="font-mono text-xs text-zinc-300">{latestRow.numeroTelefone}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition ${
              filter === "all"
                ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Total
            </p>
            <p className="mt-2 text-4xl font-black tabular-nums text-white">
              {counts.all}
            </p>
            <p className="mt-1 text-[10px] text-zinc-600">inscrições</p>
          </button>
          {Object.values(TEAMS).map((t) => {
            const meta = TEAM_META[t.time];
            const active = filter === t.time;
            return (
              <button
                key={t.time}
                type="button"
                onClick={() => setFilter(t.time)}
                className={`relative overflow-hidden rounded-2xl border p-5 text-left transition ${
                  active
                    ? `border-white/20 bg-white/[0.06] shadow-lg ${meta?.ring ?? ""} ring-1`
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <div
                  className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl ${meta?.bar ?? "bg-zinc-600"}`}
                />
                <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  {t.label}
                </p>
                <p className="relative mt-2 text-4xl font-black tabular-nums text-white">
                  {counts[t.time] ?? 0}
                </p>
                <p className="relative mt-1 text-[10px] text-zinc-500">
                  {t.esporte} · {pct(counts[t.time] ?? 0)}%
                </p>
              </button>
            );
          })}
        </div>

        {counts.all > 0 && (
          <div className="mb-10">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
              Distribuição por time
            </p>
            <div className="flex h-4 overflow-hidden rounded-full bg-white/[0.05]">
              {counts.Falxtra > 0 && (
                <div
                  style={{ width: `${pct(counts.Falxtra)}%` }}
                  className="bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
                  title={`Falxtra ${pct(counts.Falxtra)}%`}
                />
              )}
              {counts.Nexon > 0 && (
                <div
                  style={{ width: `${pct(counts.Nexon)}%` }}
                  className="bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500"
                  title={`Nexon ${pct(counts.Nexon)}%`}
                />
              )}
              {counts.Matira > 0 && (
                <div
                  style={{ width: `${pct(counts.Matira)}%` }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                  title={`Matira ${pct(counts.Matira)}%`}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-zinc-500">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-500" /> Falxtra
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" /> Nexon
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" /> Matira
              </span>
            </div>
          </div>
        )}

        {alunosMatriculados.length > 0 && (
          <div className="mb-10 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/90">
                  Alunos Matriculados
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {alunosMatriculados.length} aluno(s)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const date = new Date().toISOString().split('T')[0];
                    setPresencaDate(date);
                    await loadPresencaDoDia(date);
                    setShowPresencaModal(true);
                  }}
                  disabled={!isHorarioPresenca()}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                    isHorarioPresenca()
                      ? "border-purple-500/25 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                      : "border-zinc-500/25 bg-zinc-500/10 text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Lista de Presença
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alunosMatriculados.slice(0, 6).map((aluno) => (
                <div
                  key={aluno.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{aluno.nomeCompleto}</p>
                      <p className="text-xs text-zinc-500">{aluno.sala} · {aluno.turno}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${teamBadge(aluno.time)}`}
                    >
                      {aluno.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-mono">{aluno.numeroTelefone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-mono font-bold">{presencasPorAluno[aluno.id] || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-mono font-bold">{faltasPorAluno[aluno.id] || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {alunosMatriculados.length > 6 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 flex items-center justify-center">
                  <p className="text-sm text-zinc-500">
                    +{alunosMatriculados.length - 6} outros
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative" ref={teamMenuRef}>
            <button
              type="button"
              onClick={() =>
                setOpenFilterMenu((o) => (o === "team" ? null : "team"))
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                filter !== "all"
                  ? "border-purple-500/50 bg-purple-500/15 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                  : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/25"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Filtrar por time
              <svg
                className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition ${openFilterMenu === "team" ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFilterMenu === "team" && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/98 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setFilter("all");
                    setOpenFilterMenu(null);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                    filter === "all" ? "text-purple-300" : "text-zinc-300"
                  }`}
                >
                  Todos os times
                  {filter === "all" && (
                    <span className="text-xs text-purple-500">✓</span>
                  )}
                </button>
                {Object.values(TEAMS).map((t) => {
                  const active = filter === t.time;
                  return (
                    <button
                      key={t.time}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setFilter(t.time);
                        setOpenFilterMenu(null);
                      }}
                      className={`flex w-full items-center justify-between gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                        active ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <span>
                        <span className="font-bold">{t.label}</span>
                        <span className="ml-2 text-xs text-zinc-600">· {t.esporte}</span>
                      </span>
                      {active && <span className="text-xs text-purple-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative" ref={horarioMenuRef}>
            <button
              type="button"
              onClick={() =>
                setOpenFilterMenu((o) => (o === "horario" ? null : "horario"))
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                turnoFilter !== "all"
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                  : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/25"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Filtrar por horário de aula
              <svg
                className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition ${openFilterMenu === "horario" ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFilterMenu === "horario" && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 min-w-[260px] max-h-[min(70vh,320px)] overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/98 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTurnoFilter("all");
                    setOpenFilterMenu(null);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                    turnoFilter === "all" ? "text-cyan-300" : "text-zinc-300"
                  }`}
                >
                  Todos (Manhã / Tarde)
                  {turnoFilter === "all" && (
                    <span className="text-xs text-cyan-500">✓</span>
                  )}
                </button>
                {turnosUnicos.length === 0 && (
                  <p className="border-t border-white/5 px-4 py-3 text-xs text-zinc-600 normal-case">
                    Nenhum dado de turno nas inscrições ainda.
                  </p>
                )}
                {turnosUnicos.map((h) => {
                  const active = turnoFilter === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setTurnoFilter(h);
                        setOpenFilterMenu(null);
                      }}
                      className={`flex w-full items-center justify-between gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                        active ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <span className="normal-case">{h}</span>
                      {active && <span className="text-xs text-cyan-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative" ref={generoMenuRef}>
            <button
              type="button"
              onClick={() =>
                setOpenFilterMenu((o) => (o === "genero" ? null : "genero"))
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                generoFilter !== "all"
                  ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-100 shadow-[0_0_20px_rgba(217,70,239,0.1)]"
                  : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/25"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 text-fuchsia-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Filtrar por gênero
              <svg
                className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition ${openFilterMenu === "genero" ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFilterMenu === "genero" && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 min-w-[280px] max-h-[min(70vh,360px)] overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/98 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setGeneroFilter("all");
                    setOpenFilterMenu(null);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                    generoFilter === "all" ? "text-fuchsia-300" : "text-zinc-300"
                  }`}
                >
                  Todos
                  {generoFilter === "all" && (
                    <span className="text-xs text-fuchsia-500">✓</span>
                  )}
                </button>
                {GENEROS.map((g) => {
                  const active = generoFilter === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setGeneroFilter(g.value);
                        setOpenFilterMenu(null);
                      }}
                      className={`flex w-full items-center justify-between gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm normal-case transition hover:bg-white/5 ${
                        active ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <span>{g.label}</span>
                      {active && <span className="text-xs text-fuchsia-400">✓</span>}
                    </button>
                  );
                })}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setGeneroFilter(GENERO_FILTER_SEM_INFO);
                    setOpenFilterMenu(null);
                  }}
                  className={`flex w-full items-center justify-between gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm normal-case transition hover:bg-white/5 ${
                    generoFilter === GENERO_FILTER_SEM_INFO
                      ? "text-white"
                      : "text-zinc-500"
                  }`}
                >
                  <span>Sem informação (inscrições antigas)</span>
                  {generoFilter === GENERO_FILTER_SEM_INFO && (
                    <span className="text-xs text-fuchsia-400">✓</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {(filter !== "all" || turnoFilter !== "all" || generoFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setTurnoFilter("all");
                setGeneroFilter("all");
              }}
              className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, e-mail, telefone, turma..."
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/15"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Ordenar
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2.5 text-xs font-semibold text-zinc-300 focus:border-purple-500/40 focus:outline-none"
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Nome (A–Z)</option>
              <option value="team">Por time</option>
            </select>
          </div>
        </div>

        {dataError && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 normal-case">
            {dataError}
          </div>
        )}

        {dataLoading && rows.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}

        <div className="hidden lg:block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm normal-case">
              <thead>
                <tr className="border-b border-white/[0.06] bg-black/30 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  <th className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50"
                    />
                  </th>
                  <th className="px-5 py-4">Aluno</th>
                  <th className="px-5 py-4">Gênero / tratamento</th>
                  <th className="px-5 py-4">Contato</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Escola</th>
                  <th className="px-5 py-4">Nascimento</th>
                  <th className="px-5 py-4">Inscrição</th>
                  <th className="px-4 py-4 w-[5.5rem] min-w-[5.5rem]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-white/[0.04] transition hover:bg-white/[0.03] ${rowDisciplineClass(r)} ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } ${isMatriculaSuspensa(r) ? "bg-zinc-900/40" : ""}`}
                  >
                    <td className="px-5 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(r.id)}
                        onChange={() => handleToggleRow(r.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50"
                      />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{r.nomeCompleto || "—"}</p>
                        {isMatriculaSuspensa(r) && (
                          <span className="rounded-md border border-zinc-500/40 bg-zinc-600/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                            Suspensa
                          </span>
                        )}
                      </div>
                      {(r.cartoesAmarelos > 0 || r.cartoesVermelhos > 0) && (
                        <div className="mt-1.5 flex gap-1.5">
                          {r.cartoesAmarelos > 0 && (
                            <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                              <span className="h-2.5 w-3.5 rounded-sm bg-amber-400" />
                              {r.cartoesAmarelos}
                            </span>
                          )}
                          {r.cartoesVermelhos > 0 && (
                            <span className="inline-flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                              <span className="h-2.5 w-3.5 rounded-sm bg-red-500" />
                              {r.cartoesVermelhos}
                            </span>
                          )}
                        </div>
                      )}
                      {r.problemaSaude ? (
                        <p className="mt-1 max-w-xs truncate text-[11px] text-amber-400/80" title={r.problemaSaude}>
                          ⚕ {r.problemaSaude}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top text-xs text-zinc-400">
                      <p className="text-zinc-300">{r.genero || "—"}</p>
                      {r.tratamento ? (
                        <p className="mt-1 text-zinc-500">
                          Tratamento: <span className="text-zinc-400">{r.tratamento}</span>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-mono text-xs text-zinc-300">{r.email || "—"}</p>
                      <p className="mt-1 font-mono text-xs text-zinc-500">{r.numeroTelefone || "—"}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${teamBadge(r.time)}`}
                      >
                        {r.time || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-xs text-zinc-400">
                      <p>
                        {r.anoEscolar ? `${r.anoEscolar}º ano` : "—"} · {r.sala || "—"}
                      </p>
                      <p className="mt-1 text-zinc-500">
                        {r.turno || "—"} · Treino: {r.horarioTreino || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top font-mono text-xs text-zinc-500">
                      {r.dataNascimento || "—"}
                    </td>
                    <td className="px-5 py-4 align-top font-mono text-xs text-zinc-500 whitespace-nowrap">
                      {formatTimestamp(r.dataEnvio)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        {!r.matriculado ? (
                          <button
                            type="button"
                            onClick={() => matricularAluno(r)}
                            className="inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 transition"
                            title="Efetuar matrícula"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removerMatricula(r)}
                            className="inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 transition"
                            title="Remover matrícula"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openDisciplineModal(r)}
                          className="inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 transition"
                          title="Advertências / suspender matrícula"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWhatsappContact(r.numeroTelefone)}
                          disabled={!r.numeroTelefone}
                          className="inline-flex shrink-0 items-center justify-center w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Contatar via WhatsApp"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !dataLoading && (
            <p className="py-16 text-center text-sm text-zinc-600">
              {search.trim()
                ? "Nenhum resultado para essa busca."
                : "Nenhuma inscrição neste filtro."}
            </p>
          )}
        </div>

        <div className="lg:hidden space-y-4">
          {filtered.map((r) => (
            <article
              key={r.id}
              className={`overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent normal-case ${rowDisciplineClass(r)} ${isMatriculaSuspensa(r) ? "border-zinc-600/40 bg-zinc-900/50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] bg-black/20 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(r.id)}
                    onChange={() => handleToggleRow(r.id)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold leading-tight text-white">{r.nomeCompleto || "—"}</h3>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500">{r.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 max-w-[45%]">
                  {isMatriculaSuspensa(r) && (
                    <span className="rounded-md border border-zinc-500/40 bg-zinc-600/30 px-2 py-0.5 text-[9px] font-bold uppercase text-zinc-400">
                      Suspensa
                    </span>
                  )}
                  {r.matriculado && (
                    <span className="rounded-md border border-emerald-500/40 bg-emerald-600/30 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                      Matriculado
                    </span>
                  )}
                  <span
                    className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${teamBadge(r.time)}`}
                  >
                    {r.time}
                  </span>
                  {!r.matriculado ? (
                    <button
                      type="button"
                      onClick={() => matricularAluno(r)}
                      className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 transition"
                      title="Efetuar matrícula"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removerMatricula(r)}
                      className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 transition"
                      title="Remover matrícula"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openDisciplineModal(r)}
                    className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 transition"
                    title="Advertências / suspender matrícula"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsappContact(r.numeroTelefone)}
                    disabled={!r.numeroTelefone}
                    className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Contatar via WhatsApp"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-3 px-4 py-4 text-xs text-zinc-400">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Gênero</span>
                  <span className="text-right text-zinc-300">{r.genero || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Chamado(a) por</span>
                  <span>{r.tratamento || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Telefone</span>
                  <span className="font-mono text-zinc-300">{r.numeroTelefone}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Nascimento</span>
                  <span className="font-mono">{r.dataNascimento || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Série / turma</span>
                  <span className="text-right">
                    {r.anoEscolar ? `${r.anoEscolar}º` : "—"} · {r.sala || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Turno (aula)</span>
                  <span>{r.turno || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-600">Treino</span>
                  <span className="text-right">{r.horarioTreino || "—"}</span>
                </div>
                {r.problemaSaude ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/90">
                    <span className="font-bold text-amber-400/90">Saúde: </span>
                    {r.problemaSaude}
                  </div>
                ) : null}
                <p className="border-t border-white/[0.06] pt-3 font-mono text-[10px] text-zinc-600">
                  Inscrição: {formatTimestamp(r.dataEnvio)}
                </p>
              </div>
            </article>
          ))}
          {filtered.length === 0 && !dataLoading && (
            <p className="py-12 text-center text-sm text-zinc-600">
              {search.trim() ? "Nenhum resultado." : "Nenhuma inscrição."}
            </p>
          )}
        </div>

        <footer className="mt-12 border-t border-white/[0.06] pt-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-700">
            Solarys · Painel interno · {filtered.length} exibindo
            {search.trim() || filter !== "all" || turnoFilter !== "all" || generoFilter !== "all"
              ? ` (filtrado de ${rows.length})`
              : ""}
          </p>
        </footer>
      </main>

      {disciplineRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            ref={disciplineModalRef}
            className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl normal-case"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Advertências / suspender matrícula
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {disciplineRow.nomeCompleto || "—"}
                  {isMatriculaSuspensa(disciplineRow) && (
                    <span className="ml-2 rounded border border-zinc-500/40 bg-zinc-700/40 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                      Matrícula suspensa
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisciplineRow(null)}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Cartões de advertência
                </p>
                <div className="flex flex-wrap items-stretch gap-4">
                  <div className="flex flex-1 min-w-[140px] flex-col items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                    <button
                      type="button"
                      onClick={() => setDraftAmarelos((n) => n + 1)}
                      className="group flex flex-col items-center gap-2 transition hover:scale-105"
                      title="Adicionar cartão amarelo"
                    >
                      <span className="h-14 w-10 rounded-md bg-gradient-to-b from-amber-300 to-amber-500 shadow-lg shadow-amber-900/40 ring-2 ring-amber-400/50 group-hover:ring-amber-300" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
                        Amarelo
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftAmarelos((n) => Math.max(0, n - 1))}
                        disabled={draftAmarelos <= 0}
                        className="h-8 w-8 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="min-w-[2ch] text-center text-xl font-black tabular-nums text-amber-200">
                        {draftAmarelos}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDraftAmarelos((n) => n + 1)}
                        className="h-8 w-8 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 min-w-[140px] flex-col items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/5 p-4">
                    <button
                      type="button"
                      onClick={() => setDraftVermelhos((n) => n + 1)}
                      className="group flex flex-col items-center gap-2 transition hover:scale-105"
                      title="Adicionar cartão vermelho"
                    >
                      <span className="h-14 w-10 rounded-md bg-gradient-to-b from-red-400 to-red-700 shadow-lg shadow-red-900/40 ring-2 ring-red-500/50 group-hover:ring-red-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-300/90">
                        Vermelho
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftVermelhos((n) => Math.max(0, n - 1))}
                        disabled={draftVermelhos <= 0}
                        className="h-8 w-8 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="min-w-[2ch] text-center text-xl font-black tabular-nums text-red-200">
                        {draftVermelhos}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDraftVermelhos((n) => n + 1)}
                        className="h-8 w-8 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Anotações e observações sobre o aluno
                </label>
                <textarea
                  value={draftObservacoes}
                  onChange={(e) => setDraftObservacoes(e.target.value)}
                  placeholder="Registre ocorrências, combinados com responsáveis, motivos de advertência..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/15"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {isMatriculaSuspensa(disciplineRow) ? (
                  <button
                    type="button"
                    onClick={() => setMatriculaSuspensa(false)}
                    disabled={disciplineSaving}
                    className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    Remover suspensão
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMatriculaSuspensa(true)}
                    disabled={disciplineSaving}
                    className="flex-1 rounded-xl border border-zinc-500/40 bg-zinc-600/20 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:bg-zinc-600/35 disabled:opacity-50"
                  >
                    Suspender matrícula
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setDisciplineRow(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:bg-white/10"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={saveDisciplineFields}
                disabled={disciplineSaving}
                className="rounded-xl bg-purple-600 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-purple-500 disabled:opacity-50"
              >
                {disciplineSaving ? "Salvando…" : "Salvar cartões e observações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={whatsappModalRef}
            className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Atualizar mensagem do WhatsApp</h3>
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:text-white hover:bg-white/5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Mensagem padrão para contato
              </label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada ao contatar o aluno via WhatsApp..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/15 resize-none"
              />
              <p className="mt-3 text-xs text-zinc-500">
                Esta mensagem será usada quando você clicar no botão de WhatsApp do aluno. Deixe em branco para usar a mensagem padrão.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-green-500"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPresencaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            ref={presencaModalRef}
            className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl normal-case max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Lista de Presença</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Data: {presencaDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresencaModal(false)}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Data da presença
                </label>
                <input
                  type="date"
                  value={presencaDate}
                  onChange={(e) => setPresencaDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/15"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Filtrar por esporte
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPresencaTeamFilter("all")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      presencaTeamFilter === "all"
                        ? "bg-purple-500 text-white"
                        : "bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresencaTeamFilter("Falxtra")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      presencaTeamFilter === "Falxtra"
                        ? "bg-purple-500 text-white"
                        : "bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20"
                    }`}
                  >
                    Futsal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresencaTeamFilter("Nexon")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      presencaTeamFilter === "Nexon"
                        ? "bg-red-500 text-white"
                        : "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
                    }`}
                  >
                    Basquete
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresencaTeamFilter("Matira")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      presencaTeamFilter === "Matira"
                        ? "bg-blue-500 text-white"
                        : "bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20"
                    }`}
                  >
                    Vôlei
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {alunosMatriculados
                  .filter(r => presencaTeamFilter === "all" || r.time === presencaTeamFilter)
                  .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{r.nomeCompleto || "—"}</p>
                      <p className="text-xs text-zinc-500">{r.sala} · {r.turno} · {r.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPresencas(prev => ({ ...prev, [r.id]: "presente" }))}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                          presencas[r.id] === "presente"
                            ? "bg-emerald-500 text-white"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresencas(prev => ({ ...prev, [r.id]: "falta" }))}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                          presencas[r.id] === "falta"
                            ? "bg-red-500 text-white"
                            : "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
                        }`}
                      >
                        Falta
                      </button>
                      {presencas[r.id] && (
                        <button
                          type="button"
                          onClick={() => {
                            setPresencas(prev => {
                              const newPresencas = { ...prev };
                              delete newPresencas[r.id];
                              return newPresencas;
                            });
                          }}
                          className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition bg-zinc-500/10 text-zinc-300 border border-zinc-500/30 hover:bg-zinc-500/20"
                          title="Limpar"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {alunosMatriculados.filter(r => presencaTeamFilter === "all" || r.time === presencaTeamFilter).length === 0 && (
                  <p className="text-center text-sm text-zinc-500 py-8">
                    {presencaTeamFilter === "all" ? "Nenhum aluno matriculado." : `Nenhum aluno matriculado no time ${presencaTeamFilter}.`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowPresencaModal(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={savePresencas}
                className="rounded-xl bg-purple-600 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-purple-500"
              >
                Salvar Presença
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

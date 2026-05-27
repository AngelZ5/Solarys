import React, { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { getTeamBySlug } from "../constants/teams";
import { GENEROS, TRATAMENTOS } from "../constants/enrollment";

const TURNOS = ["Manhã", "Tarde"];
const HORARIOS = ["Tarde"];
const ANOS = ["1", "2", "3"];

const initialForm = {
  nomeCompleto: "",
  email: "",
  numeroTelefone: "",
  dataNascimento: "",
  anoEscolar: "",
  sala: "",
  turno: "",
  horarioTreino: "",
  problemaSaude: "",
  genero: "",
  tratamento: "",
};




export default function InscreverForm() {
  const { teamSlug } = useParams();
  const team = useMemo(() => getTeamBySlug(teamSlug), [teamSlug]);

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!team) {
    return <Navigate to="/inscrever" replace />;
  }

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !form.nomeCompleto.trim() ||
      !form.email.trim() ||
      !form.numeroTelefone.trim() ||
      !form.dataNascimento ||
      !form.anoEscolar ||
      !form.sala.trim() ||
      !form.turno ||
      !form.horarioTreino ||
      !form.genero ||
      !form.tratamento
    ) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    setStatus("sending");
    try {
      await addDoc(collection(db, "inscricoes"), {
        nomeCompleto: form.nomeCompleto.trim(),
        email: form.email.trim().toLowerCase(),
        numeroTelefone: form.numeroTelefone.replace(/\D/g, ""),
        dataNascimento: form.dataNascimento,
        anoEscolar: form.anoEscolar,
        sala: form.sala.trim(),
        turno: form.turno,
        horarioTreino: form.horarioTreino,
        problemaSaude: (form.problemaSaude || "").trim(),
        genero: form.genero,
        tratamento: form.tratamento,
        time: team.time,
        dataEnvio: serverTimestamp(),
      });
      setStatus("success");
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      setStatus("idle");
      setErrorMsg(
        "Não foi possível enviar. Verifique sua conexão ou peça ajuda a um professor do projeto e tente novamente."
      );
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors";

  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header
        className="border-b border-white/10 bg-black/80 backdrop-blur-md px-4 py-4 sm:px-6"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Link to="/inscrever" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest">
            ← Outros times
          </Link>
          <Link to="/" className="text-lg font-black tracking-tighter">
            SOLARYS<span className="text-purple-500">.</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-2xl">
        <div
          className={`rounded-2xl border ${team.border} bg-white/[0.03] p-6 sm:p-10 mb-8`}
        >
          <div
            className={`h-1 w-20 rounded-full bg-gradient-to-r ${team.accent} mb-6`}
          />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">
            Inscrição — {team.label}
          </h1>
          <p className="text-gray-500 text-sm mt-2 normal-case">
            {team.esporte} · {team.desc}
          </p>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
            <p className="text-green-400 font-black uppercase tracking-tight text-lg mb-2">
              Inscrição recebida
            </p>
            <p className="text-gray-400 text-sm normal-case mb-6">
              Obrigado! Sua solicitação para o time {team.label} foi registrada. Entraremos em
              contato pelo e-mail ou telefone informados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/inscrever"
                className="inline-flex justify-center px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-purple-500 hover:text-white transition-colors"
              >
                Nova inscrição
              </Link>
              <Link
                to="/"
                className="inline-flex justify-center px-6 py-3 rounded-xl border border-white/20 font-bold text-sm hover:border-purple-500 transition-colors"
              >
                Voltar ao site
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 normal-case">
            {errorMsg && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label className={labelClass}>Nome completo *</label>
              <input
                className={inputClass}
                value={form.nomeCompleto}
                onChange={update("nomeCompleto")}
                autoComplete="name"
                placeholder="Como no documento"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>E-mail *</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className={labelClass}>Telefone *</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={form.numeroTelefone}
                  onChange={update("numeroTelefone")}
                  autoComplete="tel"
                  placeholder="71999999999"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Data de nascimento *</label>
              <input
                type="date"
                className={inputClass}
                value={form.dataNascimento}
                onChange={update("dataNascimento")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Gênero *</label>
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={form.genero}
                  onChange={update("genero")}
                >
                  <option value="">Selecione</option>
                  {GENEROS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelClass}>Prefiro ser chamado(a) por *</span>
                <div className="flex flex-wrap gap-3 pt-1">
                  {TRATAMENTOS.map((t) => (
                    <label
                      key={t.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        form.tratamento === t.value
                          ? "border-purple-500 bg-purple-500/15 text-white"
                          : "border-white/15 bg-white/5 text-gray-400 hover:border-white/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tratamento"
                        value={t.value}
                        checked={form.tratamento === t.value}
                        onChange={update("tratamento")}
                        className="sr-only"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Ano escolar *</label>
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={form.anoEscolar}
                  onChange={update("anoEscolar")}
                >
                  <option value="">Selecione</option>
                  {ANOS.map((a) => (
                    <option key={a} value={a}>
                      {a}º ano (EM)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sala / turma *</label>
                <input
                  className={inputClass}
                  value={form.sala}
                  onChange={update("sala")}
                  placeholder="Ex.: Logística A"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Turno escolar *</label>
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={form.turno}
                  onChange={update("turno")}
                >
                  <option value="">Selecione</option>
                  {TURNOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Horário de treino (no momento apenas ocorrendo no turno da tarde) *</label>
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={form.horarioTreino}
                  onChange={update("horarioTreino")}
                >
                  <option value="">Selecione</option>
                  {HORARIOS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Problemas de saúde / observações</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={form.problemaSaude}
                onChange={update("problemaSaude")}
                placeholder="Deixe em branco se não houver. Informações ajudam a equipe técnica."
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-black uppercase text-sm tracking-widest transition-colors"
            >
              {status === "sending" ? "Enviando…" : "Enviar inscrição"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

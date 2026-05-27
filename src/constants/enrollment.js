/** Opções de gênero no formulário de inscrição (valores gravados no Firestore). */
export const GENEROS = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  {
    value: "Não-binário ou outra identidade",
    label: "Não-binário ou outra identidade",
  },
];

/** Prefiro ser chamado(a) por — pronomes de tratamento. */
export const TRATAMENTOS = [
  { value: "Ele", label: "Ele" },
  { value: "Ela", label: "Ela" },
];

export const GENERO_FILTER_SEM_INFO = "__sem_informacao__";

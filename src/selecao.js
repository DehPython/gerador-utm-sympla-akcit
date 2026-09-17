// Todas as pessoas que estão embaixo de um nó, em qualquer profundidade.
export function folhasDe(no) {
  if (no.pessoa) return [no.pessoa];
  return no.filhos.flatMap(folhasDe);
}

// Estado do checkbox do nó, derivado das folhas: nunca é guardado, só calculado.
export function estadoDo(no, marcadas, chaveDe) {
  const folhas = folhasDe(no);
  if (!folhas.length) return 'nenhum';

  const quantas = folhas.filter((pessoa) => marcadas.has(chaveDe(pessoa))).length;
  if (quantas === 0) return 'nenhum';
  if (quantas === folhas.length) return 'todos';
  return 'parcial';
}

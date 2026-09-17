// A campanha pertence ao grupo macro, não a um campo solto no topo da página.
// Sem isso dava para montar um estado sem sentido: campanha "embaixadores"
// com pessoas do time interno selecionadas.
export const CAMPANHA_EMBAIXADORES = 'embaixadores';
export const CAMPANHA_INTERNO = 'interno';

export const campanhaDe = (pessoa) =>
  pessoa.uf === 'Interno' ? CAMPANHA_INTERNO : CAMPANHA_EMBAIXADORES;

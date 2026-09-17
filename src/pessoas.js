import { montarUrl } from './utm.js';

// Regra do ideia.md: só quem está Ativo aparece na aplicação.
// Desligado e Pendente ficam fora, mesmo constando na planilha.
export function somenteAtivos(pessoas) {
  return pessoas.filter((p) => String(p.status ?? '').trim().toLowerCase() === 'ativo');
}

// utm_medium leva a divisão a que a pessoa pertence: UF para embaixador, área
// para interno. É de propósito: o Dashboard > Campanhas da Sympla só mostra
// source, medium e campaign, então esse corte aparece sem exportar planilha.
// content e term ficam com o detalhe territorial, que só interessa na exportação.
export function linkDaPessoa(pessoa, base, campanha) {
  return montarUrl({ base, campaign: campanha, ...camposDe(pessoa) });
}

function camposDe(pessoa) {
  if (pessoa.uf === 'Interno') {
    return { source: pessoa.nome, medium: pessoa.area || 'interno' };
  }
  return {
    source: pessoa.nome,
    medium: pessoa.uf,
    content: pessoa.embaixada,
    term: pessoa.municipio,
  };
}

// Ordem da lista de links gerados. localeCompare em pt-BR trata acento como a
// letra base, então Ávila fica entre Alves e Bruno em vez de ir para o fim.
export function emOrdemAlfabetica(pessoas) {
  return [...pessoas].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

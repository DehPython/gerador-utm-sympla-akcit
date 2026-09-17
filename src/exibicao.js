// Formatação só para leitura na tela. O slug do UTM continua saindo do valor
// original da planilha, então mexer aqui nunca muda um link já distribuído.

const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du', 'von', 'van']);

function capitalizar(bruto) {
  return bruto
    .split(/\s+/)
    .map((palavra, i) => {
      const minuscula = palavra.toLocaleLowerCase('pt-BR');
      const capitalizada = minuscula.charAt(0).toLocaleUpperCase('pt-BR') + minuscula.slice(1);

      // "de"/"da"/"do" nunca são sigla, mesmo em caixa alta na planilha.
      if (PARTICULAS.has(minuscula)) return i > 0 ? minuscula : capitalizada;

      // RN, IA, CE: sigla de duas letras já em caixa alta fica como está.
      if (palavra.length <= 2 && palavra === palavra.toLocaleUpperCase('pt-BR')) return palavra;

      return capitalizada;
    })
    .join(' ');
}

// Pessoas e embaixadas: nomes próprios, mas siglas curtas (IA2A, SENAI/CE)
// ficam como estão porque capitalizá-las descaracteriza a marca.
export function comoNome(valor) {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return '';

  if (!/\s/.test(bruto) && bruto === bruto.toLocaleUpperCase('pt-BR') && bruto.length <= 8) {
    return bruto;
  }
  return capitalizar(bruto);
}

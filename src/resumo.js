// Versão curta do link para a lista de resultados. O nome da pessoa já está na
// linha, então o resumo serve só de conferência: para onde vai e qual origem.
export function resumoDoLink(url) {
  let endereco;
  try {
    endereco = new URL(url);
  } catch {
    return url;
  }

  const dominio = endereco.hostname.replace(/^www\./, '');
  const origem = endereco.searchParams.get('utm_source');
  return origem ? `${dominio}/…?utm_source=${origem}` : `${dominio}/…`;
}

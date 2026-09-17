// Origem, canal e campanha viram utm_source, utm_medium e utm_campaign, que a
// Sympla exige. Detalhe e termo são opcionais e não entram aqui.
export const OBRIGATORIOS_AVULSO = [
  { campo: 'origem', rotulo: 'Origem', id: 'a-origem' },
  { campo: 'canal', rotulo: 'Canal', id: 'a-canal' },
  { campo: 'campanha', rotulo: 'Campanha', id: 'a-campanha' },
];

export function camposFaltando(valores) {
  return OBRIGATORIOS_AVULSO.filter(({ campo }) => !String(valores[campo] ?? '').trim());
}

// O link do evento tem de ser da Sympla: é o domínio que lê os parâmetros UTM.
// Um endereço de outro site geraria links que não rastreiam nada, e o erro só
// apareceria depois da divulgação, quando o relatório viesse vazio.
const DOMINIO = 'sympla.com.br';

// O gerador de UTM da própria Sympla também fica em sympla.com.br, e colar o
// endereço dele por engano é fácil.
const NAO_E_EVENTO = ['produtores.sympla.com.br', 'ajuda.sympla.com.br'];

export function validarUrlBase(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return { ok: false, erro: 'Cole o link do evento no Sympla.' };

  // Sem protocolo a pessoa quis dizer https; com javascript: ou data: não.
  const comProtocolo = /^[a-z][a-z0-9+.-]*:/i.test(texto) ? texto : `https://${texto}`;

  let endereco;
  try {
    endereco = new URL(comProtocolo);
  } catch {
    return { ok: false, erro: 'Isso não parece um endereço. Cole o link do evento no Sympla.' };
  }

  if (endereco.protocol !== 'https:' && endereco.protocol !== 'http:') {
    return { ok: false, erro: 'Cole o link do evento no Sympla, começando com https://' };
  }

  // Compara o host inteiro: "sympla.com.br.outro-site.com" não passa.
  const host = endereco.hostname.toLowerCase();
  const daSympla = host === DOMINIO || host.endsWith(`.${DOMINIO}`);
  if (!daSympla) {
    return { ok: false, erro: 'O link precisa ser do Sympla, como https://www.sympla.com.br/evento/...' };
  }

  if (NAO_E_EVENTO.includes(host)) {
    return { ok: false, erro: 'Esse é o site da Sympla, não a página do evento. Copie o link do evento no painel.' };
  }

  // Um link já rastreado geraria utm_source duas vezes na mesma URL, e o painel
  // da Sympla leria um dos dois sem avisar qual. Melhor recusar na entrada.
  const jaRastreado = [...endereco.searchParams.keys()]
    .filter((chave) => /^utm_(source|medium|campaign|content|term)$/i.test(chave));

  if (jaRastreado.length) {
    const quais = jaRastreado.map((c) => c.toLowerCase()).join(', ');
    return {
      ok: false,
      erro: `Esse link já vem com rastreamento (${quais}). Cole o link limpo do evento, sem os parâmetros depois do "?".`,
    };
  }

  return { ok: true, url: endereco.toString() };
}

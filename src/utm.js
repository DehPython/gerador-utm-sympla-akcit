// Normaliza um valor para uso em parâmetro UTM.
// O gerador oficial da Sympla só faz lowercase + espaço->underscore e deixa o
// acento passar percent-encoded (uait%C3%A3_pires). Aqui removemos acento e
// cedilha antes, conforme o guia de boas práticas da própria Sympla, para o
// valor chegar legível no relatório.
export function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const OBRIGATORIOS = [
  ['utm_source', 'source'],
  ['utm_medium', 'medium'],
  ['utm_campaign', 'campaign'],
];

const OPCIONAIS = [
  ['utm_content', 'content'],
  ['utm_term', 'term'],
];

export function montarUrl(campos) {
  const base = String(campos.base ?? '').trim();
  if (!base) throw new Error('URL base é obrigatória');

  const partes = [];

  for (const [chave, campo] of OBRIGATORIOS) {
    const valor = normalizar(campos[campo]);
    if (!valor) throw new Error(`${chave} é obrigatório`);
    partes.push(`${chave}=${valor}`);
  }

  for (const [chave, campo] of OPCIONAIS) {
    const valor = normalizar(campos[campo]);
    if (valor) partes.push(`${chave}=${valor}`);
  }

  const semFragmento = base.split('#')[0];
  const separador = semFragmento.includes('?') ? '&' : '?';
  return semFragmento + separador + partes.join('&');
}

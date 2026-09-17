// Leitura da planilha de embaixadores exportada em CSV pelo Google Sheets.

export function lerCsv(texto) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];

    if (dentroDeAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (c === '"') {
        dentroDeAspas = false;
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') dentroDeAspas = true;
    else if (c === ',') {
      linha.push(campo);
      campo = '';
    } else if (c === '\n') {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else if (c !== '\r') {
      campo += c;
    }
  }

  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

// A planilha tem linhas decorativas antes do cabeçalho de verdade, e as colunas
// podem ser reordenadas. Procuramos o cabeçalho pelo nome de cada coluna.
const COLUNAS = {
  uf: 'UF',
  municipio: 'MUNICÍPIO',
  embaixada: 'EMBAIXADA',
  nome: 'EMBAIXADOR(A)',
  status: 'STATUS',
};

const semAcento = (v) =>
  String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();

export function extrairEmbaixadores(linhas) {
  const esperadas = Object.values(COLUNAS).map(semAcento);
  const iCabecalho = linhas.findIndex((linha) => {
    const celulas = linha.map(semAcento);
    return esperadas.every((coluna) => celulas.includes(coluna));
  });

  if (iCabecalho === -1) {
    throw new Error(
      `Não achei o cabeçalho da planilha. Esperava as colunas: ${Object.values(COLUNAS).join(', ')}.`,
    );
  }

  const cabecalho = linhas[iCabecalho].map(semAcento);
  const indice = Object.fromEntries(
    Object.entries(COLUNAS).map(([campo, coluna]) => [campo, cabecalho.indexOf(semAcento(coluna))]),
  );

  // Só os cinco campos entram no app: e-mail, celular e LinkedIn dos
  // embaixadores ficam de fora do repositório e do site.
  return linhas
    .slice(iCabecalho + 1)
    .map((linha) => ({
      nome: (linha[indice.nome] ?? '').trim(),
      uf: (linha[indice.uf] ?? '').trim(),
      municipio: (linha[indice.municipio] ?? '').trim(),
      embaixada: (linha[indice.embaixada] ?? '').trim(),
      status: (linha[indice.status] ?? '').trim(),
    }))
    .filter((pessoa) => pessoa.nome);
}

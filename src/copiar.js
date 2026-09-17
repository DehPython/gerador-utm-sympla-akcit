// Copiar para a área de transferência funcionando nos dois cenários.
//
// A Clipboard API só existe em contexto seguro: https ou localhost. Servido
// numa rede interna por http://192.168.x.x, navigator.clipboard é undefined e
// o botão principal do site não funcionaria. Por isso o execCommand fica como
// segunda tentativa: é obsoleto, mas é o que roda em http.
export async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Permissão negada ou fora de contexto seguro: tenta o caminho antigo.
    }
  }
  return porSelecao(texto);
}

function porSelecao(texto) {
  const campo = document.createElement('textarea');
  campo.value = texto;
  campo.setAttribute('readonly', '');

  // Fora da tela pela esquerda, e não com opacity: 0 — o Chrome recusa
  // selecionar um campo invisível, e sem seleção o execCommand devolve false.
  campo.style.position = 'fixed';
  campo.style.top = '0';
  campo.style.left = '-9999px';

  document.body.append(campo);
  campo.select();
  // iOS ignora select() sozinho; com o intervalo explícito ele obedece.
  campo.setSelectionRange(0, texto.length);

  let deuCerto = false;
  try {
    deuCerto = document.execCommand('copy');
  } catch {
    deuCerto = false;
  }

  campo.remove();
  return deuCerto;
}

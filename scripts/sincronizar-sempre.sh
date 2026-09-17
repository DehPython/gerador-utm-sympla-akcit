#!/bin/sh
# Roda a sincronização em laço. Serve para deixar solto num servidor, como
# unidade systemd, ou como container ao lado do que serve o site.
#
#   INTERVALO=600 ./scripts/sincronizar-sempre.sh
#
# Uma falha não derruba o laço: src/dados.js fica como está e a próxima volta
# tenta de novo. Só isso já cobre queda de rede e instabilidade do Google.
set -u

INTERVALO="${INTERVALO:-600}"
RAIZ="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"

echo "Sincronizando a planilha a cada ${INTERVALO}s. Ctrl+C para parar."

# Encerra limpo quando o systemd ou o Docker mandarem parar.
encerrar() {
  echo "Encerrando."
  exit 0
}
trap encerrar INT TERM

while true; do
  printf '[%s] ' "$(date '+%Y-%m-%d %H:%M:%S')"
  node "$RAIZ/scripts/sincronizar.js" || echo "Segue com os dados anteriores."
  sleep "$INTERVALO" &
  wait $!
done

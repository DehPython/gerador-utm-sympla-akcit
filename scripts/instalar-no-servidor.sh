#!/bin/sh
# Prepara o servidor para o site subir sozinho depois de qualquer reinício.
#
#   sudo ./scripts/instalar-no-servidor.sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "rode com sudo" >&2
  exit 1
fi

RAIZ="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
UNIDADE=/etc/systemd/system/gerador-utm.service

# O Docker precisa subir no boot, senão a unidade abaixo não tem o que chamar.
systemctl enable docker >/dev/null 2>&1 || true

# Com o túnel configurado, a unidade precisa subir os dois arquivos de compose,
# senão depois do boot o site volta sem o túnel e o link fixo fica fora do ar.
COMPOSE="/usr/bin/docker compose up -d --remove-orphans"
if [ -f "$RAIZ/.env" ] && grep -q '^TS_AUTHKEY=.\+' "$RAIZ/.env"; then
  COMPOSE="/usr/bin/docker compose -f docker-compose.yml -f docker-compose.tailscale.yml up -d --remove-orphans"
  echo "Tailscale encontrado no .env: a unidade sobe o site e o Tailscale juntos."
else
  echo "Sem TS_AUTHKEY no .env: subindo só na rede local."
fi

sed -e "s#^WorkingDirectory=.*#WorkingDirectory=${RAIZ}#" \
    -e "s#^ExecStart=.*#ExecStart=${COMPOSE}#" \
    "$RAIZ/gerador-utm.service" > "$UNIDADE"
systemctl daemon-reload
systemctl enable --now gerador-utm

echo
echo "Instalado. O site sobe sozinho a cada reinício da máquina."
echo
systemctl --no-pager --lines=0 status gerador-utm || true
echo
echo "Para conferir depois de um reboot:  systemctl status gerador-utm"

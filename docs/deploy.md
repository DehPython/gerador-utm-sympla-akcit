# Colocar no ar

O site é estático: HTML, CSS e módulos ES. Não há banco, sessão, login nem
backend. Dois containers sobem juntos:

- **site** — nginx servindo os arquivos, sem root, disco somente leitura
- **sincronizacao** — Node relendo a planilha a cada 10 minutos

Compartilham um volume com um arquivo só, `dados.js`, a lista de pessoas. Quem
escreve é a sincronização; o site só lê.

## Instalar no servidor

```bash
git clone <repo> /opt/gerador-utm
cd /opt/gerador-utm
sudo ./scripts/instalar-no-servidor.sh
```

O instalador garante que o Docker sobe no boot e registra uma unidade systemd
que levanta os containers. Depois de queda de luz, a máquina liga, o Docker
sobe, a unidade roda e o site volta sem ninguém logar.

Conferir depois de um reinício:

```bash
systemctl status gerador-utm
curl localhost:8080/saude
```

`PORTA=9000` troca a porta. `INTERVALO=300` deixa a sincronização a cada 5 min.

### Por que duas garantias

Os containers têm `restart: always`, então o Docker os levanta assim que o
daemon inicia. A unidade systemd é o cinto e suspensório: se alguém der
`docker compose down` e esquecer, o próximo boot recoloca tudo de pé.

## Link fixo acessível de fora

O servidor é interno e não tem IP público. O Tailscale dá um endereço fixo com
HTTPS sem exigir domínio próprio nem abrir porta no roteador:

```
https://lk-xoxf7ib5.SUA-TAILNET.ts.net
```

O passo a passo está no README. Em resumo: ligue HTTPS na tailnet, gere uma auth
key reusable, coloque em `TS_AUTHKEY` no `.env` e rode o instalador, que passa a
subir site e Tailscale juntos no boot.

Enquanto o Tailscale está ativo a porta 8080 não é publicada no host. O acesso
fica restrito a quem está na tailnet, a menos que se ligue o Funnel em
`tailscale-serve.json`.

## Acesso

O site sobe **aberto**: quem alcança a porta vê a lista, sem login. É o que você
quer numa ferramenta interna de uso diário.

Publicado pelo túnel, o link fica acessível a qualquer um que tenha a URL, não
só a quem está na rede. Se um dia precisar fechar, o caminho é o Cloudflare
Access no painel Zero Trust: liga uma policy no hostname do túnel e passa a
exigir login, sem mexer em nada aqui no código.

## Contra invasão pelo servidor

O container do site não tem por onde ser usado como ponte:

| Camada | O que faz |
|---|---|
| Só GET e HEAD | Qualquer outro método responde 405. Não há upload, formulário nem escrita |
| Sem root | Todo processo roda como uid 101, inclusive o mestre do nginx |
| Disco somente leitura | O container não escreve em lugar nenhum, fora dois tmpfs |
| `cap_drop: ALL` | Nenhuma capability do kernel |
| `no-new-privileges` | Nenhum processo escala privilégio, nem via binário setuid |
| Sem socket do Docker | O container não enxerga o daemon, então não cria outros containers |
| Redes separadas | A sincronização não enxerga o site nem aceita conexão de fora |
| Teto de memória, CPU e PIDs | Um pico não derruba o resto da máquina |
| Log com rodízio | 3 arquivos de 10 MB: não enche o disco |

O nginx não tem PHP, CGI nem proxy reverso: serve arquivo de disco e nada mais.
Não há caminho de execução de código a partir de uma requisição.

Na página, todo texto entra por `textContent` — não há `innerHTML`, `eval` nem
`document.write` em lugar nenhum do código. A CSP fecha o resto: `default-src
'none'`, script só do próprio domínio, `frame-ancestors 'none'`.

Os nomes vindos da planilha viram `dados.js` por `JSON.stringify`, que escapa
aspas e barras, então um valor esquisito continua sendo texto.

## Quando a lista não atualiza

```bash
docker compose logs sincronizacao --tail 20
```

A sincronização nunca grava pela metade e nunca apaga a lista: se a planilha
falhar, o arquivo anterior segue servindo e a próxima volta tenta de novo. Ela
recusa a gravação quando vêm menos de 10 embaixadores, quando falta UF, ou
quando há nome repetido — casos em que publicar seria pior que ficar parado.

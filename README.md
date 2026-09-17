# Gerador de rastreamento de link Sympla

Cria um link de evento para cada embaixador em um clique. O painel do Sympla
passa a mostrar quantas inscrições vieram de cada pessoa.

Hoje isso é feito à mão: para 37 pessoas são 37 idas ao gerador da Sympla,
preenchendo três campos cada vez. A cada evento novo, tudo de novo.

---

# Colocar no ar

## Linux (servidor), do zero

Este é o caminho completo para a máquina que fica ligada 24/7, partindo de uma
instalação limpa. Ao final o site responde num endereço fixo com HTTPS,
acessível de qualquer lugar, e volta sozinho depois de queda de luz.

### 1. Instalar o Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
```

Confira: `docker --version`

### 2. Baixar o projeto

```bash
sudo git clone <url-do-repositorio> /opt/gerador-utm
sudo chown -R "$USER" /opt/gerador-utm
cd /opt/gerador-utm
```

### 3. Testar antes de expor

```bash
docker compose up -d --build
curl localhost:8080/saude       # deve responder: ok
```

Se responder `ok`, o site já funciona na rede local. Só então siga para o
endereço público.

### 4. Gerar a chave do Tailscale

Em [login.tailscale.com/admin/settings/keys](https://login.tailscale.com/admin/settings/keys)
clique em **Generate auth key**:

- **Reusable**: ligado
- **Ephemeral**: desligado

O Ephemeral é o que mais dá problema: marcado, a máquina some da tailnet quando
o container para, e o endereço morre junto.

A chave aparece uma vez só. Copie antes de fechar.

### 5. Guardar a chave no servidor

```bash
cp .env.example .env
nano .env                # cole em TS_AUTHKEY=
chmod 600 .env
```

### 6. Escolher o nome do endereço

Abra `docker-compose.tailscale.yml` e veja a linha `hostname:`. Ela define o
endereço final:

```
https://SEU-HOSTNAME.SUA-TAILNET.ts.net
```

Duas regras que evitam dor de cabeça:

- **Não use um nome descritivo.** Ao emitir o certificado, o Tailscale publica
  esse nome nos logs de Certificate Transparency, que são públicos e
  permanentes. `gerador-utm` entrega o que roda aqui; um nome sorteado não.
- **Confira se o nome está livre** em
  [login.tailscale.com/admin/machines](https://login.tailscale.com/admin/machines).
  Se já existir uma máquina com ele, o Tailscale acrescenta um sufixo
  (`nome-1`) e o endereço não será o que você esperava. Remova a máquina antiga
  antes, se for o caso.

### 7. Ligar o HTTPS e o Funnel na tailnet (uma vez por conta)

Em [login.tailscale.com/admin/dns](https://login.tailscale.com/admin/dns):
MagicDNS ligado e **Enable HTTPS**.

Em [login.tailscale.com/admin/acls/file](https://login.tailscale.com/admin/acls/file),
acrescente este bloco antes da última chave `}` e clique em **Save**:

```json
	"nodeAttrs": [
		{"target": ["autogroup:member"], "attr": ["funnel"]},
	],
```

Sem ele o Funnel não liga, e o endereço só responde para quem tem Tailscale.

### 8. Subir com o endereço público

```bash
docker compose -f docker-compose.yml -f docker-compose.tailscale.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.tailscale.yml logs tailscale --tail 20
```

Procure por `Hostinfo.IngressEnabled changed to true` e pelo endereço nos logs.
O certificado leva de 30 segundos a 2 minutos para sair; a primeira resposta
pode falhar antes disso.

Teste:

```bash
curl https://SEU-HOSTNAME.SUA-TAILNET.ts.net/saude
```

### 9. Fazer subir sozinho depois de reiniciar

```bash
sudo ./scripts/instalar-no-servidor.sh
```

O instalador lê o `.env`: achou `TS_AUTHKEY`, configura o systemd para subir
site e Tailscale juntos; não achou, sobe só na rede local. Ele diz qual modo
aplicou.

### 10. Conferir que sobrevive a um reinício

```bash
sudo reboot
# espere a máquina voltar, então:
systemctl status gerador-utm
curl https://SEU-HOSTNAME.SUA-TAILNET.ts.net/saude
```

Esse é o teste que importa: se responder depois do reboot, uma queda de luz não
derruba o serviço.

### Se algo falhar

| Sintoma | Onde olhar |
|---|---|
| `curl localhost:8080/saude` não responde | `docker compose logs site --tail 20` |
| Endereço `.ts.net` não abre | `docker compose logs tailscale --tail 30` |
| Abre só para quem tem Tailscale | falta o `nodeAttrs` do passo 7 |
| Endereço ganhou sufixo `-1` | o nome já estava em uso; veja o passo 6 |
| Lista desatualizada | `docker compose logs sincronizacao --tail 20` |

## Windows

```powershell
# 1. Instale o Docker Desktop:
#    https://www.docker.com/products/docker-desktop/
#    Em Settings > General, marque "Start Docker Desktop when you log in"

# 2. No PowerShell:
git clone <url-do-repositorio> C:\gerador-utm
cd C:\gerador-utm
docker compose up -d --build
```

Abra `http://localhost:8080`.

Para voltar sozinho depois de reiniciar, o Docker Desktop precisa iniciar com o
Windows (passo 1). Os containers sobem junto porque estão marcados como
`restart: always`.

## macOS

```bash
# 1. Instale o Docker Desktop:
#    https://www.docker.com/products/docker-desktop/
#    Em Settings > General, marque "Start Docker Desktop when you log in"

# 2. No Terminal:
git clone <url-do-repositorio> ~/gerador-utm
cd ~/gerador-utm
docker compose up -d --build
```

Abra `http://localhost:8080`.

## Sem Docker (só para desenvolver)

Precisa de Node 22 ou mais novo. Serve em `http://localhost:4173`, mas não
sobe sozinho nem sincroniza a planilha em laço.

```bash
npm run serve
```

---

# Usar

1. Cole o link do evento no Sympla no campo de cima
2. Marque quem vai divulgar (tudo já vem marcado)
3. Clique em **GERAR LINKS**
4. Clique em **COPIAR** na linha de cada pessoa

Quem já foi copiado fica com ✓ verde, então dá para parar no meio e voltar
depois sem se perder.

**COPIAR TUDO PARA PLANILHA** leva nome, UF, embaixada e link de todos, em
formato que cola direto no Google Sheets.

O campo só aceita endereço do Sympla. São recusados, com uma mensagem dizendo
o que houve: link de outro site, texto solto, a página do próprio gerador de
UTM, e link que já vem com rastreamento (colar um link já gerado criaria
`utm_source` duas vezes). Se você colar sem o `https://`, ele completa.

## Escolher só algumas pessoas

Os grupos abrem em níveis. Clique na setinha para descer:

```
EMBAIXADORES  →  Brasil  →  SP  →  Venture Hub  →  José Rubens Urbini Junior
              →  Internacional
INTERNO AKCIT →  (as pessoas, direto)
```

Marcar um nível marca tudo que está embaixo. Se parte estiver marcada, o
quadradinho vira um traço.

O campo de filtro busca por nome, UF, cidade e hub ao mesmo tempo, e abre a
árvore sozinho nos resultados.

## Link para quem não está na lista

Uma palestra, um parceiro, uma newsletter: abra **Criar um link para qualquer
origem**. Cada campo tem um **?** que explica o que colocar.

| Campo | Exemplo numa palestra |
|---|---|
| Origem | `palestra_unicamp` |
| Canal | `evento_presencial` |
| Campanha | `palestras_2026` |
| Detalhe (opcional) | `qr_code_slide` |
| Termo (opcional) | — |

---

# Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `docker compose up -d` | Sobe |
| `docker compose down` | Para |
| `docker compose logs -f` | Acompanha o que está acontecendo |
| `docker compose up -d --build` | Aplica uma mudança no código |
| `npm test` | Roda os 101 testes |
| `npm run sincronizar` | Puxa a planilha agora, sem esperar os 10 minutos |

Trocar a porta: `PORTA=9000 docker compose up -d`

---

# Sobre o endereço público

O passo a passo está em [Linux (servidor), do zero](#linux-servidor-do-zero),
passos 4 a 8. Aqui ficam as consequências, que valem reler antes de divulgar o
link.

## Quem consegue abrir

Qualquer pessoa com o endereço, sem precisar de Tailscale. O
`tailscale-serve.json` vem com `AllowFunnel: true`, que liga o Tailscale Funnel
e faz o endereço responder na internet aberta.

Enquanto o Tailscale está ativo, a porta 8080 deixa de ser publicada no host.
Nem pela rede local o site responde direto: só pelo endereço `.ts.net`, com
HTTPS.

## O que fica público

A lista com os nomes, cidades e organizações das 37 pessoas, para quem tiver o
endereço. E o endereço não depende só de você guardar o link: ao emitir o
certificado, o nome da máquina vai para os logs de Certificate Transparency,
que são públicos e permanentes. É por isso que o `hostname` do compose é um
nome sorteado, e não `gerador-utm`.

Para restringir de novo a quem está na tailnet, troque em
`tailscale-serve.json` e reinicie:

```json
"AllowFunnel": { "${TS_CERT_DOMAIN}:443": false }
```

## Certificado

Let's Encrypt, emitido e renovado pelo Tailscale sem intervenção. Some junto se
o container parar; volta sozinho quando ele sobe.

# Detalhes

## A lista vem da planilha

Um container relê a planilha de embaixadores a cada 10 minutos e regrava a
lista. Editar a planilha basta; ninguém precisa mexer aqui.

Quem está `Desligado` ou `Pendente` some da tela sozinho.

A sincronização se recusa a gravar quando a planilha traz menos de 10
embaixadores, quando falta UF, ou quando há dois nomes iguais. Nesses casos
publicar seria pior que ficar parado. Nesses casos a lista anterior continua
servindo e a próxima tentativa acontece 10 minutos depois.

E-mail, celular e LinkedIn não são copiados da planilha. Um teste falha se
algum deles vazar para o código.

Ver o que está acontecendo: `docker compose logs sincronizacao --tail 20`

O time interno não vem da planilha: está em `src/dados.js`, no bloco
`INTERNOS`, que a sincronização preserva. Alguém de outra área é só trocar
`"area": "ACS"` pelo nome dela.

## Como o link é montado

Os cinco campos UTM da Sympla, preenchidos assim:

| Campo | Embaixador | Interno |
|---|---|---|
| `utm_source` | `uaita_pires` | `andre_dantas` |
| `utm_medium` | `go` (a UF) | `acs` (a área) |
| `utm_campaign` | `embaixadores` | `interno` |
| `utm_content` | `hub_cerrado` | — |
| `utm_term` | `goiania` | — |

`utm_medium` leva a divisão a que a pessoa pertence porque o Dashboard →
Campanhas da Sympla mostra só `source`, `medium` e `campaign`. `content` e
`term` aparecem apenas na exportação de participantes.

A campanha vem do grupo, não de um campo separado. Assim não dá para montar um
estado sem sentido, como campanha `embaixadores` com gente do time interno.

### Acentos

O gerador oficial da Sympla mantém acento e cedilha, só percent-encodados:
`UAITÃ PIRES` vira `uait%C3%A3_pires`, ilegível no relatório. Aqui os nomes são
tratados antes: minúsculas, sem acento, sem cedilha, espaço vira `_`.

O resultado bate com o da Sympla em 8 casos de teste medidos na ferramenta
oficial, incluindo `SENAI/CE`, `a&b +c` e URL que já tem query string.

Mudar a grafia de um nome muda o link. Se isso acontecer depois de distribuir,
o relatório passa a mostrar duas pessoas. Corrija a planilha antes de gerar.

## Copiar em rede sem HTTPS

A API moderna de área de transferência só existe em HTTPS ou localhost.
Acessado por `http://192.168.x.x`, o navegador não a oferece. O app detecta
isso e usa o método antigo, testado em HTTP real.

## Segurança

O site sobe aberto: quem alcança a porta vê a lista. É o esperado numa
ferramenta interna.

O container não serve de ponte para o servidor:

- só responde GET e HEAD; qualquer outro método devolve 405
- nenhum processo roda como root
- o disco do container é somente leitura
- sem capabilities do kernel e sem acesso ao socket do Docker
- teto de memória, CPU e processos, para um pico não derrubar a máquina
- a sincronização fica em rede separada: não enxerga o site nem recebe conexão

Na página, todo texto entra por `textContent` — não há `innerHTML`, `eval` nem
`document.write` em lugar nenhum. A CSP recusa script que não venha do próprio
domínio.

Publicado pelo túnel, o link fica acessível a quem tiver a URL, não só a quem
está na rede. Para exigir login, use Cloudflare Access, sem mexer no código.

## Testes

```bash
npm test
```

São 101, sem dependência externa: Node puro. Cobrem a normalização contra a
ferramenta oficial da Sympla, a leitura da planilha, a árvore de seleção, a
ordem alfabética e a cópia nos dois modos. Alguns carregam a página inteira num
DOM simulado e clicam nos botões.

## Estrutura

```
index.html        a página
styles.css        o visual
src/              a lógica, um arquivo por assunto
  utm.js            monta a URL no padrão da Sympla
  planilha.js       lê o CSV da planilha
  arvore.js         monta os níveis de seleção
  copiar.js         área de transferência, com e sem HTTPS
  dados.js          a lista de pessoas (gerada, não edite à mão)
scripts/          sincronização, servidor local, instalação
test/             os testes
docs/deploy.md    detalhes de servidor
```

# Serve o site estático. Não há build: o app é HTML, CSS e módulos ES.
# A variante unprivileged roda tudo como uid 101, inclusive o processo mestre:
# nada aqui precisa de root, já que a porta é alta e não se escreve em disco.
FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css /site/
COPY src/ /site/src/

# Cópia inicial da lista. Em produção um volume monta /dados, e quem escreve
# ali é o container de sincronização.
RUN mkdir -p /dados && cp /site/src/dados.js /dados/dados.js \
    && chown -R nginx:nginx /dados /site

USER nginx

# nginx:alpine já roda os workers como nginx; porta alta para não exigir root.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1:8080/saude || exit 1

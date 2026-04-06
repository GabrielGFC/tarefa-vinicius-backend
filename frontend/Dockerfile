FROM nginx:1.27-alpine AS runtime

COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=10 CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

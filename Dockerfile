FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY game.js /usr/share/nginx/html/game.js

RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

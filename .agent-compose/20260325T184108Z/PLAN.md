# Plan: Fix Dockerfile to expose app on port 8080

## Problem

The current Dockerfile uses `nginx:alpine` and exposes port 80 (the nginx default). The deployment system expects the application to be available on port 8080.

### Current Dockerfile

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY game.js /usr/share/nginx/html/game.js
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Solution

Replace the nginx default listen port (80) with 8080 using `sed` in the Dockerfile, and update `EXPOSE` from 80 to 8080. This is the minimal change — no custom nginx.conf file needed.

The `sed` command targets `/etc/nginx/conf.d/default.conf` which is the file where nginx:alpine defines its `listen 80;` directive.

### Target Dockerfile

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY game.js /usr/share/nginx/html/game.js
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## Scope

- **Files changed**: `Dockerfile` (1 file)
- **Risk**: Very low — only changes the listen port
- **No new dependencies**

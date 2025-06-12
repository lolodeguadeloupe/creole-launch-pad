# Étape 1 : Build de l'application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm run build

# Étape 2 : Serveur statique avec Nginx
FROM nginx:alpine

# Copie des fichiers construits dans le dossier de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie d'une configuration Nginx personnalisée pour le SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
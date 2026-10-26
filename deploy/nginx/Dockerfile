# Compila el frontend (React + Vite) y lo sirve con Nginx.
FROM node:22-alpine AS compilacion
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# El frontend llama a la API en el mismo dominio (Nginx enruta /api al backend).
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=${VITE_API_URL} VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

FROM nginx:stable-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/nginx/rsu-fips.conf /etc/nginx/conf.d/rsu-fips.conf
COPY deploy/nginx/red-institucional.conf /etc/nginx/red-institucional.conf
COPY deploy/nginx/proxy-cabeceras.inc /etc/nginx/conf.d/proxy-cabeceras.inc
COPY --from=compilacion /app/dist /usr/share/nginx/html

# syntax=docker/dockerfile:1
# Build context: the repository root (see docker-compose.yml).

FROM node:24-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Vite bakes the API address into the bundle at build time.
ARG VITE_API_BASE_URL=http://localhost:5080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Static files only: nginx (running as a non-root user) serves the built SPA.
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

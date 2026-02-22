# Этап 1: сборка (если нужны deps, иначе упростите)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Если билд нужен локально, но в AI Studio он в GCS — можно убрать

# Этап 2: nginx
FROM nginx:alpine
# Не копируем dist! Mount сделает это
# COPY --from=builder /app/dist /app/dist  ← удалите!

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
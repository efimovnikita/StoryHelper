# Этап 1: сборка React/Vite приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем только зависимости сначала — для кэширования слоёв
COPY package*.json ./
RUN npm ci

# Копируем весь код и билдим.
COPY . .
RUN npm run build

# Этап 2: отдача статических файлов через nginx
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомный конфиг nginx (обязательно!)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run требует, чтобы слушали порт из переменной $PORT (по умолчанию 8080).
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
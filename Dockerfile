FROM nginx:alpine

RUN mkdir -p /app/dist && chmod 777 /app/dist  # чтобы mount не ругался на права

COPY nginx.conf /etc/nginx/nginx.conf   # ← перезаписываем основной конфиг!

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
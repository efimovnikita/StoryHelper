FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Убедимся, что директория существует (GCS mount overlay'нет, но на всякий)
RUN mkdir -p /app/dist && chmod 755 /app/dist

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
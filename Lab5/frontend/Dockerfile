# Збірка
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Створюємо оптимізовану production-версію React
RUN npm run build 

# Роздача файлів (Nginx)
FROM nginx:alpine
# Копіюємо зібраний проєкт з першого етапу в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Відкриваємо стандартний веб-порт
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
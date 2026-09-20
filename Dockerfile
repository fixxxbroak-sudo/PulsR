FROM node:20-alpine
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json ./
COPY client/package.json ./client/

# Устанавливаем зависимости
RUN npm install

# Копируем весь остальной код
COPY . .

# Собираем клиент
RUN npm run build

# Открываем порт и запускаем через tsx
EXPOSE 3000
CMD ["npx", "tsx", "index.ts"]
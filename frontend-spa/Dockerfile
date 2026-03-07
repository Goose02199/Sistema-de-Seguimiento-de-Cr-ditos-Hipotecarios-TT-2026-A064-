FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# --host es indispensable para que Nginx y Cloudflare vean el servicio [cite: 2026-03-05]
CMD ["npm", "run", "dev", "--", "--host"]
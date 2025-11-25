# Dockerfile para Frontend (React/Vue/Angular)
# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production=false

# Copiar el resto de los archivos
COPY . .

# Construir la aplicación
# Para React: npm run build
# Para Vue: npm run build
# Para Angular: npm run build --prod
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copiar archivos construidos desde el stage de build
COPY --from=builder /app/dist /usr/share/nginx/html
# O para React (si usa 'build' en lugar de 'dist'):
# COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]


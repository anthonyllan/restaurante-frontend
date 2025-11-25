# Dockerfile para Frontend (React/Vite)
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

# Variables de entorno para los microservicios (usando rutas relativas)
ENV VITE_API_PRODUCTO_URL=/producto-api
ENV VITE_API_PEDIDO_URL=/pedido-api
ENV VITE_API_USUARIO_URL=/usuario-api
ENV VITE_API_BASE_URL=/pedido-api

# Construir la aplicación
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copiar archivos construidos desde el stage de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puertos 80 (HTTP) y 443 (HTTPS)
EXPOSE 80 443

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

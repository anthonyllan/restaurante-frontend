# Configuración Simplificada - Rutas Relativas

## ✅ Cambios Realizados

Se simplificó la configuración para usar **rutas relativas** en lugar de URLs absolutas, siguiendo el patrón de tu otro proyecto.

### 1. Dockerfile
- Variables de entorno establecidas en tiempo de build:
  - `VITE_API_PRODUCTO_URL=/producto-api`
  - `VITE_API_PEDIDO_URL=/pedido-api`
  - `VITE_API_USUARIO_URL=/usuario-api`

### 2. nginx.conf
- Proxies configurados con rutas relativas:
  - `/producto-api/` → `http://164.90.246.132/`
  - `/pedido-api/` → `http://24.199.77.75/`
  - `/usuario-api/` → `http://143.244.210.238/`

### 3. src/config/api.js
- Simplificado para usar variables de entorno directamente
- En desarrollo: usa `localhost:puerto`
- En producción: usa rutas relativas como `/producto-api`, `/pedido-api`, `/usuario-api`

## 🚀 Cómo Funciona

1. **En desarrollo local:**
   - Variables de entorno no definidas → usa `http://localhost:2001`, etc.
   - Funciona normalmente

2. **En producción:**
   - Variables de entorno definidas en Dockerfile → usa `/producto-api`, etc.
   - Nginx intercepta estas rutas y hace proxy a los microservicios HTTP
   - El navegador ve todo como HTTPS (sin Mixed Content)

## 📝 Ejemplo de Flujo

**Frontend hace petición:**
```
GET /producto-api/api/productos
```

**Nginx intercepta:**
```
location /producto-api/ → proxy_pass http://164.90.246.132/
```

**Resultado:**
```
http://164.90.246.132/api/productos
```

**El navegador ve:**
```
https://gastrosanter-app-hq8ag.ondigitalocean.app/producto-api/api/productos
```

✅ Sin errores de Mixed Content porque todo pasa por HTTPS.

## 🔧 Para Desplegar

```bash
# 1. Recompilar
npm run build

# 2. Commit y push
git add .
git commit -m "Simplificar configuración con rutas relativas"
git push origin main
```

¡Listo! No necesitas modificar ningún servicio individual.


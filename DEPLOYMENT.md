# Guía de Despliegue - Digital Ocean

## Configuración de Mixed Content (HTTPS)

El problema de Mixed Content ocurre cuando una página HTTPS intenta cargar recursos HTTP. Para resolverlo, hemos configurado nginx como proxy reverso.

## ⚠️ IMPORTANTE: Selección de nginx.conf

**Si estás usando Digital Ocean Apps Platform:**
- Usa `nginx.conf.apps` (renómbralo a `nginx.conf`)
- Apps Platform maneja SSL automáticamente en el load balancer

**Si estás usando Droplets o Kubernetes:**
- Usa `nginx.conf` (el archivo actual)
- Necesitarás configurar SSL manualmente con Let's Encrypt

### Configuración Actual

- **Frontend**: `https://gastrosanter-app-hq8ag.ondigitalocean.app/`
- **Microservicios** (HTTP):
  - Producto: `http://164.90.246.132`
  - Pedido: `http://24.199.77.75`
  - Usuario: `http://143.244.210.238`

### Solución Implementada

Nginx actúa como proxy reverso, exponiendo todos los microservicios a través de HTTPS en el mismo dominio del frontend:

- `/api/productos` → `http://164.90.246.132`
- `/api/pedidos` → `http://24.199.77.75`
- `/api/auth`, `/api/empleados`, `/api/clientes` → `http://143.244.210.238`

### Configuración de SSL en Digital Ocean

1. **Opción 1: Certificados SSL de Digital Ocean (Recomendado)**
   - Ve a tu App en Digital Ocean
   - En la sección "Settings" → "Domains"
   - Digital Ocean generará automáticamente certificados SSL con Let's Encrypt

2. **Opción 2: Certificados SSL Manuales**
   - Si prefieres usar tus propios certificados, actualiza `nginx.conf`:
   ```nginx
   ssl_certificate /etc/nginx/ssl/cert.pem;
   ssl_certificate_key /etc/nginx/ssl/key.pem;
   ```

### Verificación

Después del despliegue, verifica que:

1. ✅ El frontend carga correctamente en HTTPS
2. ✅ Las peticiones a `/api/*` funcionan sin errores de Mixed Content
3. ✅ Los certificados SSL están activos (candado verde en el navegador)

### Troubleshooting

**Error: "Mixed Content"**
- Verifica que nginx.conf esté correctamente configurado
- Asegúrate de que los certificados SSL estén activos
- Revisa los logs de nginx: `docker logs <container-id>`

**Error: "502 Bad Gateway"**
- Verifica que las IPs de los microservicios sean correctas
- Asegúrate de que los microservicios estén accesibles desde el contenedor de nginx
- Revisa la conectividad de red en Digital Ocean

**Error: "Connection refused"**
- Verifica que los microservicios estén corriendo
- Revisa los firewalls y grupos de seguridad en Digital Ocean
- Asegúrate de que los puertos estén abiertos

### Variables de Entorno (Opcional)

Si necesitas cambiar las URLs de los microservicios, puedes usar variables de entorno:

```bash
VITE_API_PRODUCTO_URL=https://gastrosanter-app-hq8ag.ondigitalocean.app
VITE_API_PEDIDO_URL=https://gastrosanter-app-hq8ag.ondigitalocean.app
VITE_API_USUARIO_URL=https://gastrosanter-app-hq8ag.ondigitalocean.app
```

Sin embargo, con la configuración actual de nginx, no es necesario ya que todas las peticiones pasan por el mismo dominio.


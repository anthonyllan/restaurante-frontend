# ⚠️ IMPORTANTE: Pasos para Resolver Mixed Content

## Problema
El error muestra que el código compilado todavía está intentando usar URLs con puertos (`:2001`), lo cual causa errores de Mixed Content.

## Solución

### 1. Usar la configuración correcta de nginx para Apps Platform

**IMPORTANTE**: Si estás usando Digital Ocean Apps Platform, debes usar `nginx.conf.apps`:

```bash
# En tu repositorio local, antes de hacer commit:
cd Frontend/restaurante-frontend
cp nginx.conf.apps nginx.conf
```

O renombra el archivo en Digital Ocean después del despliegue.

### 2. Recompilar y Redesplegar

Después de los cambios en `src/config/api.js`, necesitas:

1. **Limpiar el build anterior:**
   ```bash
   rm -rf dist
   rm -rf build
   ```

2. **Recompilar:**
   ```bash
   npm run build
   ```

3. **Verificar que el build no contenga URLs con puertos:**
   ```bash
   # Buscar en los archivos compilados
   grep -r ":2001" dist/ || echo "✅ No se encontraron URLs con puertos"
   ```

4. **Hacer commit y push:**
   ```bash
   git add .
   git commit -m "Fix: Actualizar URLs para usar HTTPS sin puertos"
   git push origin main
   ```

### 3. Limpiar Caché del Navegador

Después del despliegue:

1. Abre las herramientas de desarrollador (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Vaciar caché y volver a cargar de forma forzada"

O usa modo incógnito para verificar.

### 4. Verificar la Configuración

Después del despliegue, verifica en la consola del navegador que las URLs sean:

✅ **Correctas:**
- `https://gastrosanter-app-hq8ag.ondigitalocean.app/api/categorias`
- `https://gastrosanter-app-hq8ag.ondigitalocean.app/api/productos`

❌ **Incorrectas (causan el error):**
- `http://gastrosanter-app-hq8ag.ondigitalocean.app:2001/api/categorias`
- `http://gastrosanter-app-hq8ag.ondigitalocean.app:2001/api/productos`

### 5. Verificar nginx.conf

Asegúrate de que `nginx.conf` (o `nginx.conf.apps`) esté correctamente configurado con los proxies a los microservicios.

### Troubleshooting

Si después de estos pasos todavía ves el error:

1. **Verifica que el build se haya actualizado:**
   - Revisa la fecha de los archivos en `dist/` o `build/`
   - Verifica que los archivos JS no contengan las URLs viejas

2. **Verifica la configuración de nginx:**
   - Los logs de nginx deberían mostrar las peticiones entrantes
   - Verifica que los proxies estén funcionando

3. **Verifica variables de entorno:**
   - Si tienes `VITE_API_*` configuradas, asegúrate de que apunten a HTTPS

4. **Forzar recarga completa:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)


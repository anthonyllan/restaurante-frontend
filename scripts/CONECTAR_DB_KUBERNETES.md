# Conectar a Base de Datos MySQL en Kubernetes (Digital Ocean)

## Paso 1: Configurar kubectl

Si aún no tienes `kubectl` configurado:

1. En Digital Ocean, ve a tu cluster `restaurante-cluster`
2. Haz clic en **"Download Config File"** o **"kubectl"**
3. Descarga el archivo de configuración
4. En Windows, ejecuta:

```cmd
# Opción A: Si descargaste el archivo de configuración
# Copia el contenido y ejecuta:
$env:KUBECONFIG="C:\ruta\a\tu\archivo\kubeconfig.yaml"

# Opción B: O agrega el archivo a tu configuración existente
copy %USERPROFILE%\.kube\config %USERPROFILE%\.kube\config.backup
# Luego copia el contenido del archivo descargado
```

## Paso 2: Verificar que puedes conectarte al cluster

```cmd
kubectl get pods -n default
```

Deberías ver tus pods corriendo, incluyendo los de MySQL.

## Paso 3: Encontrar el pod de MySQL de dbProducto

```cmd
kubectl get pods | findstr mysql
```

O para ver todos los pods:

```cmd
kubectl get pods
```

Busca el pod que contiene `mysql-dbproducto` o similar. Ejemplo:
- `mysql-dbproducto-xxxxx-xxxxx`
- `dbproducto-mysql-xxxxx`

## Paso 4: Conectarte al pod de MySQL

### Opción A: Ejecutar SQL directamente en el pod (Más fácil)

```cmd
# Reemplaza POD_NAME con el nombre real del pod
kubectl exec -it POD_NAME -- mysql -u root -p dbProducto
```

Te pedirá la contraseña. Si no la recuerdas, puedes verla en los secrets:

```cmd
kubectl get secrets
kubectl get secret NOMBRE_DEL_SECRET -o jsonpath="{.data.password}" | base64 -d
```

### Opción B: Ejecutar el script SQL directamente

Crea un archivo `insertar_dias.sql` con este contenido:

```sql
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', 1),
('Martes', 1),
('Miércoles', 1),
('Jueves', 1),
('Viernes', 1),
('Sábado', 1),
('Domingo', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
```

Luego ejecuta:

```cmd
kubectl exec -i POD_NAME -- mysql -u root -p dbProducto < insertar_dias.sql
```

### Opción C: Usar port-forward y cliente MySQL local

```cmd
# En una terminal, hacer port-forward
kubectl port-forward POD_NAME 3306:3306

# En otra terminal, conectarte con MySQL client
mysql -h 127.0.0.1 -P 3306 -u root -p dbProducto
```

## Paso 5: Ejecutar el script SQL

Una vez conectado, ejecuta:

```sql
-- Verificar el nombre de la tabla
SHOW TABLES LIKE '%dia%';

-- Ver la estructura
DESCRIBE dia;

-- Insertar los días
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', 1),
('Martes', 1),
('Miércoles', 1),
('Jueves', 1),
('Viernes', 1),
('Sábado', 1),
('Domingo', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Verificar
SELECT * FROM dia ORDER BY 
  CASE nombre
    WHEN 'Lunes' THEN 1
    WHEN 'Martes' THEN 2
    WHEN 'Miércoles' THEN 3
    WHEN 'Jueves' THEN 4
    WHEN 'Viernes' THEN 5
    WHEN 'Sábado' THEN 6
    WHEN 'Domingo' THEN 7
  END;
```

## Comandos útiles

```cmd
# Ver todos los pods
kubectl get pods

# Ver pods en un namespace específico
kubectl get pods -n NAMESPACE

# Ver logs del pod MySQL
kubectl logs POD_NAME

# Ver descripción del pod (incluye variables de entorno)
kubectl describe pod POD_NAME

# Entrar al pod (bash)
kubectl exec -it POD_NAME -- /bin/bash

# Ver servicios
kubectl get services
```

## Solución de problemas

### Error: "pod not found"
- Verifica el nombre exacto del pod: `kubectl get pods`
- Puede estar en otro namespace: `kubectl get pods --all-namespaces`

### Error: "connection refused"
- El pod puede no estar corriendo: `kubectl get pods`
- Verifica los logs: `kubectl logs POD_NAME`

### No recuerdo la contraseña
```cmd
# Ver todos los secrets
kubectl get secrets

# Ver el contenido de un secret (reemplaza SECRET_NAME)
kubectl get secret SECRET_NAME -o yaml

# O si está en variables de entorno del pod
kubectl describe pod POD_NAME | findstr MYSQL
```


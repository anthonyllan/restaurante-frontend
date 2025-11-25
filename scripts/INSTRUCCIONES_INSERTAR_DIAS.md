# Instrucciones para Insertar Días Laborables en Digital Ocean

## Opción 1: Usando Digital Ocean Console (Recomendado)

### Paso 1: Acceder a la Base de Datos
1. Ve a tu panel de Digital Ocean
2. Navega a **Databases** → Selecciona tu cluster `restaurante-cluster`
3. Encuentra la base de datos `dbProducto`
4. Haz clic en **"Access"** o **"Console"**

### Paso 2: Ejecutar el Script SQL
1. Abre la consola SQL de la base de datos
2. Copia y pega el siguiente script:

```sql
-- Verificar primero el nombre de la tabla
SHOW TABLES LIKE '%dia%';

-- Si la tabla se llama 'dia' (singular):
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', true),
('Martes', true),
('Miércoles', true),
('Jueves', true),
('Viernes', true),
('Sábado', true),
('Domingo', true)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Si la tabla se llama 'dias' (plural), usar:
-- INSERT INTO dias (nombre, habilitado) VALUES ...
```

3. Ejecuta el script
4. Verifica con: `SELECT * FROM dia ORDER BY id;`

---

## Opción 2: Usando MySQL Client desde tu computadora

### Paso 1: Obtener la información de conexión
1. En Digital Ocean, ve a tu base de datos `dbProducto`
2. Haz clic en **"Connection Details"**
3. Anota:
   - **Host** (ej: `db-mysql-nyc3-12345.db.ondigitalocean.com`)
   - **Port** (ej: `25060`)
   - **Database** (ej: `dbProducto`)
   - **Username** (ej: `doadmin`)
   - **Password** (tu contraseña)

### Paso 2: Conectarte desde la terminal

**En Windows (CMD o PowerShell):**
```cmd
mysql -h [HOST] -P [PORT] -u [USERNAME] -p [DATABASE]
```

**Ejemplo:**
```cmd
mysql -h db-mysql-nyc3-12345.db.ondigitalocean.com -P 25060 -u doadmin -p dbProducto
```

**En Linux/Mac:**
```bash
mysql -h [HOST] -P [PORT] -u [USERNAME] -p [DATABASE]
```

### Paso 3: Ejecutar el script
Una vez conectado, ejecuta:

```sql
-- Verificar el nombre de la tabla
SHOW TABLES LIKE '%dia%';

-- Insertar los días
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', true),
('Martes', true),
('Miércoles', true),
('Jueves', true),
('Viernes', true),
('Sábado', true),
('Domingo', true)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Verificar
SELECT * FROM dia ORDER BY id;
```

---

## Opción 3: Usando un cliente gráfico (MySQL Workbench, DBeaver, etc.)

1. **Configurar la conexión:**
   - Host: [Tu host de Digital Ocean]
   - Port: [Tu puerto, generalmente 25060]
   - Database: `dbProducto`
   - Username: [Tu usuario]
   - Password: [Tu contraseña]
   - **Importante:** Usa SSL/TLS si está disponible

2. **Conectarte a la base de datos**

3. **Ejecutar el script SQL:**
   - Abre el archivo `insertar_dias_laborables.sql`
   - O copia y pega el script directamente
   - Ejecuta el script

4. **Verificar:**
   ```sql
   SELECT * FROM dia ORDER BY id;
   ```

---

## Solución de Problemas

### Error: "Table doesn't exist"
- Verifica el nombre exacto de la tabla:
  ```sql
  SHOW TABLES;
  ```
- Puede ser `dia`, `dias`, `Dia`, `Dias`, `dia_semana`, etc.

### Error: "Duplicate entry"
- Los días ya existen. Esto es normal.
- Usa `INSERT IGNORE` o `ON DUPLICATE KEY UPDATE` como en el script

### Error: "Column 'habilitado' doesn't exist"
- Verifica la estructura de la tabla:
  ```sql
  DESCRIBE dia;
  ```
- El campo puede llamarse `habilitado`, `enabled`, `activo`, `status`, etc.

### Error de conexión
- Verifica que tu IP esté en la lista de "Trusted Sources" en Digital Ocean
- Verifica que estés usando el puerto correcto (generalmente 25060 para conexiones externas)
- Asegúrate de usar SSL si es requerido

---

## Verificar que funcionó

Después de insertar, verifica con:

```sql
SELECT id, nombre, habilitado FROM dia ORDER BY 
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

Deberías ver 7 filas con los días de la semana.


@echo off
REM Script rápido para insertar días laborables en MySQL en Kubernetes
REM Asegúrate de tener kubectl configurado y conectado al cluster

echo ============================================
echo Insertar Días Laborables en dbProducto
echo ============================================
echo.

echo Paso 1: Buscando pods de MySQL...
kubectl get pods | findstr mysql
echo.

echo Por favor, ingresa el nombre EXACTO del pod de MySQL de dbProducto:
set /p POD_NAME="Nombre del pod: "

echo.
echo Paso 2: Verificando que el pod existe...
kubectl get pod %POD_NAME%
if errorlevel 1 (
    echo ERROR: El pod no existe. Verifica el nombre.
    pause
    exit /b 1
)

echo.
echo Paso 3: Verificando tablas en la base de datos...
kubectl exec -it %POD_NAME% -- mysql -u root -p -e "USE dbProducto; SHOW TABLES LIKE '%%dia%%';"

echo.
echo Paso 4: Insertando días laborables...
echo.
echo Ejecutando script SQL...

kubectl exec -i %POD_NAME% -- mysql -u root -p dbProducto <<EOF
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', 1),
('Martes', 1),
('Miércoles', 1),
('Jueves', 1),
('Viernes', 1),
('Sábado', 1),
('Domingo', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

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
EOF

echo.
echo ============================================
echo Script completado!
echo ============================================
pause


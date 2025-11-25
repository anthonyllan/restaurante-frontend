-- Script para insertar días laborables en la base de datos dbProducto
-- Ejecutar este script en la base de datos del microservicio de Productos

-- Verificar si la tabla existe y su estructura
-- La tabla probablemente se llama 'dia' o 'dias'

-- Opción 1: Si la tabla se llama 'dia' (singular)
-- Insertar los 7 días de la semana
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', true),
('Martes', true),
('Miércoles', true),
('Jueves', true),
('Viernes', true),
('Sábado', true),
('Domingo', true)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Opción 2: Si la tabla se llama 'dias' (plural)
-- Descomentar y usar esta versión si la tabla se llama 'dias'
/*
INSERT INTO dias (nombre, habilitado) VALUES
('Lunes', true),
('Martes', true),
('Miércoles', true),
('Jueves', true),
('Viernes', true),
('Sábado', true),
('Domingo', true)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
*/

-- Opción 3: Si no existe ON DUPLICATE KEY UPDATE (MySQL antiguo)
-- Primero verificar si ya existen registros
-- Si no existen, usar esta versión:
/*
INSERT IGNORE INTO dia (nombre, habilitado) VALUES
('Lunes', true),
('Martes', true),
('Miércoles', true),
('Jueves', true),
('Viernes', true),
('Sábado', true),
('Domingo', true);
*/

-- Verificar que se insertaron correctamente
SELECT * FROM dia ORDER BY id;


-- ============================================
-- SCRIPT SIMPLE PARA INSERTAR DÍAS LABORABLES
-- Copia y pega esto directamente en la consola SQL de Digital Ocean
-- ============================================

-- Paso 1: Verificar el nombre de la tabla
SHOW TABLES LIKE '%dia%';

-- Paso 2: Ver la estructura de la tabla (ejecuta esto primero para verificar los campos)
-- DESCRIBE dia;  -- o DESCRIBE dias; según el nombre que encuentres

-- Paso 3: Insertar los días (elige la opción según el nombre de tu tabla)

-- OPCIÓN A: Si la tabla se llama 'dia' (singular)
INSERT INTO dia (nombre, habilitado) VALUES
('Lunes', 1),
('Martes', 1),
('Miércoles', 1),
('Jueves', 1),
('Viernes', 1),
('Sábado', 1),
('Domingo', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- OPCIÓN B: Si la tabla se llama 'dias' (plural) - descomenta esta:
-- INSERT INTO dias (nombre, habilitado) VALUES
-- ('Lunes', 1),
-- ('Martes', 1),
-- ('Miércoles', 1),
-- ('Jueves', 1),
-- ('Viernes', 1),
-- ('Sábado', 1),
-- ('Domingo', 1)
-- ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Paso 4: Verificar que se insertaron correctamente
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


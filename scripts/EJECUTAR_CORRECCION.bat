@echo off
REM Script para corregir los nombres de los días con acentos
REM Este script ejecuta el archivo SQL directamente en el pod de MySQL

echo ============================================
echo Corrigiendo nombres de días con acentos
echo ============================================
echo.

echo Ejecutando corrección...
kubectl exec -i mysql-dbproducto-856fcf56bf-klg6m -- mysql -u root -p dbProducto < corregir_dias.sql

echo.
echo ============================================
echo Corrección completada!
echo ============================================
pause


# Script para instalar PostgreSQL en Windows
Write-Host "Instalando PostgreSQL..." -ForegroundColor Green

# URL de descarga de PostgreSQL 15 (versión estable)
$postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

Write-Host "Descargando PostgreSQL..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $postgresUrl -OutFile $installerPath
    Write-Host "Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "Error al descargar PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Instalando PostgreSQL..." -ForegroundColor Yellow
Write-Host "IMPORTANTE: Durante la instalación:" -ForegroundColor Cyan
Write-Host "1. Usa la contraseña: postgres123" -ForegroundColor Cyan
Write-Host "2. Mantén el puerto por defecto: 5432" -ForegroundColor Cyan
Write-Host "3. Instala pgAdmin si quieres una interfaz gráfica" -ForegroundColor Cyan

# Iniciar la instalación
Start-Process -FilePath $installerPath -Wait

Write-Host "PostgreSQL instalado. Configurando variables de entorno..." -ForegroundColor Green

# Agregar PostgreSQL al PATH
$postgresPath = "C:\Program Files\PostgreSQL\15\bin"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$postgresPath*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$postgresPath", "User")
    Write-Host "PostgreSQL agregado al PATH" -ForegroundColor Green
}

Write-Host "Instalación completada!" -ForegroundColor Green
Write-Host "Reinicia tu terminal para que los cambios surtan efecto" -ForegroundColor Yellow 
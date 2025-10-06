# 🧪 Guía de Pruebas - Backend ProCura

## 📁 Archivos de Pruebas Creados

### 1. `requests.http`
- **Propósito:** Pruebas manuales con VSCode REST Client o Postman
- **Contenido:** Todos los endpoints con ejemplos de requests
- **Uso:** Abrir en VSCode con extensión REST Client instalada

### 2. `test-endpoints.js`
- **Propósito:** Pruebas automatizadas con Node.js
- **Contenido:** Script que valida todos los endpoints automáticamente
- **Uso:** `node test-endpoints.js`

### 3. `frontend-guide.md`
- **Propósito:** Documentación completa para el equipo de frontend
- **Contenido:** Guía de integración, ejemplos de código, troubleshooting

## 🚀 Cómo Ejecutar las Pruebas

### Opción 1: Pruebas Automatizadas (Recomendado)
```bash
node test-endpoints.js
```

**Resultado esperado:**
```
📈 Resultado: 11/11 pruebas pasaron
🎉 ¡Todas las pruebas pasaron! El backend está listo.
```

### Opción 2: Pruebas Manuales con VSCode
1. Instala la extensión "REST Client" en VSCode
2. Abre el archivo `requests.http`
3. Haz clic en "Send Request" sobre cada endpoint
4. Verifica las respuestas

### Opción 3: Pruebas Manuales con Postman
1. Importa el archivo `requests.http` en Postman
2. Ejecuta las pruebas en orden
3. Verifica que todas respondan correctamente

## ✅ Validaciones Realizadas

### Endpoints Públicos
- ✅ `GET /health` → 200 OK

### Autenticación
- ✅ `POST /api/login` con credenciales correctas → 200 OK + token
- ✅ `POST /api/login` con credenciales incorrectas → 401 Unauthorized
- ✅ `POST /api/login` con campos faltantes → 400 Bad Request
- ✅ `GET /api/login` → 404 Not Found (correcto, debe ser POST)

### Rutas Protegidas (Sin Token)
- ✅ `GET /api/usuarios` → 401 Unauthorized
- ✅ `GET /api/pacientes` → 401 Unauthorized
- ✅ `GET /api/cobros` → 401 Unauthorized

### Rutas Protegidas (Con Token)
- ✅ `GET /api/usuarios` → 200 OK
- ✅ `GET /api/pacientes` → 200 OK
- ✅ `GET /api/cobros` → 200 OK

## 🎯 Estado del Backend

**✅ COMPLETAMENTE FUNCIONAL**
- Servidor corriendo en `http://localhost:3002`
- Autenticación JWT implementada y funcionando
- Todas las rutas protegidas requieren token
- CORS habilitado para desarrollo
- Sin modificaciones a la base de datos

## 📋 Para el Frontend

**Configuración:**
- Base URL: `http://localhost:3002`
- Prefijo: `/api`
- Autenticación: JWT Bearer token

**Ejemplo de uso:**
```javascript
// Login
const response = await fetch('http://localhost:3002/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'doctor@clinica.com', password: '123456' })
});

// Usar token en requests protegidos
const data = await fetch('http://localhost:3002/api/usuarios', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🔧 Troubleshooting

### Si las pruebas fallan:
1. Verifica que el backend esté corriendo en `http://localhost:3002`
2. Revisa los logs del servidor
3. Confirma que la base de datos esté conectada
4. Ejecuta `npm run build` para recompilar si es necesario

### Si el frontend no puede conectar:
1. Verifica la URL base en el frontend
2. Confirma que use el prefijo `/api`
3. Revisa que envíe el token JWT en el header Authorization
4. Verifica que CORS esté habilitado (ya está configurado)

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs del backend
2. Ejecuta las pruebas automatizadas
3. Usa el archivo `requests.http` para probar endpoints individualmente
4. Consulta `frontend-guide.md` para ejemplos de implementación



# 🚀 Guía de Integración Frontend - Backend ProCura

## 📍 Configuración Base

**Base URL:** `http://localhost:3002`  
**Prefijo de rutas:** Todas las rutas inician con `/api`

## 🔐 Autenticación

### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "doctor@clinica.com",
  "password": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "nombre": "Dr. Juan Pérez",
    "email": "doctor@clinica.com",
    "rol": "doctor",
    "consultorio_id": "consultorio-id",
    "sedeId": "sede-tecamachalco"
  }
}
```

**Respuestas de error:**
- **401 Unauthorized:** Credenciales incorrectas
- **400 Bad Request:** Campos faltantes (email o password)

## 🛡️ Rutas Protegidas

Todas las rutas excepto `/api/login` y `/health` requieren autenticación.

**Header requerido:**
```
Authorization: Bearer <token>
```

### Endpoints Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/usuarios` | GET | Lista de usuarios |
| `/api/pacientes` | GET | Lista de pacientes |
| `/api/cobros` | GET | Lista de cobros |
| `/api/consultorios` | GET | Lista de consultorios |
| `/api/servicios` | GET | Lista de servicios |
| `/api/citas` | GET | Lista de citas |
| `/api/organizaciones` | GET | Lista de organizaciones |
| `/api/inventory` | GET | Inventario |
| `/api/immunotherapy` | GET | Registros de inmunoterapia |

## 🏥 Health Check

```http
GET /health
```

**Respuesta (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-09-30T19:00:00.000Z"
}
```

## 📊 Códigos de Estado

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| **200** | Éxito | Request procesado correctamente |
| **400** | Bad Request | Datos enviados incorrectos |
| **401** | Unauthorized | Token faltante, inválido o expirado |
| **404** | Not Found | Recurso no encontrado |
| **500** | Internal Server Error | Error interno del servidor |

## 💻 Implementación en JavaScript

### Clase ApiClient Completa

```javascript
const API_BASE = 'http://localhost:3002/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  /**
   * Realiza login y guarda token
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.user = data.user;
      
      // Guardar en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Realiza request GET autenticado
   */
  async get(endpoint) {
    if (!this.token) {
      throw new Error('No hay token de autenticación');
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.status === 401) {
        this.logout();
        throw new Error('Token expirado o inválido');
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Realiza request POST autenticado
   */
  async post(endpoint, data) {
    if (!this.token) {
      throw new Error('No hay token de autenticación');
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        this.logout();
        throw new Error('Token expirado o inválido');
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Métodos específicos para cada endpoint
   */
  async getUsuarios() {
    return this.get('/usuarios');
  }

  async getPacientes() {
    return this.get('/pacientes');
  }

  async getCobros() {
    return this.get('/cobros');
  }

  async getConsultorios() {
    return this.get('/consultorios');
  }

  async getServicios() {
    return this.get('/servicios');
  }

  async getCitas() {
    return this.get('/citas');
  }

  async getOrganizaciones() {
    return this.get('/organizaciones');
  }

  async getInventory() {
    return this.get('/inventory');
  }

  async getImmunotherapy() {
    return this.get('/immunotherapy');
  }

  /**
   * Cierra sesión y limpia datos
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Verifica si hay sesión activa
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Obtiene información del usuario actual
   */
  getCurrentUser() {
    return this.user;
  }
}

// Exportar instancia global
export const apiClient = new ApiClient();
export default ApiClient;
```

### Ejemplo de Uso en React

```jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from './apiClient';

function App() {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const { user } = await apiClient.login(email, password);
      setUser(user);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios
  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
    setUsuarios([]);
  };

  // Verificar sesión al cargar
  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      setUser(apiClient.getCurrentUser());
    }
  }, []);

  if (!user) {
    return (
      <div>
        <h1>Login</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleLogin(formData.get('email'), formData.get('password'));
        }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Login'}
          </button>
        </form>
        {error && <p style={{color: 'red'}}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1>Bienvenido, {user.nombre}</h1>
      <button onClick={handleLogout}>Logout</button>
      
      <div>
        <button onClick={loadUsuarios} disabled={loading}>
          {loading ? 'Cargando...' : 'Cargar Usuarios'}
        </button>
        {usuarios.length > 0 && (
          <ul>
            {usuarios.map(usuario => (
              <li key={usuario.id}>{usuario.nombre} - {usuario.email}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
```

## 🧪 Cómo Probar los Endpoints

### Opción 1: VSCode REST Client
1. Instala la extensión "REST Client" en VSCode
2. Abre el archivo `requests.http`
3. Haz clic en "Send Request" sobre cada endpoint
4. Verifica que las respuestas sean las esperadas

### Opción 2: Postman
1. Importa el archivo `requests.http` en Postman
2. Ejecuta las pruebas en orden
3. Usa la colección para pruebas automatizadas

### Opción 3: cURL (Terminal)
```bash
# Health check
curl http://localhost:3002/health

# Login
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@clinica.com", "password": "123456"}'

# Usuarios (reemplaza TOKEN con el token obtenido)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3002/api/usuarios
```

## ⚠️ Notas Importantes

1. **Password fijo:** Para pruebas, usar `"123456"` para cualquier usuario existente
2. **Token JWT:** Válido por 7 días, se renueva con cada login
3. **CORS:** Habilitado para desarrollo, acepta requests desde cualquier origen
4. **Organización:** No es necesario enviar `X-Organizacion-Id`, el backend lo obtiene del usuario autenticado
5. **Rate Limiting:** Algunos endpoints tienen límites de requests por minuto

## 🔧 Troubleshooting

### Error 401 Unauthorized
- Verifica que el token esté presente en el header
- Confirma que el token no haya expirado
- Asegúrate de usar el formato: `Authorization: Bearer <token>`

### Error 404 Not Found
- Confirma que la URL tenga el prefijo `/api/`
- Verifica que el endpoint exista en el backend
- Asegúrate de usar el método HTTP correcto (GET, POST, etc.)

### Error 500 Internal Server Error
- Revisa los logs del backend
- Verifica que la base de datos esté conectada
- Confirma que todos los servicios estén funcionando

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs del backend en la consola
2. Verifica que el servidor esté corriendo en `http://localhost:3002`
3. Confirma que la base de datos esté accesible
4. Usa el archivo `requests.http` para probar endpoints individualmente
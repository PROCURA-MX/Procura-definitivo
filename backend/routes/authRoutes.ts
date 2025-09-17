import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma'

const router = Router();

router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }
    
    console.log('Buscando usuario:', email);
    const user = await prisma.usuario.findUnique({ 
      where: { email }
    });
    
    console.log('Usuario encontrado:', user);
    
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    // Para pruebas, password fijo
    if (password !== '123456') {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Definido' : 'No definido');
    
    // Token simplificado sin consulta adicional
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        organizacion_id: user.organizacion_id
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    // Respuesta con consultorio_id
    const userResponse = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      consultorio_id: user.consultorio_id,
      sedeId: 'sede-tecamachalco'
    };
    
    console.log('Login exitoso para:', user.email);
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 
import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';

describe('Usuario Controller', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/usuarios debe retornar todos los usuarios', async () => {
    await prisma.usuario.create({
      data: { nombre: 'Test Usuario', rol: 'DOCTOR', email: 'testusuario@example.com', telefono: '1234567890' },
    });
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/usuarios/:id debe retornar un usuario específico', async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: 'Test Usuario', rol: 'DOCTOR', email: 'testusuario@example.com', telefono: '1234567890' },
    });
    const res = await request(app).get(`/api/usuarios/${usuario.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', usuario.id);
  });

  it('POST /api/usuarios debe crear un nuevo usuario', async () => {
    const newUsuario = { nombre: 'Nuevo Usuario', rol: 'DOCTOR', email: 'nuevo@example.com', telefono: '987654321' };
    const res = await request(app).post('/api/usuarios').send(newUsuario);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nombre', newUsuario.nombre);
  });

  it('PUT /api/usuarios/:id debe actualizar un usuario', async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: 'Test Usuario', rol: 'DOCTOR', email: 'testusuario@example.com', telefono: '1234567890' },
    });
    const res = await request(app)
      .put(`/api/usuarios/${usuario.id}`)
      .send({ nombre: 'Usuario Actualizado', rol: 'ADMINISTRADOR' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre', 'Usuario Actualizado');
  });

  it('DELETE /api/usuarios/:id debe eliminar un usuario', async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: 'Test Usuario', rol: 'DOCTOR', email: 'testusuario@example.com', telefono: '1234567890' },
    });
    const res = await request(app).delete(`/api/usuarios/${usuario.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Usuario eliminado' });
  });
}); 
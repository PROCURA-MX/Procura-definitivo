import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
function getToken(payload = { id: 'test-user', rol: 'DOCTOR' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Servicio Controller', () => {
  let servicioId: string;
  let token: string;

  beforeEach(async () => {
    await prisma.servicio.deleteMany();
    token = getToken({ id: 'test-user', rol: 'DOCTOR' });
    const servicio = await prisma.servicio.create({
      data: {
        nombre: 'Servicio Test',
        descripcion: 'Descripción de prueba',
        precio_base: 100,
      },
    });
    servicioId = servicio.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/servicios debe retornar todos los servicios', async () => {
    await prisma.servicio.create({ data: { nombre: 'Servicio A', precio_base: 100 } });
    const res = await request(app).get('/api/servicios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/servicios/:id debe retornar un servicio específico', async () => {
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio B', precio_base: 200 } });
    const res = await request(app).get(`/api/servicios/${servicio.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', servicio.id);
  });

  it('POST /api/servicios debe crear un nuevo servicio', async () => {
    const newServicio = { nombre: 'Servicio Nuevo', precio_base: 150 };
    const res = await request(app).post('/api/servicios').send(newServicio);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nombre', newServicio.nombre);
  });

  it('PUT /api/servicios/:id debe actualizar un servicio', async () => {
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio C', precio_base: 250 } });
    const res = await request(app)
      .put(`/api/servicios/${servicio.id}`)
      .send({ nombre: 'Servicio Actualizado', precio_base: 300 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre', 'Servicio Actualizado');
  });

  it('DELETE /api/servicios/:id debe eliminar un servicio', async () => {
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio Z', precio_base: 350 } });
    const res = await request(app).delete(`/api/servicios/${servicio.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Servicio eliminado' });
  });
}); 
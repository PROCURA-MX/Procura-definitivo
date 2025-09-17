import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';

describe('PrecioConsultorio Controller', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/precios-consultorio debe retornar todos los precios', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio A', direccion: 'Dir A' } });
    await prisma.precioConsultorio.create({ data: { consultorio_id: consultorio.id, concepto: 'Consulta General', precio: 100 } });
    const res = await request(app).get('/api/precios-consultorio');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/precios-consultorio/:id debe retornar un precio específico', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio B', direccion: 'Dir B' } });
    const precio = await prisma.precioConsultorio.create({ data: { consultorio_id: consultorio.id, concepto: 'Consulta Especializada', precio: 200 } });
    const res = await request(app).get(`/api/precios-consultorio/${precio.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', precio.id);
  });

  it('POST /api/precios-consultorio debe crear un nuevo precio', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio C', direccion: 'Dir C' } });
    const newPrecio = { consultorio_id: consultorio.id, concepto: 'Consulta Nueva', precio: 150 };
    const res = await request(app).post('/api/precios-consultorio').send(newPrecio);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('concepto', newPrecio.concepto);
  });

  it('PUT /api/precios-consultorio/:id debe actualizar un precio', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio D', direccion: 'Dir D' } });
    const precio = await prisma.precioConsultorio.create({ data: { consultorio_id: consultorio.id, concepto: 'Consulta Actualizar', precio: 250 } });
    const res = await request(app)
      .put(`/api/precios-consultorio/${precio.id}`)
      .send({ concepto: 'Consulta Actualizada', precio: 300 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('concepto', 'Consulta Actualizada');
  });

  it('DELETE /api/precios-consultorio/:id debe eliminar un precio', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio E', direccion: 'Dir E' } });
    const precio = await prisma.precioConsultorio.create({ data: { consultorio_id: consultorio.id, concepto: 'Consulta Eliminar', precio: 350 } });
    const res = await request(app).delete(`/api/precios-consultorio/${precio.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'PrecioConsultorio eliminado' });
  });
}); 
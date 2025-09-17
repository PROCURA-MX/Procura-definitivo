import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';

describe('Consultorio Controller', () => {
  it('GET /api/consultorios debe retornar todos los consultorios', async () => {
    await prisma.consultorio.create({ data: { nombre: 'Consultorio A', direccion: 'Dir A' } });
    const res = await request(app).get('/api/consultorios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/consultorios/:id debe retornar un consultorio específico', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio B', direccion: 'Dir B' } });
    const res = await request(app).get(`/api/consultorios/${consultorio.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', consultorio.id);
  });

  it('POST /api/consultorios debe crear un nuevo consultorio', async () => {
    const newConsultorio = { nombre: 'Consultorio Nuevo', direccion: 'Dir Nuevo' };
    const res = await request(app).post('/api/consultorios').send(newConsultorio);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nombre', newConsultorio.nombre);
  });

  it('PUT /api/consultorios/:id debe actualizar un consultorio', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio C', direccion: 'Dir C' } });
    const res = await request(app)
      .put(`/api/consultorios/${consultorio.id}`)
      .send({ nombre: 'Consultorio Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre', 'Consultorio Actualizado');
  });

  it('DELETE /api/consultorios/:id debe eliminar un consultorio', async () => {
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio Z', direccion: 'Dir Z' } });
    const res = await request(app).delete(`/api/consultorios/${consultorio.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Consultorio eliminado' });
  });
}); 
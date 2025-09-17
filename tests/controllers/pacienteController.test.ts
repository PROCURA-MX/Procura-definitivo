import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';

describe('Paciente Controller', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/pacientes debe retornar todos los pacientes', async () => {
    await prisma.paciente.create({
      data: { nombre: 'Test Paciente', apellido: 'Test Apellido', fecha_nacimiento: new Date('1990-01-01'), genero: 'M', telefono: '1234567890', email: 'testpaciente@example.com' },
    });
    const res = await request(app).get('/api/pacientes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/pacientes/:id debe retornar un paciente específico', async () => {
    const paciente = await prisma.paciente.create({
      data: { nombre: 'Test Paciente', apellido: 'Test Apellido', fecha_nacimiento: new Date('1990-01-01'), genero: 'M', telefono: '1234567890', email: 'testpaciente@example.com' },
    });
    const res = await request(app).get(`/api/pacientes/${paciente.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', paciente.id);
  });

  it('POST /api/pacientes debe crear un nuevo paciente', async () => {
    const newPaciente = { nombre: 'Nuevo Paciente', apellido: 'Nuevo Apellido', fecha_nacimiento: '1995-05-15', genero: 'F', telefono: '987654321', email: 'nuevo@example.com' };
    const res = await request(app).post('/api/pacientes').send(newPaciente);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nombre', newPaciente.nombre);
  });

  it('PUT /api/pacientes/:id debe actualizar un paciente', async () => {
    const paciente = await prisma.paciente.create({
      data: { nombre: 'Test Paciente', apellido: 'Test Apellido', fecha_nacimiento: new Date('1990-01-01'), genero: 'M', telefono: '1234567890', email: 'testpaciente@example.com' },
    });
    const res = await request(app)
      .put(`/api/pacientes/${paciente.id}`)
      .send({ nombre: 'Paciente Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre', 'Paciente Actualizado');
  });

  it('DELETE /api/pacientes/:id debe eliminar un paciente', async () => {
    const paciente = await prisma.paciente.create({
      data: { nombre: 'Test Paciente', apellido: 'Test Apellido', fecha_nacimiento: new Date('1990-01-01'), genero: 'M', telefono: '1234567890', email: 'testpaciente@example.com' },
    });
    const res = await request(app).delete(`/api/pacientes/${paciente.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Paciente eliminado' });
  });
}); 
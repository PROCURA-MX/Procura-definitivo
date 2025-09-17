import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
function getToken(payload = { id: 'test-user', rol: 'DOCTOR' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('CobroConcepto Controller', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/cobro-conceptos debe retornar todos los conceptos', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente A', apellido: 'A', fecha_nacimiento: new Date('1990-01-01'), genero: 'M', telefono: '111', email: 'a@a.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario A', rol: 'DOCTOR', email: 'ua@a.com', telefono: '222' } });
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio A', direccion: 'Dir A' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 100, estado: 'PENDIENTE' } });
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio A', precio_base: 100 } });
    await prisma.cobroConcepto.create({ data: { cobro_id: cobro.id, consultorio_id: consultorio.id, servicio_id: servicio.id, cantidad: 1, precio_unitario: 100, subtotal: 100 } });
    const res = await request(app).get('/api/cobro-conceptos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/cobro-conceptos/:id debe retornar un concepto específico', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente B', apellido: 'B', fecha_nacimiento: new Date('1991-01-01'), genero: 'F', telefono: '333', email: 'b@b.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario B', rol: 'DOCTOR', email: 'ub@b.com', telefono: '444' } });
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio B', direccion: 'Dir B' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 200, estado: 'PENDIENTE' } });
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio B', precio_base: 200 } });
    const concepto = await prisma.cobroConcepto.create({ data: { cobro_id: cobro.id, consultorio_id: consultorio.id, servicio_id: servicio.id, cantidad: 2, precio_unitario: 200, subtotal: 400 } });
    const res = await request(app).get(`/api/cobro-conceptos/${concepto.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', concepto.id);
  });

  it('POST /api/cobro-conceptos debe crear un nuevo concepto', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente C', apellido: 'C', fecha_nacimiento: new Date('1992-01-01'), genero: 'M', telefono: '555', email: 'c@c.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario C', rol: 'DOCTOR', email: 'uc@c.com', telefono: '666' } });
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio C', direccion: 'Dir C' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 300, estado: 'PENDIENTE' } });
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio C', precio_base: 300 } });
    const newConcepto = { cobro_id: cobro.id, consultorio_id: consultorio.id, servicio_id: servicio.id, cantidad: 3, precio_unitario: 300, subtotal: 900 };
    const res = await request(app).post('/api/cobro-conceptos').send(newConcepto);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('cantidad', 3);
  });

  it('PUT /api/cobro-conceptos/:id debe actualizar un concepto', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente D', apellido: 'D', fecha_nacimiento: new Date('1993-01-01'), genero: 'F', telefono: '777', email: 'd@d.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario D', rol: 'DOCTOR', email: 'ud@d.com', telefono: '888' } });
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio D', direccion: 'Dir D' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 400, estado: 'PENDIENTE' } });
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio D', precio_base: 400 } });
    const concepto = await prisma.cobroConcepto.create({ data: { cobro_id: cobro.id, consultorio_id: consultorio.id, servicio_id: servicio.id, cantidad: 4, precio_unitario: 400, subtotal: 1600 } });
    const res = await request(app)
      .put(`/api/cobro-conceptos/${concepto.id}`)
      .send({ cantidad: 5, precio_unitario: 500, subtotal: 2500 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cantidad', 5);
  });

  it('DELETE /api/cobro-conceptos/:id debe eliminar un concepto', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente E', apellido: 'E', fecha_nacimiento: new Date('1994-01-01'), genero: 'M', telefono: '999', email: 'e@e.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario E', rol: 'DOCTOR', email: 'ue@e.com', telefono: '000' } });
    const consultorio = await prisma.consultorio.create({ data: { nombre: 'Consultorio E', direccion: 'Dir E' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 500, estado: 'PENDIENTE' } });
    const servicio = await prisma.servicio.create({ data: { nombre: 'Servicio E', precio_base: 500 } });
    const concepto = await prisma.cobroConcepto.create({ data: { cobro_id: cobro.id, consultorio_id: consultorio.id, servicio_id: servicio.id, cantidad: 5, precio_unitario: 500, subtotal: 2500 } });
    const res = await request(app).delete(`/api/cobro-conceptos/${concepto.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'CobroConcepto eliminado' });
  });
}); 
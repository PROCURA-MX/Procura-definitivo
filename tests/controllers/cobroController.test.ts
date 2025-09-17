import request from 'supertest';
import app from '../../backend/index';
import { prisma } from '../setup';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

function getToken(payload = { id: 'test-user', rol: 'DOCTOR' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Cobro Controller', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/cobros debe retornar todos los cobros', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente A', apellido: 'A', fecha_nacimiento: new Date('1990-01-01'), genero: 'M', telefono: '111', email: 'a@a.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario A', rol: 'DOCTOR', email: 'ua@a.com', telefono: '222' } });
    await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 100, estado: 'PENDIENTE' } });
    const res = await request(app).get('/api/cobros');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('GET /api/cobros/:id debe retornar un cobro específico', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente B', apellido: 'B', fecha_nacimiento: new Date('1991-01-01'), genero: 'F', telefono: '333', email: 'b@b.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario B', rol: 'DOCTOR', email: 'ub@b.com', telefono: '444' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 200, estado: 'PENDIENTE' } });
    const res = await request(app).get(`/api/cobros/${cobro.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', cobro.id);
  });

  it('POST /api/cobros debe crear un nuevo cobro', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente C', apellido: 'C', fecha_nacimiento: new Date('1992-01-01'), genero: 'M', telefono: '555', email: 'c@c.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario C', rol: 'DOCTOR', email: 'uc@c.com', telefono: '666' } });
    const newCobro = {
      paciente_id: paciente.id,
      usuario_id: usuario.id,
      fecha_cobro: new Date().toISOString(),
      monto_total: 300,
      estado: 'PENDIENTE',
      pagos: [
        { metodo: 'EFECTIVO', monto: 300 }
      ]
    };
    const res = await request(app)
      .post('/api/cobros')
      .set('Authorization', `Bearer ${getToken({ id: usuario.id, rol: usuario.rol })}`)
      .send(newCobro);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('monto_total', 300);
  });

  it('PUT /api/cobros/:id debe actualizar un cobro', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente D', apellido: 'D', fecha_nacimiento: new Date('1993-01-01'), genero: 'F', telefono: '777', email: 'd@d.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario D', rol: 'DOCTOR', email: 'ud@d.com', telefono: '888' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 400, estado: 'PENDIENTE' } });
    await prisma.metodoPagoCobro.create({ data: { cobro_id: cobro.id, metodo_pago: 'EFECTIVO', monto: 400 } });
    const res = await request(app)
      .put(`/api/cobros/${cobro.id}`)
      .set('Authorization', `Bearer ${getToken({ id: usuario.id, rol: usuario.rol })}`)
      .send({
        paciente_id: paciente.id,
        usuario_id: usuario.id,
        fecha_cobro: new Date().toISOString(),
        monto_total: 500,
        estado: 'COMPLETADO',
        pagos: [{ metodo: 'EFECTIVO', monto: 500 }]
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('monto_total', 500);
  });

  it('DELETE /api/cobros/:id debe eliminar un cobro', async () => {
    const paciente = await prisma.paciente.create({ data: { nombre: 'Paciente E', apellido: 'E', fecha_nacimiento: new Date('1994-01-01'), genero: 'M', telefono: '999', email: 'e@e.com' } });
    const usuario = await prisma.usuario.create({ data: { nombre: 'Usuario E', rol: 'DOCTOR', email: 'ue@e.com', telefono: '000' } });
    const cobro = await prisma.cobro.create({ data: { paciente_id: paciente.id, usuario_id: usuario.id, fecha_cobro: new Date(), monto_total: 600, estado: 'PENDIENTE' } });
    const res = await request(app)
      .delete(`/api/cobros/${cobro.id}`)
      .set('Authorization', `Bearer ${getToken({ id: usuario.id, rol: usuario.rol })}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Cobro eliminado' });
  });
}); 
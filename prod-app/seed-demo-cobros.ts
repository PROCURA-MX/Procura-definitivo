import { PrismaClient, Rol, EstadoCobro, MetodoPago } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Consultorio
  let consultorio = await prisma.consultorio.findFirst({ where: { nombre: 'Consultorio Demo' } });
  if (!consultorio) {
    consultorio = await prisma.consultorio.create({
      data: {
        nombre: 'Consultorio Demo',
        direccion: 'Calle Falsa 123',
      },
    });
  }

  // 2. Usuario
  let usuario = await prisma.usuario.findUnique({ where: { email: 'demo@procura.com' } });
  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        nombre: 'Demo',
        apellido: 'User',
        email: 'demo@procura.com',
        telefono: '555-1234',
        rol: 'ADMINISTRADOR',
        consultorio_id: consultorio.id,
      },
    });
  }

  // 3. Paciente
  let paciente = await prisma.paciente.findFirst({ where: { email: 'paciente@demo.com' } });
  if (!paciente) {
    paciente = await prisma.paciente.create({
      data: {
        nombre: 'Paciente',
        apellido: 'Demo',
        fecha_nacimiento: new Date('1990-01-01'),
        genero: 'Otro',
        direccion: 'Calle Paciente 456',
        telefono: '555-5678',
        email: 'paciente@demo.com',
      },
    });
  }

  // 4. Servicio
  let servicio = await prisma.servicio.findFirst({ where: { nombre: 'Consulta General' } });
  if (!servicio) {
    servicio = await prisma.servicio.create({
      data: {
        nombre: 'Consulta General',
        descripcion: 'Consulta médica general',
        precio_base: 500,
      },
    });
  }

  // 5. Concepto (PrecioConsultorio)
  let precioConsultorio = await prisma.precioConsultorio.findFirst({ where: { concepto: 'Consulta General', consultorio_id: consultorio.id } });
  if (!precioConsultorio) {
    precioConsultorio = await prisma.precioConsultorio.create({
      data: {
        concepto: 'Consulta General',
        consultorio_id: consultorio.id,
        precio: 500,
      },
    });
  }

  // 6. Cobro completo
  const cobro = await prisma.cobro.create({
    data: {
      paciente_id: paciente.id,
      usuario_id: usuario.id,
      fecha_cobro: new Date(),
      monto_total: 500,
      estado: 'COMPLETADO',
      notas: 'Cobro de ejemplo para demo',
      conceptos: {
        create: [{
          cantidad: 1,
          subtotal: 500,
          consultorio_id: consultorio.id,
          precio_unitario: 500,
          servicio_id: servicio.id,
        }],
      },
      metodos_pago: {
        create: [{
          metodo_pago: 'EFECTIVO',
          monto: 500,
        }],
      },
      historial: {
        create: [{
          detalles_antes: null,
          detalles_despues: 'Cobro creado',
          tipo_cambio: 'CREACION',
          usuario_id: usuario.id,
        }],
      },
    },
    include: {
      paciente: true,
      usuario: true,
      conceptos: true,
      metodos_pago: true,
      historial: true,
    },
  });

  console.log('Datos de demo insertados correctamente:', { consultorio, usuario, paciente, servicio, precioConsultorio, cobro });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
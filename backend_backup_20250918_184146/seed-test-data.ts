import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Consultorio
  let consultorio = await prisma.consultorio.findFirst({ where: { nombre: 'Consultorio Demo' } });
  if (!consultorio) {
    consultorio = await prisma.consultorio.create({
      data: {
        nombre: 'Consultorio Demo',
        direccion: 'Calle Falsa 123',
      },
    });
  }

  // Usuario (tiene unique en email)
  const usuario = await prisma.usuario.upsert({
    where: { email: 'demo@procura.com' },
    update: {},
    create: {
      nombre: 'Demo',
      apellido: 'User',
      rol: 'ADMINISTRADOR',
      email: 'demo@procura.com',
      telefono: '555-1234',
      consultorio_id: consultorio.id,
    },
  });

  // Paciente (no tiene unique en email, buscar manualmente)
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

  console.log('Datos de prueba insertados:');
  console.log({ consultorio, usuario, paciente });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
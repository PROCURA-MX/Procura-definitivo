import { PrismaClient } from '@prisma/client';

// Configuración específica para tests
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/procura_cobros'
    }
  }
});

// Función para limpiar la base de datos de test
export async function cleanTestDatabase() {
  try {
    // Limpiar todas las tablas en orden correcto (por foreign keys)
    await testPrisma.metodoPagoCobro.deleteMany();
    await testPrisma.cobroConcepto.deleteMany();
    await testPrisma.historialCobro.deleteMany();
    await testPrisma.cobro.deleteMany();
    await testPrisma.precioConsultorio.deleteMany();
    await testPrisma.servicio.deleteMany();
    await testPrisma.consultorio.deleteMany();
    await testPrisma.paciente.deleteMany();
    await testPrisma.usuario.deleteMany();
  } catch (error) {
    console.error('Error limpiando base de datos de test:', error);
  }
}

// Función para crear datos de prueba
export async function createTestData() {
  const paciente = await testPrisma.paciente.create({
    data: {
      nombre: 'Test Paciente',
      apellido: 'Test Apellido',
      fecha_nacimiento: new Date('1990-01-01'),
      genero: 'M',
      direccion: 'Test Dirección',
      telefono: '1234567890',
      email: 'paciente@test.com',
      documento_identidad: '12345678'
    }
  });

  const usuario = await testPrisma.usuario.create({
    data: {
      nombre: 'Test Usuario',
      rol: 'DOCTOR',
      email: 'test@test.com',
      telefono: '1234567890'
    }
  });

  const consultorio = await testPrisma.consultorio.create({
    data: {
      nombre: 'Test Consultorio',
      direccion: 'Test Dirección Consultorio'
    }
  });

  const servicio = await testPrisma.servicio.create({
    data: {
      nombre: 'Test Servicio',
      descripcion: 'Servicio de prueba',
      precio_base: 100
    }
  });

  return { paciente, usuario, consultorio, servicio };
}

export { testPrisma }; 
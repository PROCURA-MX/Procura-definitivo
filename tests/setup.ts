import { PrismaClient } from '@prisma/client';

// Configuración global para tests
const prisma = new PrismaClient();

// Limpiar base de datos antes de cada test
beforeAll(async () => {
  // Conectar a la base de datos de test
  await prisma.$connect();
});

// Limpiar datos después de cada test
afterEach(async () => {
  // Deshabilitar restricciones de clave foránea (solo seguro en test)
  await prisma.$executeRaw`SET session_replication_role = 'replica';`;
  await prisma.historialCobro.deleteMany();
  await prisma.cobroConcepto.deleteMany();
  await prisma.metodoPagoCobro.deleteMany();
  await prisma.precioConsultorio.deleteMany();
  await prisma.cobro.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.consultorio.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.usuario.deleteMany();
  // Reactivar restricciones
  await prisma.$executeRaw`SET session_replication_role = 'origin';`;
});

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Variables globales para tests
declare global {
  var testData: {
    usuario: {
      nombre: string;
      rol: string;
      email: string;
      telefono: string;
    };
    paciente: {
      nombre: string;
      apellido: string;
      fecha_nacimiento: Date;
      genero: string;
      direccion?: string;
      telefono: string;
      email: string;
      documento_identidad?: string;
    };
    consultorio: {
      nombre: string;
      direccion: string;
    };
    servicio: {
      nombre: string;
      descripcion?: string;
      precio_base: number;
    };
    cobro: {
      fecha_cobro: Date;
      monto_total: number;
      estado: string;
      metodo_pago?: string;
      notas?: string;
    };
  };
}

global.testData = {
  usuario: {
    nombre: 'Test Usuario',
    rol: 'DOCTOR',
    email: 'test@test.com',
    telefono: '1234567890'
  },
  paciente: {
    nombre: 'Test Paciente',
    apellido: 'Test Apellido',
    fecha_nacimiento: new Date('1990-01-01'),
    genero: 'M',
    direccion: 'Test Dirección',
    telefono: '1234567890',
    email: 'paciente@test.com',
    documento_identidad: '12345678'
  },
  consultorio: {
    nombre: 'Test Consultorio',
    direccion: 'Test Dirección Consultorio'
  },
  servicio: {
    nombre: 'Test Servicio',
    descripcion: 'Servicio de prueba',
    precio_base: 100
  },
  cobro: {
    fecha_cobro: new Date(),
    monto_total: 150,
    estado: 'PENDIENTE',
    metodo_pago: 'EFECTIVO',
    notas: 'Test cobro'
  }
};

// Exportar para uso en tests
export { prisma }; 
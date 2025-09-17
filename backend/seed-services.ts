import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  const services = [
    {
      nombre: 'Consulta General',
      descripcion: 'Consulta médica general',
      precio_base: 50.00
    },
    {
      nombre: 'Consulta Especializada',
      descripcion: 'Consulta con especialista',
      precio_base: 80.00
    },
    {
      nombre: 'Examen de Laboratorio',
      descripcion: 'Análisis de sangre básico',
      precio_base: 25.00
    },
    {
      nombre: 'Radiografía',
      descripcion: 'Radiografía simple',
      precio_base: 45.00
    },
    {
      nombre: 'Ecografía',
      descripcion: 'Ecografía abdominal',
      precio_base: 120.00
    }
  ];

  for (const service of services) {
    // Verificar si el servicio ya existe
    const existingService = await prisma.servicio.findFirst({
      where: { nombre: service.nombre }
    });
    
    if (!existingService) {
      await prisma.servicio.create({
        data: service
      });
    }
  }

  console.log('Servicios insertados correctamente');
}

seedServices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const products = [
  { id: 'glicerinado-unidad', name: 'Glicerinado por Unidad' },
  { id: 'glicerinado-frasco', name: 'Glicerinado por Frasco' },
  { id: 'alxoid-tipo-a', name: 'Alxoid Tipo A' },
  { id: 'alxoid-tipo-b', name: 'Alxoid Tipo B' },
  { id: 'sublingual', name: 'Sublingual' },
  { id: 'bacteriana', name: 'Bacteriana' },
  { id: 'evans', name: 'Evans' },
  { id: 'vits', name: 'VITS' },
];

const allergens = [
  'Abedul', 'Ácaros', 'Álamo del este', 'Ambrosía', 'Caballo', 'Camarón',
  'Ciprés de Arizona', 'Encino', 'Fresno blanco', 'Gato', 'Manzana', 'Cucaracha',
  'Mezcla pastos', 'Perro', 'Pescado varios', 'Pino blanco', 'Pistache', 'Trueno',
];

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[^a-zA-Z0-9]+/g, '-') // Reemplaza no alfanuméricos por guion
    .replace(/^-+|-+$/g, '') // Quita guiones al inicio/fin
    .toLowerCase();
}

async function seedInventoryProducts() {
  try {
    console.log('🌱 Seeding inventory products...');
    // Sede y usuario deben existir
    const sede = await prisma.sede.upsert({
      where: { id: 'sede-tecamachalco' },
      update: {},
      create: {
        id: 'sede-tecamachalco',
        name: 'Sede Tecamachalco',
        address: 'Tecamachalco, Puebla',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    for (const prod of products) {
      const product = await prisma.product.upsert({
        where: { id: prod.id },
        update: {},
        create: {
          id: prod.id,
          name: prod.name,
          type: 'SIMPLE',
          unit: 'ML',
          description: prod.name,
          costPerUnit: 10.0,
          minStockLevel: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await prisma.stockBySede.upsert({
        where: {
          productId_sedeId: {
            productId: product.id,
            sedeId: sede.id,
          },
        },
        update: { quantity: { set: 100 } },
        create: {
          id: `stock-${product.id}-${sede.id}`,
          productId: product.id,
          sedeId: sede.id,
          quantity: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Producto y stock: ${prod.name}`);
    }
    console.log('🎉 Inventory products seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding inventory products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedAllergens() {
  for (const name of allergens) {
    const id = slugify(name);
    await prisma.allergen.upsert({
      where: { id },
      update: { name, updatedAt: new Date() },
      create: {
        id,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Alérgeno creado: ${name}`);
  }
}

async function main() {
  await seedInventoryProducts();
  await seedAllergens();

  // Consultorio dummy
  await prisma.consultorio.upsert({
    where: { id: 'dummy-consultorio-id' },
    update: {},
    create: {
      id: 'dummy-consultorio-id',
      nombre: 'Consultorio Dummy',
      direccion: 'Calle Falsa 123',
      organizacion: {
        connect: { id: '550e8400-e29b-41d4-a716-446655440000' }
      }
    },
  });

  // Paciente dummy
  await prisma.paciente.upsert({
    where: { id: 'dummy-paciente-id' },
    update: {},
    create: {
      id: 'dummy-paciente-id',
      nombre: 'Paciente',
      apellido: 'Dummy',
      fecha_nacimiento: new Date('2000-01-01'),
      genero: 'Otro',
      telefono: '0000000000',
      email: 'dummy@dummy.com',
      organizacion: {
        connect: { id: '550e8400-e29b-41d4-a716-446655440000' }
      }
    },
  });

  // Usuario dummy
  await prisma.usuario.upsert({
    where: { id: 'dummy-usuario-id' },
    update: {},
    create: {
      id: 'dummy-usuario-id',
      nombre: 'Usuario',
      apellido: 'Dummy',
      email: 'usuario@dummy.com',
      telefono: '0000000000',
      rol: 'DOCTOR',
      consultorio_id: 'dummy-consultorio-id',
      organizacion_id: '550e8400-e29b-41d4-a716-446655440000',
    },
  });

  console.log('Registros dummy creados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
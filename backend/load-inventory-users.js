const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const inventoryUsers = [
  {
    id: 'user-inventory-1',
    email: 'demo@procura.com',
    name: 'Demo User',
    sedeId: 'sede-tecamachalco',
    role: 'DOCTOR'
  },
  {
    id: 'user-inventory-2',
    email: 'rodrigoespc03@gmail.com',
    name: 'Rodrigo User',
    sedeId: 'sede-tecamachalco',
    role: 'DOCTOR'
  }
];

async function loadInventoryUsers() {
  try {
    console.log('🔄 Cargando usuarios de inventario...');
    
    for (const user of inventoryUsers) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          ...user,
          updatedAt: new Date()
        },
        create: {
          ...user,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Usuario de inventario cargado: ${user.name} (${user.email})`);
    }
    
    console.log('🎉 Todos los usuarios de inventario cargados exitosamente');
  } catch (error) {
    console.error('❌ Error cargando usuarios de inventario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loadInventoryUsers();

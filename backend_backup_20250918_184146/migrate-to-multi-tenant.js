const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToMultiTenant() {
  console.log('🚀 Iniciando migración a multi-tenant...');
  
  try {
    // 1. Crear organización por defecto
    console.log('📝 Creando organización por defecto...');
    const defaultOrganization = await prisma.organizacion.create({
      data: {
        nombre: 'Organización por Defecto',
        email: 'default@procura.com',
        telefono: '000-000-0000'
      }
    });
    
    console.log(`✅ Organización creada: ${defaultOrganization.id}`);
    
    // 2. Agregar organizacion_id a usuarios existentes
    console.log('👥 Migrando usuarios...');
    const usuarios = await prisma.usuario.findMany({
      where: {
        organizacion_id: null
      }
    });
    
    for (const usuario of usuarios) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { organizacion_id: defaultOrganization.id }
      });
    }
    
    console.log(`✅ ${usuarios.length} usuarios migrados`);
    
    // 3. Agregar organizacion_id a consultorios existentes
    console.log('🏥 Migrando consultorios...');
    const consultorios = await prisma.consultorio.findMany({
      where: {
        organizacion_id: null
      }
    });
    
    for (const consultorio of consultorios) {
      await prisma.consultorio.update({
        where: { id: consultorio.id },
        data: { organizacion_id: defaultOrganization.id }
      });
    }
    
    console.log(`✅ ${consultorios.length} consultorios migrados`);
    
    // 4. Agregar organizacion_id a pacientes existentes
    console.log('👤 Migrando pacientes...');
    const pacientes = await prisma.paciente.findMany({
      where: {
        organizacion_id: null
      }
    });
    
    for (const paciente of pacientes) {
      await prisma.paciente.update({
        where: { id: paciente.id },
        data: { organizacion_id: defaultOrganization.id }
      });
    }
    
    console.log(`✅ ${pacientes.length} pacientes migrados`);
    
    // 5. Agregar organizacion_id a servicios existentes
    console.log('🩺 Migrando servicios...');
    const servicios = await prisma.servicio.findMany({
      where: {
        organizacion_id: null
      }
    });
    
    for (const servicio of servicios) {
      await prisma.servicio.update({
        where: { id: servicio.id },
        data: { organizacion_id: defaultOrganization.id }
      });
    }
    
    console.log(`✅ ${servicios.length} servicios migrados`);
    
    console.log('🎉 Migración completada exitosamente!');
    
    // 6. Verificar migración
    console.log('🔍 Verificando migración...');
    const stats = await prisma.$transaction([
      prisma.usuario.count({ where: { organizacion_id: defaultOrganization.id } }),
      prisma.consultorio.count({ where: { organizacion_id: defaultOrganization.id } }),
      prisma.paciente.count({ where: { organizacion_id: defaultOrganization.id } }),
      prisma.servicio.count({ where: { organizacion_id: defaultOrganization.id } })
    ]);
    
    console.log('📊 Estadísticas de migración:');
    console.log(`   - Usuarios: ${stats[0]}`);
    console.log(`   - Consultorios: ${stats[1]}`);
    console.log(`   - Pacientes: ${stats[2]}`);
    console.log(`   - Servicios: ${stats[3]}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateToMultiTenant()
  .then(() => {
    console.log('✅ Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }); 
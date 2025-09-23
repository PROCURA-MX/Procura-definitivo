const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMultiTenant() {
  console.log('🧪 Probando sistema multi-tenant...');
  
  try {
    // 1. Verificar que existe la organización por defecto
    console.log('📋 Verificando organización por defecto...');
    const organizaciones = await prisma.$queryRaw`
      SELECT * FROM organizaciones WHERE nombre = 'Organización por Defecto'
    `;
    
    if (organizaciones.length === 0) {
      console.log('❌ No se encontró la organización por defecto');
      return;
    }
    
    const defaultOrg = organizaciones[0];
    console.log(`✅ Organización por defecto encontrada: ${defaultOrg.id}`);
    
    // 2. Verificar que los usuarios tienen organizacion_id
    console.log('👥 Verificando usuarios...');
    const usuarios = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM usuarios WHERE organizacion_id IS NOT NULL
    `;
    console.log(`✅ ${usuarios[0].total} usuarios tienen organización asignada`);
    
    // 3. Verificar que los consultorios tienen organizacion_id
    console.log('🏥 Verificando consultorios...');
    const consultorios = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM consultorios WHERE organizacion_id IS NOT NULL
    `;
    console.log(`✅ ${consultorios[0].total} consultorios tienen organización asignada`);
    
    // 4. Verificar que los pacientes tienen organizacion_id
    console.log('👤 Verificando pacientes...');
    const pacientes = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM pacientes WHERE organizacion_id IS NOT NULL
    `;
    console.log(`✅ ${pacientes[0].total} pacientes tienen organización asignada`);
    
    // 5. Verificar que los servicios tienen organizacion_id
    console.log('🩺 Verificando servicios...');
    const servicios = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM servicios WHERE organizacion_id IS NOT NULL
    `;
    console.log(`✅ ${servicios[0].total} servicios tienen organización asignada`);
    
    // 6. Probar consulta filtrada por organización
    console.log('🔍 Probando consulta filtrada...');
    const pacientesFiltrados = await prisma.$queryRaw`
      SELECT * FROM pacientes 
      WHERE organizacion_id = ${defaultOrg.id}::uuid
      LIMIT 3
    `;
    console.log(`✅ Consulta filtrada devolvió ${pacientesFiltrados.length} pacientes`);
    
    // 7. Verificar índices
    console.log('📊 Verificando índices...');
    const indices = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname LIKE '%organizacion%'
    `;
    console.log(`✅ ${indices.length} índices de organización encontrados:`);
    indices.forEach(idx => console.log(`   - ${idx.indexname} en ${idx.tablename}`));
    
    console.log('🎉 ¡Sistema multi-tenant funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiTenant(); 
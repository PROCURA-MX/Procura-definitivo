import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 🏗️ SERVICIO ROBUSTO DE PRODUCTOS
 * 
 * Este servicio implementa una arquitectura multi-tenant correcta
 * que resuelve los problemas de duplicación y escalabilidad.
 */

export class RobustProductService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 🎯 MÉTODO PRINCIPAL: Buscar producto por nombre y organización
   * 
   * Este método es ROBUSTO porque:
   * 1. ✅ Respeta la arquitectura multi-tenant
   * 2. ✅ No depende de stock para identificar productos
   * 3. ✅ Maneja casos edge correctamente
   * 4. ✅ Es escalable y mantenible
   */
  async findProductByName(
    productName: string, 
    organizationId: string,
    sedeId?: string
  ): Promise<{
    product: any;
    stock?: number;
    error?: string;
  }> {
    try {
      // 1. 🎯 BUSCAR PRODUCTO POR ORGANIZACIÓN (MULTI-TENANT CORRECTO)
      const product = await this.prisma.product.findFirst({
        where: {
          name: {
            equals: productName.trim(),
            mode: 'insensitive'
          },
          organizacion_id: organizationId // ✅ CLAVE: Filtrar por organización
        },
        select: {
          id: true,
          name: true,
          category: true,
          organizacion_id: true,
          costPerUnit: true
        }
      });

      if (!product) {
        return {
          product: null,
          error: `Producto "${productName}" no encontrado en la organización ${organizationId}`
        };
      }

      // 2. 📦 OBTENER STOCK SI SE ESPECIFICA SEDE
      let stock = 0;
      if (sedeId) {
        const stockRecord = await this.prisma.stockBySede.findFirst({
          where: {
            productId: product.id,
            sedeId: sedeId
          },
          select: { quantity: true }
        });
        stock = stockRecord?.quantity ? Number(stockRecord.quantity) : 0;
      }

      return {
        product,
        stock
      };

    } catch (error) {
      console.error('❌ Error en findProductByName:', error);
      return {
        product: null,
        error: `Error interno: ${error.message}`
      };
    }
  }

  /**
   * 🔍 MÉTODO DE BÚSQUEDA AVANZADA
   * 
   * Busca productos con múltiples estrategias:
   * 1. Nombre exacto
   * 2. Nombre normalizado (sin tildes)
   * 3. Búsqueda parcial
   */
  async findProductAdvanced(
    productName: string,
    organizationId: string,
    sedeId?: string
  ): Promise<{
    product: any;
    stock?: number;
    searchStrategy: string;
    error?: string;
  }> {
    
    // Estrategia 1: Búsqueda exacta
    let result = await this.findProductByName(productName, organizationId, sedeId);
    if (result.product) {
      return { ...result, searchStrategy: 'exact' };
    }

    // Estrategia 2: Búsqueda normalizada
    const normalizedName = productName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
      .replace(/\s+/g, ' ') // Normaliza espacios
      .trim();

    if (normalizedName !== productName) {
      result = await this.findProductByName(normalizedName, organizationId, sedeId);
      if (result.product) {
        return { ...result, searchStrategy: 'normalized' };
      }
    }

    // Estrategia 3: Búsqueda parcial
    const partialProduct = await this.prisma.product.findFirst({
      where: {
        name: {
          contains: productName.trim(),
          mode: 'insensitive'
        },
        organizacion_id: organizationId
      },
      select: {
        id: true,
        name: true,
        category: true,
        organizacion_id: true,
        costPerUnit: true
      }
    });

    if (partialProduct) {
      let stock = 0;
      if (sedeId) {
        const stockRecord = await this.prisma.stockBySede.findFirst({
          where: {
            productId: partialProduct.id,
            sedeId: sedeId
          },
          select: { quantity: true }
        });
        stock = stockRecord?.quantity ? Number(stockRecord.quantity) : 0;
      }

      return {
        product: partialProduct,
        stock,
        searchStrategy: 'partial'
      };
    }

    return {
      product: null,
      searchStrategy: 'none',
      error: `Producto "${productName}" no encontrado con ninguna estrategia de búsqueda`
    };
  }

  /**
   * 📊 MÉTODO DE VALIDACIÓN DE STOCK
   * 
   * Valida si hay stock suficiente para un tratamiento
   */
  async validateStock(
    productId: string,
    sedeId: string,
    requiredQuantity: number
  ): Promise<{
    hasStock: boolean;
    availableStock: number;
    requiredStock: number;
    deficit?: number;
  }> {
    const stock = await this.prisma.stockBySede.findFirst({
      where: {
        productId: productId,
        sedeId: sedeId
      },
      select: { quantity: true }
    });

    const availableStock = stock?.quantity ? Number(stock.quantity) : 0;
    const hasStock = availableStock >= requiredQuantity;
    const deficit = hasStock ? 0 : requiredQuantity - availableStock;

    return {
      hasStock,
      availableStock,
      requiredStock: requiredQuantity,
      deficit
    };
  }

  /**
   * 🏥 MÉTODO DE BÚSQUEDA POR SEDE
   * 
   * Busca productos que tienen stock en una sede específica
   */
  async findProductsWithStockInSede(
    sedeId: string,
    organizationId: string,
    category?: string
  ): Promise<any[]> {
    const whereClause: any = {
      stockBySede: {
        some: {
          sedeId: sedeId,
          quantity: { gt: 0 }
        }
      },
      organizacion_id: organizationId
    };

    if (category) {
      whereClause.category = category;
    }

    return await this.prisma.product.findMany({
      where: whereClause,
      include: {
        StockBySede: {
          where: { sedeId: sedeId },
          select: { quantity: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}

/**
 * 🎯 FUNCIÓN DE UTILIDAD PARA TRATAMIENTOS
 * 
 * Esta función reemplaza la función frágil getAlergenIdByName
 * con una implementación robusta y escalable.
 */
export async function findProductForTreatment(
  prisma: PrismaClient,
  productName: string,
  organizationId: string,
  sedeId: string
): Promise<{
  productId: string;
  productName: string;
  availableStock: number;
  error?: string;
}> {
  const service = new RobustProductService(prisma);
  
  const result = await service.findProductAdvanced(
    productName,
    organizationId,
    sedeId
  );

  if (!result.product) {
    throw new Error(result.error || `Producto "${productName}" no encontrado`);
  }

  // Validar stock
  const stockValidation = await service.validateStock(
    result.product.id,
    sedeId,
    0.01 // Mínimo requerido
  );

  if (!stockValidation.hasStock) {
    throw new Error(
      `Stock insuficiente para "${productName}": ` +
      `disponible ${stockValidation.availableStock}, ` +
      `requerido ${stockValidation.requiredStock}`
    );
  }

  return {
    productId: result.product.id,
    productName: result.product.name,
    availableStock: stockValidation.availableStock
  };
}


/**
 * 🏗️ SERVICIO ROBUSTO DE PRODUCTOS
 * 
 * Este servicio implementa una arquitectura multi-tenant correcta
 * que resuelve los problemas de duplicación y escalabilidad.
 */

export class RobustProductService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 🎯 MÉTODO PRINCIPAL: Buscar producto por nombre y organización
   * 
   * Este método es ROBUSTO porque:
   * 1. ✅ Respeta la arquitectura multi-tenant
   * 2. ✅ No depende de stock para identificar productos
   * 3. ✅ Maneja casos edge correctamente
   * 4. ✅ Es escalable y mantenible
   */
  async findProductByName(
    productName: string, 
    organizationId: string,
    sedeId?: string
  ): Promise<{
    product: any;
    stock?: number;
    error?: string;
  }> {
    try {
      // 1. 🎯 BUSCAR PRODUCTO POR ORGANIZACIÓN (MULTI-TENANT CORRECTO)
      const product = await this.prisma.product.findFirst({
        where: {
          name: {
            equals: productName.trim(),
            mode: 'insensitive'
          },
          organizacion_id: organizationId // ✅ CLAVE: Filtrar por organización
        },
        select: {
          id: true,
          name: true,
          category: true,
          organizacion_id: true,
          costPerUnit: true
        }
      });

      if (!product) {
        return {
          product: null,
          error: `Producto "${productName}" no encontrado en la organización ${organizationId}`
        };
      }

      // 2. 📦 OBTENER STOCK SI SE ESPECIFICA SEDE
      let stock = 0;
      if (sedeId) {
        const stockRecord = await this.prisma.stockBySede.findFirst({
          where: {
            productId: product.id,
            sedeId: sedeId
          },
          select: { quantity: true }
        });
        stock = stockRecord?.quantity ? Number(stockRecord.quantity) : 0;
      }

      return {
        product,
        stock
      };

    } catch (error) {
      console.error('❌ Error en findProductByName:', error);
      return {
        product: null,
        error: `Error interno: ${error.message}`
      };
    }
  }

  /**
   * 🔍 MÉTODO DE BÚSQUEDA AVANZADA
   * 
   * Busca productos con múltiples estrategias:
   * 1. Nombre exacto
   * 2. Nombre normalizado (sin tildes)
   * 3. Búsqueda parcial
   */
  async findProductAdvanced(
    productName: string,
    organizationId: string,
    sedeId?: string
  ): Promise<{
    product: any;
    stock?: number;
    searchStrategy: string;
    error?: string;
  }> {
    
    // Estrategia 1: Búsqueda exacta
    let result = await this.findProductByName(productName, organizationId, sedeId);
    if (result.product) {
      return { ...result, searchStrategy: 'exact' };
    }

    // Estrategia 2: Búsqueda normalizada
    const normalizedName = productName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
      .replace(/\s+/g, ' ') // Normaliza espacios
      .trim();

    if (normalizedName !== productName) {
      result = await this.findProductByName(normalizedName, organizationId, sedeId);
      if (result.product) {
        return { ...result, searchStrategy: 'normalized' };
      }
    }

    // Estrategia 3: Búsqueda parcial
    const partialProduct = await this.prisma.product.findFirst({
      where: {
        name: {
          contains: productName.trim(),
          mode: 'insensitive'
        },
        organizacion_id: organizationId
      },
      select: {
        id: true,
        name: true,
        category: true,
        organizacion_id: true,
        costPerUnit: true
      }
    });

    if (partialProduct) {
      let stock = 0;
      if (sedeId) {
        const stockRecord = await this.prisma.stockBySede.findFirst({
          where: {
            productId: partialProduct.id,
            sedeId: sedeId
          },
          select: { quantity: true }
        });
        stock = stockRecord?.quantity ? Number(stockRecord.quantity) : 0;
      }

      return {
        product: partialProduct,
        stock,
        searchStrategy: 'partial'
      };
    }

    return {
      product: null,
      searchStrategy: 'none',
      error: `Producto "${productName}" no encontrado con ninguna estrategia de búsqueda`
    };
  }

  /**
   * 📊 MÉTODO DE VALIDACIÓN DE STOCK
   * 
   * Valida si hay stock suficiente para un tratamiento
   */
  async validateStock(
    productId: string,
    sedeId: string,
    requiredQuantity: number
  ): Promise<{
    hasStock: boolean;
    availableStock: number;
    requiredStock: number;
    deficit?: number;
  }> {
    const stock = await this.prisma.stockBySede.findFirst({
      where: {
        productId: productId,
        sedeId: sedeId
      },
      select: { quantity: true }
    });

    const availableStock = stock?.quantity ? Number(stock.quantity) : 0;
    const hasStock = availableStock >= requiredQuantity;
    const deficit = hasStock ? 0 : requiredQuantity - availableStock;

    return {
      hasStock,
      availableStock,
      requiredStock: requiredQuantity,
      deficit
    };
  }

  /**
   * 🏥 MÉTODO DE BÚSQUEDA POR SEDE
   * 
   * Busca productos que tienen stock en una sede específica
   */
  async findProductsWithStockInSede(
    sedeId: string,
    organizationId: string,
    category?: string
  ): Promise<any[]> {
    const whereClause: any = {
      stockBySede: {
        some: {
          sedeId: sedeId,
          quantity: { gt: 0 }
        }
      },
      organizacion_id: organizationId
    };

    if (category) {
      whereClause.category = category;
    }

    return await this.prisma.product.findMany({
      where: whereClause,
      include: {
        StockBySede: {
          where: { sedeId: sedeId },
          select: { quantity: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}

/**
 * 🎯 FUNCIÓN DE UTILIDAD PARA TRATAMIENTOS
 * 
 * Esta función reemplaza la función frágil getAlergenIdByName
 * con una implementación robusta y escalable.
 */
export async function findProductForTreatment(
  prisma: PrismaClient,
  productName: string,
  organizationId: string,
  sedeId: string
): Promise<{
  productId: string;
  productName: string;
  availableStock: number;
  error?: string;
}> {
  const service = new RobustProductService(prisma);
  
  const result = await service.findProductAdvanced(
    productName,
    organizationId,
    sedeId
  );

  if (!result.product) {
    throw new Error(result.error || `Producto "${productName}" no encontrado`);
  }

  // Validar stock
  const stockValidation = await service.validateStock(
    result.product.id,
    sedeId,
    0.01 // Mínimo requerido
  );

  if (!stockValidation.hasStock) {
    throw new Error(
      `Stock insuficiente para "${productName}": ` +
      `disponible ${stockValidation.availableStock}, ` +
      `requerido ${stockValidation.requiredStock}`
    );
  }

  return {
    productId: result.product.id,
    productName: result.product.name,
    availableStock: stockValidation.availableStock
  };
}

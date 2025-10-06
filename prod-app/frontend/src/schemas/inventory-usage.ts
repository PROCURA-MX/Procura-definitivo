import { z } from 'zod'
import { TipoTratamiento } from '@/types/inventory'

// Schema for a single detail item in the inventory usage record
const inventoryUsageDetailSchema = z.object({
  subtipo: z.string().min(1),
  productId: z.string().min(1, 'El ID del producto es requerido'), // CAMBIO: usar productId en lugar de nombreProducto
  cantidad: z.number().int().min(1),
  frasco: z.string().optional(),
  alergenos: z.array(z.string()).optional(),
  doses: z.number().int().optional(),
})

// Main schema for the entire inventory usage form submission
export const inventoryUsageSchema = z
  .object({
    nombrePaciente: z.string().min(1, { message: 'El nombre del paciente es obligatorio.' }),
    tipoTratamiento: z.nativeEnum(TipoTratamiento, {
      errorMap: () => ({ message: 'Debe seleccionar un tipo de tratamiento válido.' }),
    }),
    observaciones: z.string().optional(),
    tuvoReaccion: z.boolean({ required_error: 'Debe indicar si hubo o no una reacción.' }),
    descripcionReaccion: z.string().optional(),
    items: z.array(inventoryUsageDetailSchema).min(1, {
      message: 'Debes agregar al menos un item de uso de inventario',
    }),
    pacienteId: z.string().min(1, 'Selecciona un paciente'),
    consultorioId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tuvoReaccion) {
        return typeof data.descripcionReaccion === 'string' && data.descripcionReaccion.trim().length > 0
      }
      return true
    },
    {
      message: 'La descripción es obligatoria si indicó que hubo una reacción.',
      path: ['descripcionReaccion'],
    }
  )

export type InventoryUsageInput = z.infer<typeof inventoryUsageSchema>
export type InventoryUsageDetailInput = z.infer<
  typeof inventoryUsageDetailSchema
> 
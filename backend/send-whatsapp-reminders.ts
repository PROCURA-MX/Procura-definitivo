import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import * as dotenv from 'dotenv'
import twilio from 'twilio'

dotenv.config()

const prisma = new PrismaClient()
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

async function main() {
  // Calcular fechas de mañana
  const now = new Date()
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0)

  // Buscar citas de mañana
  const citas = await prisma.citas.findMany({
    where: {
      fecha_inicio: {
        gte: startOfTomorrow,
        lt: endOfTomorrow
      }
    },
    include: { pacientes: true }
  })

  for (const cita of citas) {
    const paciente = cita.pacientes
    if (!paciente?.telefono) continue

    const fecha = format(cita.fecha_inicio, "PPPP 'a las' p", { locale: es })
    const mensaje = `Hola ${paciente.nombre}, te recordamos tu cita en ProCura el ${fecha}. Si tienes dudas, contáctanos.`
    const to = `whatsapp:${paciente.telefono}`

    try {
      const res = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to,
        body: mensaje
      })
      console.log(`Mensaje enviado a ${paciente.nombre} (${paciente.telefono}): ${res.sid}`)
    } catch (err) {
      console.error(`Error enviando a ${paciente.telefono}:`, err)
    }
  }
  await prisma.$disconnect()
}

main()
  .then(() => console.log('Recordatorios enviados'))
  .catch(console.error) 
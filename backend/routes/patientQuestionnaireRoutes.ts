import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { issueQuestionnaireToken, verifyQuestionnaireToken, markJtiUsed } from '../services/patient-questionnaire-token'
import { authenticateMultiTenant } from '../middleware/tenantMiddleware'

// Crear instancia de PrismaClient directamente
const prisma = new PrismaClient()

const router = Router()

// Emite enlace y envía email (autenticado por staff)
router.post('/issue-link', authenticateMultiTenant, async (req, res) => {
  try {
    const { patientId, expiresIn } = req.body || {}
    if (!patientId) {
      res.status(400).json({ success: false, error: 'patientId requerido' })
      return
    }
    const orgId = (req as any).tenantFilter?.organizacion_id
    if (!orgId) {
      res.status(400).json({ success: false, error: 'orgId no disponible' })
      return
    }

    // Obtener datos del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: patientId },
      select: { id: true, nombre: true, apellido: true, email: true }
    })

    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente no encontrado' })
      return
    }

    if (!paciente.email) {
      res.status(400).json({ success: false, error: 'El paciente no tiene email configurado' })
      return
    }

    const token = issueQuestionnaireToken({ patientId, orgId, expiresIn })
    const urlBase = process.env.PUBLIC_APP_URL || 'http://localhost:5173'
    const url = `${urlBase}/cuestionario?token=${encodeURIComponent(token)}`

    // Enviar email con el cuestionario
    try {
      const { EmailService } = await import('../services/emailService')
      const userId = (req as any).user?.id || 'system'
      
      const emailResult = await EmailService.sendPatientQuestionnaireEmail({
        pacienteNombre: `${paciente.nombre} ${paciente.apellido}`.trim(),
        pacienteEmail: paciente.email,
        consultorioNombre: 'ProCura',
        usuarioId: userId,
        pacienteId: paciente.id,
        questionnaireUrl: url
      })

      if (emailResult.success) {
        console.log(`📧 Cuestionario reenviado exitosamente a ${paciente.email}`)
        res.json({ success: true, url, token, emailSent: true, messageId: emailResult.messageId })
      } else {
        console.error('❌ Error enviando email:', emailResult.error)
        res.json({ success: true, url, token, emailSent: false, emailError: emailResult.error })
      }
    } catch (emailError) {
      console.error('❌ Error crítico enviando email:', emailError)
      res.json({ success: true, url, token, emailSent: false, emailError: 'Error enviando email' })
    }
  } catch (err) {
    console.error('issue-link error', err)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

// Crea sesión efímera (público)
router.post('/session', async (req, res) => {
  try {
    const { token } = req.body || {}
    if (!token) {
      res.status(400).json({ success: false, error: 'token requerido' })
      return
    }
    const payload = verifyQuestionnaireToken(token)
    // Datos mínimos del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: payload.sub },
      select: { id: true, nombre: true, apellido: true }
    })
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente no encontrado' })
      return
    }
    // Nota: podemos devolver un esquema si existe; por ahora metadatos
    res.json({ success: true, session: { jti: payload.jti, patientId: payload.sub, orgId: payload.orgId }, paciente })
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' })
  }
})

// Envía respuestas (público)
router.post('/submit', async (req, res) => {
  try {
    const { token, answers } = req.body || {}
    if (!token || !answers) {
      res.status(400).json({ success: false, error: 'token y answers requeridos' })
      return
    }
    const payload = verifyQuestionnaireToken(token)
    await prisma.questionnaire_responses.create({
      data: {
        patient_id: payload.sub,
        org_id: payload.orgId,
        answers,
        source: 'patient-link'
      }
    })
    // invalidar jti (en memoria)
    markJtiUsed(payload.jti)
    res.json({ success: true })
  } catch (err) {
    console.error('submit error', err)
    res.status(401).json({ success: false, error: 'Token inválido o expirado' })
  }
})

// Obtener datos para PDF (staff)
router.get('/pdf-data', authenticateMultiTenant, async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) {
      res.status(400).json({ success: false, error: 'patientId requerido' })
      return
    }
    
    // Obtener datos del paciente y respuesta
    const [paciente, respuesta] = await Promise.all([
      prisma.paciente.findUnique({
        where: { id: patientId },
        select: { id: true, nombre: true, apellido: true, email: true }
      }),
      prisma.questionnaire_responses.findFirst({
        where: { patient_id: patientId },
        orderBy: { created_at: 'desc' }
      } as any)
    ])
    
    if (!paciente || !respuesta) {
      res.status(404).json({ success: false, error: 'Datos no encontrados' })
      return
    }
    
    res.json({
      success: true,
      data: {
        paciente: {
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          email: paciente.email
        },
        respuesta: {
          answers: respuesta.answers,
          created_at: respuesta.created_at
        }
      }
    })
  } catch (err) {
    console.error('pdf-data error', err)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

export default router

// Última respuesta (staff)
router.get('/last', authenticateMultiTenant, async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) {
      res.status(400).json({ success: false, error: 'patientId requerido' })
      return
    }
    const row = await prisma.questionnaire_responses.findFirst({
      where: { patient_id: patientId },
      orderBy: { created_at: 'desc' }
    } as any)
    if (!row) {
      res.json({ success: true, data: null })
      return
    }
    res.json({ success: true, data: row })
  } catch (err) {
    console.error('last error', err)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})



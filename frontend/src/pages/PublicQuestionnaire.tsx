import { useEffect, useMemo, useState } from 'react'
import CuestionarioPacientes from '@/components/CuestionarioPacientes'

function PublicQuestionnaire() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pacienteName, setPacienteName] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)
  const [prefill, setPrefill] = useState<any>(null)

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setError('Enlace inválido')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/patient-questionnaire/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        if (!res.ok) throw new Error('Token inválido o expirado')
        const data = await res.json()
        const nombre = [data?.paciente?.nombre, data?.paciente?.apellido].filter(Boolean).join(' ')
        setPacienteName(nombre || 'Paciente')
        // Si el backend decide devolver respuestas previas, podríamos mapearlas aquí
      } catch (e: any) {
        setError(e?.message || 'No se pudo iniciar el cuestionario')
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [token])

  async function handleSubmit(datos: any) {
    try {
      setLoading(true)
      setError(null)
      const payload = {
        token,
        answers: {
          version: 1,
          respuestas: datos.respuestas,
          firma: datos.firma,
          aceptaTerminos: datos.aceptaTerminos,
          aceptaPrivacidad: datos.aceptaPrivacidad
        }
      }
      const res = await fetch('/api/patient-questionnaire/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'No se pudo enviar')
      setSubmitted(true)
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar el cuestionario')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">Cargando…</div>
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow p-6 rounded">
        <h1 className="text-xl font-semibold text-red-600 mb-2">No se pudo abrir el cuestionario</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  )
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow p-6 rounded">
        <h1 className="text-xl font-bold text-green-700">¡Gracias!</h1>
        <p className="text-gray-700 mt-2">Hemos recibido tu cuestionario correctamente.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white shadow rounded p-4">
        <h1 className="text-2xl font-bold text-gray-900">Cuestionario de Pacientes</h1>
        <p className="text-gray-600 mt-1">{pacienteName}</p>
        <div className="mt-4">
          <CuestionarioPacientes
            embedded
            pacienteId={''}
            initialData={prefill || {}}
            onGuardar={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

export default PublicQuestionnaire



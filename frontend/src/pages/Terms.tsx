export default function Terms() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-600 mb-6">Términos de Servicio</h1>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar ProCura, aceptas estar sujeto a estos Términos de Servicio y a todas las 
            leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, 
            no debes utilizar nuestro servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Descripción del servicio</h2>
          <p>
            ProCura es una plataforma de gestión médica que proporciona herramientas para:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Gestión de pacientes y citas médicas</li>
            <li>Control de inventario médico</li>
            <li>Facturación y cobros</li>
            <li>Historial médico y reportes</li>
            <li>Integración con calendarios y sistemas de pago</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Uso apropiado</h2>
          <p>
            Te comprometes a utilizar ProCura únicamente para fines legales y de acuerdo con estos términos. 
            No debes:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Utilizar el servicio para actividades ilegales o no autorizadas</li>
            <li>Intentar acceder a cuentas de otros usuarios</li>
            <li>Interferir con el funcionamiento del servicio</li>
            <li>Transmitir virus, malware o código malicioso</li>
            <li>Violar cualquier ley o regulación aplicable</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Cuenta de usuario</h2>
          <p>
            Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. 
            Aceptas la responsabilidad por todas las actividades que ocurran bajo tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Privacidad y protección de datos</h2>
          <p>
            Tu privacidad es importante para nosotros. El uso de tu información personal se rige por nuestra 
            <a href="/privacy" className="text-purple-600 hover:underline"> Política de Privacidad</a>, 
            que forma parte integral de estos términos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Disponibilidad del servicio</h2>
          <p>
            Nos esforzamos por mantener ProCura disponible las 24 horas del día, pero no garantizamos 
            disponibilidad ininterrumpida. Podemos realizar mantenimiento programado o no programado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Limitación de responsabilidad</h2>
          <p>
            ProCura se proporciona "tal como está". No garantizamos que el servicio sea libre de errores 
            o interrupciones. Nuestra responsabilidad se limita al máximo permitido por la ley.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. 
            Los cambios entrarán en vigor inmediatamente después de su publicación en esta página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Terminación</h2>
          <p>
            Podemos suspender o terminar tu acceso al servicio en cualquier momento, 
            con o sin causa, con o sin previo aviso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos en:
          </p>
          <div className="mt-2">
            <p><strong>Email:</strong> healthincsystems@gmail.com</p>
            <p><strong>Sitio web:</strong> https://app.tuprocura.com</p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>
    </div>
  );
}

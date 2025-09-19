export default function Privacy() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-600 mb-6">Política de Privacidad</h1>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Información que recopilamos</h2>
          <p>
            Recopilamos información que nos proporcionas directamente, como tu nombre, dirección de correo electrónico, 
            información de contacto y datos médicos necesarios para brindar nuestros servicios de salud.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Cómo utilizamos tu información</h2>
          <p>
            Utilizamos tu información personal para:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Brindar servicios médicos y de atención al paciente</li>
            <li>Gestionar citas y recordatorios</li>
            <li>Procesar pagos y facturación</li>
            <li>Comunicarnos contigo sobre tu atención médica</li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Compartir información</h2>
          <p>
            No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto cuando:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Sea necesario para tu tratamiento médico</li>
            <li>Lo requiera la ley</li>
            <li>Haya dado tu consentimiento explícito</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Seguridad de los datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tu información 
            personal contra acceso no autorizado, alteración, divulgación o destrucción.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Tus derechos</h2>
          <p>
            Tienes derecho a acceder, corregir, actualizar o solicitar la eliminación de tu información personal. 
            Para ejercer estos derechos, contáctanos en: <strong>healthincsystems@gmail.com</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios 
            significativos publicando la nueva política en esta página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en:
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

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getUsuarios } from '../services/usuariosService';
import { DialogDatePicker } from './ui/dialog-date-picker';
// import { Separator } from './ui/separator';
// import { Badge } from './ui/badge';

interface Pregunta {
  id: string;
  tipo: 'texto' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'fecha' | 'checkbox_textarea';
  pregunta: string;
  opciones?: string[];
  requerida: boolean;
  seccion: string;
  orden: number;
}

interface Respuesta {
  preguntaId: string;
  respuesta: string | boolean | string[];
}

interface CuestionarioPacientesProps {
  embedded?: boolean;
  pacienteId?: string;
  onGuardar?: (datos: any) => void;
}

export default function CuestionarioPacientes({ embedded = false, pacienteId, onGuardar }: CuestionarioPacientesProps) {
  const [validaciones, setValidaciones] = useState<{[key: string]: {valido: boolean, mensaje: string}}>({});
  const [preguntas, setPreguntas] = useState<Pregunta[]>([
    // Información Personal
    {
      id: 'nombre',
      tipo: 'texto',
      pregunta: 'Nombre completo',
      requerida: true,
      seccion: 'Información Personal',
      orden: 1
    },
    {
      id: 'fecha_nacimiento',
      tipo: 'fecha',
      pregunta: 'Fecha de nacimiento',
      requerida: true,
      seccion: 'Información Personal',
      orden: 2
    },
    {
      id: 'edad',
      tipo: 'texto',
      pregunta: 'Edad',
      requerida: true,
      seccion: 'Información Personal',
      orden: 3
    },
    {
      id: 'sexo',
      tipo: 'select',
      pregunta: 'Sexo',
      opciones: ['Masculino', 'Femenino', 'Otro'],
      requerida: true,
      seccion: 'Información Personal',
      orden: 4
    },
    {
      id: 'estado_civil',
      tipo: 'select',
      pregunta: 'Estado civil',
      opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'],
      requerida: true,
      seccion: 'Información Personal',
      orden: 5
    },
    {
      id: 'ocupacion',
      tipo: 'texto',
      pregunta: 'Ocupación',
      requerida: true,
      seccion: 'Información Personal',
      orden: 6
    },
    {
      id: 'calle',
      tipo: 'texto',
      pregunta: 'Calle y número',
      requerida: true,
      seccion: 'Información Personal',
      orden: 7
    },
    {
      id: 'colonia',
      tipo: 'texto',
      pregunta: 'Colonia',
      requerida: true,
      seccion: 'Información Personal',
      orden: 8
    },
    {
      id: 'ciudad',
      tipo: 'texto',
      pregunta: 'Ciudad',
      requerida: true,
      seccion: 'Información Personal',
      orden: 9
    },
    {
      id: 'estado',
      tipo: 'texto',
      pregunta: 'Estado',
      requerida: true,
      seccion: 'Información Personal',
      orden: 10
    },
    {
      id: 'codigo_postal',
      tipo: 'texto',
      pregunta: 'Código Postal',
      requerida: true,
      seccion: 'Información Personal',
      orden: 11
    },
    {
      id: 'telefono',
      tipo: 'texto',
      pregunta: 'Teléfono',
      requerida: true,
      seccion: 'Información Personal',
      orden: 12
    },
    {
      id: 'email',
      tipo: 'texto',
      pregunta: 'Correo electrónico',
      requerida: false,
      seccion: 'Información Personal',
      orden: 13
    },

    // Información de Emergencia
    {
      id: 'contacto_emergencia',
      tipo: 'texto',
      pregunta: 'Nombre del contacto de emergencia',
      requerida: true,
      seccion: 'Información de Emergencia',
      orden: 14
    },
    {
      id: 'telefono_emergencia',
      tipo: 'texto',
      pregunta: 'Teléfono del contacto de emergencia',
      requerida: true,
      seccion: 'Información de Emergencia',
      orden: 15
    },
    {
      id: 'parentesco_emergencia',
      tipo: 'texto',
      pregunta: 'Parentesco con el contacto de emergencia',
      requerida: true,
      seccion: 'Información de Emergencia',
      orden: 16
    },

    // Antecedentes Familiares
    {
      id: 'rinitis_familiar',
      tipo: 'checkbox',
      pregunta: '¿Padre, madre o hermanos con rinitis?',
      requerida: false,
      seccion: 'Antecedentes Familiares (Padre, Madre, Hermanos)',
      orden: 17
    },
    {
      id: 'asma_familiar',
      tipo: 'checkbox',
      pregunta: '¿Padre, madre o hermanos con asma?',
      requerida: false,
      seccion: 'Antecedentes Familiares (Padre, Madre, Hermanos)',
      orden: 18
    },
    {
      id: 'enfermedad_autoinmune_familiar',
      tipo: 'checkbox',
      pregunta: '¿Padre, madre o hermanos con alguna enfermedad autoinmune?',
      requerida: false,
      seccion: 'Antecedentes Familiares (Padre, Madre, Hermanos)',
      orden: 19
    },
    {
      id: 'eccema_familiar',
      tipo: 'checkbox',
      pregunta: '¿Padre, madre o hermanos con eccema?',
      requerida: false,
      seccion: 'Antecedentes Familiares (Padre, Madre, Hermanos)',
      orden: 20
    },
    {
      id: 'dermatitis_atopica_familiar',
      tipo: 'checkbox',
      pregunta: '¿Padre, madre o hermanos con dermatitis atópica?',
      requerida: false,
      seccion: 'Antecedentes Familiares (Padre, Madre, Hermanos)',
      orden: 21
    },
    {
      id: 'otras_enfermedades_familiares',
      tipo: 'checkbox',
      pregunta: '¿Hay alguna otra enfermedad importante en su familia?',
      requerida: false,
      seccion: 'Antecedentes Familiares (Padre, Madre, Hermanos)',
      orden: 22
    },

    // A. Personales Patológicos
    {
      id: 'es_alergico',
      tipo: 'checkbox',
      pregunta: '¿Es alérgico?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 23
    },
    {
      id: 'toma_medicamentos',
      tipo: 'checkbox',
      pregunta: '¿Se encuentra tomando algún medicamento o suplemento alimenticio?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 24
    },
    {
      id: 'reaccion_vacuna',
      tipo: 'checkbox',
      pregunta: '¿Tuvo alguna reacción importante con alguna vacuna?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 25
    },
    {
      id: 'es_diabetico',
      tipo: 'checkbox',
      pregunta: '¿Es diabético?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 26
    },
    {
      id: 'presion_alta',
      tipo: 'checkbox',
      pregunta: '¿En alguna ocasión le han detectado alta la presión?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 27
    },
    {
      id: 'es_asmatico',
      tipo: 'checkbox',
      pregunta: '¿Es asmático?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 28
    },
    {
      id: 'estornuda_manana',
      tipo: 'checkbox',
      pregunta: '¿Estornuda y le fluye mucho la nariz por las mañanas?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 29
    },
    {
      id: 'enfermedades_importantes',
      tipo: 'textarea',
      pregunta: 'Excluyendo las cirugías u operaciones, ¿Qué enfermedades importantes ha tenido? (especifique año)',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 30
    },
    {
      id: 'operacion_cirugia',
      tipo: 'checkbox',
      pregunta: '¿Le han practicado alguna operación o cirugía?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 31
    },
    {
      id: 'transfusiones_sanguineas',
      tipo: 'checkbox',
      pregunta: '¿Ha recibido transfusiones sanguíneas?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 32
    },
    {
      id: 'hepatitis',
      tipo: 'checkbox',
      pregunta: '¿Ha tenido Hepatitis?',
      requerida: false,
      seccion: 'A. Personales Patológicos',
      orden: 33
    },

    // A. Personales NO Patológicos
    {
      id: 'actualmente_fuma',
      tipo: 'checkbox',
      pregunta: '¿Actualmente fuma?',
      requerida: false,
      seccion: 'A. Personales NO Patológicos',
      orden: 34
    },
    {
      id: 'convive_animales',
      tipo: 'checkbox',
      pregunta: '¿Convive con animales / mascotas?',
      requerida: false,
      seccion: 'A. Personales NO Patológicos',
      orden: 35
    },
    {
      id: 'tipo_sangre',
      tipo: 'select',
      pregunta: '¿Cuál es su tipo de sangre?',
      opciones: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sé'],
      requerida: false,
      seccion: 'A. Personales NO Patológicos',
      orden: 36
    },

    // Hábitos y Estilo de Vida
    {
      id: 'fuma',
      tipo: 'radio',
      pregunta: '¿Fuma?',
      opciones: ['Sí', 'No', 'Ex fumador'],
      requerida: true,
      seccion: 'Hábitos y Estilo de Vida',
      orden: 37
    },
    {
      id: 'alcohol',
      tipo: 'radio',
      pregunta: '¿Consume alcohol?',
      opciones: ['Sí', 'No', 'Ocasionalmente'],
      requerida: true,
      seccion: 'Hábitos y Estilo de Vida',
      orden: 38
    },
    {
      id: 'ejercicio',
      tipo: 'radio',
      pregunta: '¿Realiza ejercicio regularmente?',
      opciones: ['Sí', 'No', 'Ocasionalmente'],
      requerida: true,
      seccion: 'Hábitos y Estilo de Vida',
      orden: 39
    },
    {
      id: 'dieta_especial',
      tipo: 'textarea',
      pregunta: '¿Sigue alguna dieta especial?',
      requerida: false,
      seccion: 'Hábitos y Estilo de Vida',
      orden: 40
    },

    // Motivo de consulta
    {
      id: 'motivo_consulta',
      tipo: 'textarea',
      pregunta: 'Comparte tus síntomas o cualquier detalle importante que el médico deba conocer',
      requerida: true,
      seccion: 'Motivo de consulta',
      orden: 41
    }
  ]);

  // Funciones de validación
  const validarCalle = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'La calle es requerida' };
    }
    if (valor.length < 5) {
      return { valido: false, mensaje: 'La calle debe tener al menos 5 caracteres' };
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s#.-]+$/.test(valor)) {
      return { valido: false, mensaje: 'La calle contiene caracteres no válidos' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarColonia = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'La colonia es requerida' };
    }
    if (valor.length < 3) {
      return { valido: false, mensaje: 'La colonia debe tener al menos 3 caracteres' };
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/.test(valor)) {
      return { valido: false, mensaje: 'La colonia contiene caracteres no válidos' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarCiudad = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'La ciudad es requerida' };
    }
    if (valor.length < 2) {
      return { valido: false, mensaje: 'La ciudad debe tener al menos 2 caracteres' };
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
      return { valido: false, mensaje: 'La ciudad solo debe contener letras' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarEstado = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'El estado es requerido' };
    }
    if (valor.length < 2) {
      return { valido: false, mensaje: 'El estado debe tener al menos 2 caracteres' };
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
      return { valido: false, mensaje: 'El estado solo debe contener letras' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarCodigoPostal = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'El código postal es requerido' };
    }
    if (!/^\d{5}$/.test(valor)) {
      return { valido: false, mensaje: 'El código postal debe tener 5 dígitos' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarTelefono = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'El teléfono es requerido' };
    }
    if (!/^\d{10}$/.test(valor.replace(/\D/g, ''))) {
      return { valido: false, mensaje: 'El teléfono debe tener 10 dígitos' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarEmail = (valor: string) => {
    if (!valor.trim()) {
      return { valido: false, mensaje: 'El email es requerido' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valor)) {
      return { valido: false, mensaje: 'El email no tiene un formato válido' };
    }
    return { valido: true, mensaje: '' };
  };

  const validarCampo = (campoId: string, valor: string) => {
    switch (campoId) {
      case 'calle':
        return validarCalle(valor);
      case 'colonia':
        return validarColonia(valor);
      case 'ciudad':
        return validarCiudad(valor);
      case 'estado':
        return validarEstado(valor);
      case 'codigo_postal':
        return validarCodigoPostal(valor);
      case 'telefono':
        return validarTelefono(valor);
      case 'email':
        return validarEmail(valor);
      default:
        return { valido: true, mensaje: '' };
    }
  };

  // Función para generar el aviso de privacidad dinámico
  const generarAvisoPrivacidad = async () => {
    // Datos del paciente
    const nombrePaciente = getRespuesta('nombre') || '_________________';
    const domicilioPaciente = `${getRespuesta('calle') || '_________________'} ${getRespuesta('colonia') || '_________________'} ${getRespuesta('ciudad') || '_________________'} ${getRespuesta('estado') || '_________________'} ${getRespuesta('codigo_postal') || '_________________'}`;
    const telefonoPaciente = getRespuesta('telefono') || '_________________';
    const emailPaciente = getRespuesta('email') || '_________________';
    
    // Obtener datos del doctor desde la base de datos
    let datosDoctor = {
      nombre: 'Dr. Nombre Apellido',
      especialidad: 'Médico General',
      domicilioConsultorio: 'Dirección del consultorio',
      telefonoConsultorio: 'Teléfono del consultorio',
      emailConsultorio: 'Email del consultorio',
      whatsapp: 'WhatsApp',
      cedulaProfesional: 'Cédula profesional',
      rfc: 'RFC',
      paginaWeb: 'Página web'
    };
    
    try {
      const usuarios = await getUsuarios();
      const doctor = usuarios.find((u: any) => u.rol === 'DOCTOR');
      if (doctor) {
        datosDoctor = {
          nombre: `Dr. ${doctor.nombre} ${doctor.apellido}`,
          especialidad: 'Médico General',
          domicilioConsultorio: doctor.consultorio?.direccion || 'Dirección del consultorio',
          telefonoConsultorio: doctor.telefono || 'Teléfono del consultorio',
          emailConsultorio: doctor.email || 'Email del consultorio',
          whatsapp: doctor.telefono || 'WhatsApp',
          cedulaProfesional: 'Cédula profesional',
          rfc: 'RFC',
          paginaWeb: 'Página web'
        };
      }
    } catch (error) {
      console.error('Error al obtener datos del doctor:', error);
    }
    
    return `
AVISO DE PRIVACIDAD

Identidad y Domicilio del Responsable
${datosDoctor.nombre}, ${datosDoctor.especialidad}, (en adelante, el(la) «Responsable» y/o su «Médico») dedicado a la prestación de servicios profesionales médicos, recaba sus datos personales, incluyendo los sensibles, como parte de una relación profesional y para efectos del cumplimiento de sus obligaciones, por lo que en respeto al derecho de toda persona a la privacidad y a la autodeterminación informativa, se pone a su disposición el presente Aviso de Privacidad.

Domicilio del Responsable: ${datosDoctor.domicilioConsultorio}
Teléfono: ${datosDoctor.telefonoConsultorio}
Email: ${datosDoctor.emailConsultorio}
Cédula Profesional: ${datosDoctor.cedulaProfesional}
RFC: ${datosDoctor.rfc}

La recolección, obtención, uso, almacenamiento, acceso, tratamiento y transferencia de datos personales por parte del Médico se encuentran sujetos a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su reglamento y lineamientos emitidos por el INAI.

Al proporcionar información al Médico por cualquier medio (verbal o por escrito, ya sea por medios físicos o electrónicos), usted confirma que está de acuerdo con los términos de este Aviso de Privacidad.

Datos Personales que se Recaban
Con el fin de prestarle nuestros servicios, podemos requerir de usted la siguiente información:
• Nombre del paciente y/o de quien lo representa
• Firma del paciente y/o de quien lo representa
• Identificación oficial
• Información de facturación
• Teléfono
• Dirección
• Dirección de correo electrónico
• Nombre de contacto de emergencia
• Datos Sensibles como: tipo de sangre, historial clínico, enfermedades, padecimientos, alergias, información genética, tratamientos médicos, estado de salud presente, cuestiones de carácter psicológico y/o psiquiátrico

Finalidades Primarias
Su médico(a) recaba sus datos personales para proteger, promover y recuperar la salud del titular de los datos, a fin de:
• Conocer su historial, antecedentes y condiciones médicas
• Prestar la atención médica más apta para sus necesidades particulares
• Compartir información necesaria para emergencias médicas
• Elaborar expediente de paciente
• Solicitar estudios y análisis
• Notificar citas programadas
• Facturación y cobranza
• Notificar sobre medicamentos recetados
• Atender emergencias médicas
• Cumplir requerimientos legales

Finalidades Secundarias
• Hacerle llegar información y promociones importantes para el cuidado de su salud

Transferencia de Datos
Sus datos personales se transferirán:
• A otros médicos especialistas cuando sea necesario
• A instituciones relacionadas con el sector salud
• A aseguradoras en caso de tener póliza contratada
• Para dar cumplimiento a disposiciones oficiales

Derechos ARCO
Usted tiene derecho a:
• Acceso: Conocer qué datos personales tiene su médico y para qué los utiliza
• Rectificación: Corregir información inexacta o incompleta
• Cancelación: Solicitar que se eliminen sus datos
• Oposición: Oponerse al uso de sus datos para fines específicos

Para ejercitar sus derechos ARCO puede contactar a:
• Email: ${datosDoctor.emailConsultorio}
• WhatsApp: ${datosDoctor.whatsapp}
• Teléfono: ${datosDoctor.telefonoConsultorio}
• Domicilio: ${datosDoctor.domicilioConsultorio}

Conservación de Datos
En caso de cambiar de médico, se le proporcionará su expediente electrónico.

Para cumplir con los anteriores fines yo, ${nombrePaciente}; con domicilio en ${domicilioPaciente}; con número de teléfono ${telefonoPaciente}; y con dirección de correo electrónico ${emailPaciente}, mediante mi firma autógrafa, manifiesto expresamente que:
(i) Estoy enterado de los términos del presente aviso de privacidad;
(ii) Otorgo las autorizaciones señaladas; y
(iii) Doy mi autorización expresa para que mis datos personales incluyendo los sensibles, se traten de conformidad con el presente.

${datosDoctor.nombre}
Cédula Profesional: ${datosDoctor.cedulaProfesional}
Última revisión: ${new Date().toLocaleDateString('es-ES')}

Firma del Paciente / Responsable: ${nombrePaciente}
    `;
  };

  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [firma, setFirma] = useState<string>('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [showAvisoPrivacidad, setShowAvisoPrivacidad] = useState(false);
  const [avisoPrivacidadTexto, setAvisoPrivacidadTexto] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [preguntaEditando, setPreguntaEditando] = useState<Pregunta | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);

  // Agrupar preguntas por sección
  const preguntasPorSeccion = preguntas.reduce((acc, pregunta) => {
    if (!acc[pregunta.seccion]) {
      acc[pregunta.seccion] = [];
    }
    acc[pregunta.seccion].push(pregunta);
    return acc;
  }, {} as Record<string, Pregunta[]>);

  // Ordenar preguntas dentro de cada sección
  Object.keys(preguntasPorSeccion).forEach(seccion => {
    preguntasPorSeccion[seccion].sort((a, b) => a.orden - b.orden);
  });

  const handleRespuestaChange = (preguntaId: string, valor: string | boolean | string[]) => {
    setRespuestas(prev => {
      const index = prev.findIndex(r => r.preguntaId === preguntaId);
      if (index >= 0) {
        const nuevas = [...prev];
        nuevas[index] = { preguntaId, respuesta: valor };
        return nuevas;
      } else {
        return [...prev, { preguntaId, respuesta: valor }];
      }
    });

    // Validación en tiempo real para campos de texto
    if (typeof valor === 'string') {
      const validacion = validarCampo(preguntaId, valor);
      setValidaciones(prev => ({
        ...prev,
        [preguntaId]: validacion
      }));
    }
  };

  const getRespuesta = (preguntaId: string) => {
    const respuesta = respuestas.find(r => r.preguntaId === preguntaId);
    return respuesta?.respuesta || '';
  };

  // Handler especial para fecha de nacimiento
  const handleFechaNacimientoChange = (date: Date | null) => {
    setFechaNacimiento(date);
    if (date) {
      const fechaString = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
      handleRespuestaChange('fecha_nacimiento', fechaString);
    } else {
      handleRespuestaChange('fecha_nacimiento', '');
    }
  };

  // Inicializar fecha de nacimiento desde respuestas existentes
  useEffect(() => {
    const fechaRespuesta = getRespuesta('fecha_nacimiento');
    if (fechaRespuesta && typeof fechaRespuesta === 'string') {
      setFechaNacimiento(new Date(fechaRespuesta));
    }
  }, [respuestas]);

  // Funcionalidad de firma digital
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    setFirma(canvas.toDataURL());
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirma('');
  };

  const renderizarPregunta = (pregunta: Pregunta) => {
    const valor = getRespuesta(pregunta.id);

    switch (pregunta.tipo) {
      case 'texto':
        const validacion = validaciones[pregunta.id];
        const esValido = validacion ? validacion.valido : true;
        const mensajeError = validacion ? validacion.mensaje : '';
        
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label htmlFor={pregunta.id} className="text-lg font-semibold text-gray-700">
              {pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={pregunta.id}
              value={valor as string}
              onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
              placeholder="Escriba su respuesta"
              className={`text-lg bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 ${
                !esValido && valor ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {!esValido && valor && (
              <p className="text-red-500 text-sm mt-1">{mensajeError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label htmlFor={pregunta.id} className="text-lg font-semibold text-gray-700">
              {pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={pregunta.id}
              value={valor as string}
              onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
              placeholder="Escriba su respuesta"
              className="text-lg min-h-[100px] bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Checkbox
                checked={valor as boolean}
                onCheckedChange={(checked) => handleRespuestaChange(pregunta.id, checked as boolean)}
              />
              <span>{pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}</span>
            </Label>
          </div>
        );

      case 'radio':
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label className="text-lg font-semibold text-gray-700">
              {pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {pregunta.opciones?.map((opcion) => (
                <Label key={opcion} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={pregunta.id}
                    value={opcion}
                    checked={valor === opcion}
                    onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{opcion}</span>
                </Label>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label htmlFor={pregunta.id} className="text-lg font-semibold text-gray-700">
              {pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}
            </Label>
            <select
              id={pregunta.id}
              value={valor as string}
              onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none"
            >
              <option value="">Seleccione una opción</option>
              {pregunta.opciones?.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        );

      case 'fecha':
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label htmlFor={pregunta.id} className="text-lg font-semibold text-gray-700">
              {pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}
            </Label>
            <DialogDatePicker
              selected={pregunta.id === 'fecha_nacimiento' ? fechaNacimiento : null}
              onChange={pregunta.id === 'fecha_nacimiento' ? handleFechaNacimientoChange : (date) => {
                if (date) {
                  const fechaString = date.toISOString().split('T')[0];
                  handleRespuestaChange(pregunta.id, fechaString);
                } else {
                  handleRespuestaChange(pregunta.id, '');
                }
              }}
              placeholder={`Seleccionar ${pregunta.pregunta.toLowerCase()}`}
              className="text-lg"
              enableQuickNavigation={true}
              yearRange={pregunta.id === 'fecha_nacimiento' ? 'past' : 'both'}
            />
          </div>
        );

      case 'checkbox_textarea':
        const isChecked = valor === true || (typeof valor === 'string' && valor === 'true');
        return (
          <div key={pregunta.id} className="space-y-2">
            <Label className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => handleRespuestaChange(pregunta.id, checked as boolean)}
              />
              <span>{pregunta.pregunta} {pregunta.requerida && <span className="text-red-500">*</span>}</span>
            </Label>
            {isChecked && (
              <Textarea
                id={`${pregunta.id}_texto`}
                value={getRespuesta(`${pregunta.id}_texto`) as string}
                onChange={(e) => handleRespuestaChange(`${pregunta.id}_texto`, e.target.value)}
                placeholder="Especifique detalles..."
                className="text-lg min-h-[100px] bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 ml-6"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const validarFormulario = () => {
    const preguntasRequeridas = preguntas.filter(p => p.requerida);
    const respuestasCompletadas = preguntasRequeridas.every(pregunta => {
      const respuesta = respuestas.find(r => r.preguntaId === pregunta.id);
      return respuesta && respuesta.respuesta !== '' && respuesta.respuesta !== false;
    });

    // Validar que todos los campos con validación personalizada sean válidos
    const camposConValidacion = ['calle', 'colonia', 'ciudad', 'estado', 'codigo_postal', 'telefono', 'email'];
    const validacionesCompletadas = camposConValidacion.every(campoId => {
      const validacion = validaciones[campoId];
      return !validacion || validacion.valido;
    });

    return respuestasCompletadas && validacionesCompletadas && aceptaTerminos && aceptaPrivacidad && firma;
  };

  const generarPDF = async () => {
    // Aquí implementaríamos la generación del PDF
    // Por ahora solo simulamos la funcionalidad
    const avisoPrivacidad = await generarAvisoPrivacidad();
    const datosCompletos = {
      pacienteId,
      fecha: new Date().toISOString(),
      respuestas,
      firma,
      aceptaTerminos,
      aceptaPrivacidad,
      avisoPrivacidad
    };

    console.log('Generando PDF con datos:', datosCompletos);
    
    // Simular generación de PDF
    alert('PDF generado exitosamente con el aviso de privacidad personalizado. En una implementación real, se guardaría el archivo.');
    
    if (onGuardar) {
      onGuardar(datosCompletos);
    }
  };

  const guardarCuestionario = () => {
    if (!validarFormulario()) {
      alert('Por favor complete todos los campos requeridos, acepte los términos y firme el documento.');
      return;
    }

    generarPDF();
  };

  return (
    <div className={`${embedded ? 'w-full' : 'max-w-4xl mx-auto'} ${embedded ? 'py-2' : 'p-6'} space-y-4`}>
      {!embedded && (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#4285f2] mb-4">Cuestionario de Pacientes</h1>
          <p className="text-lg text-gray-600">
            Por favor complete este formulario con información precisa. Los campos marcados con * son obligatorios.
          </p>
        </div>
      )}

      {/* Información del Paciente */}
      {pacienteId && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#4285f2]">Información del Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">ID del Paciente: {pacienteId}</p>
            <p className="text-gray-700">Fecha: {new Date().toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

      {/* Formulario */}
      <div className={`space-y-${embedded ? '4' : '8'}`}>
        {Object.entries(preguntasPorSeccion).map(([seccion, preguntasSeccion]) => (
          <Card key={seccion}>
            <CardHeader className={embedded ? 'pb-3' : ''}>
              <CardTitle className={`${embedded ? 'text-xl' : 'text-2xl'} font-bold text-[#4285f2]`}>{seccion}</CardTitle>
            </CardHeader>
            <CardContent className={`space-y-${embedded ? '4' : '6'}`}>
              {preguntasSeccion.map(renderizarPregunta)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Firma Digital */}
      <Card>
        <CardHeader className={embedded ? 'pb-3' : ''}>
          <CardTitle className={`${embedded ? 'text-xl' : 'text-2xl'} font-bold text-[#4285f2]`}>Firma Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Por favor firme en el área de abajo para confirmar que toda la información proporcionada es correcta.
          </p>
          
          <div className="border-2 border-gray-300 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="border border-gray-400 rounded cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          
          <div className="flex gap-4">
            <Button onClick={limpiarFirma} variant="outline" className="text-white">
              Limpiar Firma
            </Button>
            {firma && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Firma completada
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Términos y Condiciones */}
      <Card>
        <CardHeader className={embedded ? 'pb-3' : ''}>
          <CardTitle className={`${embedded ? 'text-xl' : 'text-2xl'} font-bold text-[#4285f2]`}>Términos y Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Checkbox
                checked={aceptaTerminos}
                onCheckedChange={(checked) => setAceptaTerminos(checked as boolean)}
              />
              <span className="text-lg">
                Acepto los términos y condiciones del tratamiento médico
              </span>
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Checkbox
                checked={aceptaPrivacidad}
                onCheckedChange={(checked) => setAceptaPrivacidad(checked as boolean)}
              />
              <span className="text-lg">
                Acepto el uso de mis datos personales conforme al{' '}
                <button
                  type="button"
                  onClick={async () => {
                    const aviso = await generarAvisoPrivacidad();
                    setAvisoPrivacidadTexto(aviso);
                    setShowAvisoPrivacidad(true);
                  }}
                  className="text-[#4285f2] underline hover:text-[#4285f2]/80 font-medium"
                >
                  aviso de privacidad
                </button>
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Modal del Aviso de Privacidad */}
      {showAvisoPrivacidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-[#4285f2]">Aviso de Privacidad</h2>
              <button
                onClick={() => setShowAvisoPrivacidad(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
                {avisoPrivacidadTexto}
              </pre>
            </div>
            <div className="p-6 border-t">
              <Button
                onClick={() => setShowAvisoPrivacidad(false)}
                className="bg-[#4285f2] hover:bg-[#4285f2]/90 text-white px-6 py-2"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className={`flex justify-center gap-4 ${embedded ? 'pt-4 pb-2' : 'pt-6 pb-4'}`}>
        <Button
          onClick={guardarCuestionario}
          disabled={!validarFormulario()}
          className="bg-[#4285f2] hover:bg-[#4285f2]/90 text-white px-8 py-3 text-lg font-bold"
        >
          Guardar Cuestionario
        </Button>
        
        {!embedded && (
          <Button variant="outline" className="px-8 py-3 text-lg">
            Cancelar
          </Button>
        )}
      </div>

      {/* Indicador de Validación */}
      {!validarFormulario() && (
        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 font-semibold mb-2">
            Por favor complete todos los campos requeridos, acepte los términos y firme el documento.
          </p>
          
          {/* Mostrar errores específicos de validación */}
          {Object.entries(validaciones).some(([_, validacion]) => !validacion.valido) && (
            <div className="mt-3 text-left">
              <p className="text-orange-700 font-medium mb-2">Errores de validación:</p>
              <ul className="text-sm text-orange-600 space-y-1">
                {Object.entries(validaciones)
                  .filter(([_, validacion]) => !validacion.valido)
                  .map(([campoId, validacion]) => {
                    const pregunta = preguntas.find(p => p.id === campoId);
                    return (
                      <li key={campoId} className="flex items-center">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="font-medium">{pregunta?.pregunta || campoId}:</span>
                        <span className="ml-1">{validacion.mensaje}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
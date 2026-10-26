export interface SampleDoc {
  id: string;
  name: string;
  badge: string;
  description: string;
  themeId: string;
  markdown: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'informe-ejecutivo',
    name: 'Informe Ejecutivo Trimestral',
    badge: 'Negocios',
    description: 'Reporte profesional con resumen gerencial, métricas clave, tablas financieras y recomendaciones.',
    themeId: 'executive',
    markdown: `# Informe de Desempeño Trimestral (Q3)

> **Resumen para Dirección General**: Durante el tercer trimestre fiscal, la organización alcanzó un crecimiento consolidado del **24.5%** en ingresos operativos, superando los objetivos estratégicos trazados en el plan anual.

---

## 1. Resumen Ejecutivo y Objetivos

Este informe presenta el balance consolidado de las operaciones de la compañía, destacando la adopción de nuevas líneas de productos digitales y la optimización de costes de infraestructura.

### Metas Estratégicas Cumplidas:
- **Expansión Regional**: Apertura de operaciones en 4 nuevos mercados clave en América Latina.
- **Eficiencia Operativa**: Reducción del tiempo de entrega de servicios en un **32%**.
- **Satisfacción del Cliente (CSAT)**: Índice promedio de **94.8%**, el más alto registrado en los últimos tres años.

---

## 2. Métricas e Indicadores de Rendimiento

A continuación se detallan los resultados por departamento en comparación con el periodo previo:

| Unidad de Negocio | Presupuesto (USD) | Ingresos Obtenidos | Cumplimiento | Variación Interanual |
| :--- | :---: | :---: | :---: | :--- |
| **Soluciones Cloud** | $450,000 | $580,200 | 128.9% | +38.2% 🟢 |
| **Consultoría Estratégica** | $280,000 | $315,000 | 112.5% | +14.6% 🟢 |
| **Soporte & Mantenimiento** | $160,000 | $158,400 | 99.0% | +2.1% 🟡 |
| **I+D / Inteligencia Artificial** | $200,000 | $245,000 | 122.5% | +52.0% 🟢 |

---

## 3. Iniciativas en Curso y Estado de Hitos

- [x] Migración completa a infraestructura en la nube de alta disponibilidad.
- [x] Certificación internacional de seguridad ISO 27001.
- [ ] Lanzamiento del portal de autoservicio para clientes corporativos (previsto para Noviembre).
- [ ] Negociación de alianzas estratégicas con integradores regionales.

> *"La aceleración digital y la automatización de procesos internos nos permiten escalar de manera rentable y sustentable."*  
> — **Dirección de Operaciones**

---

## 4. Conclusiones y Próximos Pasos

1. **Inversión de Capital**: Asignar un 15% adicional del excedente presupuestario al equipo de automatización.
2. **Capacitación Continua**: Iniciar el programa de formación técnica para 120 colaboradores.
3. **Revisión de Riesgos**: Concluir la auditoría de continuidad de negocio antes del cierre de Q4.

---
*Documento confidencial elaborado por la Gerencia de Finanzas y Estrategia.*
`,
  },
  {
    id: 'documentacion-tecnica',
    name: 'Especificación Técnica & API REST',
    badge: 'Tecnología',
    description: 'Documentación para desarrolladores con bloques de código, endpoints, tablas de parámetros y respuestas JSON.',
    themeId: 'tech',
    markdown: `# Guía de Integración: API v2 de Pagos y Facturación

Esta especificación técnica detalla los protocolos, métodos de autenticación y modelos de datos para la pasarela de pagos integrada.

---

## 1. Arquitectura y Autenticación

Todas las solicitudes a la API deben realizarse mediante **HTTPS** y requieren autenticación mediante un token de portador (*Bearer Token*) enviado en la cabecera HTTP:

\`\`\`http
Authorization: Bearer sk_live_948fbc20a91e45da812b
Content-Type: application/json
Accept: application/json
\`\`\`

> **Nota de Seguridad**: Nunca exponga las claves secretas en aplicaciones cliente o repositorios públicos.

---

## 2. Endpoints Principales

### Crear una Intención de Pago

\`POST /api/v2/payment-intents\`

Permite inicializar una transacción segura y recibir el identificador de procesamiento.

#### Parámetros del Request Body:

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| \`amount\` | \`integer\` | **Sí** | Monto expresado en la unidad mínima (ej. centavos). |
| \`currency\` | \`string\` | **Sí** | Código de moneda ISO 4217 de 3 letras (\`USD\`, \`EUR\`, \`MXN\`). |
| \`customer_id\` | \`string\` | Opcional | Identificador único del cliente registrado. |
| \`description\` | \`string\` | Opcional | Detalle informativo reflejado en el recibo. |

#### Ejemplo de Código (TypeScript / Node.js):

\`\`\`typescript
import axios from 'axios';

async function crearPago(monto: number, moneda: string) {
  const respuesta = await axios.post(
    'https://api.empresa.com/v2/payment-intents',
    {
      amount: monto * 100,
      currency: moneda,
      description: 'Suscripción mensual Pro'
    },
    {
      headers: {
        'Authorization': \`Bearer \${process.env.API_SECRET_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  return respuesta.data;
}
\`\`\`

#### Respuesta Exitosa (\`201 Created\`):

\`\`\`json
{
  "id": "pi_3Mtwx2LkdIwHu7ix28a3tqZf",
  "object": "payment_intent",
  "amount": 4900,
  "currency": "usd",
  "status": "requires_payment_method",
  "created_at": 1726742000
}
\`\`\`

---

## 3. Códigos de Estado y Errores

- \`200 OK\`: Consulta o actualización ejecutada exitosamente.
- \`201 Created\`: Recurso creado satisfactoriamente.
- \`400 Bad Request\`: Parámetros de validación incorrectos o faltantes.
- \`401 Unauthorized\`: Clave de API inválida o expirada.
- \`429 Too Many Requests\`: Límite de tasa superado (máximo 120 peticiones/minuto).
`,
  },
  {
    id: 'investigacion-academica',
    name: 'Artículo de Investigación / Paper',
    badge: 'Académico',
    description: 'Estructura universitaria clásica con resumen abstracto, metodología, tablas comparativas y referencias.',
    themeId: 'academic',
    markdown: `# Impacto de la Inteligencia Artificial Generativa en la Productividad del Desarrollo de Software

**Autor Principal**: Dr. Alejandro Morales  
**Institución**: Departamento de Ciencias de la Computación, Universidad Tecnológica  
**Fecha de Publicación**: Septiembre 2026  

---

## Resumen (Abstract)

El presente estudio empírico analiza el impacto cuantitativo y cualitativo de la adopción de asistentes de programación basados en modelos de lenguaje extenso (LLMs) en equipos de ingeniería de software. A lo largo de seis meses de observación controlada sobre 184 ingenieros, se evidenció un incremento promedio del **37.8%** en la velocidad de resolución de incidentes y una reducción del **28.4%** en el tiempo de escritura de pruebas unitarias.

---

## 1. Introducción y Planteamiento del Problema

La integración de herramientas asistidas por inteligencia artificial en los flujos de trabajo de desarrollo de software ha generado un debate significativo en torno a la productividad neta y la deuda técnica resultante. Investigaciones previas (Smith et al., 2024) señalaban incrementos notables en la velocidad de codificación inicial, pero alertaban sobre posibles deterioros en la mantenibilidad.

### Hipótesis de Trabajo:
1. *H1*: El uso de asistentes acelera significativamente la fase de prototipado e implementación inicial.
2. *H2*: La tasa de defectos lógicos en código generado sin supervisión humana estricta es superior a la del código redactado manualmente.

---

## 2. Metodología Experimental y Muestra

Se conformaron dos grupos de trabajo bajo condiciones de evaluación ciega durante 24 semanas:

| Grupo | N (Participantes) | Nivel de Experiencia | Herramientas Permitidas |
| :--- | :---: | :---: | :--- |
| **Control (A)** | 92 | Junior (30%), Semi-Senior (45%), Senior (25%) | IDE convencional + Documentación oficial |
| **Experimental (B)** | 92 | Junior (30%), Semi-Senior (45%), Senior (25%) | IDE convencional + Asistente de IA activo |

---

## 3. Resultados y Discusión

Los datos recopilados demuestran que:

- El grupo experimental completó los módulos de pruebas automatizadas en un promedio de **4.2 horas frente a 6.1 horas** del grupo de control.
- En pruebas de refactorización de arquitectura compleja, ambos grupos mostraron tasas similares de éxito, sugiriendo que el razonamiento arquitectónico de alto nivel sigue dependiendo crucialmente del criterio del desarrollador senior.

---

## 4. Referencias Bibliográficas

1. Chen, M., Tworek, J., Jun, H., et al. (2021). *Evaluating Large Language Models Trained on Code*. arXiv preprint arXiv:2107.03374.
2. Vaswani, A., Shazeer, N., Parmar, N., et al. (2017). *Attention Is All You Need*. Advances in Neural Information Processing Systems, 30.
3. Ziegler, A., Kalliamvakou, E., Li, X. A., et al. (2022). *Productivity assessment of neural code synthesis in industrial environments*. IEEE Software, 39(4), 45-52.
`,
  },
  {
    id: 'proyecto-tareas',
    name: 'Plan de Proyecto y Minuta',
    badge: 'Gestión',
    description: 'Plantilla práctica con objetivos, matriz de responsables, cronograma de entregables y lista de verificación.',
    themeId: 'emerald',
    markdown: `# Plan de Lanzamiento: Nueva Plataforma Web 2026

**Líder del Proyecto**: Sofía Valenzuela  
**Estado General**: En Progreso (Fase 3 de 5)  
**Fecha Objetivo**: 15 de Noviembre de 2026  

---

## 1. Objetivos del Proyecto

El propósito de esta iniciativa es renovar la experiencia de usuario de la plataforma principal, modernizando la arquitectura frontend y mejorando los tiempos de carga en dispositivos móviles por debajo de 1.2 segundos.

---

## 2. Matriz de Roles y Responsabilidades (RACI)

| Rol | Miembro Asignado | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Project Manager** | Sofía Valenzuela | Seguimiento de cronograma y asignación presupuestaria |
| **Lead Designer** | Marcos Rivas | Sistema de diseño, prototipado y validación de accesibilidad |
| **Tech Lead** | Daniel Castro | Arquitectura técnica, pipelines CI/CD y despliegue |
| **QA Specialist** | Elena Gómez | Pruebas funcionales automatizadas y carga |

---

## 3. Lista de Tareas y Verificación de Entregables

### Fase 1: Descubrimiento y Diseño
- [x] Entrevistas con 25 usuarios clave y definición de personas.
- [x] Wireframes interactivos y validación con gerencia de producto.
- [x] Definición de tokens de diseño y paleta cromática accesible (WCAG AAA).

### Fase 2: Desarrollo Frontend & Backend
- [x] Configuración de infraestructura en la nube y entornos de *Staging*.
- [x] Desarrollo de componentes base y sistema de navegación responsivo.
- [ ] Integración final de la pasarela de pagos y facturación electrónica.
- [ ] Optimización de imágenes en formato WebP/AVIF y Lazy Loading.

### Fase 3: Pruebas de Rendimiento y Lanzamiento
- [ ] Auditoría de seguridad y penetración (Pentesting).
- [ ] Pruebas de estrés simulando 10,000 usuarios concurrentes.
- [ ] Lanzamiento en producción y monitoreo de telemetría 24/7.
`,
  },
  {
    id: 'servicios-windows',
    name: 'Servicios de Windows (Guía & Preguntas)',
    badge: 'Sistemas',
    description: 'Guía técnica con preguntas de diagnóstico, comandos sc/PowerShell y tablas detalladas de servicios del sistema.',
    themeId: 'modern-navy',
    markdown: `# Guía y Cuestionario: Servicios de Windows (Diagnóstico y Administración)

> **Documento de Referencia Técnica**: Este documento compila las preguntas frecuentes, estados de ejecución y comandos clave para la gestión de servicios en entornos Windows Server y Windows 11/10.

---

## 1. Conceptos Fundamentales

Los **Servicios de Windows** son aplicaciones que se ejecutan en segundo plano sin una interfaz de usuario interactiva, iniciadas por el sistema operativo o por cuentas de servicio dedicadas (*LocalSystem*, *NetworkService*, *LocalService*).

---

## 2. Tabla Comparativa de Comandos de Gestión

A continuación se resumen los comandos nativos para consultar, pausar e iniciar servicios tanto en consola CMD como en PowerShell:

| Operación | Comando CMD (sc / net) | Cmdlet de PowerShell | Descripción |
| :--- | :--- | :--- | :--- |
| **Consultar estado** | \`sc query wuauserv\` | \`Get-Service wuauserv\` | Muestra si el servicio está *RUNNING* o *STOPPED*. |
| **Iniciar servicio** | \`net start wuauserv\` | \`Start-Service wuauserv\` | Inicia el servicio y sus dependencias requeridas. |
| **Detener servicio** | \`net stop wuauserv\` | \`Stop-Service wuauserv\` | Detiene la ejecución del proceso asociado. |
| **Reiniciar servicio** | \`sc stop ... && sc start ...\` | \`Restart-Service wuauserv\` | Detiene y levanta el servicio en una sola instrucción. |
| **Tipo de inicio** | \`sc config wuauserv start= auto\` | \`Set-Service -StartupType Automatic\` | Define si arranca automático, manual o deshabilitado. |

---

## 3. Matriz de Servicios Críticos del Sistema Operativo

| Nombre Corto | Nombre para Mostrar | Tipo de Inicio Recomendado | Impacto si se Deshabilita |
| :--- | :--- | :---: | :--- |
| **wuauserv** | Windows Update | Automático | Impide la descarga de parches y actualizaciones de seguridad. |
| **Spooler** | Cola de impresión | Automático / Manual | No se pueden enviar documentos a impresoras locales o de red. |
| **WinDefend** | Servicio Antivirus de Windows Defender | Automático | Deja el equipo vulnerable a amenazas y malware. |
| **Dhcp** | Cliente DHCP | Automático | Pérdida de conectividad IPv4/IPv6 asignada por el router. |
| **Dnscache** | Cliente DNS | Automático | Falla en la resolución de nombres de dominio y navegación web. |
| **EventLog** | Registro de eventos de Windows | Automático | No se pueden auditar eventos ni consultar el Visor de Sucesos. |

---

## 4. Preguntas Frecuentes y Diagnóstico

### ¿Por qué un servicio puede quedar en estado "Stopping" o "Pending"?
1. El hilo del servicio no responde al mensaje de parada (*SERVICE_CONTROL_STOP*).
2. Recursos bloqueados en memoria o sockets de red retenidos por procesos secundarios.
3. Para forzar la terminación se puede identificar el PID con \`sc queryex [nombre]\` y terminarlo con \`taskkill /F /PID [pid]\`.

### Checklist de Mantenimiento Preventivo:
- [x] Verificar que no existan servicios con arranque automático en estado *Stopped*.
- [x] Auditar servicios con cuentas personalizadas que tengan contraseñas próximas a expirar.
- [ ] Comprobar dependencias circulares en servicios creados por terceros.
- [ ] Respaldar la clave del registro \`HKLM\\SYSTEM\\CurrentControlSet\\Services\`.
`,
  },
];


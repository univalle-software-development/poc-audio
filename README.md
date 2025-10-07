# POC Audio - Aplicación de Chat con IA y Speech-to-Text

## Descripción General

Este proyecto constituye una prueba de concepto (POC) desarrollada para el curso Proyecto Integrador II-01 de la Universidad del Valle. La aplicación integra tecnologías de inteligencia artificial conversacional con capacidades de reconocimiento de voz, permitiendo a los usuarios interactuar mediante texto o voz con un asistente basado en modelos de lenguaje de gran escala.

La arquitectura implementada combina Next.js como framework principal, Convex como base de datos reactiva en tiempo real, Google Cloud Speech-to-Text para la transcripción de audio, y la API de OpenAI para la generación de respuestas conversacionales.

## Contexto Académico

**Institución**: Universidad del Valle  
**Curso**: Proyecto Integrador II-01  
**Equipo**: Golangers  
**Período**: Octubre 2025  
**Repository**: univalle-software-development/poc-audio

## Arquitectura del Sistema

### Stack Tecnológico

El proyecto se fundamenta en las siguientes tecnologías y servicios:

#### Frontend
- **Next.js 13.5.1**: Framework de React que proporciona renderizado del lado del servidor (SSR), generación de sitios estáticos (SSG) y rutas de API serverless.
- **React 18.2.0**: Biblioteca principal para la construcción de interfaces de usuario reactivas.
- **TypeScript 5.2.2**: Superset de JavaScript que añade tipado estático, mejorando la robustez del código y la experiencia de desarrollo.
- **Tailwind CSS 3.3.3**: Framework de CSS utilitario que permite un diseño responsive y consistente mediante clases predefinidas.

#### Backend y Base de Datos
- **Convex 1.22.0**: Plataforma de backend que proporciona una base de datos reactiva con sincronización en tiempo real, funciones serverless y gestión de estado global.
- **OpenAI API**: Servicio de inteligencia artificial que provee acceso a modelos de lenguaje para la generación de respuestas conversacionales. El modelo implementado es GPT-5-nano, seleccionado por su balance entre rendimiento y costo para entornos de prueba.

#### Servicios de Terceros
- **Google Cloud Speech-to-Text API**: Servicio de reconocimiento automático de voz (ASR) que convierte audio hablado en texto transcrito. Configurado para soportar español (es-ES) como idioma principal e inglés (en-US) como alternativa.

#### Bibliotecas Complementarias
- **Radix UI**: Conjunto de componentes de interfaz accesibles y sin estilo predefinido, utilizados como base para elementos como diálogos, menús desplegables y tooltips.
- **React Textarea Autosize**: Componente que ajusta automáticamente la altura del área de texto según el contenido.
- **Lucide React**: Biblioteca de iconos SVG optimizados para React.

### Patrón de Arquitectura

La aplicación sigue una arquitectura de tres capas claramente definidas:

#### Capa de Presentación
Compuesta por componentes React organizados en el directorio `components/`. Los componentes principales incluyen:

- **Chat Component**: Orquesta la interfaz de usuario del chat, gestionando la visualización de mensajes, el input del usuario y los controles de interacción.
- **ChatMessage Component**: Renderiza mensajes individuales con formato diferenciado para mensajes del usuario y del asistente.
- **Loading Indicators**: Componentes especializados que proporcionan retroalimentación visual durante operaciones asíncronas como la transcripción de audio y la generación de respuestas.

#### Capa de Lógica de Negocio
Implementada mediante hooks personalizados de React y acciones de Convex:

- **useSpeechToText**: Hook que encapsula toda la lógica relacionada con la grabación de audio mediante MediaRecorder API, la transmisión de datos al servidor y la gestión de estados de transcripción.
- **useConvexChat**: Hook que gestiona el estado del chat, incluyendo mensajes, entrada de usuario y comunicación con el backend de Convex.
- **Convex Actions**: Funciones serverless que ejecutan operaciones asíncronas como llamadas a APIs externas (OpenAI, Google Cloud).

#### Capa de Datos
Gestionada por Convex, que proporciona:

- **Schema Definitions**: Definiciones tipadas de las estructuras de datos almacenadas.
- **Queries**: Funciones reactivas que recuperan datos y se actualizan automáticamente cuando los datos cambian.
- **Mutations**: Funciones que modifican el estado de la base de datos de forma transaccional.

## Flujo de Datos y Comunicación

### Flujo de Interacción por Texto

1. El usuario ingresa texto en el componente de input.
2. Al enviar, se dispara una mutación de Convex que almacena el mensaje del usuario en la base de datos.
3. La mutación desencadena una acción que envía el historial de conversación al modelo de OpenAI.
4. OpenAI procesa el contexto y genera una respuesta.
5. La respuesta se almacena en Convex mediante otra mutación.
6. Los queries reactivos detectan el cambio y actualizan automáticamente la interfaz, mostrando la respuesta del asistente.

### Flujo de Interacción por Voz

1. El usuario activa el botón de micrófono, iniciando la captura de audio mediante la MediaRecorder API del navegador.
2. Durante la grabación, el audio se acumula en fragmentos (chunks) almacenados en memoria.
3. Al detener la grabación, los fragmentos se combinan en un Blob con formato WebM Opus.
4. El hook `useSpeechToText` transmite el Blob mediante FormData a la ruta API `/api/speech-to-text`.
5. El endpoint de Next.js recibe el audio, lo convierte a formato base64 y lo envía a Google Cloud Speech-to-Text API.
6. Google Cloud procesa el audio aplicando algoritmos de reconocimiento de voz y retorna la transcripción en formato JSON.
7. El texto transcrito se recibe en el hook y se actualiza en el estado local.
8. Un efecto de React detecta la actualización y coloca automáticamente la transcripción en el input del chat.
9. El usuario puede revisar, editar y enviar el texto transcrito, siguiendo entonces el flujo de interacción por texto.

## Implementación de Speech-to-Text

### Configuración de Google Cloud Platform

La integración con Google Cloud Speech-to-Text requiere una configuración previa en la plataforma:

1. **Creación del Proyecto**: Se establece un proyecto dedicado en Google Cloud Platform, lo cual permite aislar recursos, configuraciones y facturación.

2. **Habilitación de la API**: La Cloud Speech-to-Text API debe habilitarse explícitamente para el proyecto. Las APIs de Google Cloud están deshabilitadas por defecto como medida de seguridad y control de costos.

3. **Generación de Credenciales**: Se crea una API Key que actúa como mecanismo de autenticación. Esta clave permite que las solicitudes desde la aplicación sean autorizadas por Google Cloud.

4. **Restricción de Credenciales**: Como práctica de seguridad, la API Key se restringe para que únicamente pueda utilizarse con la Speech-to-Text API, minimizando el riesgo en caso de exposición accidental.

### Arquitectura del Endpoint

El endpoint `/api/speech-to-text` implementado como Next.js API Route proporciona una capa de abstracción entre el cliente y Google Cloud:

**Razones para esta arquitectura**:
- **Seguridad**: La API Key de Google Cloud permanece en el servidor, nunca se expone al navegador del cliente.
- **Control**: Permite implementar validaciones, rate limiting y manejo centralizado de errores.
- **Abstracción**: Desacopla el cliente de los detalles de implementación de Google Cloud, facilitando futuros cambios de proveedor.

**Proceso de transcripción**:
1. Recepción del audio en formato Blob mediante FormData.
2. Conversión del Blob a ArrayBuffer y posterior codificación en base64.
3. Construcción de la solicitud HTTP a Google Cloud con la configuración apropiada.
4. Procesamiento de la respuesta y extracción del texto transcrito.
5. Retorno de la transcripción al cliente en formato JSON.

### Configuración de Audio

Los parámetros de configuración para el reconocimiento de voz fueron seleccionados considerando:

- **Encoding (WEBM_OPUS)**: Formato estándar utilizado por MediaRecorder en navegadores modernos. Opus proporciona buena calidad de audio con tasas de compresión eficientes.

- **Sample Rate (48000 Hz)**: Tasa de muestreo de alta fidelidad que captura un amplio rango de frecuencias vocales, mejorando la precisión del reconocimiento.

- **Language Code (es-ES)**: Configurado para español de España como idioma principal, con posibilidad de ajuste según la región objetivo.

- **Alternative Language Codes (en-US)**: Inglés americano como idioma de respaldo, permitiendo que el sistema funcione si detecta entrada en inglés.

## Integración con OpenAI

### Selección del Modelo

El proyecto utiliza GPT-5-nano como modelo de lenguaje, una decisión fundamentada en:

- **Economía**: Con límites de 200,000 tokens por minuto y 2,000,000 tokens por día, resulta apropiado para un entorno de prueba de concepto sin incurrir en costos significativos.

- **Rendimiento**: Proporciona respuestas de calidad suficiente para validar la integración y el flujo de usuario.

- **Disponibilidad**: Los límites de 500 requests por minuto permiten pruebas simultáneas con múltiples usuarios.

### Configuración del System Prompt

El system prompt se configuró de manera genérica y sin restricciones temáticas:

```
You are ChatGPT, a helpful assistant powered by OpenAI. 
You can assist with a wide range of topics and tasks.
```

Esta configuración permite que el asistente responda a cualquier consulta sin limitarse a dominios específicos, facilitando la validación de la funcionalidad general del sistema.

### Gestión de Contexto

Convex Actions maneja la comunicación con OpenAI de la siguiente manera:

1. **Recuperación del Historial**: Se obtienen todos los mensajes de la conversación actual desde Convex.
2. **Construcción del Contexto**: Los mensajes se formatean según la estructura esperada por la API de OpenAI, incluyendo roles (user, assistant, system).
3. **Inclusión del System Prompt**: Se antepone el prompt del sistema al inicio del array de mensajes.
4. **Envío y Procesamiento**: La solicitud se envía a OpenAI y la respuesta se procesa.
5. **Persistencia**: La respuesta del modelo se almacena en Convex, manteniendo la continuidad conversacional.

## Componentes de Interfaz

### Indicadores de Carga

Se implementaron dos tipos de indicadores visuales para mejorar la experiencia del usuario:

#### Indicador de Transcripción
Aparece como un badge flotante sobre el área de input durante el proceso de transcripción. Consiste en tres puntos animados con rebote secuencial acompañados del texto "Transcribing audio...". El diseño utiliza:
- Fondo gris claro (zinc-100) con bordes redondeados completos (pill shape).
- Sombra suave para elevación visual.
- Posicionamiento absoluto que no interfiere con otros elementos.

#### Indicador de Procesamiento de IA
Se muestra en el área de mensajes cuando el modelo está generando una respuesta. Presenta:
- Avatar circular con gradiente azul (blue-400 a blue-600) conteniendo las letras "AI".
- Puntos animados con rebote secuencial.
- Diseño consistente con los mensajes del chat para coherencia visual.

Ambos indicadores utilizan animaciones CSS nativas de Tailwind, evitando JavaScript adicional y manteniendo un rendimiento óptimo.

### Componente de Chat

El componente principal del chat implementa:

- **Layout Flexible**: Utiliza Flexbox CSS para distribuir el espacio entre la lista de mensajes y el área de input, adaptándose al viewport del dispositivo.

- **Scroll Automático**: Implementa auto-scroll al final de la conversación cuando llegan nuevos mensajes, con lógica para evitar scroll en la carga inicial.

- **Responsive Design**: Adapta el diseño mediante breakpoints de Tailwind, ajustando padding, tamaños de fuente y distribución de elementos según el tamaño de pantalla.

- **Manejo de Estados**: Coordina múltiples estados (isLoading, isRecording, isTranscribing) para actualizar la interfaz apropiadamente.

## Gestión de Variables de Entorno

### Estrategia de Configuración

El proyecto distingue entre variables de entorno públicas y privadas:

**Variables Públicas** (prefijo `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_CONVEX_URL`: URL del deployment de Convex, accesible desde el navegador para establecer la conexión WebSocket.

**Variables Privadas** (sin prefijo):
- `GOOGLE_CLOUD_API_KEY`: Credencial de Google Cloud, disponible únicamente en el servidor.
- `OPENAI_API_KEY`: Credencial de OpenAI, almacenada en el dashboard de Convex para uso en Actions.

### Archivos de Configuración

- **`.env.local`**: Archivo local no versionado que contiene credenciales sensibles para desarrollo.
- **`.env`**: Archivo versionado que documenta las variables requeridas sin incluir valores reales, sirviendo como plantilla.
- **`.gitignore`**: Configurado para excluir `.env.local` y otros archivos sensibles del control de versiones.

## Seguridad

### Prácticas Implementadas

1. **Separación de Credenciales**: Las API keys nunca se exponen al cliente, manteniéndose exclusivamente en el servidor.

2. **Restricción de API Keys**: La clave de Google Cloud está limitada a una sola API, reduciendo el impacto de una posible filtración.

3. **Variables de Entorno**: Uso de variables de entorno en lugar de hardcodear credenciales en el código fuente.

4. **Validación en Endpoints**: Los endpoints de API verifican la existencia de datos requeridos antes de procesarlos.

5. **Manejo de Errores**: Implementación de bloques try-catch con logs detallados para facilitar debugging sin exponer información sensible al cliente.

### Consideraciones para Producción

Para un despliegue en producción, se recomiendan mejoras adicionales:

- **Autenticación**: Implementar verificación de identidad del usuario antes de permitir acceso a funcionalidades.
- **Rate Limiting**: Establecer límites de requests por usuario para prevenir abuso.
- **CORS**: Configurar políticas de Cross-Origin Resource Sharing apropiadas.
- **Sanitización de Input**: Validar y limpiar entradas de usuario para prevenir inyecciones.
- **Monitoreo**: Implementar logging y alertas para detectar comportamientos anómalos.

## Estructura del Proyecto

```
poc-audio/
├── app/
│   ├── api/
│   │   └── speech-to-text/
│   │       └── route.ts          # Endpoint de transcripción
│   ├── globals.css               # Estilos globales y Tailwind
│   ├── layout.tsx                # Layout principal de la aplicación
│   ├── page.tsx                  # Página principal del chat
│   └── providers.tsx             # Provider de Convex
├── components/
│   ├── chat.tsx                  # Componente principal del chat
│   ├── chat-message.tsx          # Renderizado de mensajes individuales
│   ├── convex-chat-provider.tsx  # Provider y lógica del chat
│   ├── loading-dots.tsx          # Indicadores de carga
│   ├── navbar.tsx                # Barra de navegación
│   └── footer.tsx                # Pie de página
├── convex/
│   ├── chat.ts                   # Queries y mutations del chat
│   ├── multiModelAI.ts           # Actions para OpenAI
│   ├── speechToText.ts           # Configuración de Speech-to-Text
│   └── schema.ts                 # Definición del schema de datos
├── hooks/
│   ├── use-speech-to-text.ts     # Hook de grabación y transcripción
│   └── use-toast.ts              # Sistema de notificaciones
├── lib/
│   └── utils.ts                  # Utilidades compartidas
├── docs/
│   ├── google-cloud-speech-to-text-setup.md  # Guía de configuración
│   ├── loading-indicators.md                  # Documentación de indicadores
│   └── environment-variables.md               # Variables de entorno
└── public/
    └── golangers.webp            # Logo del equipo
```

## Desarrollo y Ejecución

### Requisitos del Sistema

- Node.js versión 18 o superior
- pnpm como gestor de paquetes
- Cuenta de Google Cloud Platform con facturación habilitada
- Cuenta de OpenAI con créditos disponibles
- Cuenta de Convex (gratuita para desarrollo)

### Configuración Inicial

1. **Clonación del Repositorio**:
   ```bash
   git clone https://github.com/univalle-software-development/poc-audio.git
   cd poc-audio
   ```

2. **Instalación de Dependencias**:
   ```bash
   pnpm install
   ```

3. **Configuración de Convex**:
   ```bash
   npx convex dev
   ```
   Este comando inicializa un proyecto de Convex, genera el código cliente y actualiza el archivo `.env` con la URL del deployment.

4. **Configuración de Variables de Entorno**:
   Crear archivo `.env.local` con:
   ```
   GOOGLE_CLOUD_API_KEY=<tu-api-key-de-google-cloud>
   ```

5. **Configuración de OpenAI en Convex**:
   - Acceder al dashboard de Convex
   - Navegar a Settings → Environment Variables
   - Agregar `OPENAI_API_KEY` con el valor correspondiente

### Ejecución en Desarrollo

Para iniciar el servidor de desarrollo:

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

En una terminal separada, mantener Convex en modo desarrollo:

```bash
npx convex dev
```

Esto habilita hot-reload tanto para el frontend como para las funciones de Convex.

### Compilación para Producción

```bash
pnpm build
pnpm start
```

El comando `build` genera una versión optimizada de la aplicación, mientras que `start` sirve esta versión en modo producción.

## Consideraciones de Costos

### Google Cloud Speech-to-Text

- **Capa Gratuita**: 60 minutos de transcripción mensual sin costo.
- **Costo Adicional**: $0.006 USD por cada 15 segundos de audio procesado después de agotar la capa gratuita.
- **Estrategia de Optimización**: Para una POC, la capa gratuita es suficiente. En producción, considerar límites de duración por grabación y caching de transcripciones comunes.

### OpenAI API

- **Modelo GPT-5-nano**: Diseñado para ser económico con límites de 200,000 TPM (tokens por minuto).
- **Monitoreo**: Revisar periódicamente el uso en el dashboard de OpenAI para evitar costos inesperados.
- **Alternativas**: Considerar modelos más pequeños o proveedores alternativos para reducir costos en producción.

### Convex

- **Plan Gratuito**: Suficiente para desarrollo y proyectos pequeños.
- **Escalabilidad**: Los planes pagos se ajustan según uso, facilitando la transición a producción.

## Mejoras Futuras

### Funcionalidades Técnicas

1. **Detección Automática de Idioma**: Implementar detección del idioma hablado antes de enviar a Google Cloud, mejorando la precisión en entornos multilingües.

2. **Visualización de Forma de Onda**: Agregar representación visual de la amplitud del audio durante la grabación para mejor feedback al usuario.

3. **Edición de Transcripción**: Interfaz de confirmación que permita al usuario revisar y corregir la transcripción antes de enviarla como mensaje.

4. **Historial de Conversaciones**: Implementar persistencia de sesiones múltiples con capacidad de recuperar conversaciones anteriores.

5. **Soporte de Voz Continua**: Permitir entrada de voz sin necesidad de detener manualmente, usando detección de silencios.

### Optimizaciones de Rendimiento

1. **Lazy Loading**: Cargar componentes pesados bajo demanda para reducir el tamaño del bundle inicial.

2. **Memoización**: Aplicar React.memo y useMemo en componentes que renderizan frecuentemente.

3. **Compresión de Audio**: Implementar compresión adicional del audio antes de enviarlo a Google Cloud para reducir latencia y costos.

4. **Caching**: Implementar estrategias de cache para respuestas comunes del modelo de IA.

### Mejoras de UX

1. **Retroalimentación Háptica**: En dispositivos móviles, proporcionar vibración al iniciar/detener grabación.

2. **Atajos de Teclado**: Implementar shortcuts para acciones comunes (Ctrl+Enter para enviar, etc.).

3. **Temas**: Sistema de temas claro/oscuro con preferencia persistente.

4. **Accesibilidad**: Mejorar navegación por teclado, etiquetas ARIA y soporte para lectores de pantalla.

## Lecciones Aprendidas

### Integración de APIs Externas

La experiencia de integrar múltiples APIs externas (Google Cloud, OpenAI) demostró la importancia de una arquitectura bien diseñada con capas de abstracción claras. El uso de Next.js API Routes como capa intermedia resultó valioso tanto para seguridad como para mantenibilidad.

### Manejo de Estado en Aplicaciones Reactivas

Convex como backend reactivo simplificó significativamente la sincronización de estado entre cliente y servidor. La actualización automática de la UI cuando cambian los datos elimina código boilerplate y reduce errores.

### Experiencia de Usuario en Aplicaciones de IA

Los indicadores de carga resultaron cruciales para la percepción de velocidad y confiabilidad de la aplicación. Incluso con tiempos de respuesta de 2-3 segundos, la retroalimentación visual apropiada mantiene al usuario informado y reduce la frustración.

### Gestión de Credenciales

La separación estricta entre variables públicas y privadas, junto con el uso de servicios gestionados (Convex) para variables sensibles, proporciona seguridad sin comprometer la experiencia de desarrollo.

## Conclusiones

Este proyecto de prueba de concepto demuestra exitosamente la viabilidad técnica de integrar tecnologías de reconocimiento de voz con sistemas de inteligencia artificial conversacional. La arquitectura implementada es escalable, mantenible y sigue las mejores prácticas de desarrollo web moderno.

Las tecnologías seleccionadas (Next.js, Convex, Google Cloud, OpenAI) se complementan efectivamente, cada una aportando capacidades especializadas que juntas forman un sistema cohesivo. La separación de responsabilidades entre frontend, backend y servicios externos facilita futuras extensiones y modificaciones.

El proyecto sirve como base sólida para futuras iteraciones que podrían incluir características más avanzadas como análisis de sentimientos, traducción en tiempo real, o integración con sistemas de telefonía para asistentes virtuales.

## Referencias

### Documentación Oficial

- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Convex: https://docs.convex.dev
- Google Cloud Speech-to-Text: https://cloud.google.com/speech-to-text/docs
- OpenAI API: https://platform.openai.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

### Recursos Técnicos

- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- React Hooks: https://react.dev/reference/react

### Artículos y Guías

- Best Practices for API Keys: https://cloud.google.com/docs/authentication/api-keys
- Serverless Architecture: https://martinfowler.com/articles/serverless.html
- React Performance Optimization: https://react.dev/learn/render-and-commit

## Contacto y Contribución

Este proyecto fue desarrollado como parte del curso Proyecto Integrador II-01 de la Universidad del Valle por el equipo Golangers.

Para consultas académicas o técnicas relacionadas con el proyecto, contactar a través del repositorio oficial en GitHub: https://github.com/univalle-software-development/poc-audio

---

**Fecha de Última Actualización**: Octubre 7, 2025  
**Versión**: 1.0.0  
**Licencia**: MIT

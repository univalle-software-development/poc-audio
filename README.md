# Configuración de Google Cloud Speech-to-Text

Este documento explica paso a paso cómo se implementó la funcionalidad de Speech-to-Text usando Google Cloud en nuestro POC de chat con IA.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración en Google Cloud Platform](#configuración-en-google-cloud-platform)
3. [Implementación en el Proyecto](#implementación-en-el-proyecto)
4. [Arquitectura y Flujo de Datos](#arquitectura-y-flujo-de-datos)
5. [Archivos Creados y Modificados](#archivos-creados-y-modificados)
6. [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)
7. [Pruebas y Verificación](#pruebas-y-verificación)

---

## 🎯 Requisitos Previos

Antes de comenzar, necesitas:

- ✅ Una cuenta de Google Cloud Platform (GCP)
- ✅ Un proyecto creado en GCP
- ✅ Tarjeta de crédito vinculada (Google ofrece $300 USD de créditos gratuitos)
- ✅ Node.js y pnpm instalados
- ✅ Proyecto Next.js funcionando

---

## ☁️ Configuración en Google Cloud Platform

### Paso 1: Crear/Seleccionar un Proyecto

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. En la barra superior, haz clic en el selector de proyectos
3. Crea un nuevo proyecto o selecciona uno existente
4. Dale un nombre descriptivo (ej: `poc-audio-speech-to-text`)

**¿Por qué?** Cada proyecto en GCP es un espacio aislado con sus propias APIs, credenciales y facturación.

### Paso 2: Habilitar la API de Speech-to-Text

1. En el menú lateral, ve a **APIs & Services** → **Library**
2. Busca "Cloud Speech-to-Text API"
3. Haz clic en la API y selecciona **Enable**
4. Espera unos segundos mientras se habilita

**¿Por qué?** Por defecto, las APIs de Google Cloud están deshabilitadas. Habilitarla permite que tu proyecto pueda usarla.

### Paso 3: Crear Credenciales (API Key)

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **Create Credentials** → **API Key**
3. Se generará una API key automáticamente
4. **IMPORTANTE**: Copia la API key inmediatamente

**¿Por qué?** La API key es como una contraseña que permite que tu aplicación se comunique con Google Cloud.

### Paso 4: Restringir la API Key (Seguridad)

1. Haz clic en la API key recién creada (ícono de lápiz/editar)
2. En **API restrictions**:
   - Selecciona "Restrict key"
   - Marca solo **"Cloud Speech-to-Text API"**
3. Guarda los cambios

**¿Por qué?** Si alguien obtiene tu API key, solo podrá usarla para Speech-to-Text, no para otros servicios de Google Cloud que podrían ser más costosos.

### Paso 5: Configurar la API Key en Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
GOOGLE_CLOUD_API_KEY=tu-api-key-aqui
```

**¿Por qué `.env.local`?**
- ✅ Está en `.gitignore` por defecto (no se sube a GitHub)
- ✅ Next.js lo carga automáticamente
- ✅ Las variables sin `NEXT_PUBLIC_` solo están disponibles en el servidor (más seguro)

---

## 💻 Implementación en el Proyecto

### Paso 1: Instalación de Dependencias

```bash
pnpm add @google-cloud/speech
```

**¿Por qué?** Aunque usamos la REST API directamente, el paquete oficial de Google Cloud nos da tipos TypeScript y utilidades útiles.

### Paso 2: Crear el Endpoint de API

**Archivo**: `app/api/speech-to-text/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 1. Recibir el archivo de audio del cliente
  const formData = await request.formData();
  const audioFile = formData.get("audio") as Blob;

  // 2. Convertir el audio a base64 (formato que acepta Google Cloud)
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");

  // 3. Obtener la API key de las variables de entorno
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  // 4. Llamar a la API de Google Cloud Speech-to-Text
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",        // Formato del audio del navegador
          sampleRateHertz: 48000,        // Calidad de audio
          languageCode: "es-ES",         // Español como idioma principal
          alternativeLanguageCodes: ["en-US"], // Inglés como fallback
        },
        audio: { content: base64Audio }
      }),
    }
  );

  // 5. Extraer y devolver la transcripción
  const data = await response.json();
  const transcription = data.results
    ?.map((result: any) => result.alternatives[0]?.transcript)
    .join(" ") || "";

  return NextResponse.json({ transcription });
}
```

**¿Por qué un endpoint de API?**
- ✅ La API key debe estar en el servidor, nunca en el frontend
- ✅ Next.js API Routes son serverless y escalables
- ✅ Podemos manejar errores y validaciones centralizadamente

**¿Por qué estos parámetros?**
- **WEBM_OPUS**: Formato estándar que usan los navegadores modernos para grabación
- **48000 Hz**: Tasa de muestreo estándar para audio de alta calidad
- **es-ES**: Configurado para español de España (puedes cambiarlo)
- **alternativeLanguageCodes**: Si no detecta español, intenta con inglés

### Paso 3: Crear el Hook de Grabación de Audio

**Archivo**: `hooks/use-speech-to-text.ts`

```typescript
export function useSpeechToText() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    // 1. Pedir permiso para acceder al micrófono
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { channelCount: 1, sampleRate: 48000 } 
    });

    // 2. Crear el grabador de audio
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    // 3. Guardar los chunks de audio mientras graba
    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    // 4. Cuando se detiene, enviar a transcribir
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm;codecs=opus",
      });
      await transcribeAudio(audioBlob);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch("/api/speech-to-text", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setTranscript(data.transcription);
  };

  return { isRecording, transcript, startRecording, stopRecording };
}
```

**¿Por qué un hook personalizado?**
- ✅ Reutilizable en cualquier componente
- ✅ Encapsula toda la lógica de grabación
- ✅ Maneja estados (grabando, transcripción, errores)
- ✅ Sigue las mejores prácticas de React

**¿Qué hace MediaRecorder?**
- Es una API nativa del navegador
- Captura audio del micrófono
- Lo guarda en chunks (fragmentos) mientras graba
- Al detener, crea un Blob (archivo binario) con todo el audio

### Paso 4: Integrar en el Componente Chat

**Archivo**: `components/chat.tsx`

```typescript
import { useSpeechToText } from "@/hooks/use-speech-to-text";

function ChatInner() {
  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
  } = useSpeechToText();

  // Cuando hay transcripción, actualizar el input
  useEffect(() => {
    if (transcript) {
      handleInputChange({ target: { value: transcript } } as any);
    }
  }, [transcript]);

  const handleRecordingToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <button onClick={handleRecordingToggle}>
      {isRecording ? <StopIcon /> : <MicrophoneIcon />}
    </button>
  );
}
```

**¿Por qué este flujo?**
- ✅ El hook maneja toda la complejidad
- ✅ El componente solo se preocupa de la UI
- ✅ Cuando hay transcripción, se actualiza el input automáticamente
- ✅ El usuario puede editar el texto antes de enviar

---

## 🔄 Arquitectura y Flujo de Datos

```
┌─────────────┐
│  Usuario    │
│  (Habla)    │
└──────┬──────┘
       │ 1. Click en micrófono
       ▼
┌─────────────────────────────┐
│  Navegador                  │
│  - MediaRecorder API        │
│  - Graba audio en WebM Opus │
└──────┬──────────────────────┘
       │ 2. Audio Blob
       ▼
┌─────────────────────────────┐
│  Hook: useSpeechToText      │
│  - Convierte a FormData     │
│  - Envía a /api/speech-to-text │
└──────┬──────────────────────┘
       │ 3. POST request
       ▼
┌─────────────────────────────┐
│  Next.js API Route          │
│  - Recibe audio             │
│  - Convierte a base64       │
│  - Añade API key            │
└──────┬──────────────────────┘
       │ 4. HTTPS request
       ▼
┌─────────────────────────────┐
│  Google Cloud               │
│  Speech-to-Text API         │
│  - Procesa el audio         │
│  - Detecta idioma           │
│  - Transcribe               │
└──────┬──────────────────────┘
       │ 5. JSON response
       ▼
┌─────────────────────────────┐
│  Next.js API Route          │
│  - Extrae transcripción     │
│  - Formatea respuesta       │
└──────┬──────────────────────┘
       │ 6. Transcripción
       ▼
┌─────────────────────────────┐
│  Hook: useSpeechToText      │
│  - Actualiza estado         │
│  - Trigger useEffect        │
└──────┬──────────────────────┘
       │ 7. Actualiza input
       ▼
┌─────────────────────────────┐
│  Chat Component             │
│  - Muestra transcripción    │
│  - Usuario puede editar     │
│  - Enviar al chat           │
└─────────────────────────────┘
```

---

## 📁 Archivos Creados y Modificados

### Archivos Nuevos

1. **`app/api/speech-to-text/route.ts`**
   - Endpoint serverless de Next.js
   - Maneja la comunicación con Google Cloud
   - Protege la API key

2. **`hooks/use-speech-to-text.ts`**
   - Hook React personalizado
   - Maneja grabación de audio
   - Estados y lifecycle de la transcripción

3. **`.env.local`** (no commitear)
   - Variables de entorno locales
   - API key de Google Cloud

### Archivos Modificados

1. **`components/chat.tsx`**
   - Import del hook `useSpeechToText`
   - Integración del botón de micrófono
   - useEffect para actualizar input con transcripción

2. **`.env`** (template)
   - Agregada variable `GOOGLE_CLOUD_API_KEY`
   - Sirve como referencia para otros desarrolladores

3. **`package.json`**
   - Agregada dependencia `@google-cloud/speech`

---

## 🔒 Seguridad y Mejores Prácticas

### ✅ Lo que hicimos bien

1. **API Key en el servidor**
   - ✅ La key nunca llega al navegador
   - ✅ Usamos Next.js API Routes (serverless)
   - ✅ Variable de entorno sin `NEXT_PUBLIC_`

2. **Restricción de la API Key**
   - ✅ Solo puede usarse para Speech-to-Text
   - ✅ Limita el daño si se filtra

3. **`.env.local` en `.gitignore`**
   - ✅ Las credenciales no se suben a GitHub
   - ✅ Cada desarrollador usa sus propias keys

4. **Validaciones en el endpoint**
   - ✅ Verificamos que exista el archivo de audio
   - ✅ Verificamos que exista la API key
   - ✅ Manejamos errores de Google Cloud

### ⚠️ Consideraciones de Seguridad

1. **Rate Limiting**: Considera agregar límites de requests
2. **Autenticación**: En producción, valida que el usuario esté autenticado
3. **Tamaño del archivo**: Limita el tamaño máximo del audio
4. **CORS**: Configura CORS si el frontend está en otro dominio

---

## 🧪 Pruebas y Verificación

### Verificar que funciona

1. **Iniciar el servidor**:
   ```bash
   pnpm dev
   ```

2. **Abrir el navegador**: `http://localhost:3000`

3. **Hacer clic en el botón del micrófono**
   - Debe pedir permiso para usar el micrófono
   - El botón debe cambiar a rojo (grabando)

4. **Hablar claramente**

5. **Hacer clic de nuevo para detener**
   - El audio se envía a Google Cloud
   - La transcripción aparece en el input
   - Puedes editar antes de enviar

### Debugging

Si algo falla, revisa:

1. **Console del navegador** (F12)
   - Errores de permisos del micrófono
   - Errores de fetch al endpoint

2. **Terminal del servidor** (donde corre `pnpm dev`)
   - Logs del endpoint `/api/speech-to-text`
   - Errores de Google Cloud API

3. **Verificar variables de entorno**
   ```typescript
   console.log("API Key set:", !!process.env.GOOGLE_CLOUD_API_KEY);
   ```

### Errores Comunes

| Error | Solución |
|-------|----------|
| "API Key not set" | Verifica que `.env.local` existe y tiene la key |
| "Permission denied" | Permite el acceso al micrófono en el navegador |
| "Invalid encoding" | El navegador puede no soportar WebM Opus |
| "Quota exceeded" | Llegaste al límite gratuito de Google Cloud |

---

## 📊 Costos y Límites

### Capa Gratuita de Google Cloud

- **60 minutos gratis** por mes
- Después: **$0.006 USD** por 15 segundos de audio
- Para un POC, la capa gratuita es más que suficiente

### Optimizaciones

1. **Usar modelo `gpt-5-nano`** para el chat (más económico)
2. **Limitar duración de grabación** (ej: máximo 30 segundos)
3. **Cachear respuestas comunes** si es aplicable

---

## 🚀 Próximos Pasos

1. **Mejorar UX**: Agregar visualización de onda de audio mientras graba
2. **Soporte multi-idioma**: Detectar idioma automáticamente
3. **Edición de transcripción**: Permitir corregir antes de enviar
4. **Historial**: Guardar transcripciones anteriores
5. **Analytics**: Trackear precisión de las transcripciones

---

## 📚 Recursos Adicionales

- [Documentación oficial de Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [React Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## ✍️ Notas Finales

Este documento fue creado para el proyecto **POC Audio - Cloud Speech-to-Text** de la Universidad del Valle, Proyecto Integrador II-01.

**Fecha**: Octubre 7, 2025  
**Autor**: GitHub Copilot  
**Repositorio**: `univalle-software-development/poc-audio`

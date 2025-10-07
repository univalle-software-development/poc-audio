# Indicadores de Carga Implementados

## 📝 Resumen

Se han implementado indicadores de carga elegantes y minimalistas para mejorar la experiencia del usuario durante:

1. **Transcripción de audio** - Cuando el audio se está procesando
2. **Respuesta de IA** - Cuando el modelo está generando una respuesta

## 🎨 Componentes Creados

### `components/loading-dots.tsx`

Componente reutilizable con dos variantes de indicadores de carga:

#### `LoadingDots`
- Tres puntos que rebotan en secuencia
- Diseño minimalista y elegante
- Animación suave con `animate-bounce`
- Color: `zinc-400`

```tsx
<LoadingDots className="optional-classes" />
```

#### `LoadingSpinner`
- Spinner circular clásico
- Tamaños: `sm`, `md`, `lg`
- Bordes en degradado de grises

```tsx
<LoadingSpinner size="md" />
```

## 🔄 Modificaciones Realizadas

### 1. Hook `use-speech-to-text.ts`

**Cambios:**
- ✅ Agregado estado `isTranscribing`
- ✅ Se activa cuando comienza la transcripción
- ✅ Se desactiva cuando termina (en el `finally` block)

**Nuevos exports:**
```typescript
interface UseSpeechToTextReturn {
  isRecording: boolean;
  isTranscribing: boolean;  // ← NUEVO
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
}
```

### 2. Componente `chat.tsx`

**Cambios:**

#### Import del nuevo componente:
```tsx
import { LoadingDots } from "@/components/loading-dots";
```

#### Nuevo estado del hook:
```tsx
const {
  isRecording,
  isTranscribing,  // ← NUEVO
  transcript,
  error: speechError,
  startRecording,
  stopRecording,
  resetTranscript,
} = useSpeechToText();
```

#### Indicador "AI pensando" en el área de mensajes:
```tsx
{isLoading && (
  <div className="flex items-start gap-3 px-4 py-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
      AI
    </div>
    <div className="flex-1 pt-1">
      <LoadingDots />
    </div>
  </div>
)}
```

**Diseño:**
- Avatar circular con gradiente azul
- Texto "AI" blanco
- Dots animados al lado

#### Indicador "Transcribiendo" sobre el input:
```tsx
{isTranscribing && (
  <div className="absolute -top-10 left-4 bg-zinc-100 px-3 py-2 rounded-full shadow-sm flex items-center gap-2 text-sm text-zinc-600">
    <LoadingDots />
    <span>Transcribing audio...</span>
  </div>
)}
```

**Diseño:**
- Posición absoluta sobre el input
- Fondo gris claro con sombra suave
- Bordes redondeados (pill shape)
- Dots + texto descriptivo

## 🎯 UX/UI Considerations

### Colores
- **Loading dots**: `zinc-400` - Neutral, no distrae
- **AI avatar**: Gradiente azul (`blue-400` → `blue-600`) - Asociado con tecnología/IA
- **Transcribing badge**: Fondo `zinc-100` con texto `zinc-600` - Contraste suave

### Animaciones
- **Bounce dots**: Rebote secuencial con delays (`-0.3s`, `-0.15s`, `0s`)
- **Smooth transitions**: Transiciones CSS nativas de Tailwind
- **No obstrusivas**: Los indicadores no bloquean la interacción

### Posicionamiento
- **AI thinking**: Dentro del área de mensajes, como si fuera un mensaje más
- **Transcribing**: Flotante sobre el input, visible pero no invasivo

## 🧪 Estados Cubiertos

| Estado | Indicador | Ubicación |
|--------|-----------|-----------|
| `isLoading` | "AI" avatar + dots | Área de mensajes |
| `isTranscribing` | "Transcribing audio..." badge | Sobre el input |
| `isRecording` | Botón rojo pulsante | Botón de micrófono |
| `isClearing` | Spinner en botón | Botón "Clear Chat" |

## 📱 Responsive

Ambos indicadores son completamente responsive:
- Se adaptan al ancho del contenedor
- Texto legible en móviles
- No causan overflow horizontal

## ♿ Accesibilidad

- Colores con contraste adecuado
- Animaciones sutiles (no causan mareo)
- Texto descriptivo para lectores de pantalla

## 🚀 Futuras Mejoras

Posibles mejoras opcionales:

1. **Progress bar**: Mostrar progreso de transcripción (si la API lo soporta)
2. **Sound waves**: Visualización de onda de audio mientras graba
3. **Estimación de tiempo**: "Approx. 2 seconds..."
4. **Cancelación**: Botón para cancelar transcripción en progreso
5. **Animación de entrada/salida**: Fade in/out suave

---

**Fecha**: Octubre 7, 2025  
**Proyecto**: POC Audio - Cloud Speech-to-Text  
**Universidad del Valle** - Proyecto Integrador II-01

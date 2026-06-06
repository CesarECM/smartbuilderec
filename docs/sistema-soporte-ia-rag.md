# Sistema de Soporte IA con RAG — Arquitectura Genérica

> Documento técnico de referencia para implementar este sistema en cualquier proyecto independiente.  
> Generado a partir de la implementación en directorioec.mx — Sprint 9.

---

## Concepto Central

Este sistema implementa un **agente de soporte conversacional de tres capas** que se auto-mejora con el tiempo. La idea central es que ningún ticket debe existir dos veces: cuando un humano resuelve algo que la IA no pudo, el sistema aprende automáticamente de esa resolución y actualiza su base de conocimiento para que la próxima vez lo resuelva solo.

---

## Las Tres Capas de Resolución

```
Usuario pregunta
      │
      ▼
┌─────────────────────────────────┐
│  CAPA 1 — IA Autónoma (RAG)    │  Resuelve ~70% de casos
│  Claude Sonnet + pgvector       │
└─────────────┬───────────────────┘
              │ No resuelto en N turnos
              ▼
┌─────────────────────────────────┐
│  CAPA 2 — Escalación a Ticket  │  El usuario genera un ticket
│  Vinculado a la sesión de chat  │  con historial completo
└─────────────┬───────────────────┘
              │ Admin resuelve
              ▼
┌─────────────────────────────────┐
│  CAPA 3 — Feedback Loop IA     │  Claude analiza la resolución
│  Genera sugerencias de mejora   │  y propone mejoras al sistema
└─────────────────────────────────┘
```

---

## Arquitectura de Datos

### Tablas Principales (PostgreSQL + pgvector)

**Knowledge Base** — La fuente de verdad de la IA:

```sql
-- Respuestas cortas y directas
knowledge_faqs (
  id          uuid PRIMARY KEY,
  pregunta    text NOT NULL,
  respuesta   text NOT NULL,
  categoria   text,                -- dominio-específico
  activo      boolean DEFAULT true,
  votos_util  integer DEFAULT 0,   -- feedback implícito de usuarios
  embedding   vector(1536)         -- generado con OpenAI
)

-- Documentación larga dividida en fragmentos
knowledge_recursos (
  id        uuid PRIMARY KEY,
  titulo    text NOT NULL,
  tipo      text,   -- 'articulo' | 'video' | 'pdf' | 'tutorial'
  contenido text,
  url       text,
  activo    boolean DEFAULT true,
  embedding vector(1536)  -- del título (para búsqueda rápida de pertinencia)
)

-- Fragmentos indexados del contenido largo
knowledge_chunks (
  id          uuid PRIMARY KEY,
  recurso_id  uuid REFERENCES knowledge_recursos ON DELETE CASCADE,
  chunk_index integer,
  contenido   text NOT NULL,
  embedding   vector(1536)   -- cada fragmento tiene su propio vector
)
```

**Conversación y Escalación**:

```sql
-- Cada sesión de chat (una por conversación)
soporte_sesiones (
  id             uuid PRIMARY KEY,
  user_id        uuid,             -- nullable: permite anónimos
  pagina_origen  text,             -- ¿desde qué URL abrió el chat?
  total_turnos   integer,
  transcript     jsonb,            -- [{role, content}] array completo
  resolucion     text,             -- 'resuelta_l1' | 'escalada_l3'
  ticket_id      uuid              -- referencia circular (FK hacia tickets)
)

-- Tickets creados por escalación desde chat
soporte_tickets (
  id                     uuid PRIMARY KEY,
  numero                 serial UNIQUE,    -- identificador legible (#123)
  sesion_id              uuid,             -- lleva el historial completo
  user_id                uuid,
  asunto                 text,
  categoria              text,
  prioridad              text,
  estado                 text,             -- nuevo → en_revision → resuelto
  resolucion             text,             -- respuesta que dio el agente humano
  notas_internas         text,
  tiempo_resolucion_mins integer           -- métrica para SLA
)
```

**Sistema de Aprendizaje**:

```sql
-- Sugerencias que genera la IA al analizar resoluciones
soporte_sugerencias (
  id                  uuid PRIMARY KEY,
  tipo                text,   -- 'nueva_faq' | 'nuevo_recurso' | 'actualizar_prompt' | 'patron_detectado'
  ticket_ids          uuid[], -- tickets que originaron esta sugerencia
  propuesta           jsonb,  -- {descripcion, contenido, causa_raiz}
  estado              text,   -- pendiente → aprobada | rechazada
  aprobada_por        uuid,
  aplicada_en         timestamptz
)

-- Versiones del system prompt (nunca se auto-modifica, requiere humano)
soporte_prompt_versions (
  id              uuid PRIMARY KEY,
  version         integer,
  prompt_sistema  text NOT NULL,
  activo          boolean DEFAULT false,  -- solo uno activo a la vez
  cambios         text,
  aprobado_por    uuid
)
```

### Función RPC de Búsqueda Vectorial

Esta función es el corazón del RAG. Se ejecuta en PostgreSQL y combina FAQs + chunks en una sola consulta:

```sql
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding       vector(1536),
  similarity_threshold  float DEFAULT 0.72,
  match_count           int DEFAULT 5
)
RETURNS TABLE (
  id          uuid,
  tipo        text,   -- 'faq' o 'recurso_chunk'
  titulo      text,
  contenido   text,
  similarity  float
) AS $$
BEGIN
  RETURN QUERY
    -- Buscar en FAQs directamente
    SELECT f.id, 'faq'::text, f.pregunta, f.respuesta,
           1 - (f.embedding <=> query_embedding) AS similarity
    FROM knowledge_faqs f
    WHERE f.activo = true
      AND 1 - (f.embedding <=> query_embedding) > similarity_threshold

    UNION ALL

    -- Buscar en chunks de recursos
    SELECT c.id, 'recurso_chunk'::text, r.titulo, c.contenido,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM knowledge_chunks c
    JOIN knowledge_recursos r ON r.id = c.recurso_id
    WHERE r.activo = true
      AND 1 - (c.embedding <=> query_embedding) > similarity_threshold

    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

Índices HNSW para búsqueda rápida incluso con millones de vectores:

```sql
CREATE INDEX ON knowledge_faqs     USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON knowledge_recursos USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON knowledge_chunks   USING hnsw (embedding vector_cosine_ops);
```

---

## El Pipeline RAG — Paso a Paso

### 1. Indexación (al escribir contenido)

```
Admin escribe FAQ o recurso
          │
          ▼
   texto = pregunta + " " + respuesta   (para FAQ)
   texto = título                        (para recurso)
          │
          ▼
   OpenAI text-embedding-3-small
          │
          ▼
   vector[1536] → guardado en columna embedding
```

Para recursos largos, el contenido se fragmenta antes de indexar:

```typescript
function chunkText(text: string, size = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;  // overlap evita cortar ideas a la mitad
  }
  return chunks;
}
```

Cada fragmento recibe su propio embedding. Esto permite que una pregunta encuentre el párrafo exacto de un artículo largo, no el artículo completo.

### 2. Retrieval (en cada mensaje del usuario)

```typescript
async function retrieveKnowledge(query: string) {
  // 1. Generar embedding de la pregunta del usuario
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query.slice(0, 32_000)  // límite seguro
  });

  // 2. Buscar por similitud coseno en PostgreSQL
  const { data } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding.data[0].embedding,
    similarity_threshold: 0.72,
    match_count: 5
  });

  return data; // los documentos más relevantes
}
```

El threshold `0.72` es la palanca más importante del sistema: muy bajo = ruido irrelevante, muy alto = demasiado estricto y pierde contexto útil. Se ajusta empíricamente con los datos del proyecto.

### 3. Augmentation (construcción del system prompt)

```typescript
async function buildSystemPrompt(lastMessage: string, userContext: UserCtx) {
  const docs = await retrieveKnowledge(lastMessage);

  const knowledgeSection = docs.length > 0
    ? `CONOCIMIENTO DISPONIBLE:\n${docs.map(d =>
        `[${d.tipo.toUpperCase()}] ${d.titulo}\n${d.contenido}`
      ).join("\n---\n")}`
    : "No hay documentación específica disponible para esta consulta.";

  return `
Eres un asistente de soporte para [TU PRODUCTO].
${buildUserContextSection(userContext)}

${knowledgeSection}

REGLAS:
- Responde solo sobre [TU DOMINIO].
- Si no sabes con certeza, di que no sabes.
- Si el usuario lleva más de 4 intercambios sin resolver, sugiere crear un ticket.
- Máximo 3 párrafos por respuesta.
  `.trim();
}
```

El knowledge base se inyecta **dinámicamente en cada mensaje**. La IA no memoriza las FAQs — las recibe en contexto según lo que el usuario preguntó. Esto mantiene el prompt corto y siempre relevante.

### 4. Generation con Streaming

```typescript
// Next.js Route Handler
export async function POST(req: Request) {
  const { mensaje, sesionId, historial } = await req.json();
  const systemPrompt = await buildSystemPrompt(mensaje, userCtx);

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...historial,        // historial completo de la sesión
      { role: "user", content: mensaje }
    ]
  });

  // El cliente ve la respuesta mientras se genera
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta") {
          controller.enqueue(chunk.delta.text);
        }
      }
      controller.close();
      // Al terminar: persistir transcripción en BD
      await persistirSesion(sesionId, mensaje, await stream.finalMessage());
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain",
      "x-sesion-id": sesionId  // el cliente lo guarda para continuidad de sesión
    }
  });
}
```

---

## El Feedback Loop — Cómo el Sistema Aprende

Cuando un agente humano resuelve un ticket, se dispara automáticamente:

```typescript
async function analizarResolucion(ticketId: string) {
  const ticket = await obtenerTicketConSesion(ticketId);

  const analisis = await anthropic.messages.create({
    model: "claude-haiku-4-5",  // más barato para análisis en lote
    messages: [{
      role: "user",
      content: `
Analiza este ticket de soporte resuelto:

PREGUNTA ORIGINAL: ${ticket.asunto}
HISTORIAL DE CHAT: ${JSON.stringify(ticket.sesion.transcript)}
RESOLUCIÓN HUMANA: ${ticket.resolucion}

Responde en JSON:
{
  "ia_podia_resolverlo": boolean,
  "por_que_no": "string o null",
  "sugerencias": [
    {
      "tipo": "nueva_faq" | "nuevo_recurso" | "actualizar_prompt",
      "descripcion": "qué crear/modificar",
      "contenido_propuesto": "el texto exacto a agregar",
      "causa_raiz": "qué gap de conocimiento cubriría"
    }
  ]
}
      `
    }]
  });

  // Guardar sugerencias pendientes de aprobación humana
  await guardarSugerencias(ticketId, analisis);
}
```

**Invariante de seguridad crítica**: Los prompts del sistema **nunca se auto-modifican**. Cuando el análisis sugiere `actualizar_prompt`, el sistema crea una nueva versión en `soporte_prompt_versions` con `activo = false`. Un humano debe aprobarla y activarla manualmente. Las FAQs y recursos sí se pueden crear automáticamente al aprobar la sugerencia.

### Cron de Detección de Patrones

Corre diariamente y busca tickets similares que ningún análisis individual habría detectado:

```typescript
// Corre a las 02:00 UTC
async function analizarPatrones() {
  const tickets = await obtenerTicketsResueltos(30); // últimos 30 días

  const analisis = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    messages: [{
      role: "user",
      content: `
Analiza estos ${tickets.length} tickets resueltos del último mes.
Detecta patrones: temas recurrentes (3+ tickets) que NO estén cubiertos en FAQs.
Para cada patrón, propón una FAQ o recurso nuevo.

TICKETS: ${JSON.stringify(tickets.map(t => ({
  asunto: t.asunto,
  categoria: t.categoria,
  resolucion: t.resolucion
})))}

Responde como array JSON de sugerencias del tipo "patron_detectado".
      `
    }]
  });

  await guardarSugerencias(null, analisis, "patron_detectado");
}
```

---

## Arquitectura de Archivos

```
/
├── app/
│   ├── api/
│   │   └── soporte/
│   │       ├── chat/route.ts           — streaming IA, lógica RAG
│   │       ├── tickets/route.ts        — CRUD tickets
│   │       ├── tickets/[id]/route.ts   — detalle + feedback loop
│   │       ├── faqs/route.ts           — CRUD FAQs + indexación
│   │       ├── recursos/route.ts       — CRUD recursos + chunking
│   │       ├── sugerencias/route.ts    — aprobar/rechazar mejoras IA
│   │       └── admin/route.ts          — dashboard stats
│   └── api/cron/
│       └── analizar-patrones/route.ts  — detección nocturna de patrones
│
├── components/soporte/
│   ├── ChatWidget.tsx    — widget flotante, manejo de sesión, streaming
│   ├── ChatMessages.tsx  — renderizado de mensajes, markdown
│   └── TicketForm.tsx    — formulario de escalación
│
└── lib/soporte/
    ├── rag.ts             — retrieveKnowledge(), formatDocsForPrompt()
    ├── embeddings.ts      — generateEmbedding(), chunkText(), embedChunks()
    ├── context-builder.ts — buildSystemPrompt() dinámico
    └── prompts/
        ├── base.ts        — prompt genérico (personalizar por dominio)
        └── admin.ts       — prompt para usuarios con más contexto
```

---

## Variables de Entorno Requeridas

```env
# LLM — chat y análisis
ANTHROPIC_API_KEY=sk-ant-...

# Embeddings — indexación y retrieval
OPENAI_API_KEY=sk-...

# Base de datos
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...         # para operaciones admin (bypass RLS)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Cron (Vercel)
CRON_SECRET=...
```

---

## Puntos de Adaptación por Dominio

Estos son los únicos elementos que cambian entre un proyecto y otro:

| Elemento | Dónde está | Qué cambiar |
|---|---|---|
| **Identidad del agente** | `lib/prompts/base.ts` | Nombre, tono, qué sabe y qué no sabe |
| **Categorías** | ENUMs SQL | Reemplazar por las categorías de tu dominio |
| **Contexto de usuario** | `buildSystemPrompt()` | Qué datos del usuario inyectar (plan, historial, etc.) |
| **Threshold de similitud** | `rag.ts` | 0.72 default; bajar si hay poca KB, subir si hay ruido |
| **Turnos antes de escalar** | `ChatWidget.tsx` | 6 por defecto; ajustar según complejidad del dominio |
| **Modelo de chat** | `chat/route.ts` | Sonnet para calidad, Haiku para economía |
| **Tamaño de chunks** | `embeddings.ts` | 1200 chars default; docs técnicos = chunks más pequeños |

---

## Flujo Completo

```
USUARIO                  BACKEND                      BASE DE DATOS
  │                          │                               │
  │── "¿Cómo cancelo?" ────▶│                               │
  │                          │── embed(pregunta) ──▶ OpenAI │
  │                          │◀── vector[1536] ─────────────│
  │                          │                               │
  │                          │── match_knowledge() ─────────▶│
  │                          │◀── [FAQ1, Chunk3, FAQ5] ──────│
  │                          │                               │
  │                          │── buildSystemPrompt()         │
  │                          │   [base + contexto + docs]    │
  │                          │                               │
  │                          │── Claude Sonnet stream ──▶ Anthropic
  │◀── [respuesta stream] ───│                               │
  │                          │── persistir transcript ──────▶│
  │                          │                               │
  │ (6 turnos sin resolver)  │                               │
  │── [crear ticket] ───────▶│── INSERT ticket ─────────────▶│
  │                          │── UPDATE sesion (escalada) ───▶│
  │                          │                               │
ADMIN                        │                               │
  │── resolver ticket ──────▶│── UPDATE ticket (resuelto) ──▶│
  │                          │── analizarResolucion() ──▶ Claude Haiku
  │                          │◀── {sugerencias} ─────────────│
  │                          │── INSERT sugerencias ─────────▶│
  │                          │                               │
  │── aprobar sugerencia ───▶│── INSERT FAQ + embed ─────────▶│
  │                          │   (la próxima vez la IA        │
  │                          │    lo resuelve sola)           │
```

---

## Métricas de Éxito a Monitorear

```sql
-- Tasa de resolución L1 (IA sin escalación)
SELECT
  COUNT(*) FILTER (WHERE resolucion = 'resuelta_l1') * 100.0 / COUNT(*) AS tasa_l1,
  AVG(total_turnos) AS turnos_promedio
FROM soporte_sesiones
WHERE created_at > NOW() - INTERVAL '30 days';

-- Tiempo promedio de resolución humana (SLA)
SELECT AVG(tiempo_resolucion_mins)
FROM soporte_tickets
WHERE estado = 'resuelto'
  AND created_at > NOW() - INTERVAL '30 days';

-- Sugerencias aplicadas vs generadas (calidad del feedback loop)
SELECT estado, COUNT(*)
FROM soporte_sugerencias
GROUP BY estado;
```

---

## Decisiones de Diseño No Obvias

1. **OpenAI para embeddings, Anthropic para chat**: Los embeddings de OpenAI `text-embedding-3-small` son el estándar de facto para pgvector. Claude no ofrece API de embeddings. No mezclar modelos de embedding: si indexas con OpenAI, debes buscar con OpenAI.

2. **Historial completo en `transcript` (JSONB)**: La sesión guarda el array completo `[{role, content}]`. Cuando se escala a ticket, el agente humano ve la conversación íntegra sin reconstruir nada.

3. **Los prompts nunca se auto-modifican**: Es la única salvaguarda crítica del sistema. Sin este principio, el sistema podría degradarse solo con una sugerencia mal generada. Las FAQs y recursos sí se auto-aplican al aprobar; los prompts no.

4. **Fire-and-forget para el feedback loop**: `analizarResolucion()` corre en background sin bloquear la respuesta al admin. Si falla, no afecta la experiencia del usuario ni del agente.

5. **Sesiones anónimas permitidas**: `user_id` es nullable. Esto habilita soporte sin login — útil para capturar leads antes de que el usuario tenga cuenta.

6. **Cron de patrones en horario nocturno**: El análisis grupal es costoso en tokens. Correr a las 02:00 UTC evita competir con tráfico real y mantiene el costo controlado (Claude Haiku, máximo N tickets por lote).

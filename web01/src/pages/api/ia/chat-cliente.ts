import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const query = data.query;
    const history = data.history || [];

    if (!query) {
      return new Response(JSON.stringify({ success: false, error: 'La pregunta no puede estar vacía.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // URL de la IA en la red local
    const AI_URL = import.meta.env.PUBLIC_COGNITIVE_IA_URL || 'http://100.110.176.23:8000';
    const endpoint = `${AI_URL}/api/chat/query`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      // AQUÍ ESTÁ LA MAGIA DE SEGURIDAD:
      // Forzamos siempre el rol "cliente". El navegador no puede modificar esto
      // porque ocurre del lado del servidor (backend de Astro).
      const securePayload = {
        query: query,
        history: history,
        user_role: "cliente" // Rol restrictivo inyectado
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(securePayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[IA Proxy Cliente] Error del Cerebro Cognitivo:", response.status, errorData);
        return new Response(JSON.stringify({ success: false, error: `Error interno de la IA (Status ${response.status})` }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await response.json();
      
      // Filtrar posibles respuestas que contengan información sensible de la API interna
      return new Response(JSON.stringify({
        success: true,
        answer: result.answer,
        sources: result.sources // Devolvemos fuentes por si el cliente quiere saber de qué producto habla
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[IA Proxy Cliente] Error de conexión:", fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({ success: false, error: 'El asesor virtual está demorado. Por favor, intentá de nuevo.' }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ success: false, error: 'Asesor virtual temporalmente no disponible.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error("[IA Proxy Cliente] Error general:", error);
    return new Response(JSON.stringify({ success: false, error: 'Error del servidor web.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

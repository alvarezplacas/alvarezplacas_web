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

    // La URL local en la VPN donde corre el Nodo 3 (Cerebro Cognitivo)
    // Puede leerse de las variables de entorno o tener un fallback seguro
    const AI_URL = import.meta.env.PUBLIC_COGNITIVE_IA_URL || 'http://100.110.176.23:8000';
    const endpoint = `${AI_URL}/api/chat/query`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout porque la IA puede tardar

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          history: history
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[IA Proxy] Error del Cerebro Cognitivo:", response.status, errorData);
        return new Response(JSON.stringify({ success: false, error: `Error del Cerebro Cognitivo (Status ${response.status})` }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await response.json();
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[IA Proxy] Error de conexión con Cerebro Cognitivo:", fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({ success: false, error: 'Tiempo de espera agotado. La IA tardó demasiado en responder.' }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ success: false, error: 'No se pudo contactar al Cerebro Cognitivo. Verifique que la PC i7 (Nodo 3) esté encendida y la VPN conectada.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error("[IA Proxy] Error interno:", error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno en el proxy del Dashboard.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

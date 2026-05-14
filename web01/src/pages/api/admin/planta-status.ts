import type { APIRoute } from 'astro';

/**
 * Proxy API for Plant Status (Monitoreo Industrial)
 * Connects to the local plant server via Tailscale VPN.
 */
export const GET: APIRoute = async () => {
    const PLANTA_URL = 'http://100.94.20.127:3000/api/public-status';

    try {
        const response = await fetch(PLANTA_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Set a short timeout to avoid hanging the VPS if the plant is offline
            signal: AbortSignal.timeout(5000) 
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: `Error de planta: ${response.statusText}` 
            }), { status: 500 });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        console.error('[Planta Proxy Error]:', error.message);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'No se pudo conectar con el servidor de planta (Offline o VPN desconectada)' 
        }), { status: 503 });
    }
};

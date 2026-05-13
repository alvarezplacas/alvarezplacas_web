import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { createItem } from '@directus/sdk';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const client_session = cookies.get('client_session')?.value;
        
        if (!client_session) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Debes iniciar sesión para generar un presupuesto oficial.' 
            }), { status: 401 });
        }

        const data = await request.json();
        
        // El id del cliente en el sistema es el valor de la cookie client_session
        const cliente_id = parseInt(client_session);

        if (isNaN(cliente_id)) {
             return new Response(JSON.stringify({ 
                success: false, 
                message: 'Sesión inválida. Por favor re-ingresa al sistema.' 
            }), { status: 400 });
        }

        // Crear el pedido/presupuesto en Directus
        // Usamos la colección 'pedidos' que ya tiene los campos necesarios
        const result = await directus.request(createItem('pedidos', {
            cliente_id: cliente_id,
            status: 'pendiente', 
            datos_optimizacion: data, // JSON con los proyectos y piezas
            fecha_pedido: new Date().toISOString(),
            resumen_visible: true,
            total_m2: data.projects.reduce((acc, p) => acc + (p.stats?.totalM2 || 0), 0)
        }));

        console.log(`[SmartCut] Presupuesto generado ID: ${result.id} para cliente: ${cliente_id}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Presupuesto enviado correctamente', 
            id: result.id 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('[SmartCut Save Error]:', e);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error interno al procesar el presupuesto: ' + (e.message || 'Error desconocido')
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

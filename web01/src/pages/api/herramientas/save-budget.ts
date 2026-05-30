import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { createItem, readItem } from '@directus/sdk';

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

        // Obtener datos del cliente y su vendedor asignado
        let sellerId = null;
        let clientName = `Cliente #${cliente_id}`;
        let sellerName = 'Braian';
        try {
            const clientData = await directus.request(readItem('clientes', cliente_id, {
                fields: ['id', 'name', 'nombre_empresa', 'vendedor_id']
            })) as any;
            
            if (clientData) {
                clientName = clientData.nombre_empresa || clientData.name || clientName;
                if (clientData.vendedor_id) {
                    sellerId = typeof clientData.vendedor_id === 'object' ? clientData.vendedor_id.id : clientData.vendedor_id;
                    try {
                        const sellerData = await directus.request(readItem('vendedores', sellerId, {
                            fields: ['name']
                        })) as any;
                        if (sellerData?.name) {
                            sellerName = sellerData.name;
                        }
                    } catch (err) {
                        console.error('[SmartCut] Error fetching seller name:', err);
                    }
                }
            }
        } catch (err) {
            console.error('[SmartCut] Error fetching client assigned seller:', err);
        }

        // Crear el pedido/presupuesto en Directus
        // Usamos la colección 'pedidos' que ya tiene los campos necesarios
        const result = await directus.request(createItem('pedidos', {
            cliente_id: cliente_id,
            vendedor_id: sellerId,
            status: 'pendiente', 
            datos_optimizacion: data, // JSON con los proyectos y piezas
            fecha_pedido: new Date().toISOString(),
            resumen_visible: true,
            total_m2: data.projects.reduce((acc, p) => acc + (p.stats?.totalM2 || 0), 0)
        })) as any;

        console.log(`[SmartCut] Presupuesto generado ID: ${result.id} para cliente: ${cliente_id}, vendedor asignado: ${sellerId}`);

        // 💬 DISPARADOR DE NOTIFICACIÓN DE WHATSAPP AL VENDEDOR (+5491161411842)
        const totalPlates = data.projects.reduce((acc: number, p: any) => acc + (p.stats?.totalPlates || 0), 0);
        const reqDateStr = data.fecha_entrega_requerida 
            ? new Date(data.fecha_entrega_requerida).toLocaleDateString('es-AR') 
            : 'A confirmar';
        const msg = `${sellerName}, acabas de recibir un pedido de corte de parte de ${clientName} a través de nuestro sitio web! 📝 Placas: ${totalPlates} unidades. Fecha de entrega requerida: ${reqDateStr}.`;
        
        console.log(`[SmartCut Notification Dispatch] Enviando WhatsApp a +5491161411842: "${msg}"`);
        
        try {
            await fetch('https://admin.alvarezplacas.com.ar/api/notifications/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer alvarez-api-token-v16-2026' },
                body: JSON.stringify({
                    phone: '+5491161411842',
                    message: msg
                })
            });
        } catch (wppErr: any) {
            console.error('[SmartCut] Error enviando WhatsApp al vendedor:', wppErr.message);
        }

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

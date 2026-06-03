import { directus } from '@conexiones/directus.js';
import { updateItem, readItem } from '@directus/sdk';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
    const session = cookies.get('admin_session')?.value || cookies.get('seller_session')?.value;
    if (!session) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const { pedidoId, total, comentarios } = await request.json();

        if (!pedidoId || total === undefined) {
            return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }

        // 1. Obtener datos del pedido y el cliente asociado
        const order = await directus.request(readItem('pedidos', pedidoId, {
            fields: ['id', 'status', 'cliente_id', 'vendedor_id']
        })) as any;

        if (!order) {
            return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404 });
        }

        const clientId = typeof order.cliente_id === 'object' ? order.cliente_id.id : order.cliente_id;
        const sellerId = typeof order.vendedor_id === 'object' ? order.vendedor_id.id : order.vendedor_id;

        // 2. Obtener datos del cliente (nombre y teléfono) y del vendedor
        let clientName = 'Cliente';
        let clientPhone = '';
        let sellerName = 'Tu asesor';

        if (clientId) {
            const clientData = await directus.request(readItem('clientes', clientId, {
                fields: ['name', 'nombre_empresa', 'phone']
            })) as any;
            if (clientData) {
                clientName = clientData.nombre_empresa || clientData.name || clientName;
                clientPhone = clientData.phone || '';
            }
        }

        if (sellerId) {
            const sellerData = await directus.request(readItem('vendedores', sellerId, {
                fields: ['name']
            })) as any;
            if (sellerData?.name) {
                sellerName = sellerData.name;
            }
        }

        // 3. Actualizar el pedido en Directus: establecer el total en pesos y comentarios visibles
        const totalVal = parseFloat(total);
        const result = await directus.request(updateItem('pedidos', pedidoId, {
            total: totalVal,
            resumen_visible: comentarios || `Tu presupuesto de placas y herrajes ha sido cotizado por un total de $${totalVal.toLocaleString('es-AR')}.`,
            date_updated: new Date().toISOString()
        }));

        // 4. Enviar notificación de WhatsApp al cliente
        if (clientPhone) {
            // Sanitizar y formatear teléfono
            let cleanPhone = clientPhone.replace(/\D/g, '');
            if (cleanPhone.length === 10) {
                cleanPhone = '549' + cleanPhone;
            } else if (cleanPhone.startsWith('15') && cleanPhone.length === 11) {
                cleanPhone = '549' + cleanPhone.substring(2);
            } else if (cleanPhone.length > 0 && !cleanPhone.startsWith('54') && !cleanPhone.startsWith('+54')) {
                cleanPhone = '549' + cleanPhone;
            }
            const cleanPhoneFormatted = cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone;

            const msg = `¡Hola ${clientName}! Tu asesor de Alvarez Placas, ${sellerName}, ha enviado la cotización oficial para tu pedido #${pedidoId}.\n\n💰 Total Cotizado: *$${totalVal.toLocaleString('es-AR')}*.\n💬 Notas: ${comentarios || 'Listo para aprobar.'}\n\n🔗 Ingresá a tu Panel de Clientes para revisar el detalle de materiales y Aprobar tu Presupuesto para iniciar el corte: https://alvarezplacas.com.ar/cliente/pedidos`;

            console.log(`[Quote Sent Notification] Enviando WhatsApp al cliente ${cleanPhoneFormatted}: "${msg}"`);

            try {
                await fetch('https://admin.alvarezplacas.com.ar/api/notifications/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer alvarez-api-token-v16-2026' },
                    body: JSON.stringify({
                        phone: cleanPhoneFormatted,
                        message: msg
                    })
                });
            } catch (wppErr: any) {
                console.error('[Send Quote] Error enviando WhatsApp al cliente:', wppErr.message);
            }
        }

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (e: any) {
        console.error("[Send Quote API Error]:", e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor: ' + e.message }), { status: 500 });
    }
};

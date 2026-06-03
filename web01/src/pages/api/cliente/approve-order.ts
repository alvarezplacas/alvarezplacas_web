import { directus } from '@conexiones/directus.js';
import { updateItem, readItem } from '@directus/sdk';

export const POST = async ({ request, cookies }: any) => {
    try {
        const body = await request.json();
        const { pedidoId } = body;
        const clientId = cookies.get('client_session')?.value;

        if (!clientId || !pedidoId) {
            return new Response(JSON.stringify({ error: 'Acceso denegado o ID faltante' }), { status: 400 });
        }

        // Helper: sanitiza y formatea el teléfono para WhatsApp (+54911...)
        const formatWhatsAppPhone = (phone: string): string => {
            let clean = phone.replace(/\D/g, '');
            if (clean.length === 10) {
                clean = '549' + clean;
            } else if (clean.startsWith('15') && clean.length === 11) {
                clean = '549' + clean.substring(2);
            } else if (clean.length > 0 && !clean.startsWith('54') && !clean.startsWith('+54')) {
                clean = '549' + clean;
            }
            return clean.startsWith('+') ? clean : '+' + clean;
        };

        // 1. Validar que el pedido pertenezca al cliente, y obtener sus datos + vendedor
        const pedido = await directus.request(readItem('pedidos', pedidoId, {
            fields: ['cliente_id', 'vendedor_id', 'total']
        })) as any;

        if (!pedido) {
            return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404 });
        }

        const pedidoClientId = typeof pedido.cliente_id === 'object' ? pedido.cliente_id.id : pedido.cliente_id;
        const sellerId = typeof pedido.vendedor_id === 'object' ? pedido.vendedor_id.id : pedido.vendedor_id;

        if (String(pedidoClientId) !== String(clientId)) {
            return new Response(JSON.stringify({ error: 'Pedido no pertenece a tu cuenta' }), { status: 403 });
        }

        // 2. Obtener información de contacto del cliente y vendedor
        let clientName = 'Cliente';
        let clientPhone = 'No especificado';
        if (clientId) {
            const clientData = await directus.request(readItem('clientes', clientId, {
                fields: ['name', 'nombre_empresa', 'phone']
            })) as any;
            if (clientData) {
                clientName = clientData.nombre_empresa || clientData.name || clientName;
                clientPhone = clientData.phone || clientPhone;
            }
        }

        let sellerName = 'Braian';
        let sellerPhone = '+5491161411842'; // Fallback
        if (sellerId) {
            const sellerData = await directus.request(readItem('vendedores', sellerId, {
                fields: ['name', 'whatsapp']
            })) as any;
            if (sellerData) {
                sellerName = sellerData.name || sellerName;
                if (sellerData.whatsapp) {
                    sellerPhone = formatWhatsAppPhone(sellerData.whatsapp);
                }
            }
        }
        
        // 3. Actualizar estado del pedido a 'en_produccion' (aprobado por el cliente)
        await directus.request(updateItem('pedidos', pedidoId, {
            status: 'en_produccion',
            date_updated: new Date().toISOString()
        }));

        // 4. Enviar notificación de WhatsApp al vendedor asignado para avisarle que LLAME al cliente de inmediato
        const quoteTotal = pedido.total ? parseFloat(pedido.total) : 0;
        const msg = `🚨 *URGENTE - ACORDAR PAGO* 🚨\n\n¡Hola ${sellerName}! El cliente *${clientName}* acaba de APROBAR el presupuesto del pedido *#${pedidoId}* por un total de *$${quoteTotal.toLocaleString('es-AR')}*.\n\n📞 *DEBES LLAMARLO DE INMEDIATO* al número: *${clientPhone}* para coordinar el cobro y dar inicio formal a la producción en taller.\n\n🔗 Ver detalles: https://alvarezplacas.com.ar/vendedor/pedidos?id=${pedidoId}`;

        console.log(`[Urgent Call Notification Dispatch] Enviando WhatsApp al vendedor a ${sellerPhone}: "${msg}"`);

        try {
            await fetch('https://admin.alvarezplacas.com.ar/api/notifications/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer alvarez-api-token-v16-2026' },
                body: JSON.stringify({
                    phone: sellerPhone,
                    message: msg
                })
            });
        } catch (wppErr: any) {
            console.error('[Approve Order] Error enviando alerta de llamada por WhatsApp al vendedor:', wppErr.message);
        }

        return new Response(JSON.stringify({ success: true, sellerName }), { status: 200 });
    } catch (e: any) {
        console.error("Error al aprobar pedido:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

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

        // Obtener datos del cliente y su vendedor asignado
        let sellerId = null;
        let clientName = `Cliente #${cliente_id}`;
        let sellerName = 'Braian';
        let sellerPhone = '+5491161411842'; // Fallback por defecto

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
                            fields: ['name', 'whatsapp']
                        })) as any;
                        if (sellerData?.name) {
                            sellerName = sellerData.name;
                        }
                        if (sellerData?.whatsapp) {
                            sellerPhone = formatWhatsAppPhone(sellerData.whatsapp);
                        }
                    } catch (err) {
                        console.error('[SmartCut] Error fetching seller name & phone:', err);
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
            status: 'presupuesto', 
            datos_optimizacion: data, // JSON con los proyectos, piezas y herrajes consolidado
            fecha_pedido: new Date().toISOString(),
            resumen_visible: true,
            total_m2: data.projects.reduce((acc, p) => acc + (p.stats?.totalM2 || 0), 0)
        })) as any;

        console.log(`[SmartCut] Presupuesto generado ID: ${result.id} para cliente: ${cliente_id}, vendedor asignado: ${sellerId} (${sellerPhone})`);

        // 💬 DISPARADOR DE NOTIFICACIÓN DE WHATSAPP AL VENDEDOR ASIGNADO
        const totalPlates = data.projects.reduce((acc: number, p: any) => acc + (p.stats?.totalPlates || 0), 0);
        const reqDateStr = data.fecha_entrega_requerida 
            ? new Date(data.fecha_entrega_requerida).toLocaleDateString('es-AR') 
            : 'A confirmar';
        
        // Obtener resumen compacto de herrajes principales para la alerta
        let hwSummary = '';
        if (data.hardware && data.hardware.length > 0) {
            const hwItems = data.hardware.slice(0, 3).map((h: any) => `${h.qty}x ${h.name.split(' (')[0]}`).join(', ');
            hwSummary = `\n🛠️ Herrajes principales: ${hwItems}${data.hardware.length > 3 ? '...' : ''}`;
        }
            
        const msg = `¡Hola ${sellerName}! Acabas de recibir un nuevo pedido de optimización de parte de *${clientName}* 📝\n\n📦 Placas: ${totalPlates} unidades.\n📅 Fecha de entrega requerida: ${reqDateStr}.${hwSummary}\n\n🔗 Abrir pedido para cotizar: https://alvarezplacas.com.ar/vendedor/pedidos?id=${result.id}`;
        
        console.log(`[SmartCut Notification Dispatch] Enviando WhatsApp a ${sellerPhone}: "${msg}"`);
        
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

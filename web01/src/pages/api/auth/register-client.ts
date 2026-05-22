import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems, createItem, staticToken, updateItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';
import { registerSession } from '../../../session_store';

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL_INTERNAL || import.meta.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = import.meta.env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

// Inicialización del cliente de Directus
const directusClient = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

export const GET: APIRoute = ({ redirect }) => {
    return redirect('/cliente/registro');
};

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        let body: any = {};
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            const formData = await request.formData();
            body = Object.fromEntries(formData);
        }

        const { name, email, phone, address, password, vendedor_id, cuit_dni } = body;

        if (!name || !email || !password) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Faltan campos obligatorios' 
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 🔒 SEGURIDAD: Bloquear emails de dominio interno
        if (email.toLowerCase().endsWith('@alvarezplacas.com.ar')) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'No se puede registrar con ese correo electrónico' 
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // 🔒 SEGURIDAD: Verificar que el email no pertenezca a un vendedor
        // Los vendedores SOLO se administran desde Directus, nunca desde el registro público
        const existingVendedor = await directusClient.request(readItems('vendedores', {
            filter: { email: { _eq: email.toLowerCase() } },
            limit: 1
        }));
        if (existingVendedor.length > 0) {
            // Mensaje genérico para no revelar que es vendedor
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'El correo electrónico ya está registrado' 
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Verificar si el usuario ya existe en clientes
        const existing = await directusClient.request(readItems('clientes', {
            filter: { email: { _eq: email.toLowerCase() } }
        }));

        if (existing.length > 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'El correo electrónico ya está registrado' 
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Generar Número de Cliente (ALV-XXXX)
        const lastClient = await directusClient.request(readItems('clientes', {
            sort: ['-id'],
            limit: 1,
            fields: ['client_number']
        }));

        let nextNum = 1001;
        if (lastClient.length > 0 && lastClient[0].client_number) {
            const match = lastClient[0].client_number.match(/\d+/);
            if (match) nextNum = parseInt(match[0]) + 1;
        }
        const client_number = `ALV-${nextNum}`;

        // 3. Hashear password
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Asignación de Vendedor
        let assignedSellerId = vendedor_id;
        
        if (!assignedSellerId || assignedSellerId === 'auto') {
            try {
                // Obtener todos los vendedores
                const allSellers = await directusClient.request(readItems('vendedores', {
                    fields: ['id', 'name']
                }));
                
                if (allSellers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * allSellers.length);
                    assignedSellerId = allSellers[randomIndex].id;
                }
            } catch (e) {
                console.error("Error trayendo vendedores para auto-asignación:", e);
            }
        }

        // 5. Crear en Directus
        console.log(`[Register] Creating client: ${email} (${client_number}) - Seller: ${assignedSellerId}`);
        
        try {
            const newClient = await directusClient.request(createItem('clientes', {
                name,
                email: email.toLowerCase().trim(),
                phone: phone ? phone.replace(/\D/g, '') : '',
                address: address || '',
                cuit_dni: cuit_dni || '',
                password_hash,
                client_number,
                status: 'active',
                scoring: 1,
                vendedor_id: assignedSellerId,
                registration_date: new Date().toISOString()
            }));

            // Auto-login
            const clientId = newClient?.id?.toString();
            if (clientId) {
                cookies.set('client_session', clientId, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30, // 30 días
                    httpOnly: true,
                    sameSite: 'lax'
                });

                const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
                const userAgent = request.headers.get('user-agent') || 'unknown';
                registerSession(ip, userAgent, clientId, 'client');
            }

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Registro exitoso. ¡Bienvenido al Club!',
                redirectUrl: '/cliente'
            }), { status: 201, headers: { 'Content-Type': 'application/json' } });

        } catch (directusError: any) {
            console.error('[Directus Create Error]:', JSON.stringify(directusError, null, 2));
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Error en Directus: ' + (directusError.message || 'Verifique campos obligatorios')
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (e: any) {
        console.error('[Registration General Error]:', e);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error en el servidor: ' + e.message 
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
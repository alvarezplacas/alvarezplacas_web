import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems, createItem, staticToken } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const getEnv = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) return (import.meta as any).env;
    return process.env;
};

const env = getEnv();
const DIRECTUS_URL = env.DIRECTUS_URL_INTERNAL || env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

// Inicialización correcta del cliente de Directus
const directusClient = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

// Todo debe estar envuelto en una función HTTP, en este caso POST
export const POST: APIRoute = async ({ request }) => {
    let data: any = {};
    const contentType = request.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            data = await request.json();
        } else {
            const formData = await request.formData();
            data = Object.fromEntries(formData.entries());
        }
    } catch (e) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error procesando la solicitud. Formato inválido.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const name = (data.name || data.nombre)?.toString();
    const email = data.email?.toString();
    const phone = (data.phone || data.whatsapp)?.toString();
    const address = (data.address || data.direccion)?.toString();
    const password = data.password?.toString();

    if (!name || !email || !password) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Campos obligatorios faltantes (Nombre, Email o Password)'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Generate Client Number (ALV-XXXX) via Directus
        const clientResults = await directusClient.request(readItems('clientes', {
            filter: { client_number: { _starts_with: 'ALV-' } },
            sort: ['-id'],
            limit: 1,
            fields: ['client_number']
        }));

        let nextNumber = 1;
        if (clientResults && clientResults.length > 0) {
            const lastNumString = clientResults[0].client_number.split('-')[1];
            if (lastNumString) {
                const lastNum = parseInt(lastNumString, 10);
                if (!isNaN(lastNum)) nextNumber = lastNum + 1;
            }
        }
        const clientNumber = `ALV-${nextNumber.toString().padStart(4, '0')}`;

        // 3. Assign Seller
        const sellers = await directusClient.request(readItems('vendedores', {
            fields: ['id']
        }));

        const assignedSellerId = sellers?.[0]?.id || null;

        // 4. Insert into "clientes" collection
        const createItemResult: any = await directusClient.request(createItem('clientes', {
            nombre_empresa: name,
            whatsapp: phone,
            direccion: address,
            email: email,
            password_hash: hashedPassword,
            client_number: clientNumber,
            vendedor_asignado: assignedSellerId,
            puntaje: 1,
            status: 'published'
        }));

        // Set session cookie
        const userId = createItemResult?.id || createItemResult?.key || 'unknown';
        const cookieValue = `client_session=${encodeURIComponent(userId.toString())}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;

        return new Response(JSON.stringify({
            success: true,
            message: '¡Bienvenido al Club! Tu registro ha sido exitoso.',
            redirectUrl: '/cliente'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookieValue
            }
        });

    } catch (e: any) {
        console.error('Registration Error:', e);

        let message = 'Error en el registro: ' + (e.message || 'Error desconocido');
        let status = 500;

        if (e.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            message = 'Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.';
            status = 400;
        }

        return new Response(JSON.stringify({
            success: false,
            message: message
        }), {
            status: status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
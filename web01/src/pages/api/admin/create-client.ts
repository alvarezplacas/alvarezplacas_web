import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { readItems, createItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { name, email, phone, address, vendedor_id } = body;

        if (!name || !email) {
            return new Response(JSON.stringify({ success: false, message: 'Nombre y Email son obligatorios' }), { status: 400 });
        }

        // 1. Verificar si el email ya existe
        const existing = await directus.request(readItems('clientes', {
            filter: { email: { _eq: email.toLowerCase() } }
        }));

        if (existing.length > 0) {
            return new Response(JSON.stringify({ success: false, message: 'El cliente ya está registrado con ese email' }), { status: 400 });
        }

        // 2. Generar Número de Cliente (ALV-XXXX)
        const lastClient = await directus.request(readItems('clientes', {
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

        // 3. Password por defecto: Alvarez2026
        const password_hash = await bcrypt.hash('Alvarez2026', 10);

        // 4. Crear en Directus
        const newClient = await directus.request(createItem('clientes', {
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            address: address || '',
            client_number,
            password_hash,
            status: 'active',
            scoring: 1, // Punto de inicio
            vendedor_id: vendedor_id || null,
            registration_date: new Date().toISOString()
        }));

        console.log(`[Admin Create Client] Success: ${client_number} - ${email}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Cliente ${client_number} registrado con éxito.`,
            redirectUrl: '/admin/clientes'
        }), { status: 201 });

    } catch (e: any) {
        console.error('[Admin Create Client Error]:', e);
        return new Response(JSON.stringify({ success: false, message: 'Error interno del servidor' }), { status: 500 });
    }
};

import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems, createItem, staticToken } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const DIRECTUS_URL = process.env.DIRECTUS_URL_INTERNAL || process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = 'jb-_twuOduXRpNMS_mN5-6jKKlE1ddH8';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

    let data: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        data = await request.json();
    } else {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
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
        const clientResults = await directus.request(readItems('clientes', {
            filter: { client_number: { _starts_with: 'ALV-' } },
            sort: ['-id'],
            limit: 1,
            fields: ['client_number']
        }));

        let nextNumber = 1;
        if (clientResults && clientResults.length > 0) {
            const lastNum = parseInt(clientResults[0].client_number.split('-')[1]);
            nextNumber = lastNum + 1;
        }
        const clientNumber = `ALV-${nextNumber.toString().padStart(4, '0')}`;

        // 3. Assign Seller (The one with fewer clients)
        // En Directus esto requiere un poco más de lógica si no tenemos SQL directo para COUNT/GROUP BY
        // Por ahora, traemos vendedores y asignamos el primero o buscamos uno.
        const sellers = await directus.request(readItems('vendedores', {
            fields: ['id', 'Nombre']
        }));

        let assignedSellerId = sellers?.[0]?.id || null;

        // 4. Insert into "clientes" collection
        const createItemResult: any = await directus.request(createItem('clientes', {
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

        // Set session cookie (logged in directly)
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

        // Manejo de errores específicos de Directus (duplicados, etc.)
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

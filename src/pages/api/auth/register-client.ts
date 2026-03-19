import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems, createItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const directus = createDirectus(DIRECTUS_URL).with(rest());

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const phone = formData.get('phone')?.toString();
    const address = formData.get('address')?.toString();
    const password = formData.get('password')?.toString();

    if (!name || !email || !password) {
        return new Response('Campos obligatorios faltantes', { status: 400 });
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
        await directus.request(createItem('clientes', {
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

        // Return JSON for AJAX requests
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Registro exitoso. Redirigiendo...' 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
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

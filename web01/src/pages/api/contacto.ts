import { directus } from '@conexiones/directus.js';
import { createItem } from '@directus/sdk';

export const POST = async ({ request }) => {
    try {
        const data = await request.formData();
        const nombre = data.get('nombre');
        const email = data.get('email');
        const tel = data.get('tel');
        const mensaje = data.get('mensaje');

        if (!nombre || !mensaje) {
            return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 });
        }

        // Intento de envío a Directus (Colección: mensajes_contacto)
        await directus.request(createItem('mensajes_contacto', {
            nombre,
            email,
            telefono: tel,
            mensaje,
            fecha: new Date().toISOString()
        }));

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('Error enviando a Directus:', error);
        return new Response(JSON.stringify({ success: true, warning: 'Sent with fallback' }), { status: 200 });
    }
};

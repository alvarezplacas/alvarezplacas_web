import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const directus = createDirectus(DIRECTUS_URL).with(rest());

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
        return new Response('Email y contraseña requeridos', { status: 400 });
    }

    try {
        // Buscar en la colección de 'clientes' en Directus (Case-insensitive)
        const clientResults = await directus.request(readItems('clientes', {
            filter: { email: { _icontains: email } },
            limit: 1
        }));

        const user = clientResults?.[0];

        if (!user) {
            return new Response('Usuario no encontrado', { status: 404 });
        }

        // En Directus, el campo se llama password_hash (según el esquema previo)
        // O tal vez password si es un campo de sistema. Asumimos el esquema personalizado.
        const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');

        if (!isPasswordValid) {
            return new Response('Contraseña incorrecta', { status: 401 });
        }

        // Set cookie (valid for 30 days)
        cookies.set('client_session', user.id.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        // El rol en el esquema Directus suele estar en un campo 'role'
        const role = user.role || 'client';

        if (role === 'admin') return redirect('/admin');
        if (role === 'seller') return redirect('/vendedor');
        return redirect('/cliente');

    } catch (e: any) {
        console.error('Login error:', e);
        return new Response('Error en el login: ' + e.message, { status: 500 });
    }
};

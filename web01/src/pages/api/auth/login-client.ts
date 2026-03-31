import type { APIRoute } from 'astro';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const getEnv = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) return (import.meta as any).env;
    return process.env;
};

const env = getEnv();
const DIRECTUS_URL = env.DIRECTUS_URL_INTERNAL || env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    console.log(`[Login] Attempt for: ${email} using ${DIRECTUS_URL}`);

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
            console.log(`[Login] User not found: ${email}`);
            return new Response('Usuario no encontrado', { status: 404 });
        }

        // En Directus, el campo se llama password_hash (según el esquema previo)
        // Intentamos bcrypt, pero si el hash no es válido o falla, comparamos plano (para migración/debug)
        let isPasswordValid = false;
        try {
            if (user.password_hash?.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(password, user.password_hash);
            } else {
                // Fallback para texto plano si no parece un hash de bcrypt
                isPasswordValid = (password === user.password_hash);
            }
        } catch (e) {
            console.warn('[Login] Bcrypt error, falling back to plain text', e);
            isPasswordValid = (password === user.password_hash);
        }

        if (!isPasswordValid) {
            console.log(`[Login] Invalid password for: ${email}`);
            return new Response('Contraseña incorrecta', { status: 401 });
        }

        // Set cookie (valid for 30 days)
        cookies.set('client_session', user.id.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        // Redirección
        const role = user.role || 'client';
        if (role === 'admin') return redirect('/admin');
        if (role === 'seller') return redirect('/vendedor');
        return redirect('/cliente');

    } catch (e: any) {
        console.error('[Login Error Detail]:', JSON.stringify(e, null, 2));
        const errMsg = e.message || (e.errors ? JSON.stringify(e.errors) : 'Error desconocido');
        return new Response('Error en el login: ' + errMsg, { status: 500 });
    }
};

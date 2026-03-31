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

export const GET: APIRoute = ({ redirect }) => {
    return redirect('/login');
};

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        console.log(`[Login] Attempt for: ${email}`);

        if (!email || !password) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Email y contraseña requeridos' 
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Buscar en la colección de 'clientes' en Directus (Case-insensitive)
        const clientResults = await directus.request(readItems('clientes', {
            filter: { email: { _icontains: email } },
            limit: 1
        }));

        const user = clientResults?.[0];

        if (!user) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Usuario no encontrado' 
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        let isPasswordValid = false;
        try {
            if (user.password_hash?.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(password, user.password_hash);
            } else {
                isPasswordValid = (password === user.password_hash);
            }
        } catch (e) {
            isPasswordValid = (password === user.password_hash);
        }

        if (!isPasswordValid) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Set cookie
        cookies.set('client_session', user.id.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        const role = user.role || 'client';
        let redirectUrl = '/cliente';
        if (role === 'admin') redirectUrl = '/admin';
        else if (role === 'seller') redirectUrl = '/vendedor';

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Sesión iniciada correctamente',
            redirectUrl 
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error('[Login Error Detail]:', JSON.stringify(e, null, 2));
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error interno: ' + (e.message || 'Error desconocido')
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

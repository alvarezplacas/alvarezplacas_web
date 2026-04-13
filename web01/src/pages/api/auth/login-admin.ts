import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { readItems } from '@directus/sdk';
import bcrypt from 'bcryptjs';

export const GET: APIRoute = ({ redirect }) => {
    return redirect('/login');
};

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Email y contraseña requeridos' }), { status: 400 });
        }

        console.log(`[Admin Login Attempt] Email: ${email}`);

        // Buscar en la colección de 'vendedores'
        let results;
        try {
             results = await directus.request(readItems('vendedores', {
                filter: { email: { _eq: email } },
                limit: 1
            }));
        } catch (error: any) {
            console.error('[Directus Query Error]:', error);
            return new Response(JSON.stringify({ 
                success: false, 
                message: `Error al conectar con la base de datos: ${error.message || 'Desconocido'}` 
            }), { status: 500 });
        }

        const user = results?.[0];

        if (!user) {
             return new Response(JSON.stringify({ success: false, message: 'Usuario no encontrado en la base de datos' }), { status: 401 });
        }

        if (user.email !== 'admin@alvarezplacas.com.ar') {
             return new Response(JSON.stringify({ success: false, message: 'El usuario no tiene privilegios de administrador' }), { status: 403 });
        }

        // Verificar password_hash
        let isPasswordValid = false;
        if (user.password_hash) {
            isPasswordValid = await bcrypt.compare(password, user.password_hash);
        } else {
            // Fallback para contraseñas en texto plano si existen (migración)
            console.warn('[Admin Login] Usando fallback de contraseña para admin');
            isPasswordValid = (password === 'JavierMix2026!');
        }

        if (isPasswordValid) {
            // Set session cookie
            cookies.set('admin_session', 'authenticated_javier', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 // 24 horas
            });

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Acceso administrativo concedido 🎉',
                redirectUrl: '/admin'
            }), { status: 200 });
        }

        return new Response(JSON.stringify({ success: false, message: 'Contraseña incorrecta' }), { status: 401 });
    } catch (e: any) {
        console.error('[Admin Login Critical Error]:', e);
        return new Response(JSON.stringify({ success: false, message: `Error crítico: ${e.message}` }), { status: 500 });
    }
};

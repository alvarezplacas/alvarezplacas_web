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
        const results = await directus.request(readItems('vendedores', {
            filter: { email: { _eq: email } },
            limit: 1
        }));

        const user = results?.[0];

        if (!user || user.email !== 'admin@alvarezplacas.com.ar') {
             return new Response(JSON.stringify({ success: false, message: 'No autorizado como administrador' }), { status: 401 });
        }

        // Verificar password_hash
        let isPasswordValid = false;
        if (user.password_hash) {
            isPasswordValid = await bcrypt.compare(password, user.password_hash);
        } else {
            // Fallback para contraseñas en texto plano si existen (migración)
            isPasswordValid = (password === 'JavierMix2026!');
        }

        if (isPasswordValid) {
            cookies.set('admin_session', 'authenticated_javier', {
                path: '/',
                maxAge: 60 * 60 * 24 // 24 horas
            });
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Acceso administrativo concedido',
                redirectUrl: '/admin'
            }), { status: 200 });
        }

        return new Response(JSON.stringify({ success: false, message: 'Credenciales inválidas' }), { status: 401 });
    } catch (e: any) {
        console.error('[Admin Login Error]:', e);
        return new Response(JSON.stringify({ success: false, message: 'Error en el servidor' }), { status: 500 });
    }
};

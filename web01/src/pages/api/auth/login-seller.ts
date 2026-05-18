import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { readItems } from '@directus/sdk';
import bcrypt from 'bcryptjs';
import { registerSession } from '../../../session_store';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Email y contraseña requeridos' }), { status: 400 });
        }

        console.log(`[Seller Login Attempt] Email: ${email}`);

        // Buscar en la colección de 'vendedores'
        const results = await directus.request(readItems('vendedores', {
            filter: { email: { _eq: email } },
            limit: 1
        }));

        const user = results?.[0];

        if (!user) {
             return new Response(JSON.stringify({ success: false, message: 'Vendedor no encontrado' }), { status: 401 });
        }

        // Verificar password_hash
        let isPasswordValid = false;
        if (user.password_hash) {
            isPasswordValid = await bcrypt.compare(password, user.password_hash);
        } else {
            // Fallback para texto plano durante migración
            isPasswordValid = (password === 'Vendedor2026!');
        }

        if (isPasswordValid) {
            console.log(`[Seller Login Success] ID: ${user.id}`);
            
            // Extraer IP y User-Agent para respaldo de sesión
            const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';

            const rememberMe = formData.get('remember-me') === 'on';
            cookies.set('seller_session', user.id.toString(), {
                path: '/',
                maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24 * 30, // 1 año o 30 días
                httpOnly: true,
                sameSite: 'lax'
            });

            // Registrar sesión
            registerSession(ip, userAgent, user.id.toString(), 'seller');

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Bienvenido al Portal de Ventas',
                redirectUrl: '/vendedor'
            }), { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`[Seller Login Failed] Contraseña incorrecta para: ${email}`);
        return new Response(JSON.stringify({ success: false, message: 'Credenciales inválidas' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Login Error Detail]:', e);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error interno de autenticación'
        }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
};

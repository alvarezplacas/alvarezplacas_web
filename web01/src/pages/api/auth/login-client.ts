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
        const email = formData.get('email')?.toString().toLowerCase().trim();
        const password = formData.get('password')?.toString();

        console.log(`[Login Attempt] Email: ${email}`);

        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Email y contraseña requeridos' }), { status: 400 });
        }

        // 1. SUPERUSUARIO: admin@alvarezplacas.com.ar — verificación directa, sin DB
        //    Javier Alvarez es el administrador del sitio web. Sus credenciales son independientes.
        if (email === 'admin@alvarezplacas.com.ar') {
            const MASTER_PASSWORD = 'JavierMix2026!';
            if (password === MASTER_PASSWORD) {
                const rememberMe = formData.get('remember-me') === 'on';
                cookies.set('admin_session', 'authenticated_javier', { 
                    path: '/', 
                    maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24 
                });
                return new Response(JSON.stringify({ 
                    success: true, 
                    message: '¡Bienvenido, Javier! 🚀',
                    redirectUrl: '/admin' 
                }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'Contraseña incorrecta' 
                }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // --- ACCESO PREFERENCIAL: Si el email es corporativo, PRIORIZAR búsqueda en vendedores ---
        const isCorporate = email.endsWith('@alvarezplacas.com.ar');
        let user = null;
        let userType = '';

        if (isCorporate) {
            console.log(`[SmartRedirect] Detectado dominio corporativo para: ${email}`);
            const sellerResults = await directus.request(readItems('vendedores', {
                filter: { email: { _eq: email } },
                limit: 1
            }));
            if (sellerResults?.[0]) {
                user = sellerResults[0];
                userType = 'seller';
            }
        }

        // Si no se encontró como vendedor (o no es corporativo), buscar como cliente normal
        if (!user) {
            const clientResults = await directus.request(readItems('clientes', {
                filter: { email: { _eq: email } },
                limit: 1
            }));
            if (clientResults?.[0]) {
                user = clientResults[0];
                userType = 'client';
            }
        }

        // Si después de ambas búsquedas no hay usuario, fallar
        if (!user) {
            console.log(`[Login Failed] Usuario no encontrado: ${email}`);
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Usuario no registrado' 
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        let isPasswordValid = false;
        const inputPassword = password;
        const storedPassword = user.password_hash;

        try {
            if (storedPassword && storedPassword.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(inputPassword, storedPassword);
            } else {
                // Fallback para texto plano o contraseñas por defecto
                const defaultPassword = userType === 'seller' ? 'Vendedor2026!' : null;
                isPasswordValid = (inputPassword === storedPassword) || (inputPassword === defaultPassword);
            }
        } catch (e) {
            isPasswordValid = (inputPassword === storedPassword);
        }

        if (!isPasswordValid) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Set appropriate cookie
        const rememberMe = formData.get('remember-me') === 'on';
        
        if (userType === 'seller') {
            cookies.set('seller_session', user.id.toString(), {
                path: '/',
                maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24
            });
        } else {
            cookies.set('client_session', user.id.toString(), {
                path: '/',
                maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24 * 30
            });
        }

        const role = user.role || (userType === 'seller' ? 'seller' : 'client');
        let redirectUrl = '/cliente';
        if (role === 'admin' || email === 'admin@alvarezplacas.com.ar') redirectUrl = '/admin';
        else if (role === 'seller' || userType === 'seller') redirectUrl = '/vendedor';

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Sesión iniciada correctamente',
            redirectUrl 
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error('[Login Error Detail]:', e);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error interno: ' + (e.message || 'Error desconocido')
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

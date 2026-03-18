import type { APIRoute } from 'astro';
import { query } from '@lib/db.js';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
        return new Response('Email y contraseña requeridos', { status: 400 });
    }

    try {
        // 1. Check in new "Clientes" table first (Case-insensitive)
        const clienteResult: any = await query("SELECT id, password_hash, 'client' as role FROM \"Clientes\" WHERE email ILIKE $1", [email]);
        
        let user;
        if (clienteResult.rows.length > 0) {
            user = clienteResult.rows[0];
        } else {
            // 2. Fallback to legacy "users" table
            const legacyResult: any = await query("SELECT id, password_hash, role FROM users WHERE email ILIKE $1", [email]);
            if (legacyResult.rows.length === 0) {
                return new Response('Usuario no encontrado', { status: 404 });
            }
            user = legacyResult.rows[0];
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return new Response('Contraseña incorrecta', { status: 401 });
        }

        // Set cookie (valid for 30 days)
        cookies.set('client_session', user.id.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        // Redirect based on role
        if (user.role === 'admin') return redirect('/admin');
        if (user.role === 'seller') return redirect('/vendedor');
        return redirect('/cliente');

    } catch (e: any) {
        console.error(e);
        return new Response('Error en el login: ' + e.message, { status: 500 });
    }
};

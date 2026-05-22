import type { APIRoute } from 'astro';
import { clearSession } from '../../../session_store';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
    // Extraer IP y User-Agent para limpiar la caché de sesión
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Clear all possible session cookies
    cookies.delete('client_session', { path: '/' });
    cookies.delete('seller_session', { path: '/' });
    cookies.delete('admin_session', { path: '/' });

    // Limpiar caché de sesión persistente por IP
    clearSession(ip, userAgent);

    // Redirect to home as requested
    return redirect('/');
};

export const POST: APIRoute = GET;

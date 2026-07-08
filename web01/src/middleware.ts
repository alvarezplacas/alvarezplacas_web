import { defineMiddleware } from 'astro:middleware';
import { getSession, registerSession } from './session_store';

export const onRequest = defineMiddleware(async (context: any, next: any) => {
    const path = context.url.pathname;

    // Rutas públicas que no requieren verificación
    const isPublic = path.startsWith('/_astro') || path.startsWith('/favicon') || path === '/mantenimiento' || path === '/cliente/registro';
    const isLoginPage = path === '/login' || path === '/admin/login' || path === '/vendedor/login';
    const isApiRoute = path.startsWith('/api');

    let ip = 'unknown';
    let userAgent = 'unknown';
    try {
        ip = context.request.headers.get('x-real-ip') || context.request.headers.get('x-forwarded-for')?.split(',')[0] || context.clientAddress || 'unknown';
        userAgent = context.request.headers.get('user-agent') || 'unknown';
    } catch (e) {
        // En prerender, context.clientAddress y context.request.headers no están disponibles
    }

    // 🛡️ Leer identidades de sesión tradicionales
    let adminSession = context.cookies.get('admin_session');
    let sellerSession = context.cookies.get('seller_session');
    let clientSession = context.cookies.get('client_session');
    let stockSession = context.cookies.get('stock_session');

    // Desactivamos el motor de auto-recuperación por IP + User Agent para evitar conflicto de IPs duplicadas (ej. misma oficina)
    /*
    if (!adminSession && !sellerSession && !clientSession) {
        const cachedSession = getSession(ip, userAgent);
        if (cachedSession) {
            console.log(`[Auto-Recuperación] Restaurando sesión de rol '${cachedSession.role}' para IP: ${ip}`);
            
            const cookieName = cachedSession.role === 'admin' ? 'admin_session' 
                             : cachedSession.role === 'seller' ? 'seller_session' 
                             : 'client_session';
            
            // Re-inyectamos la cookie en la petición actual para que Astro la procese transparentemente
            context.cookies.set(cookieName, cachedSession.userId, {
                path: '/',
                maxAge: 60 * 60 * 8, // 8 horas estrictas
                httpOnly: true,
                sameSite: 'lax'
            });

            // Re-leemos la sesión
            if (cachedSession.role === 'admin') adminSession = context.cookies.get('admin_session');
            else if (cachedSession.role === 'seller') sellerSession = context.cookies.get('seller_session');
            else clientSession = context.cookies.get('client_session');
        }
    } else {
        // Si las cookies sí están activas, refrescamos el registro en la caché por IP + User Agent para mantener la sesión viva
        if (adminSession) registerSession(ip, userAgent, adminSession.value, 'admin');
        else if (sellerSession) registerSession(ip, userAgent, sellerSession.value, 'seller');
        else if (clientSession) registerSession(ip, userAgent, clientSession.value, 'client');
    }
    */

    if (adminSession) context.locals.admin_id = adminSession.value;
    if (sellerSession) context.locals.vendedor_id = sellerSession.value;
    if (clientSession) context.locals.cliente_id = clientSession.value;
    if (stockSession) context.locals.stock_user = stockSession.value;

    if (isPublic || isLoginPage || isApiRoute) {
        return next();
    }

    // Proteger rutas /deposito/*
    if (path.startsWith('/deposito')) {
        if (!stockSession && !adminSession) {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /admin/*
    if (path.startsWith('/admin')) {
        if (!adminSession || adminSession.value !== 'authenticated_javier') {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /vendedor/*
    if (path.startsWith('/vendedor')) {
        if (!sellerSession && !adminSession) {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /cliente/*
    if (path.startsWith('/cliente')) {
        if (!clientSession && !sellerSession && !adminSession) {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /ceo/*
    if (path.startsWith('/ceo')) {
        if (!sellerSession && !adminSession) {
            return context.redirect('/login');
        }
    }

    return next();
});

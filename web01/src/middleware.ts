import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context: any, next: any) => {
    const path = context.url.pathname;

    // Rutas públicas que no requieren verificación
    const isPublic = path.startsWith('/_astro') || path.startsWith('/favicon') || path === '/mantenimiento';
    const isLoginPage = path === '/login' || path === '/admin/login' || path === '/vendedor/login';
    const isApiRoute = path.startsWith('/api');

    // Extraer identidades de sesión si existen (Globalmente)
    const adminSession = context.cookies.get('admin_session');
    const sellerSession = context.cookies.get('seller_session');
    const clientSession = context.cookies.get('client_session');

    if (adminSession) context.locals.admin_id = adminSession.value;
    if (sellerSession) context.locals.vendedor_id = sellerSession.value;
    if (clientSession) context.locals.cliente_id = clientSession.value;

    if (isPublic || isLoginPage || isApiRoute) {
        return next();
    }

    // Proteger rutas /admin/*
    if (path.startsWith('/admin')) {
        if (!adminSession || adminSession.value !== 'authenticated_javier') {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /vendedor/*
    if (path.startsWith('/vendedor')) {
        // Un administrador también puede ver rutas de vendedor
        if (!sellerSession && !adminSession) {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /cliente/*
    if (path.startsWith('/cliente')) {
        // Un administrador o un vendedor también pueden ver rutas de cliente (para soporte)
        if (!clientSession && !sellerSession && !adminSession) {
            return context.redirect('/login');
        }
    }

    return next();
});

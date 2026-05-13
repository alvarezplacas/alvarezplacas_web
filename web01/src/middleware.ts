import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context: any, next: any) => {
    const path = context.url.pathname;

    // Rutas públicas que no requieren verificación
    const isPublic = path.startsWith('/_astro') || path.startsWith('/favicon') || path === '/mantenimiento';
    const isLoginPage = path === '/login' || path === '/admin/login' || path === '/vendedor/login';
    const isApiRoute = path.startsWith('/api');

    // Extraer identidades de sesión si existen (Globalmente)
    const sellerSession = context.cookies.get('seller_session');
    if (sellerSession) context.locals.vendedor_id = sellerSession.value;

    const clientSession = context.cookies.get('client_session');
    if (clientSession) context.locals.cliente_id = clientSession.value;

    if (isPublic || isLoginPage || isApiRoute) {
        return next();
    }

    // Proteger rutas /admin/*
    if (path.startsWith('/admin')) {
        const session = context.cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /vendedor/*
    if (path.startsWith('/vendedor')) {
        if (!sellerSession) {
            return context.redirect('/login');
        }
    }

    // Proteger rutas /cliente/*
    if (path.startsWith('/cliente')) {
        if (!clientSession) {
            return context.redirect('/login');
        }
    }

    return next();
});

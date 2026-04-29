import { defineMiddleware } from 'astro:middleware';
import { directus, readItems } from '@conexiones/directus.js';

export const onRequest = defineMiddleware(async (context: any, next: any) => {
    const isPublicStatic = context.url.pathname.startsWith('/_astro') || context.url.pathname.startsWith('/favicon');
    const isMaintenancePage = context.url.pathname === '/mantenimiento';
    const isAdmin = context.url.pathname.startsWith('/admin');
    const isApi = context.url.pathname.startsWith('/api');

    if (context.url.pathname === '/administrador' || context.url.pathname === '/administrador/') {
        return context.redirect('/admin');
    }

    let isMaintenanceActive = false;
    try {
        // Usar Directus (resiliente) en lugar de query directo
        const settings = await directus.request(readItems('site_settings', {
            filter: { key: { _eq: 'maintenance_mode' } },
            limit: 1
        }));
        if (settings && settings.length > 0) isMaintenanceActive = settings[0].value === 'true';
    } catch (e) { 
        console.error("[Middleware] Falló la verificación de mantenimiento:", e);
    }

    const isAdminLogin = context.url.pathname === '/admin/login';
    const isClient = context.url.pathname.startsWith('/cliente');
    const isVendedor = context.url.pathname.startsWith('/vendedor');
    const isClientLogin = context.url.pathname === '/login'; 

    if (isAdmin && !isAdminLogin) {
        const session = context.cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') return context.redirect('/admin/login');
    }

    if (isVendedor && context.url.pathname !== '/vendedor/login') {
        const session = context.cookies.get('seller_session');
        if (!session) return context.redirect('/vendedor/login');
    }

    if (isMaintenanceActive && !isMaintenancePage && !isAdmin && !isApi && !isPublicStatic) {
        return context.redirect('/mantenimiento');
    }

    return next();
});

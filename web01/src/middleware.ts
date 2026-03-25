import { defineMiddleware } from 'astro:middleware';
import { query } from '@conexiones/lib/db.js';

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
        const result = await query("SELECT value FROM site_settings WHERE key = 'maintenance_mode'");
        const rows = (result?.rows || []) as any[];
        if (rows.length > 0) isMaintenanceActive = rows[0].value === 'true';
    } catch (e) { /* Manejo de error si la DB no está lista */ }

    const isAdminLogin = context.url.pathname === '/admin/login';
    const isClient = context.url.pathname.startsWith('/cliente');
    const isClientLogin = context.url.pathname === '/login'; // Ajustado según ruteo actual

    if (isAdmin && !isAdminLogin) {
        const session = context.cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') return context.redirect('/admin/login');
    }

    if (isMaintenanceActive && !isMaintenancePage && !isAdmin && !isApi && !isPublicStatic) {
        return context.redirect('/mantenimiento');
    }

    return next();
});

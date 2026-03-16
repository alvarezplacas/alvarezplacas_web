import { defineMiddleware } from 'astro:middleware';
import { query } from './lib/db.js';

export const onRequest = defineMiddleware(async (context: any, next: any) => {
    // Definimos las rutas que NO deben ser bloqueadas por mantenimiento
    const isPublicStatic = context.url.pathname.startsWith('/_astro') || context.url.pathname.startsWith('/favicon');
    const isMaintenancePage = context.url.pathname === '/mantenimiento';
    const isAdmin = context.url.pathname.startsWith('/admin') || context.url.pathname.startsWith('/administrador');
    const isApi = context.url.pathname.startsWith('/api');

    // Friendly redirect for /administrador
    if (context.url.pathname === '/administrador' || context.url.pathname === '/administrador/') {
        return context.redirect('/admin');
    }

    // Consulta real a la base de datos
    let isMaintenanceActive = false;
    const result = await query("SELECT value FROM site_settings WHERE key = 'maintenance_mode'");
    const rows = (result?.rows || []) as any[];
    if (rows.length > 0) {
        isMaintenanceActive = rows[0].value === 'true';
    }

    const isAdminLogin = context.url.pathname === '/admin/login';
    const isClient = context.url.pathname.startsWith('/cliente');
    const isClientLogin = context.url.pathname === '/cliente/login';
    const isSeller = context.url.pathname.startsWith('/vendedor');
    const isSellerLogin = context.url.pathname === '/vendedor/login';

    // Admin Protection
    if (isAdmin && !isAdminLogin) {
        const session = context.cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') {
            return context.redirect('/admin/login');
        }
    }

    // Client Protection
    if (isClient && !isClientLogin) {
        const session = context.cookies.get('client_session');
        if (!session) {
            return context.redirect('/cliente/login');
        }
    }

    // Seller Protection
    if (isSeller && !isSellerLogin) {
        const session = context.cookies.get('seller_session');
        if (!session) {
            return context.redirect('/vendedor/login');
        }
    }

    if (isMaintenanceActive && !isMaintenancePage && !isAdmin && !isApi && !isPublicStatic) {
        return context.redirect('/mantenimiento');
    }

    return next();
});

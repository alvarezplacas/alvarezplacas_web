import { defineMiddleware } from 'astro:middleware';
import { query } from './lib/db.js';

export const onRequest = defineMiddleware(async (context: any, next: any) => {
    // Definimos las rutas que NO deben ser bloqueadas por mantenimiento
    const isPublicStatic = context.url.pathname.startsWith('/_astro') || context.url.pathname.startsWith('/favicon');
    const isMaintenancePage = context.url.pathname === '/mantenimiento';
    const isAdmin = context.url.pathname.startsWith('/admin');
    const isApi = context.url.pathname.startsWith('/api');

    // Consulta real a la base de datos
    let isMaintenanceActive = false;
    try {
        const result = await query("SELECT value FROM site_settings WHERE key = 'maintenance_mode'");
        console.log('Middleware Maintenance Query:', result?.rows);
        if (result && result.rows && result.rows.length > 0) {
            isMaintenanceActive = result.rows[0].value === 'true';
        }
        console.log('Middleware isMaintenanceActive:', isMaintenanceActive);
    } catch (e: any) {
        console.error('Error consultando mantenimiento en DB:', e.message);
    }

    const isAdminLogin = context.url.pathname === '/admin/login';

    if (isAdmin && !isAdminLogin) {
        const session = context.cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') {
            return context.redirect('/admin/login');
        }
    }

    if (isMaintenanceActive && !isMaintenancePage && !isAdmin && !isApi && !isPublicStatic) {
        return context.redirect('/mantenimiento');
    }

    return next();
});

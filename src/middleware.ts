import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
    // Definimos las rutas que NO deben ser bloqueadas por mantenimiento
    const isPublicStatic = context.url.pathname.startsWith('/_astro') || context.url.pathname.startsWith('/favicon');
    const isMaintenancePage = context.url.pathname === '/mantenimiento';
    const isAdmin = context.url.pathname.startsWith('/admin');
    const isApi = context.url.pathname.startsWith('/api');

    // En un entorno real, esto vendría de una DB o Redis.
    // Para simplificar el "static/admin option" sin DB activa aún, usamos una cookie o variable de entorno simualda
    // Pero el usuario pidió una opción admin, así que usaremos un chequeo que el admin pueda disparar.
    
    // Simulación de check de mantenimiento (esto debería ser dinámico)
    const isMaintenanceActive = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenanceActive && !isMaintenancePage && !isAdmin && !isApi && !isPublicStatic) {
        return context.redirect('/mantenimiento');
    }

    return next();
});

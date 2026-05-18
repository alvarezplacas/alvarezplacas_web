/**
 * Session Store - Persistencia de Sesión Industrial por IP + User-Agent (Vanguardia 2026)
 * Permite que las sesiones persistan hasta por 8 horas, sirviendo de respaldo absoluto
 * si el navegador del cliente bloquea o borra cookies por políticas estrictas de privacidad.
 */

interface SessionInfo {
    userId: string;
    role: string;
    expiresAt: number;
}

// Mapa en memoria para almacenar sesiones persistentes por IP + User Agent
const sessionStore = new Map<string, SessionInfo>();

/**
 * Registra una sesión activa para un cliente por su IP y User Agent
 */
export function registerSession(ip: string, userAgent: string, userId: string, role: string) {
    if (!ip || ip === 'unknown') return;
    const key = `${ip.trim()}_${(userAgent || '').trim()}`;
    sessionStore.set(key, {
        userId,
        role,
        expiresAt: Date.now() + 1000 * 60 * 60 * 8 // Respaldo estricto de 8 horas
    });
}

/**
 * Intenta recuperar una sesión activa basada en la IP y User Agent del cliente
 */
export function getSession(ip: string, userAgent: string): SessionInfo | null {
    if (!ip || ip === 'unknown') return null;
    const key = `${ip.trim()}_${(userAgent || '').trim()}`;
    const session = sessionStore.get(key);
    
    if (!session) return null;
    
    // Si la sesión ya expiró, la limpiamos y retornamos null
    if (Date.now() > session.expiresAt) {
        sessionStore.delete(key);
        return null;
    }
    
    return session;
}

/**
 * Elimina una sesión por su IP y User Agent (ej. en logout)
 */
export function clearSession(ip: string, userAgent: string) {
    if (!ip || ip === 'unknown') return;
    const key = `${ip.trim()}_${(userAgent || '').trim()}`;
    sessionStore.delete(key);
}

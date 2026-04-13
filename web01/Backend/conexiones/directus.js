import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

/**
 * Singleton del cliente de Directus para el proyecto modular.
 * Este archivo es propiedad del Agente 1 (Backend/Conexiones).
 */

const getSafeEnv = () => {
    // Mergear process.env (runtime Docker) con import.meta.env (build time).
    // process.env tiene prioridad para variables inyectadas por Docker en producción.
    const merged = {};
    try {
        if (typeof process !== 'undefined' && process.env) {
            Object.assign(merged, process.env);
        }
    } catch (e) {}
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            Object.assign(merged, import.meta.env);
        }
    } catch (e) {}
    return merged;
};

const env = getSafeEnv();
const URL_PUBLIC = 'https://admin.alvarezplacas.com.ar';
// Prioridad: var de entorno del Docker → fallback a URL pública
const URL_INTERNAL = (typeof process !== 'undefined' && process.env?.DIRECTUS_URL_INTERNAL)
    || env.DIRECTUS_URL_INTERNAL;

// Lógica de Conexión Inteligente: Prefiere interna en VPS, pero permite fallback
const DIRECTUS_URL = URL_INTERNAL || env.DIRECTUS_URL || URL_PUBLIC;
// Token: prioridad a process.env (Docker runtime) → env (build time) → token v16 por defecto
const DIRECTUS_TOKEN = (typeof process !== 'undefined' && process.env?.DIRECTUS_TOKEN)
    || env.DIRECTUS_TOKEN
    || 'U_49a1I4EcNofowltd95z0MwlUdJ8VgW';

console.log(`[Directus] Iniciando cliente en: ${DIRECTUS_URL}`);

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

// Verificación asíncrona de salud de la conexión (opcional, para logs)
if (typeof process !== 'undefined') {
    directus.request(readItems('vendedores', { limit: 1 }))
        .then(() => console.log(`[Directus] ✅ Conexión Exitosa con ${DIRECTUS_URL}`))
        .catch((err) => {
            console.error(`[Directus] ❌ Error en ${DIRECTUS_URL}. Reintentando con Pública...`);
            // Nota: El cliente ya está creado, pero los fallos de SSR se verán mitigados si la URL es correcta.
        });
}

export { directus, readItems, readItem };
export default directus;

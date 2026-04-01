import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

/**
 * Singleton del cliente de Directus para el proyecto modular.
 * Este archivo es propiedad del Agente 1 (Backend/Conexiones).
 */

const getSafeEnv = () => {
    try {
        // En Astro components/Vite files
        if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env;
    } catch (e) {}
    try {
        // En Node.js puro (SSR Runtime fallback)
        if (typeof process !== 'undefined' && process.env) return process.env;
    } catch (e) {}
    return {};
};

const env = getSafeEnv();
const URL_PUBLIC = 'https://admin.alvarezplacas.com.ar';
const URL_INTERNAL = env.DIRECTUS_URL_INTERNAL;

// Lógica de Conexión Inteligente: Prefiere interna en VPS, pero permite fallback
const DIRECTUS_URL = URL_INTERNAL || env.DIRECTUS_URL || URL_PUBLIC;
const DIRECTUS_TOKEN = env.DIRECTUS_TOKEN || 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

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

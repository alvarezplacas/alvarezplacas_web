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
const DIRECTUS_URL = env.DIRECTUS_URL_INTERNAL || env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

export { directus, readItems, readItem };
export default directus;

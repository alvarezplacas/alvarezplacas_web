import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

/**
 * Singleton del cliente de Directus para el proyecto modular.
 * Este archivo es propiedad del Agente 1 (Backend/Conexiones).
 */

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN; // Opcional para requests privados

const directus = createDirectus(DIRECTUS_URL).with(rest());

if (DIRECTUS_TOKEN) {
    directus.with(staticToken(DIRECTUS_TOKEN));
}

export { directus, readItems, readItem };
export default directus;

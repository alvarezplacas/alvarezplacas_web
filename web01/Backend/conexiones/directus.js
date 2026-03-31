import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

/**
 * Singleton del cliente de Directus para el proyecto modular.
 * Este archivo es propiedad del Agente 1 (Backend/Conexiones).
 */

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL_INTERNAL || import.meta.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN || 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

export { directus, readItems, readItem };
export default directus;

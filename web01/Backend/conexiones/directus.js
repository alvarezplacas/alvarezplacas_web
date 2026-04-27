import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

/**
 * Singleton del cliente de Directus para el proyecto modular.
 * Optimizado para VPS y fallback automático.
 */

const getSafeEnv = () => {
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

// Determinamos la URL base. 
// Si estamos en el servidor (Node), intentamos usar la interna si existe.
const URL_INTERNAL = (typeof process !== 'undefined' && process.env?.DIRECTUS_URL_INTERNAL) || env.DIRECTUS_URL_INTERNAL;

// IMPORTANTE: Para evitar errores de DNS en tiempo de ejecución que tiren abajo el sitio,
// usamos la URL pública por defecto a menos que estemos seguros de la interna.
let finalUrl = URL_PUBLIC;

if (typeof process !== 'undefined' && URL_INTERNAL) {
    // Si querés forzar el uso de la red interna de Docker, descomentá la línea de abajo.
    // Pero para máxima estabilidad, la URL pública es más segura si el DNS de Docker falla.
    // finalUrl = URL_INTERNAL; 
}

const DIRECTUS_TOKEN = (typeof process !== 'undefined' && process.env?.DIRECTUS_TOKEN)
    || env.DIRECTUS_TOKEN
    || 'alvarez-api-token-v16-2026';

console.log(`[Directus] Conectando a: ${finalUrl}`);

const directus = createDirectus(finalUrl)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

export { directus, readItems, readItem };
export default directus;

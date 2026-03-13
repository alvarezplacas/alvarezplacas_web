/**
 * Formatea un nombre de archivo o cadena a un formato legible.
 * @param {string} str 
 * @returns {string}
 */
export function formatName(str) {
    if (!str) return "";
    return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Normaliza una cadena para comparaciones (quita espacios, minúsculas).
 * @param {string} str 
 * @returns {string}
 */
export function normalize(str) {
    return (str || "").trim().toLowerCase();
}

/**
 * Loguea mensajes con un formato estandarizado.
 */
export const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    success: (msg) => console.log(`[PASS] ${msg}`)
};

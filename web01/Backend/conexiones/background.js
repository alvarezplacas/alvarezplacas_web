import { directus } from './directus.js';
import { readFolders, readFiles } from '@directus/sdk';

const DEFAULT_BG = '/background.avif';

async function fetchBackgroundFromDirectus() {
  try {
    // 1. Buscar carpeta "Background_home" o "background" (insensible a mayúsculas)
    const folders = await directus.request(readFolders());
    const bgFolder = folders.find(f => 
      f.name.toLowerCase() === 'background_home' || 
      f.name.toLowerCase() === 'background'
    );

    if (!bgFolder) {
      console.log('[Directus] Carpeta de fondos no encontrada, usando predeterminado.');
      return DEFAULT_BG;
    }

    // 2. Obtener el archivo de imagen más reciente en esa carpeta
    const files = await directus.request(readFiles({
      filter: {
        folder: {
          _eq: bgFolder.id
        },
        type: {
          _starts_with: 'image/'
        }
      },
      sort: ['-uploaded_on'],
      limit: 1,
      fields: ['id']
    }));

    if (files && files.length > 0) {
      const fileId = files[0].id;
      return `https://admin.alvarezplacas.com.ar/assets/${fileId}?format=avif`;
    }

    console.log('[Directus] La carpeta de fondos está vacía, usando predeterminado.');
    return DEFAULT_BG;
  } catch (error) {
    console.error('[Directus] Error al obtener fondo del home:', error);
    return DEFAULT_BG;
  }
}

/**
 * Obtiene la URL del fondo del Home con un timeout de 1.5s para no bloquear la carga del sitio.
 */
export async function getHomeBackgroundUrl() {
  let timeoutId;
  
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn('[Directus] Timeout alcanzado al buscar fondo, usando fallback local.');
      resolve(DEFAULT_BG);
    }, 1500);
  });

  try {
    const result = await Promise.race([
      fetchBackgroundFromDirectus(),
      timeoutPromise
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (e) {
    clearTimeout(timeoutId);
    return DEFAULT_BG;
  }
}

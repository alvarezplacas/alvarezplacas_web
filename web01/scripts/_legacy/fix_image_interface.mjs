import { createDirectus, rest, staticToken, updateField } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(TOKEN))
    .with(rest());

async function improveImageField() {
    console.log("--- 🎨 Optimizando Interfaz de Imagen ---");
    
    try {
        await client.request(updateField('materiales', 'imagen', {
            meta: {
                interface: 'file-image',
                display: 'image',
                options: {
                    folder: null
                }
            }
        }));
        console.log("✅ Campo 'imagen' transformado a Selector de Imágenes.");
    } catch (e) {
        console.error("❌ Error optimizando campo:", e.errors?.[0]?.message || e.message);
    }
}

improveImageField();

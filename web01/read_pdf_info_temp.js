import fs from 'fs';
import path from 'path';

const pdfDir = 'd:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/web01/3d/Muebles';

async function analyzePDF(filename) {
    const { default: pdf } = await import('pdf-parse');
    const filePath = path.join(pdfDir, filename);
    try {
        console.log(`\n========================================`);
        console.log(`Analizando: ${filename}`);
        console.log(`========================================`);
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        console.log(`Páginas: ${data.numpages}`);
        
        // Mostrar los primeros 3000 caracteres
        console.log(`\n--- MUESTRA DE TEXTO (Primeros 3000 caracteres) ---`);
        console.log(data.text.substring(0, 3000));
        
        // Buscar ciertas palabras clave
        console.log(`\n--- ANÁLISIS DE PALABRAS CLAVE ---`);
        const keywords = ['bajo mesada', 'alacena', 'escritorio', 'chifonier', 'placard', 'vestidor', 'biblioteca', 'rack', 'tv', 'cajonera', 'modulo', 'cocina', 'fiplasto', 'masisa'];
        const textLower = data.text.toLowerCase();
        keywords.forEach(kw => {
            const count = (textLower.match(new RegExp(kw, 'g')) || []).length;
            if (count > 0) {
                console.log(`- "${kw}": ${count} coincidencias`);
            }
        });
        
    } catch (error) {
        console.error(`Error al analizar ${filename}:`, error);
    }
}

async function run() {
    await analyzePDF('Planos de muebles de cocina en melamina.pdf');
    await analyzePDF('Muebles fiplasto catalogo.pdf');
    await analyzePDF('MADERA_MASISA.pdf');
}

run();

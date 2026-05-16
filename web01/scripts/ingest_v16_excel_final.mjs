import * as xlsx from 'xlsx';
import fs from 'fs';
import { createDirectus, rest, authentication, readItems, createItem, updateItem, staticToken } from '@directus/sdk';

// Configuración Industrial
const DIRECTUS_URL = 'http://alvarezplacas_directus_v16:8055';
const STATIC_TOKEN = 'alvarez-api-token-v16-2026';
const EXCEL_FILE = './database/Catalogo_de_productos.xlsx';

const client = createDirectus(DIRECTUS_URL).with(staticToken(STATIC_TOKEN)).with(rest());

async function upsertItem(collection, filter, data) {
    try {
        const existing = await client.request(readItems(collection, { filter, limit: 1 }));
        if (existing.length > 0) {
            return await client.request(updateItem(collection, existing[0].id, data));
        } else {
            return await client.request(createItem(collection, data));
        }
    } catch (e) {
        const msg = e.errors?.[0]?.message || e.message || JSON.stringify(e);
        throw new Error(msg);
    }
}

async function startIngestion() {
    console.log("--- 🔱 Iniciando Ingesta Maestra v16 (Excel) ---");
    console.log("🔑 Usando Token Maestro Industrial...");
    
    if (!fs.existsSync(EXCEL_FILE)) {
        console.error("❌ Archivo no encontrado:", EXCEL_FILE);
        return;
    }

    const buffer = fs.readFileSync(EXCEL_FILE);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    const cache = { marcas: {}, rubros: {} };
    let totalCount = 0;

    for (const sheetName of workbook.SheetNames) {
        if (sheetName === 'EINHELL') continue; // Omitimos herramientas por ahora si el foco es placas
        
        console.log(`\n📦 Procesando Hoja: ${sheetName}...`);
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        for (const row of data) {
            try {
                const nombre = row['ARTICULO/COLOR REAL'] || row['Nombre'] || '';
                const marcaName = row['MARCA'] || row['Marca'] || sheetName;
                if (!nombre) continue;

                // 1. Resolver Rubro
                if (!cache.rubros['Placas']) {
                    const res = await upsertItem('Rubros', { nombre: { _eq: 'Placas' } }, { nombre: 'Placas' });
                    cache.rubros['Placas'] = res.id;
                }

                // 2. Resolver Marca
                if (!cache.marcas[marcaName]) {
                    const res = await upsertItem('marcas', { nombre: { _eq: marcaName } }, { nombre: marcaName, rubro: cache.rubros['Placas'] });
                    cache.marcas[marcaName] = res.id;
                }

                const espesor = row['ESPESOR'] || '';
                const precio_l1 = parseFloat(row['L1'] || row['Precio'] || 0);
                const precio_l2 = parseFloat(row['L2'] || 0);

                // 3. Generar SKU Industrial (Flujo: Letra-Codigo-XXXX)
                const rubroData = await client.request(readItems('Rubros', { fields: ['letra'], filter: { id: { _eq: cache.rubros['Placas'] } } }));
                const marcaData = await client.request(readItems('marcas', { fields: ['codigo'], filter: { id: { _eq: cache.marcas[marcaName] } } }));
                
                const letra = rubroData[0]?.letra || 'X';
                const codigo = marcaData[0]?.codigo || '00';
                const prefix = `${letra}-${codigo}-`;

                // Buscar el último número para esta combinación
                const lastProducts = await client.request(readItems('Productos', {
                    fields: ['sku'],
                    filter: { sku: { _starts_with: prefix } },
                    sort: ['-sku'],
                    limit: 1
                }));

                let nextNumber = 1;
                if (lastProducts.length > 0) {
                    const lastNum = parseInt(lastProducts[0].sku.split('-').pop());
                    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
                }

                const sku = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

                await upsertItem('Productos', { sku: { _eq: sku } }, {
                    status: 'published',
                    nombre: nombre,
                    sku: sku,
                    linea: row['LINEA/GRUPO'] || '',
                    espesor: espesor,
                    soporte: row['SOPORTE'] || 'AGLOMERADO',
                    marca: cache.marcas[marcaName],
                    rubro: cache.rubros['Placas'],
                    precio_l1: precio_l1,
                    precio_l2: precio_l2,
                    activo: true
                });

                totalCount++;
                if (totalCount % 20 === 0) process.stdout.write('.');
            } catch (e) {
                console.error(`\n❌ Error procesando fila:`, e.message);
            }
        }
    }

    console.log(`\n\n--- ✨ INGESTA COMPLETADA: ${totalCount} productos sincronizados ---`);
}

startIngestion().catch(console.error);

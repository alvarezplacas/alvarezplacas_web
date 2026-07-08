import * as xlsx from 'xlsx';
import fs from 'fs';
import { createDirectus, rest, authentication, readItems, createItem, updateItem, staticToken } from '@directus/sdk';

// Configuración Industrial
const STATIC_TOKEN = 'alvarez-api-token-v16-2026';
// Configuración Industrial
import path from 'path';

let EXCEL_FILE = 'Z:\\ingesta\\Catalogo_de_productos.xlsx';
if (!fs.existsSync(EXCEL_FILE)) {
    EXCEL_FILE = 'C:\\CATALOGADOR\\ingesta\\Catalogo_de_productos.xlsx';
}
if (!fs.existsSync(EXCEL_FILE)) {
    EXCEL_FILE = './database/Catalogo_de_productos.xlsx';
}

let client;

async function getDirectusClient() {
    if (client) return client;
    let url = 'http://alvarezplacas_directus_v16:8055';
    try {
        const check = await fetch('http://100.127.6.20:8055/server/ping').then(r => r.text()).catch(() => '');
        if (check === 'pong') {
            url = 'http://100.127.6.20:8055';
        } else {
            const checkExt = await fetch('https://admin.alvarezplacas.com.ar/server/ping').then(r => r.text()).catch(() => '');
            if (checkExt === 'pong') {
                url = 'https://admin.alvarezplacas.com.ar';
            }
        }
    } catch (e) {
        url = 'https://admin.alvarezplacas.com.ar';
    }
    console.log(`🔌 Conectando a Directus en: ${url}`);
    client = createDirectus(url).with(staticToken(STATIC_TOKEN)).with(rest());
    return client;
}

async function upsertItem(collection, filter, data) {
    try {
        const directusClient = await getDirectusClient();
        const existing = await directusClient.request(readItems(collection, { filter, limit: 1 }));
        if (existing.length > 0) {
            return await directusClient.request(updateItem(collection, existing[0].id, data));
        } else {
            return await directusClient.request(createItem(collection, data));
        }
    } catch (e) {
        const msg = e.errors?.[0]?.message || e.message || JSON.stringify(e);
        throw new Error(msg);
    }
}

async function startIngestion() {
    console.log("--- 🔱 Iniciando Ingesta Maestra v16 (Excel) ---");
    console.log(`📂 Leyendo archivo Excel desde: ${EXCEL_FILE}`);
    console.log("🔑 Usando Token Maestro Industrial...");
    
    if (!fs.existsSync(EXCEL_FILE)) {
        console.error("❌ Archivo no encontrado:", EXCEL_FILE);
        return;
    }

    const buffer = fs.readFileSync(EXCEL_FILE);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    const cache = { marcas: {}, rubros: {} };
    let totalCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    const orphans = [];

    const skuRegex = /^[MHTIRDXS]-\d{2}-\d{4}$/;

    for (const sheetName of workbook.SheetNames) {
        if (sheetName === 'EINHELL') continue; // Omitimos herramientas por ahora si el foco es placas
        
        console.log(`\n📦 Procesando Hoja: ${sheetName}...`);
        const sheet = workbook.Sheets[sheetName];
        
        // --- ESCANEO INTELIGENTE DE ENCABEZADOS ---
        const rowsRaw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        let headerRowIndex = 0;
        let headers = [];

        for (let i = 0; i < Math.min(rowsRaw.length, 10); i++) {
            const row = rowsRaw[i];
            if (row.includes('MARCA') || row.includes('ARTICULO/COLOR REAL') || row.includes('Nombre') || row.includes('CODIGO') || row.includes('codigo')) {
                headerRowIndex = i;
                headers = row;
                break;
            }
        }

        console.log(`📌 Hoja ${sheetName}: Encabezados encontrados en fila ${headerRowIndex + 1}`);
        const data = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });
        
        if (data.length > 0) {
            console.log(`🔍 Columnas detectadas: ${Object.keys(data[0]).join(', ')}`);
        }

        for (const row of data) {
            try {
                // 1. Extraer y Normalizar Datos
                const rawColor = (
                    row['ARTICULO/COLOR REAL'] || 
                    row['COLOR/DISEÑO'] || 
                    row['Nombre'] || 
                    row['DISEÑO'] || 
                    row['Articulo'] || 
                    ''
                ).toString().trim();

                if (!rawColor || rawColor.toUpperCase() === 'PLACA' || rawColor.length < 2) {
                    continue;
                }

                const codigo = (row['codigo'] || row['CODIGO'] || row['Código'] || '').toString().trim();
                
                // VALIDACIÓN DE SKU
                if (!codigo || !skuRegex.test(codigo)) {
                    console.warn(`⚠️ SKU Inválido o Huérfano detectado: "${codigo}" para el producto "${rawColor}"`);
                    orphans.push({ Hoja: sheetName, Producto: rawColor, SKU: codigo });
                    continue;
                }

                const brandName = (row['MARCA'] || row['Marca'] || sheetName).toString().toUpperCase().trim();
                const lineGroup = (row['LINEA/GRUPO'] || row['LINEA'] || '').toString().trim();
                const support = (row['SOPORTE'] || 'AGLOMERADO').toUpperCase();
                
                const espesorRaw = row['ESPESOR'] || '';
                let thickness = parseFloat(espesorRaw.toString().replace(',', '.')) || 0;
                if (thickness > 100) {
                    thickness = thickness / 1000;
                }

                // 2. Resolver Rubro
                if (!cache.rubros['Placas']) {
                    const res = await upsertItem('Rubros', { nombre: { _eq: 'Placas' } }, { nombre: 'Placas', letra: 'M' });
                    cache.rubros['Placas'] = res.id;
                }

                // 3. Resolver Marca
                if (!cache.marcas[brandName]) {
                    const res = await upsertItem('marcas', { nombre: { _eq: brandName } }, { nombre: brandName, rubro: cache.rubros['Placas'] });
                    cache.marcas[brandName] = res.id;
                }

                // 4. Construir Identidad Industrial
                const modelo = rawColor;
                const fullNombre = `Placa ${brandName} ${modelo} ${lineGroup ? '('+lineGroup+')' : ''} ${thickness}mm ${support.toLowerCase()}`;

                const precio_l1 = parseFloat(row['L1'] || row['Precio'] || 0);
                const precio_l2 = parseFloat(row['L2'] || 0);

                // 5. BUSCAR EXISTENCIA STRICT POR SKU
                const directusClient = await getDirectusClient();
                const existing = await directusClient.request(readItems('Productos', {
                    filter: { sku: { _eq: codigo } },
                    limit: 1
                }));

                if (existing.length > 0) {
                    console.log(`♻️  [${codigo}] Actualizando: ${modelo}`);
                    updatedCount++;
                } else {
                    console.log(`🆕  [${codigo}] Creando: ${modelo} (${lineGroup})`);
                    createdCount++;
                }

                // 6. UPSERT FINAL (Bajo SKU estricto como PK)
                await upsertItem('Productos', { sku: { _eq: codigo } }, {
                    status: 'published',
                    nombre: fullNombre,
                    descripcion: fullNombre,
                    color_real: modelo,
                    modelo: modelo,
                    sku: codigo,
                    linea: lineGroup,
                    espesor: thickness,
                    soporte: support,
                    marca: cache.marcas[brandName],
                    rubro: cache.rubros['Placas'],
                    precio_L1: precio_l1,
                    precio_L2: precio_l2,
                    activo: true
                });

                totalCount++;
            } catch (e) {
                console.error(`\n❌ Error procesando fila:`, e.message);
            }
        }
    }

    console.log(`\n\n--- ✨ INGESTA COMPLETADA ---`);
    console.log(`📦 Sincronizados Totales: ${totalCount}`);
    console.log(`🆕 Creados Nuevos: ${createdCount}`);
    console.log(`♻️ Actualizados: ${updatedCount}`);
    console.log(`⚠️ SKUs Huérfanos/Inválidos: ${orphans.length}`);
    if (orphans.length > 0) {
        console.log("📋 Detalles de Huérfanos:");
        console.table(orphans);
        // Guardar logs de huérfanos para auditoría
        const orphanLogPath = path.join(path.dirname(EXCEL_FILE), 'skus_huerfanos.json');
        fs.writeFileSync(orphanLogPath, JSON.stringify(orphans, null, 2));
        console.log(`💾 Log guardado en: ${orphanLogPath}`);
    }
}

startIngestion().catch(console.error);

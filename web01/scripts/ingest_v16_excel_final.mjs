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
        
        // --- ESCANEO INTELIGENTE DE ENCABEZADOS ---
        // Obtenemos las filas como arrays para buscar los nombres de las columnas
        const rowsRaw = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        let headerRowIndex = 0;
        let headers = [];

        for (let i = 0; i < Math.min(rowsRaw.length, 10); i++) {
            const row = rowsRaw[i];
            if (row.includes('MARCA') || row.includes('ARTICULO/COLOR REAL') || row.includes('Nombre')) {
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
                // 1. Extraer y Normalizar Datos (Búsqueda flexible de columnas)
                const rawColor = (
                    row['ARTICULO/COLOR REAL'] || 
                    row['COLOR/DISEÑO'] || 
                    row['Nombre'] || 
                    row['DISEÑO'] || 
                    row['Articulo'] || 
                    ''
                ).toString().trim();

                const brandName = (row['MARCA'] || row['Marca'] || sheetName).toString().toUpperCase().trim();
                const lineGroup = (row['LINEA/GRUPO'] || row['LINEA'] || '').toString().trim();
                const codigo = (row['codigo'] || row['CODIGO'] || row['Código'] || '').toString().trim();
                const support = (row['SOPORTE'] || 'AGLOMERADO').toUpperCase();
                
                // Limpiador de Espesor: "18 MM" -> 18
                const espesorRaw = row['ESPESOR'] || '';
                const thickness = parseFloat(espesorRaw.toString().replace(/[^0-9.]/g, '')) || 0;

                if (!rawColor) continue;

                // 2. Resolver Rubro (Placas)
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
                // El 'modelo' es el nombre del diseño/color (ej: Helsinki)
                const modelo = rawColor;
                // El 'nombre' es descriptivo completo
                const fullNombre = `Placa ${brandName} ${modelo} ${lineGroup ? '('+lineGroup+')' : ''} ${thickness}mm ${support.toLowerCase()}`;

                const precio_l1 = parseFloat(row['L1'] || row['Precio'] || 0);
                const precio_l2 = parseFloat(row['L2'] || 0);

                // 5. BUSCAR EXISTENCIA PARA EVITAR DUPLICADOS
                // Buscamos por Color Real + Marca + Espesor + Soporte
                const existing = await client.request(readItems('Productos', {
                    filter: {
                        _and: [
                            { color_real: { _eq: modelo } },
                            { marca: { _eq: cache.marcas[brandName] } },
                            { espesor: { _eq: thickness } },
                            { soporte: { _eq: support } }
                        ]
                    },
                    limit: 1
                }));

                let sku;
                if (existing.length > 0) {
                    sku = existing[0].sku;
                    console.log(`♻️  [${sku}] Actualizando: ${modelo}`);
                } else {
                    // Generar SKU Industrial Nuevo
                    const rubroData = await client.request(readItems('Rubros', { fields: ['letra'], filter: { id: { _eq: cache.rubros['Placas'] } } }));
                    const marcaData = await client.request(readItems('marcas', { fields: ['codigo'], filter: { id: { _eq: cache.marcas[brandName] } } }));
                    
                    const letra = rubroData[0]?.letra || 'M';
                    const codigo = marcaData[0]?.codigo || '00';
                    const prefix = `${letra}-${codigo}-`;

                    const lastProducts = await client.request(readItems('Productos', {
                        fields: ['sku'],
                        filter: { sku: { _starts_with: prefix } },
                        sort: ['-sku'],
                        limit: 1
                    }));

                    let nextNumber = 1;
                    if (lastProducts.length > 0) {
                        const parts = lastProducts[0].sku.split('-');
                        const lastNum = parseInt(parts[parts.length - 1]);
                        if (!isNaN(lastNum)) nextNumber = lastNum + 1;
                    }
                    sku = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
                    console.log(`🆕  [${sku}] Creando: ${modelo} (${lineGroup})`);
                }

                // 6. UPSERT FINAL (Mapeo técnico v16.9)
                await upsertItem('Productos', { sku: { _eq: sku } }, {
                    status: 'published',
                    nombre: fullNombre,
                    descripcion: fullNombre,
                    color_real: modelo,
                    modelo: modelo,
                    sku: sku,
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

    console.log(`\n\n--- ✨ INGESTA COMPLETADA: ${totalCount} productos sincronizados ---`);
}

startIngestion().catch(console.error);

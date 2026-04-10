import { createDirectus, rest, authentication, createRelation, updateField } from '@directus/sdk';

const DIRECTUS_URL = 'http://alvarezplacas_directus:8055';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASS = 'JavierMix2026!';

async function fixRelations() {
    console.log("--- 🧠 Iniciando Restauración de Inteligencia Relacional ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASS);
        console.log("✅ Login exitoso.");

        const relations = [
            // [Colección Many, Campo FK, Colección One, Campo Display]
            ['materiales', 'id_marca', 'marcas', 'nombre'],
            ['materiales', 'id_categoria', 'categorias', 'nombre'],
            ['materiales', 'id_espesor', 'espesores', 'valor'],
            ['pedidos', 'cliente_id', 'clientes', 'name'],
            ['pedidos', 'vendedor_id', 'vendedores', 'name'],
            ['clientes', 'vendedor_id', 'vendedores', 'name']
        ];

        for (const [manyCol, fkField, oneCol, displayField] of relations) {
            console.log(`🔗 Vinculando ${manyCol}.${fkField} -> ${oneCol}...`);
            
            try {
                // 1. Crear la relación formal
                await client.request(createRelation({
                    collection: manyCol,
                    field: fkField,
                    related_collection: oneCol,
                    meta: {
                        one_field: manyCol,
                        junction_field: null
                    },
                    schema: {
                        on_delete: 'SET NULL'
                    }
                }));
                console.log(`   ✅ Relación creada.`);
            } catch (e) {
                console.warn(`   ⚠️ La relación ya existe o hubo un aviso: ${e.message}`);
            }

            try {
                // 2. Configurar la Interfaz y el Display
                await client.request(updateField(manyCol, fkField, {
                    meta: {
                        interface: 'select-dropdown-m2o',
                        display: 'related-values',
                        display_options: {
                            template: `{{${displayField}}}`
                        }
                    }
                }));
                console.log(`   🎨 Interfaz y Display configurados.`);
            } catch (e) {
                console.error(`   ❌ Error configurando interfaz para ${fkField}:`, e.message);
            }
        }

        console.log("--- ✨ Configuración Finalizada con Éxito ---");

    } catch (e) {
        console.error("❌ Error grave en el proceso:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

fixRelations();

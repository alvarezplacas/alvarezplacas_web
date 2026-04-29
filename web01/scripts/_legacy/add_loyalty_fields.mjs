import { createDirectus, rest, staticToken, createField } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function sync() {
    try {
        console.log("Añadiendo campo last_order_date a 'clientes'...");
        await directus.request(createField('clientes', {
            field: 'last_order_date',
            type: 'timestamp',
            meta: {
                interface: 'datetime',
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Fecha del último pedido entregado para control de vigencia de puntos'
            }
        }));
        console.log("Campo añadido con éxito.");
    } catch (e) {
        console.warn("El campo puede que ya exista o hubo un error:", e.message);
    }
}

sync();

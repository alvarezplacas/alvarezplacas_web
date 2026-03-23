const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function checkPublicModal() {
    try {
        console.log("--- Public Check for SKU: TAB-RAC-FAP-18-AGL ---");
        const res = await fetch(`${DIRECTUS_URL}/items/productos?filter[sku][_eq]=TAB-RAC-FAP-18-AGL&fields=sku,nombre,marca_id.nombre,linea_id.nombre,categoria_id.nombre`);
        const body = await res.json();
        
        console.log(JSON.stringify(body, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkPublicModal();

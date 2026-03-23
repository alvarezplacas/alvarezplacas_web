const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function checkGaudiPublic() {
    try {
        const url = `${DIRECTUS_URL}/items/productos?filter[sku][_eq]=TAB-GAU-FAP-18-MDF&fields=sku,nombre,marca_id.nombre,linea_id.nombre,categoria_id.nombre,atributos,imagen`;
        console.log(`URL: ${url}`);
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkGaudiPublic();

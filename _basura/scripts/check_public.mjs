const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function checkPublicAccess() {
    try {
        console.log("--- Checking Public Access (No Token) ---");
        const res = await fetch(`${DIRECTUS_URL}/items/Marca?limit=1`);
        const body = await res.json();
        
        if (body.errors) {
            console.log("❌ Public Access Denied:", JSON.stringify(body.errors, null, 2));
        } else {
            console.log("✅ Public Access Granted for 'Marca' collection.");
        }
        
        const resProd = await fetch(`${DIRECTUS_URL}/items/productos?limit=1&fields=sku,marca_id.nombre`);
        const bodyProd = await resProd.json();
        if (bodyProd.errors) {
            console.log("❌ Public Access for 'productos.marca_id' Denied:", JSON.stringify(bodyProd.errors, null, 2));
        } else {
            console.log("✅ Public Access for 'productos.marca_id' Granted.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkPublicAccess();

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function testPublicAccess() {
    console.log("--- Testing Public Access to 'productos' ---");
    try {
        const res = await fetch(`${DIRECTUS_URL}/items/productos?limit=1&fields=id,nombre,status`);
        const body = await res.json();
        
        if (body.errors) {
            console.error("❌ Public access denied:", JSON.stringify(body.errors, null, 2));
        } else {
            console.log("✅ Public access OK. Samples found:", body.data.length);
            if (body.data.length > 0) {
              console.log("Sample product:", JSON.stringify(body.data[0], null, 2));
            } else {
              console.log("No items found even with public access OK (is collection empty?).");
            }
        }

        // Test with filter status: published
        const resPub = await fetch(`${DIRECTUS_URL}/items/productos?limit=1&fields=id,nombre,status&filter[status][_eq]=published`);
        const bodyPub = await resPub.json();
        console.log("\n--- Testing Published Filter ---");
        if (bodyPub.errors) {
            console.error("❌ Failed with 'published' filter:", JSON.stringify(bodyPub.errors, null, 2));
        } else {
            console.log("Published items found:", bodyPub.data.length);
        }

    } catch (e) {
        console.error("Error during test:", e.message);
    }
}

testPublicAccess();

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function checkAllPublic() {
    for (const coll of ['Marca', 'categorias', 'lineas', 'productos']) {
        const res = await fetch(`${DIRECTUS_URL}/items/${coll}?limit=1`);
        const body = await res.json();
        if (body.errors) {
            console.log(`❌ Public Access to '${coll}' : DENIED`);
        } else {
            console.log(`✅ Public Access to '${coll}' : GRANTED`);
        }
    }
}

checkAllPublic();

const url = 'http://alvarezplacas_directus_v16:8055/auth/login';
const body = {
    email: 'admin@alvarezplacas.com.ar',
    password: 'JavierMix2026!'
};

console.log(`--- 🔍 Probando Login en: ${url} ---`);

async function test() {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        console.log(`Estado HTTP: ${res.status} ${res.statusText}`);
        
        const data = await res.json();
        console.log('Respuesta:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('❌ Error de red:', e.message);
        if (e.cause) console.error('Causa:', e.cause);
    }
}

test();

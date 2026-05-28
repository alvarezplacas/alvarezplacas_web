async function testAstroLogin() {
    const url = 'https://alvarezplacas.com.ar/api/auth/login-admin';
    const credentials = {
        email: 'admin@alvarezplacas.com.ar',
        password: 'JavierMix2026!'
    };

    try {
        console.log(`Probando Login en Astro: ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Raw Response:", text);
        
        try {
            const data = JSON.parse(text);
            console.log("Respuesta JSON:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Response is not JSON.");
        }
    } catch (e) {
        console.error("Error en el fetch:", e.message);
    }
}

testAstroLogin();

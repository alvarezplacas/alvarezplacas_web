import { GET } from '../src/pages/api/vendedor/views/pedidos.ts';

// Mock cookies for Facundo (Jefe, ID 2)
const cookiesMockFacundo = {
    get: (name) => {
        if (name === 'seller_session') {
            return { value: '2' };
        }
        return null;
    }
};

// Mock cookies for Ariel (Seller, ID 1)
const cookiesMockAriel = {
    get: (name) => {
        if (name === 'seller_session') {
            return { value: '1' };
        }
        return null;
    }
};

async function runTest() {
    try {
        console.log("=========================================");
        console.log("EJECUTANDO PRUEBA PARA FACUNDO (JEFE)...");
        console.log("=========================================");
        
        const responseFacundo = await GET({ cookies: cookiesMockFacundo });
        const htmlFacundo = await responseFacundo.text();
        
        console.log("Status Code:", responseFacundo.status);
        console.log("Tiene columna 'Vendedor' en thead:", htmlFacundo.includes('<th>Vendedor</th>'));
        console.log("Tiene fila para German Rodriguez:", htmlFacundo.includes('rodriguez german'));
        console.log("Tiene fila para pedido #3:", htmlFacundo.includes('Interno #3'));
        
        // Count how many occurrences of class="pedido-row" exist
        const rowCountFacundo = (htmlFacundo.match(/class="pedido-row"/g) || []).length;
        console.log(`Pedidos mostrados a Facundo: ${rowCountFacundo}`);
        
        console.log("\n=========================================");
        console.log("EJECUTANDO PRUEBA PARA ARIEL (VENDEDOR)...");
        console.log("=========================================");
        
        const responseAriel = await GET({ cookies: cookiesMockAriel });
        const htmlAriel = await responseAriel.text();
        
        console.log("Status Code:", responseAriel.status);
        console.log("Tiene columna 'Vendedor' en thead:", htmlAriel.includes('<th>Vendedor</th>'));
        console.log("Tiene fila para German Rodriguez:", htmlAriel.includes('rodriguez german'));
        
        const rowCountAriel = (htmlAriel.match(/class="pedido-row"/g) || []).length;
        console.log(`Pedidos mostrados a Ariel: ${rowCountAriel}`);
        
    } catch (e) {
        console.error("Falla en la prueba:", e);
    }
}

runTest();

import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = 'sv47_8QErnkx0-EBKFBnAoBw433CJs13';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(STATIC_TOKEN))
    .with(rest());

async function expirePoints() {
    try {
        console.log("--- Iniciando Proceso de Expiración de Puntos ---");
        
        // Calcular fecha de corte (hace 3 meses)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoff = threeMonthsAgo.toISOString();

        console.log(`Fecha de corte: ${cutoff}`);

        // 1. Buscar clientes con puntos que no pidieron nada en 3 meses
        const inactiveClients = await directus.request(readItems('clientes', {
            filter: {
                _and: [
                    { scoring: { _gt: 0 } },
                    { 
                        _or: [
                            { last_order_date: { _lt: cutoff } },
                            { 
                                _and: [
                                    { last_order_date: { _null: true } },
                                    { registration_date: { _lt: cutoff } }
                                ]
                            }
                        ]
                    }
                ]
            },
            fields: ['id', 'name', 'email', 'scoring']
        }));

        console.log(`Clientes inactivos encontrados: ${inactiveClients.length}`);

        for (const client of inactiveClients) {
            console.log(`Expirando ${client.scoring} puntos para: ${client.name} (${client.email})`);
            
            await directus.request(updateItem('clientes', client.id, {
                scoring: 0,
                // Opcional: registrar motivo en notas si existiera campo
            }));
        }

        console.log("--- Proceso Finalizado con Éxito ---");

    } catch (e) {
        console.error("Error en el proceso de expiración:", e);
    }
}

expirePoints();

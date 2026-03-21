import { createDirectus, rest, updateItem, createItem, readItems } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.alvarezplacas.com.ar';
const directus = createDirectus(DIRECTUS_URL).with(rest());

/**
 * Domain Service: ScoringService
 * Calcula el puntaje de fidelidad usando una progresión logarítmica.
 */
export class ScoringService {
    static calculatePoints(totalPedidos, totalInvertido = 0) {
        if (totalPedidos <= 0) return 0;
        const basePoints = Math.log10(totalPedidos + 1);
        const multiplier = 10;
        const volumeBonus = totalInvertido > 0 ? Math.log10(totalInvertido / 1000 + 1) : 0;
        return Math.round((basePoints * multiplier) + volumeBonus);
    }

    static getTier(points) {
        if (points >= 50) return { name: 'Platinum', color: 'text-blue-400' };
        if (points >= 25) return { name: 'Gold', color: 'text-yellow-400' };
        if (points >= 10) return { name: 'Silver', color: 'text-gray-300' };
        return { name: 'Bronce', color: 'text-orange-400' };
    }
}

/**
 * Application Logic: Scoring Actions
 */
export async function addPointsForOrder(userId, amount = 1) {
    // 1. Obtener puntos actuales
    const client = await directus.request(readItems('clientes', {
        filter: { id: { _eq: userId } },
        fields: ['puntaje']
    }));

    const currentPoints = client[0]?.puntaje || 0;

    // 2. Actualizar puntos en Directus
    await directus.request(updateItem('clientes', userId, {
        puntaje: currentPoints + amount,
        last_order_at: new Date().toISOString(),
        points_updated_at: new Date().toISOString()
    }));
    
    // 3. Registrar log (opcional si existe la colección)
    try {
        await directus.request(createItem('puntos_log', {
            cliente_id: userId,
            cantidad: amount,
            motivo: 'order_completed'
        }));
    } catch (e) { /* Colección opcional */ }
}

export async function processInactivityDeductions() {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const inactiveUsers = await directus.request(readItems('clientes', {
        filter: {
            _and: [
                { puntaje: { _gt: 0 } },
                { last_order_at: { _lt: sixtyDaysAgo } },
                { points_updated_at: { _lt: thirtyDaysAgo } }
            ]
        }
    }));

    for (const user of (inactiveUsers || [])) {
        const deduction = 1;
        const newPoints = Math.max(0, (user.puntaje || 0) - deduction);
        
        await directus.request(updateItem('clientes', user.id, {
            puntaje: newPoints,
            points_updated_at: new Date().toISOString()
        }));

        try {
            await directus.request(createItem('puntos_log', {
                cliente_id: user.id,
                cantidad: -deduction,
                motivo: 'inactivity_deduction'
            }));
        } catch (e) { /* Colección opcional */ }
    }
}

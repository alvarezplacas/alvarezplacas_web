/**
 * Scoring Logic - Herramientas de fidelidad.
 * Propiedad del Agente 5 (Frontend/Herramientas).
 */
import { directus, readItems } from '../../../Backend/conexiones/directus.js';
import { updateItem, createItem } from '@directus/sdk';

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

export async function addPointsForOrder(userId, amount = 1) {
    const client = await directus.request(readItems('clientes', {
        filter: { id: { _eq: userId } },
        fields: ['puntaje']
    }));

    const currentPoints = client[0]?.puntaje || 0;

    await directus.request(updateItem('clientes', userId, {
        puntaje: currentPoints + amount,
        last_order_at: new Date().toISOString(),
        points_updated_at: new Date().toISOString()
    }));
    
    try {
        await directus.request(createItem('puntos_log', {
            cliente_id: userId,
            cantidad: amount,
            motivo: 'order_completed'
        }));
    } catch (e) { /* Colección opcional */ }
}

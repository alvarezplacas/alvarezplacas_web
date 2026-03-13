/**
 * Domain Service: ScoringService
 * Calcula el puntaje de fidelidad usando una progresión logarítmica
 * para premiar la recurrencia sin generar brechas exponenciales entre clientes.
 */
export class ScoringService {
    /**
     * Calcula los puntos basados en pedidos y volumen.
     * @param {number} totalPedidos - Cantidad total de pedidos realizados.
     * @param {number} totalInvertido - Suma total de dinero gastado (opcional).
     * @returns {number} Puntos calculados (redondeado).
     */
    static calculatePoints(totalPedidos, totalInvertido = 0) {
        if (totalPedidos <= 0) return 0;

        // Algoritmo Logarítmico: 
        // Puntos = log10(X + 1) * Multiplicador
        // Esto premia mucho los primeros pedidos y luego se estabiliza.
        const basePoints = Math.log10(totalPedidos + 1);
        const multiplier = 10; // Ajustable según política comercial

        // Bonus por volumen (opcional)
        const volumeBonus = totalInvertido > 0 ? Math.log10(totalInvertido / 1000 + 1) : 0;

        return Math.round((basePoints * multiplier) + volumeBonus);
    }

    /**
     * Determina el nivel de fidelidad (Tier)
     */
    static getTier(points) {
        if (points >= 50) return { name: 'Platinum', color: 'text-blue-400' };
        if (points >= 25) return { name: 'Gold', color: 'text-yellow-400' };
        if (points >= 10) return { name: 'Silver', color: 'text-gray-300' };
        return { name: 'Bronce', color: 'text-orange-400' };
    }
}

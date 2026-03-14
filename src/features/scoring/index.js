import { query } from '@lib/db.js';

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
    await query(`
        UPDATE users 
        SET points = points + $2, 
            last_order_at = CURRENT_TIMESTAMP,
            points_updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `, [userId, amount]);
    
    await query(`
        INSERT INTO points_log (user_id, amount, reason)
        VALUES ($1, $2, 'order_completed')
    `, [userId, amount]);
}

export async function processInactivityDeductions() {
    const inactiveUsers = await query(`
        SELECT id, points, last_order_at, points_updated_at 
        FROM users 
        WHERE is_club_member = TRUE 
          AND points > 0 
          AND last_order_at < (CURRENT_TIMESTAMP - INTERVAL '60 days')
          AND points_updated_at < (CURRENT_TIMESTAMP - INTERVAL '30 days')
    `);

    for (const user of inactiveUsers.rows) {
        const deduction = 1;
        const newPoints = Math.max(0, user.points - deduction);
        await query(`UPDATE users SET points = $2, points_updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id, newPoints]);
        await query(`INSERT INTO points_log (user_id, amount, reason) VALUES ($1, $2, 'inactivity_deduction')`, [user.id, -deduction]);
    }
}

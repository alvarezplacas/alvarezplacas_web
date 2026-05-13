/**
 * Communication Service
 * Handles internal messaging between Clients and Sellers.
 * Propiedad del Agente 2 (Backend/Dashboard).
 */
import { directus, readItems } from '@conexiones/directus.js';
import { createItem, updateItem } from '@directus/sdk';

export class CommunicationService {
    static COLLECTION = 'mensajes';

    /**
     * Get messages between a client and a seller.
     */
    static async getChat(clientId, sellerId) {
        try {
            return await directus.request(readItems(this.COLLECTION, {
                filter: {
                    _or: [
                        { remitente_id: { _eq: clientId }, destinatario_id: { _eq: sellerId } },
                        { remitente_id: { _eq: sellerId }, destinatario_id: { _eq: clientId } }
                    ]
                },
                sort: ['fecha_envio'],
                limit: 100
            }));
        } catch (e) {
            console.error("Error fetching chat:", e);
            return [];
        }
    }

    /**
     * Send a message.
     */
    static async sendMessage(fromId, toId, content, pedidoId = null, prioridad = 'media') {
        try {
            return await directus.request(createItem(this.COLLECTION, {
                remitente_id: fromId,
                destinatario_id: toId,
                mensaje: content,
                fecha_envio: new Date().toISOString(),
                visto: false,
                pedido_id: pedidoId,
                prioridad: prioridad
            }));
        } catch (e) {
            console.error("Error sending message:", e);
            throw e;
        }
    }

    /**
     * Mark messages as seen.
     */
    static async markAsSeen(messageIds) {
        try {
            // Bulk update in Directus normally requires an array of IDs
            for (const id of messageIds) {
                await directus.request(updateItem(this.COLLECTION, id, { visto: true }));
            }
        } catch (e) {
            console.error("Error marking as seen:", e);
        }
    }

    /**
     * Get unread count for a user.
     */
    static async getUnreadCount(userId) {
        try {
            const res = await directus.request(readItems(this.COLLECTION, {
                filter: { destinatario_id: { _eq: userId }, visto: { _eq: false } },
                aggregate: { count: '*' }
            }));
            return parseInt(res[0]?.count || '0');
        } catch (e) {
            return 0;
        }
    }

    /**
     * Get unread stats grouped by priority.
     */
    static async getPriorityStats(sellerId) {
        try {
            const res = await directus.request(readItems(this.COLLECTION, {
                filter: { destinatario_id: { _eq: sellerId }, visto: { _eq: false } },
                fields: ['prioridad'],
            }));
            
            const stats = { alta: 0, media: 0, baja: 0 };
            res.forEach(m => {
                if (m.prioridad === 'alta') stats.alta++;
                else if (m.prioridad === 'baja') stats.baja++;
                else stats.media++;
            });
            return stats;
        } catch (e) {
            return { alta: 0, media: 0, baja: 0 };
        }
    }
}

import { atom } from 'nanostores';
import { Order } from '../../domain/Order';

// Store para las órdenes activas en el dashboard
export const ordersStore = atom([
    new Order({
        id: "1024",
        cliente: "Juan Pérez",
        status: Order.STATUS.PENDIENTE,
        logistica: Order.LOGISTICS.RETIRO,
        items: [
            { name: "Placa Egger Blanco 18mm", price: 15000, quantity: 2, medidas: { base: 2600, altura: 1830 } },
            { name: "Tapacanto ABS Blanco", price: 500, quantity: 10 }
        ]
    }),
    new Order({
        id: "1025",
        cliente: "María García",
        status: Order.STATUS.PENDIENTE,
        logistica: Order.LOGISTICS.ENVIO,
        items: [
            { name: "Faplac Roble Dakar 18mm", price: 18000, quantity: 1 }
        ]
    })
]);

// Store para notificaciones de scoring (puntos ganados)
export const scoringNotificationStore = atom(null);

/**
 * Acción para procesar una orden y otorgar puntos
 */
export function processOrder(orderId) {
    const orders = ordersStore.get();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex !== -1) {
        const order = orders[orderIndex];
        const result = order.markAsProcessed();

        if (result.triggerScoring) {
            // Actualizar la lista (inmutabilidad para Nano Stores)
            const newOrders = [...orders];
            newOrders[orderIndex] = order;
            ordersStore.set(newOrders);

            // Notificar puntos ganados
            scoringNotificationStore.set({
                cliente: order.cliente,
                puntos: result.pointsAwarded,
                timestamp: Date.now()
            });

            // Limpiar notificación después de unos segundos
            setTimeout(() => {
                scoringNotificationStore.set(null);
            }, 4000);
        }
    }
}

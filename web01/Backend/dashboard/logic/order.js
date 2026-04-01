/**
 * Entidad de Dominio: Order
 * Maneja el ciclo de vida y la representación visual de un pedido.
 * Propiedad del Agente 2 (Backend/Dashboard).
 */
import { ScoringService } from '../../../Frontend/herramientas/logic/scoring.js';

export class Order {
    static STATUS = {
        PRESUPUESTO: 'presupuesto',
        EN_PRODUCCION: 'en_produccion',
        EN_CORTE: 'en_corte',
        TERMINADO: 'terminado',
        EN_REPARTO: 'en_reparto',
        ENTREGADO: 'entregado'
    };

    static LOGISTICS = {
        RETIRO: 'Retiro en Local',
        ENVIO: 'Envío a Domicilio'
    };

    constructor(data) {
        this.id = data.id;
        this.cliente = data.cliente;
        this.items = data.items || [];
        this.status = data.status || Order.STATUS.PENDIENTE;
        this.logistica = data.logistica || Order.LOGISTICS.RETIRO;
        this.fecha = data.fecha || new Date();
    }

    getStatusColor() {
        switch (this.status) {
            case Order.STATUS.PRESUPUESTO: return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
            case Order.STATUS.EN_PRODUCCION: return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case Order.STATUS.EN_CORTE: return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
            case Order.STATUS.TERMINADO: return 'text-green-400 border-green-400/30 bg-green-400/10';
            case Order.STATUS.EN_REPARTO: return 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10';
            case Order.STATUS.ENTREGADO: return 'text-gray-400 border-gray-400/30 bg-gray-400/5';
            default: return 'text-white border-gray-700 bg-gray-800';
        }
    }

    getLogisticsInfo() {
        return {
            label: this.logistica,
            icon: this.logistica === Order.LOGISTICS.RETIRO ? 'fa-store' : 'fa-truck'
        };
    }

    getTotalValue() {
        return this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }
}

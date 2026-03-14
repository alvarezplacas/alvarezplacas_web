/**
 * Entidad de Dominio: Order
 * Maneja el ciclo de vida y la representación visual de un pedido.
 */
import { ScoringService } from '@features/scoring';

export class Order {
    static STATUS = {
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        TERMINADO: 'Terminado',
        ENTREGADO: 'Entregado'
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

    /**
     * Retorna el color asociado al estado para la UI
     */
    getStatusColor() {
        switch (this.status) {
            case Order.STATUS.PENDIENTE:
                return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
            case Order.STATUS.EN_PROCESO:
                return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case Order.STATUS.TERMINADO:
                return 'text-green-400 border-green-400/30 bg-green-400/10';
            case Order.STATUS.ENTREGADO:
                return 'text-gray-400 border-gray-400/30 bg-gray-400/5';
            default:
                return 'text-white border-gray-700 bg-gray-800';
        }
    }

    /**
     * Retorna si el pedido está listo para ser movido por logística
     */
    isReadyForLogistics() {
        return this.status === Order.STATUS.TERMINADO;
    }

    /**
     * Retorna el label de logística con su icono
     */
    getLogisticsInfo() {
        return {
            label: this.logistica,
            icon: this.logistica === Order.LOGISTICS.RETIRO ? 'fa-store' : 'fa-truck'
        };
    }

    /**
     * El vendedor marca el pedido como procesado.
     * Gatilla la ejecución de puntos de fidelidad.
     */
    markAsProcessed() {
        if (this.status === Order.STATUS.PENDIENTE) {
            this.status = Order.STATUS.EN_PROCESO;
            return {
                triggerScoring: true,
                pointsAwarded: ScoringService.calculatePoints(1, this.getTotalValue()) // Ejemplo: 1 pedido más
            };
        }
        return { triggerScoring: false };
    }

    getTotalValue() {
        return this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }

    /**
     * Verifica si el pedido contiene items con medidas (cortes)
     */
    hasCortes() {
        return this.items.some(item => item.medidas);
    }

    /**
     * Genera el formato listo para copiar en Leptom Optimizer
     * Formato basado en config: Cant;Base;Altura;Detalle;Material;Rota;CArr;CAbj;CDer;CIzq
     */
    getLeptomFormat() {
        const header = "(copia esto en tu leptom)\n";
        const rows = this.items
            .filter(item => item.medidas)
            .map(item => {
                const { cant, base, altura, rota, cantos } = item.medidas;
                const material = item.name.substring(0, 20); // Truncar si es muy largo
                const rotaVal = rota ? 1 : 0;
                const cArr = cantos?.arriba || 0;
                const cAbj = cantos?.abajo || 0;
                const cDer = cantos?.derecha || 0;
                const cIzq = cantos?.izquierda || 0;

                return `${item.quantity};${base};${altura};${item.name};${material};${rotaVal};${cArr};${cAbj};${cDer};${cIzq}`;
            })
            .join('\n');

        return header + rows;
    }
}

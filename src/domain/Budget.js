/**
 * Entidad de Dominio: Budget
 * Maneja la lógica de presupuestación y aprobación.
 */
import { ScoringService } from '@features/scoring';

export class Budget {
    static STATUS = {
        BORRADOR: 'Borrador',
        ENVIADO: 'Enviado',
        APROBADO: 'Aprobado',
        RECHAZADO: 'Rechazado'
    };

    constructor(data) {
        this.id = data.id;
        this.clienteId = data.clienteId;
        this.total = data.total || 0;
        this.status = data.status || Budget.STATUS.BORRADOR;
        this.items = data.items || [];
    }

    /**
     * El cliente aprueba el presupuesto.
     * Esta acción debería gatillar la creación de una orden y el inicio del scoring.
     */
    approve() {
        this.status = Budget.STATUS.APROBADO;
        // La lógica de puntos se ejecuta al aprobar/procesar
        return {
            triggerScoring: true,
            conversionToOrder: true
        };
    }
}

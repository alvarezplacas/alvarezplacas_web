import { ScoringService } from './ScoringService';

/**
 * Entidad de Dominio: User
 * Maneja perfiles, roles y permisos.
 */
export class User {
    static ROLES = {
        ADMIN: 'admin',
        VENDEDOR: 'vendedor',
        CLIENTE: 'cliente'
    };

    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.email = data.email;
        this.role = data.role || User.ROLES.CLIENTE;
        this.avatar = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombre)}&background=ff2800&color=fff`;

        // Datos de actividad para Scoring
        this.totalPedidos = data.totalPedidos || 0;
        this.totalInvertido = data.totalInvertido || 0;
    }

    getPoints() {
        return ScoringService.calculatePoints(this.totalPedidos, this.totalInvertido);
    }

    getTier() {
        return ScoringService.getTier(this.getPoints());
    }

    isAdmin() {
        return this.role === User.ROLES.ADMIN;
    }

    isVendedor() {
        return this.role === User.ROLES.VENDEDOR;
    }

    isCliente() {
        return this.role === User.ROLES.CLIENTE;
    }

    getDashboardPath() {
        switch (this.role) {
            case User.ROLES.ADMIN: return '/admin';
            case User.ROLES.VENDEDOR: return '/vendedor';
            case User.ROLES.CLIENTE: return '/cliente';
            default: return '/';
        }
    }
}

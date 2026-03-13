import { normalize } from '../core/utils.js';

/**
 * Representa un producto (Placa) en el dominio de Alvarezplacas.
 * Encapsula la lógica de categorización y detección de colores.
 */
export class Placa {
    constructor(data) {
        this.id = data.id;
        this.marca = data.marca || "Desconocida";
        this.linea = data.linea || "General";
        this.nombre = data.nombre || "";
        this.codigo = data.codigo || "";
        this.imagen = data.imagen || "";
        this.acabado = data.acabado || "Consultar";
        this.medida = data.medida || "2.75 x 1.83 mts";
        this.color = data.color || "Consultar";
        this.tono = data.tono || "Neutro";
        this.tags = data.tags || [];

        // Auto-inferir si faltan datos clave
        if (this.color === "Consultar") this.color = this.inferirColor();
        this.tono = this.determinarTono();
        this.categoria = this.inferirCategoria();
    }

    inferirCategoria() {
        const l = normalize(this.linea);
        const n = normalize(this.nombre);

        if (n.includes('marmol') || n.includes('mármol') || n.includes('piedra') || n.includes('concreto') || n.includes('cemento') || l.includes('urban')) return "Piedra";
        if (n.includes('lino') || n.includes('hilado') || n.includes('seda') || l.includes('hilado') || l.includes('lino')) return "Textil";
        if (n.includes('roble') || n.includes('nogal') || n.includes('haya') || n.includes('madera') || n.includes('cedro') || n.includes('wengue') || n.includes('báltico') || n.includes('baltico') || l.includes('madera') || l.includes('nórdica') || l.includes('natur') || l.includes('étnica')) return "Madera";
        if (l.includes('lisos') || l.includes('colores') || l.includes('grupo 1')) return "Liso";

        return "Madera";
    }

    inferirColor() {
        const n = normalize(this.nombre);

        if (n.includes('blanco') || n.includes('tundra') || n.includes('nieve')) return "Blanco";
        if (n.includes('negro') || n.includes('carbón') || n.includes('ebano')) return "Negro";
        if (n.includes('gris') || n.includes('humo') || n.includes('ceniza') || n.includes('antracita') || n.includes('bruma')) return "Gris";
        if (n.includes('roble') || n.includes('nogal') || n.includes('haya') || n.includes('madera') || n.includes('cedro') || n.includes('wengue') || n.includes('baltico') || n.includes('báltico') || n.includes('carvalho')) return "Marrón (Madera)";
        if (n.includes('arena') || n.includes('beige') || n.includes('crema') || n.includes('linosa') || n.includes('seda')) return "Beige / Crema";
        if (n.includes('azul') || n.includes('oceano') || n.includes('marino')) return "Azul";
        if (n.includes('verde') || n.includes('musgo') || n.includes('bosque')) return "Verde";
        if (n.includes('rojo') || n.includes('terracota') || n.includes('amaranto')) return "Rojo";
        if (n.includes('marmol') || n.includes('piedra') || n.includes('concreto') || n.includes('cemento') || n.includes('urban')) return "Piedra / Mármol";

        return "Marrón (Madera)";
    }

    determinarTono() {
        const c = normalize(this.color);
        const calidos = ['madera', 'roble', 'nogal', 'castaño', 'amarillo', 'rojo', 'naranja', 'beige', 'arena', 'marrón', 'marron', 'habano', 'cedro', 'caju'];
        const frios = ['gris', 'azul', 'negro', 'blanco', 'ceniza', 'litio', 'aluminio', 'plata', 'grafito', 'antracita'];

        if (calidos.some(w => c.includes(w))) return "Cálido";
        if (frios.some(w => c.includes(w))) return "Frío";
        return "Neutro";
    }

    toJSON() {
        return {
            id: this.id,
            marca: this.marca,
            linea: this.linea,
            nombre: this.nombre,
            codigo: this.codigo,
            imagen: this.imagen,
            acabado: this.acabado,
            medida: this.medida,
            color: this.color,
            tono: this.tono,
            categoria: this.categoria,
            tags: [...new Set([this.marca, this.linea, this.categoria, this.color, this.tono, ...this.tags])].filter(Boolean)
        };
    }
}

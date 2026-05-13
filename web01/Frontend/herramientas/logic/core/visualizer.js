/**
 * SmartCut Visualizer - (v1.0)
 * Renderizado de planos de corte optimizados para el operario.
 */

export class SmartCutVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scale = 1;
        this.colors = {
            plate: '#111',
            stripBorder: 'rgba(230, 57, 70, 0.5)', // Rojo para Nivel 1
            itemBorder: 'rgba(67, 97, 238, 0.5)',   // Azul para Nivel 2
            text: '#fff',
            waste: 'rgba(255, 255, 255, 0.05)'
        };
    }

    render(optimizedData, plateW, plateH, onUpdate = null) {
        this.container.innerHTML = '';
        this.optimizedData = optimizedData;
        this.onUpdate = onUpdate;
        this.scale = (this.container.clientWidth - 40) / plateW;
        if (this.scale > 1) this.scale = 1;

        optimizedData.plates.forEach((plate, idx) => {
            const plateWrap = this.createPlateElement(plate, idx, plateW, plateH);
            this.container.appendChild(plateWrap);
        });
    }

    createPlateElement(plate, index, w, h) {
        const wrap = document.createElement('div');
        wrap.className = 'plate-view-wrap animate-in';
        wrap.innerHTML = `<div class="plate-label">TABLERO ${index + 1} - ${w}x${h}mm <span style="font-size: 0.7rem; color: #666; font-weight: normal;">(Doble clic para rotar, arrastrar para mover)</span></div>`;

        const canvas = document.createElement('canvas');
        canvas.width = w * this.scale;
        canvas.height = h * this.scale;
        canvas.style.cursor = 'crosshair';
        
        const ctx = canvas.getContext('2d');
        this.drawPlate(ctx, plate, w, h);
        wrap.appendChild(canvas);

        // Eventos de Interacción
        this.setupInteractions(canvas, plate, index, w, h);

        const stats = this.calculateTechnicalData(plate, w, h);
        wrap.appendChild(this.createStatsGrid(stats));

        return wrap;
    }

    setupInteractions(canvas, plate, plateIdx, plateW, plateH) {
        let isDragging = false;
        let selectedItem = null;
        let offset = { x: 0, y: 0 };

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) / this.scale,
                y: (e.clientY - rect.top) / this.scale
            };
        };

        const findItemAt = (pos) => {
            for (let strip of plate.strips) {
                for (let item of strip.items) {
                    const iw = (item.rotated ? item.h : item.l);
                    const ih = (item.rotated ? item.l : item.h);
                    if (pos.x >= item.x && pos.x <= item.x + iw && pos.y >= item.y && pos.y <= item.y + ih) {
                        return item;
                    }
                }
            }
            return null;
        };

        canvas.onmousedown = (e) => {
            const pos = getMousePos(e);
            selectedItem = findItemAt(pos);
            if (selectedItem) {
                isDragging = true;
                offset.x = pos.x - selectedItem.x;
                offset.y = pos.y - selectedItem.y;
                canvas.style.cursor = 'grabbing';
            }
        };

        window.onmousemove = (e) => {
            if (!isDragging || !selectedItem) return;
            const pos = getMousePos(e);
            selectedItem.x = Math.round(pos.x - offset.x);
            selectedItem.y = Math.round(pos.y - offset.y);
            
            // Redibujar
            const ctx = canvas.getContext('2d');
            this.drawPlate(ctx, plate, plateW, plateH);
        };

        window.onmouseup = () => {
            if (isDragging) {
                isDragging = false;
                canvas.style.cursor = 'crosshair';
                if (this.onUpdate) this.onUpdate(this.optimizedData);
            }
        };

        canvas.ondblclick = (e) => {
            const pos = getMousePos(e);
            const item = findItemAt(pos);
            if (item) {
                item.rotated = !item.rotated;
                const ctx = canvas.getContext('2d');
                this.drawPlate(ctx, plate, plateW, plateH);
                if (this.onUpdate) this.onUpdate(this.optimizedData);
            }
        };
    }

    drawPlate(ctx, plate, w, h) {
        const s = this.scale;
        ctx.fillStyle = this.colors.plate;
        ctx.fillRect(0, 0, w * s, h * s);
        this.drawWasteHatching(ctx, 0, 0, w, h);

        plate.strips.forEach(strip => {
            // Ya no dibujamos los bordes de la tira si hay cambios manuales para no confundir
            // Pero mantenemos el dibujo de las piezas
            strip.items.forEach(item => {
                const ix = item.x * s;
                const iy = item.y * s;
                const iw = (item.rotated ? item.h : item.l) * s;
                const ih = (item.rotated ? item.l : item.h) * s;

                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(ix, iy, iw, ih);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(ix, iy, iw, ih);

                if (item.edges) {
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = '#ff2800';
                    ctx.lineWidth = 2;
                    const e = item.edges;
                    const draw = item.rotated ? { t: e.l, b: e.r, l: e.b, r: e.t } : e;
                    if (draw.t > 0) { ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix + iw, iy); ctx.stroke(); }
                    if (draw.b > 0) { ctx.beginPath(); ctx.moveTo(ix, iy + ih); ctx.lineTo(ix + iw, iy + ih); ctx.stroke(); }
                    if (draw.l > 0) { ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix, iy + ih); ctx.stroke(); }
                    if (draw.r > 0) { ctx.beginPath(); ctx.moveTo(ix + iw, iy); ctx.lineTo(ix + iw, iy + ih); ctx.stroke(); }
                    ctx.setLineDash([]);
                }

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px JetBrains Mono, monospace';
                ctx.textAlign = 'center';
                
                const labelL = item.rotated ? item.h : item.l;
                const labelH = item.rotated ? item.l : item.h;

                if (iw > 40) ctx.fillText(`${labelL}`, ix + (iw / 2), iy + 25);
                if (ih > 40) {
                    ctx.save();
                    ctx.translate(ix + 25, iy + (ih / 2));
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillText(`${labelH}`, 0, 0);
                    ctx.restore();
                }

                if (iw > 60 && ih > 60) {
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = '900 24px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(item.label.toUpperCase(), ix + (iw/2), iy + (ih/2) + 8);
                }
            });
        });
    }

    drawWasteHatching(ctx, x, y, w, h) {
        const s = this.scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x * s, y * s, w * s, h * s);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gap = 10;
        for (let i = (x + y) * s - (w + h) * s; i < (x + y + w + h) * s; i += gap) {
            ctx.beginPath();
            ctx.moveTo(i, y * s);
            ctx.lineTo(i - h * s, (y + h) * s);
            ctx.stroke();
        }
        ctx.restore();
    }

    calculateTechnicalData(plate, w, h) {
        let usedArea = 0;
        let piecesCount = 0;
        plate.strips.forEach(s => {
            s.items.forEach(item => {
                usedArea += item.l * item.h;
                piecesCount++;
            });
        });
        const totalArea = w * h;
        const efficiency = (usedArea / totalArea) * 100;
        return {
            usedM2: (usedArea / 1000000).toFixed(3),
            wasteM2: ((totalArea - usedArea) / 1000000).toFixed(3),
            efficiency: efficiency.toFixed(1),
            pieces: piecesCount
        };
    }

    createStatsGrid(stats) {
        const grid = document.createElement('div');
        grid.className = 'tech-data-grid';
        grid.innerHTML = `
            <div class="data-cell"><span>M2 ÚTILES</span><strong>${stats.usedM2}</strong></div>
            <div class="data-cell"><span>M2 SOBRANTE</span><strong>${stats.wasteM2}</strong></div>
            <div class="data-cell"><span>EFICIENCIA</span><strong style="color: ${stats.efficiency > 90 ? '#25d366' : '#d4af37'}">${stats.efficiency}%</strong></div>
            <div class="data-cell"><span>PIEZAS</span><strong>${stats.pieces}</strong></div>
        `;
        return grid;
    }
}

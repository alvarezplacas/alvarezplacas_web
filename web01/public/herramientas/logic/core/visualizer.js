/**
 * SmartCut Visualizer v5.7.5 - INDUSTRIAL MAGNETIC EDITION
 * Renderizado de planos con snapping magnético y prevención de colisiones.
 */
export class SmartCutVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.plates = [];
        this.scale = 1;
        this.padding = 40;
        this.dragState = { dragging: false, item: null, plate: null, offset: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 } };
        this.snapThreshold = 15; // Sensibilidad del imán
    }

    setContainer(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(result, plateW, plateH, onUpdate) {
        this.plates = result.plates;
        this.container.innerHTML = '';
        
        this.plates.forEach((plate, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'plate-view-wrap animate-in';
            wrap.innerHTML = `
                <div class="plate-header-industrial">
                    <div class="plate-title">PLACA ${idx + 1}</div>
                    <div class="plate-subtitle">${plateW} x ${plateH} mm</div>
                </div>
                <canvas id="canvas-plate-${idx}" class="industrial-canvas"></canvas>
                <div id="stats-plate-${idx}" class="industrial-stats-grid"></div>
            `;
            this.container.appendChild(wrap);
            this.setupCanvas(idx, plate, plateW, plateH, onUpdate);
        });
    }

    setupCanvas(idx, plate, pw, ph, onUpdate) {
        const canvas = document.getElementById(`canvas-plate-${idx}`);
        const ctx = canvas.getContext('2d');
        
        const availableW = this.container.clientWidth - (this.padding * 2);
        this.scale = Math.min(availableW / (pw + 100), 600 / (ph + 100)); // Espacio para cotas
        
        canvas.width = (pw + 100) * this.scale;
        canvas.height = (ph + 100) * this.scale;

        // Centrar el tablero en el canvas con margen para cotas
        ctx.translate(20 * this.scale, 20 * this.scale);

        this.drawPlate(ctx, plate, pw, ph);
        this.renderStats(idx, plate, pw, ph);

        // EVENTOS DE ARRASTRE MAGNÉTICO
        canvas.onmousedown = (e) => this.handleMouseDown(e, idx, plate, canvas);
        window.onmousemove = (e) => this.handleMouseMove(e, onUpdate);
        window.onmouseup = () => this.handleMouseUp(onUpdate);
    }

    handleMouseDown(e, plateIdx, plate, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;

        for (const strip of plate.strips) {
            for (const item of strip.items) {
                if (x >= item.x && x <= item.x + item.l && y >= item.y && y <= item.y + item.h) {
                    this.dragState = {
                        dragging: true,
                        item,
                        plate,
                        canvas,
                        offset: { x: x - item.x, y: y - item.y },
                        lastPos: { x: item.x, y: item.y },
                        originalStrip: strip
                    };
                    canvas.style.cursor = 'grabbing';
                    return;
                }
            }
        }
    }

    handleMouseMove(e, onUpdate) {
        if (!this.dragState.dragging) return;
        const { item, plate, canvas, offset } = this.dragState;
        const rect = canvas.getBoundingClientRect();
        
        let newX = (e.clientX - rect.left) / this.scale - offset.x;
        let newY = (e.clientY - rect.top) / this.scale - offset.y;

        // LÓGICA MAGNÉTICA (SNAPPING)
        const snap = this.calculateSnap(newX, newY, item, plate);
        item.x = snap.x;
        item.y = snap.y;

        this.refreshCanvas(canvas, plate);
    }

    calculateSnap(x, y, currentItem, plate) {
        let snappedX = x;
        let snappedY = y;
        let isSnapped = false;

        // Bordes de la placa (Límites)
        if (Math.abs(x) < this.snapThreshold) { snappedX = 0; isSnapped = true; }
        if (Math.abs(y) < this.snapThreshold) { snappedY = 0; isSnapped = true; }

        // Snapping contra otras piezas
        plate.strips.forEach(strip => {
            strip.items.forEach(other => {
                if (other === currentItem) return;

                // X snapping (Izquierda o Derecha)
                if (Math.abs(x - (other.x + other.l)) < this.snapThreshold) snappedX = other.x + other.l;
                if (Math.abs((x + currentItem.l) - other.x) < this.snapThreshold) snappedX = other.x - currentItem.l;

                // Y snapping (Arriba o Abajo)
                if (Math.abs(y - (other.y + other.h)) < this.snapThreshold) snappedY = other.y + other.h;
                if (Math.abs((y + currentItem.h) - other.y) < this.snapThreshold) snappedY = other.y - currentItem.h;
            });
        });

        return { x: snappedX, y: snappedY };
    }

    handleMouseUp(onUpdate) {
        if (!this.dragState.dragging) return;
        
        const { item, plate, lastPos, canvas } = this.dragState;
        
        // Verificación de Colisión Final
        const hasCollision = this.checkCollision(item, plate);
        if (hasCollision) {
            // "Rebote" si hay colisión (No permite montar una sobre otra)
            item.x = lastPos.x;
            item.y = lastPos.y;
        }

        this.dragState.dragging = false;
        canvas.style.cursor = 'grab';
        this.refreshCanvas(canvas, plate);
        if (onUpdate) onUpdate(this.getResult());
    }

    checkCollision(item, plate) {
        let collision = false;
        plate.strips.forEach(strip => {
            strip.items.forEach(other => {
                if (other === item) return;
                if (item.x < other.x + other.l && item.x + item.l > other.x &&
                    item.y < other.y + other.h && item.y + item.h > other.y) {
                    collision = true;
                }
            });
        });
        return collision;
    }

    refreshCanvas(canvas, plate) {
        const ctx = canvas.getContext('2d');
        const pw = (canvas.width / this.scale) - 100;
        const ph = (canvas.height / this.scale) - 100;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(20 * this.scale, 20 * this.scale);
        this.drawPlate(ctx, plate, pw, ph);
        ctx.restore();
    }

    drawPlate(ctx, plate, pw, ph) {
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Detectar modo claro para impresión o visualización técnica
        const isLightMode = document.body.getAttribute('data-theme') !== 'dark';

        // Fondo de la placa
        ctx.fillStyle = isLightMode ? '#ffffff' : '#0a0a0c';
        ctx.fillRect(0, 0, pw, ph);
        
        // DIBUJAR COTAS EXTERNAS (Medidas generales del tablero)
        this.drawExternalDimensions(ctx, pw, ph, isLightMode);

        // DIBUJAR DESPERDICIO (Hachurado Industrial)
        this.drawWastePattern(ctx, pw, ph, plate, isLightMode);
        
        // Dibujar piezas
        plate.strips.forEach((strip, sIdx) => {
            strip.items.forEach(item => {
                this.drawItem(ctx, item, isLightMode);
            });
        });
        ctx.restore();
    }

    drawExternalDimensions(ctx, pw, ph, isLightMode) {
        ctx.save();
        const offset = 25 / this.scale;
        ctx.strokeStyle = isLightMode ? '#666' : '#444';
        ctx.lineWidth = 1 / this.scale;
        ctx.font = `bold ${14 / this.scale}px Inter`;
        ctx.fillStyle = isLightMode ? '#000' : '#888';
        ctx.textAlign = 'center';

        // Dimensión Horizontal (Inferior)
        ctx.beginPath();
        ctx.moveTo(0, ph + offset);
        ctx.lineTo(pw, ph + offset);
        ctx.stroke();
        ctx.fillText(`${Math.round(pw)}`, pw / 2, ph + offset + (20 / this.scale));

        // Dimensión Vertical (Derecha)
        ctx.save();
        ctx.translate(pw + offset, ph / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(`${Math.round(ph)}`, 0, 15 / this.scale);
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(pw + offset, 0);
        ctx.lineTo(pw + offset, ph);
        ctx.stroke();

        ctx.restore();
    }

    drawWastePattern(ctx, pw, ph, plate, isLightMode) {
        ctx.save();
        // Clipping: Solo pintar donde NO hay piezas
        ctx.beginPath();
        ctx.rect(0, 0, pw, ph);
        plate.strips.forEach(s => s.items.forEach(i => {
            ctx.rect(i.x + i.l, i.y, -i.l, i.h); // Dibujar en sentido inverso para restar del path
        }));
        ctx.clip();

        ctx.strokeStyle = isLightMode ? '#ddd' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5 / this.scale;
        
        const step = 15 / this.scale;
        for (let i = -ph; i < pw + ph; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + ph, ph);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawItem(ctx, item, isLightMode) {
        const isDragging = this.dragState.dragging && this.dragState.item === item;
        
        // Cuerpo de la pieza
        if (isLightMode) {
            ctx.fillStyle = isDragging ? 'rgba(0,0,0,0.05)' : '#ffffff';
            ctx.strokeStyle = '#000000';
        } else {
            ctx.fillStyle = isDragging ? 'oklch(62.8% 0.25 29.23 / 40%)' : 'oklch(20% 0.01 280)';
            ctx.strokeStyle = isDragging ? 'oklch(62.8% 0.25 29.23)' : 'oklch(100% 0 0 / 15%)';
        }
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.roundRect(item.x, item.y, item.l, item.h, 2);
        ctx.fill();
        ctx.stroke();

        // Tapacantos (Comunicación Visual al Operador)
        if (item.edges) {
            ctx.save();
            const edgeWidth = 3 / this.scale;
            ctx.lineWidth = edgeWidth;
            
            const renderLabel = (x1, y1, x2, y2, t, side) => {
                ctx.fillStyle = isLightMode ? '#000' : this.getEdgeColor(t);
                ctx.font = `bold ${9 / this.scale}px Inter`;
                ctx.textAlign = 'center';
                
                let tx = (x1 + x2) / 2;
                let ty = (y1 + y2) / 2;
                let val = t === "0.45" ? ".4" : t;

                // OFFSET INDUSTRIAL: Mover etiquetas fuera de la zona de colisión con medidas centrales
                if (side === 't') ty -= 5 / this.scale;
                if (side === 'b') ty += 12 / this.scale;
                if (side === 'l') tx -= 12 / this.scale;
                if (side === 'r') tx += 12 / this.scale;
                
                ctx.fillText(val, tx, ty);
            };

            const getDashPattern = (t) => {
                const thick = parseFloat(t);
                if (thick >= 2) return []; // Sólido para 2mm
                if (thick >= 1) return [6 / this.scale, 3 / this.scale]; // Guiones para 1mm
                if (thick > 0) return [2 / this.scale, 2 / this.scale]; // Puntos para 0.45mm
                return [1 / this.scale, 5 / this.scale]; // Guía muy tenue si es 0
            };

            const drawE = (x1, y1, x2, y2, t, side) => {
                ctx.save();
                ctx.strokeStyle = isLightMode ? '#000000' : this.getEdgeColor(t);
                ctx.lineWidth = (parseFloat(t) >= 2 ? 3 : 1.5) / this.scale;
                
                // Patrón de guiones según espesor (Clave para impresión B/N)
                ctx.setLineDash(getDashPattern(t));
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Etiqueta de espesor
                ctx.setLineDash([]);
                renderLabel(x1, y1, x2, y2, t, side);
                ctx.restore();
            };

            if (item.edges.t) drawE(item.x, item.y, item.x + item.l, item.y, item.edges.t, 't');
            if (item.edges.b) drawE(item.x, item.y + item.h, item.x + item.l, item.y + item.h, item.edges.b, 'b');
            if (item.edges.l) drawE(item.x, item.y, item.x, item.y + item.h, item.edges.l, 'l');
            if (item.edges.r) drawE(item.x + item.l, item.y, item.x + item.l, item.y + item.h, item.edges.r, 'r');
            
            ctx.restore();
        }

        // Etiquetas (Medidas Nominales) - POSICIONAMIENTO CENTRAL PARA EVITAR COLISIÓN
        const fontSize = 12 / this.scale;
        const subFontSize = 9 / this.scale;
        
        ctx.fillStyle = isLightMode ? '#000' : '#fff';
        ctx.font = `bold ${fontSize}px Inter`;
        ctx.textAlign = 'center';
        
        if (item.l > 30 / this.scale && item.h > 30 / this.scale) {
            // Referencia Numérica (Ref ID)
            ctx.font = `900 ${14 / this.scale}px Inter`;
            ctx.fillStyle = isLightMode ? '#000' : '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(`(${item.refId || '?'})`, item.x + (5 / this.scale), item.y + (15 / this.scale));

            // Medida Horizontal (Largo)
            ctx.font = `bold ${fontSize}px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(item.nominalL)}`, item.x + item.l / 2, item.y + (item.h * 0.4) + fontSize);

            // Medida Vertical (Ancho)
            ctx.save();
            ctx.translate(item.x + (item.l * 0.8) + fontSize, item.y + item.h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${Math.round(item.nominalH)}`, 0, 0);
            ctx.restore();

            ctx.font = `600 ${subFontSize}px Inter`;
            ctx.fillStyle = isLightMode ? 'rgba(0,0,0,0.5)' : 'oklch(100% 0 0 / 50%)';
            ctx.fillText(item.label.toUpperCase(), item.x + item.l / 2, item.y + item.h * 0.8);
        }
    }

    getEdgeColor(thickness) {
        if (thickness >= 2) return '#ff2800'; // Rojo para 2mm
        if (thickness >= 1) return '#007aff'; // Azul para 1mm
        return '#25d366'; // Verde para 0.45mm
    }

    renderStats(idx, plate, pw, ph) {
        const statsEl = document.getElementById(`stats-plate-${idx}`);
        const usedArea = plate.strips.reduce((acc, s) => acc + s.items.reduce((a, i) => a + (i.l * i.h), 0), 0);
        const eff = (usedArea / (pw * ph)) * 100;

        // Recalcular metros de tapacanto por placa con excedente industrial
        let edges = { "0.45": 0, "1": 0, "2": 0 };
        const calcEdge = (len) => Math.max(len * 1.18, len + 100) / 1000;
        plate.strips.forEach(s => s.items.forEach(i => {
            if (i.edges) {
                if (i.edges.t) edges[i.edges.t] += calcEdge(i.nominalL);
                if (i.edges.b) edges[i.edges.b] += calcEdge(i.nominalL);
                if (i.edges.l) edges[i.edges.l] += calcEdge(i.nominalH);
                if (i.edges.r) edges[i.edges.r] += calcEdge(i.nominalH);
            }
        }));

        statsEl.innerHTML = `
            <div class="stats-group">
                <div class="stat-main"><span>EFICIENCIA PLACA</span><strong>${eff.toFixed(1)}%</strong></div>
                <div class="stat-main"><span>PIEZAS</span><strong>${plate.strips.reduce((a, s) => a + s.items.length, 0)}</strong></div>
            </div>
            <div class="stats-group" style="border-left: 1px solid oklch(100% 0 0 / 8%); padding-left: 20px;">
                <div class="edge-stat">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <div style="width:30px; border-bottom: 2px dotted #25d366;"></div> 0.45mm
                    </span>
                    <strong>${edges["0.45"].toFixed(1)}m</strong>
                </div>
                <div class="edge-stat">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <div style="width:30px; border-bottom: 2px dashed #007aff;"></div> 1.0mm
                    </span>
                    <strong>${edges["1"].toFixed(1)}m</strong>
                </div>
                <div class="edge-stat">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <div style="width:30px; border-bottom: 2px solid #ff2800;"></div> 2.0mm
                    </span>
                    <strong>${edges["2"].toFixed(1)}m</strong>
                </div>
            </div>
        `;
    }

    getResult() {
        // Cálculo global para retornar al App
        let usedArea = 0;
        let totalPieces = 0;
        let edgeMeters = { "0.45": 0, "1": 0, "2": 0 };
        this.plates.forEach(p => p.strips.forEach(s => s.items.forEach(i => {
            usedArea += i.l * i.h;
            totalPieces++;
            if (i.edges) {
                // Cálculo Industrial: 18% de desperdicio o 100mm fijos para retestado (el mayor)
                const calcEdge = (len) => Math.max(len * 1.18, len + 100);
                if (i.edges.t) edgeMeters[i.edges.t] += calcEdge(i.nominalL) / 1000;
                if (i.edges.b) edgeMeters[i.edges.b] += calcEdge(i.nominalL) / 1000;
                if (i.edges.l) edgeMeters[i.edges.l] += calcEdge(i.nominalH) / 1000;
                if (i.edges.r) edgeMeters[i.edges.r] += calcEdge(i.nominalH) / 1000;
            }
        })));
        return { plates: this.plates, stats: { totalPlates: this.plates.length, totalPieces, efficiency: 0, edgeMeters } };
    }
}

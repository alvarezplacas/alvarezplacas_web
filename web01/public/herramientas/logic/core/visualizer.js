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
        this.scale = Math.min(availableW / pw, 600 / ph);
        
        canvas.width = pw * this.scale;
        canvas.height = ph * this.scale;

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
        const pw = canvas.width / this.scale;
        const ph = canvas.height / this.scale;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawPlate(ctx, plate, pw, ph);
    }

    drawPlate(ctx, plate, pw, ph) {
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Detectar modo claro para impresión o visualización técnica
        const isLightMode = document.body.getAttribute('data-theme') !== 'dark';

        // Fondo de la placa
        ctx.fillStyle = isLightMode ? '#ffffff' : '#0a0a0c';
        ctx.fillRect(0, 0, pw, ph);
        
        // DIBUJAR DESPERDICIO (Hachurado Industrial)
        this.drawWastePattern(ctx, pw, ph, plate, isLightMode);
        
        // Dibujar piezas
        plate.strips.forEach((strip, sIdx) => {
            // Líneas de corte Nivel 1
            ctx.strokeStyle = isLightMode ? 'rgba(0,0,0,0.2)' : 'oklch(100% 0 0 / 10%)'; 
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(strip.x, strip.y, strip.w, strip.h);
            ctx.setLineDash([]);

            strip.items.forEach(item => {
                this.drawItem(ctx, item, isLightMode);
            });
        });
        ctx.restore();
    }

    drawWastePattern(ctx, pw, ph, plate, isLightMode) {
        ctx.save();
        ctx.strokeStyle = isLightMode ? 'rgba(0,0,0,0.1)' : 'oklch(100% 0 0 / 5%)';
        ctx.lineWidth = 0.5;
        
        // Trama diagonal marcada
        const step = 20;
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
                ctx.font = `800 ${10 / this.scale}px Inter`; // Más grueso y legible
                ctx.textAlign = 'center';
                
                let tx = (x1 + x2) / 2;
                let ty = (y1 + y2) / 2;
                let val = t === "0.45" ? ".4" : t;

                // POSICIONAMIENTO INDUSTRIAL: Evitar colisión con medidas centrales
                // Siempre horizontal para máxima legibilidad
                if (side === 't') ty -= 6 / this.scale;
                if (side === 'b') ty += 14 / this.scale;
                if (side === 'l') tx -= 14 / this.scale;
                if (side === 'r') tx += 14 / this.scale;
                
                ctx.fillText(val, tx, ty);
            };

            const getDashPattern = (t) => {
                const thick = parseFloat(t);
                if (thick >= 2) return []; // Sólido: 2mm
                if (thick >= 1) return [8 / this.scale, 4 / this.scale]; // Guiones largos: 1mm
                if (thick > 0) return [2 / this.scale, 3 / this.scale]; // Puntos: 0.45mm
                return [1 / this.scale, 8 / this.scale]; // Guía mínima
            };

            const drawE = (x1, y1, x2, y2, t, side) => {
                ctx.save();
                ctx.strokeStyle = isLightMode ? '#000000' : this.getEdgeColor(t);
                ctx.lineWidth = (parseFloat(t) >= 2 ? 4 : 2) / this.scale; // Líneas más marcadas
                
                ctx.setLineDash(getDashPattern(t));
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

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

        // ETIQUETAS TÉCNICAS (Medidas y Referencia ID)
        const fontSize = 13 / this.scale;
        const subFontSize = 9 / this.scale;
        const idFontSize = 11 / this.scale;
        
        ctx.fillStyle = isLightMode ? '#000' : '#fff';
        ctx.textAlign = 'center';
        
        if (item.l > 45 / this.scale && item.h > 45 / this.scale) {
            // ID de Pieza - Estilo Lepton (ID)
            ctx.font = `bold ${idFontSize}px "JetBrains Mono", monospace`;
            ctx.fillText(`(${item.id % 100})`, item.x + 15 / this.scale, item.y + 15 / this.scale);

            // Medida Horizontal (Largo)
            ctx.font = `800 ${fontSize}px Inter`;
            ctx.fillText(`${Math.round(item.nominalL)}`, item.x + item.l/2, item.y + (item.h * 0.25) + fontSize);
            
            // Medida Vertical (Ancho) - Rotada pero desplazada para no pisar el centro
            ctx.save();
            ctx.translate(item.x + (item.l * 0.2) + fontSize, item.y + item.h/2);
            ctx.rotate(-Math.PI/2);
            ctx.fillText(`${Math.round(item.nominalH)}`, 0, 0);
            ctx.restore();
            
            // Etiqueta descriptiva
            ctx.font = `600 ${subFontSize}px Inter`;
            ctx.fillStyle = isLightMode ? 'rgba(0,0,0,0.6)' : 'oklch(100% 0 0 / 60%)';
            ctx.fillText(item.label.toUpperCase(), item.x + item.l/2, item.y + item.h/2 + (subFontSize/2));
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

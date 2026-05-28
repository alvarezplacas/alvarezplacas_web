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
        
        // Estado de selección para tooltip y rotación
        this.selectedItem = null;
        this.selectedPlate = null;
        this.selectedCanvas = null;
        this.onUpdateCallback = null;

        // Escucha global de teclado para rotar pieza seleccionada
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.selectedItem) {
                // Verificar que el canvas seleccionado siga en el DOM (evita memory leaks de instancias huérfanas)
                if (this.selectedCanvas && !document.body.contains(this.selectedCanvas)) {
                    this.selectedItem = null;
                    return;
                }
                // Evitar el desplazamiento de la página por la barra espaciadora
                e.preventDefault();
                this.rotateSelectedItem();
            }
        });
    }

    setContainer(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(result, plateW, plateH, onUpdate) {
        this.plates = result.plates;
        this.container.innerHTML = '';
        this.onUpdateCallback = onUpdate;
        
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

        let clickedItem = null;
        for (const strip of plate.strips) {
            for (const item of strip.items) {
                if (x >= item.x && x <= item.x + item.l && y >= item.y && y <= item.y + item.h) {
                    clickedItem = item;
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
                    break;
                }
            }
            if (clickedItem) break;
        }

        // Selección activa
        this.selectedItem = clickedItem;
        this.selectedPlate = clickedItem ? plate : null;
        this.selectedCanvas = clickedItem ? canvas : null;

        // Refrescar todos los tableros para actualizar tooltip de selección única
        this.plates.forEach((p, idx) => {
            const pCanvas = document.getElementById(`canvas-plate-${idx}`);
            if (pCanvas) {
                this.refreshCanvas(pCanvas, p);
            }
        });
    }

    handleMouseMove(e, onUpdate) {
        if (!this.dragState.dragging) return;
        const { item, plate, canvas, offset } = this.dragState;
        const rect = canvas.getBoundingClientRect();
        
        let newX = (e.clientX - rect.left) / this.scale - offset.x;
        let newY = (e.clientY - rect.top) / this.scale - offset.y;

        const pw = (canvas.width / this.scale) - 100;
        const ph = (canvas.height / this.scale) - 100;

        // LÓGICA MAGNÉTICA (SNAPPING MULTI-BORDES Y ALINEACIÓN)
        const snap = this.calculateSnap(newX, newY, item, plate, pw, ph);
        
        // Clampeado dentro de los límites del plano (permite arrastrar libremente por encima)
        item.x = Math.max(0, Math.min(snap.x, pw - item.l));
        item.y = Math.max(0, Math.min(snap.y, ph - item.h));

        this.refreshCanvas(canvas, plate);
    }

    calculateSnap(x, y, currentItem, plate, pw, ph) {
        let snappedX = x;
        let snappedY = y;

        // Snapping con los 4 bordes exteriores de la placa (Límites)
        if (Math.abs(x) < this.snapThreshold) snappedX = 0;
        if (Math.abs(y) < this.snapThreshold) snappedY = 0;
        if (Math.abs((x + currentItem.l) - pw) < this.snapThreshold) snappedX = pw - currentItem.l;
        if (Math.abs((y + currentItem.h) - ph) < this.snapThreshold) snappedY = ph - currentItem.h;

        // Snapping contra otras piezas (Contacto y Alineación de bordes)
        plate.strips.forEach(strip => {
            strip.items.forEach(other => {
                if (other === currentItem) return;

                // 1. Pegado de contacto (Adyacencia)
                if (Math.abs(x - (other.x + other.l)) < this.snapThreshold) snappedX = other.x + other.l;
                if (Math.abs((x + currentItem.l) - other.x) < this.snapThreshold) snappedX = other.x - currentItem.l;
                if (Math.abs(y - (other.y + other.h)) < this.snapThreshold) snappedY = other.y + other.h;
                if (Math.abs((y + currentItem.h) - other.y) < this.snapThreshold) snappedY = other.y - currentItem.h;

                // 2. Alineación técnica (Alineado en el mismo eje)
                if (Math.abs(x - other.x) < this.snapThreshold) snappedX = other.x;
                if (Math.abs((x + currentItem.l) - (other.x + other.l)) < this.snapThreshold) snappedX = other.x + other.l - currentItem.l;
                if (Math.abs(y - other.y) < this.snapThreshold) snappedY = other.y;
                if (Math.abs((y + currentItem.h) - (other.y + other.h)) < this.snapThreshold) snappedY = other.y + other.h - currentItem.h;
            });
        });

        return { x: snappedX, y: snappedY };
    }

    handleMouseUp(onUpdate) {
        if (!this.dragState.dragging) return;
        
        const { item, plate, lastPos, canvas } = this.dragState;

        const pw = (canvas.width / this.scale) - 100;
        const ph = (canvas.height / this.scale) - 100;

        // Respaldar todas las posiciones originales de la placa
        const backups = [];
        plate.strips.forEach(s => s.items.forEach(i => {
            backups.push({ item: i, x: i.x, y: i.y });
        }));

        // Intentar resolver colisiones mediante empuje
        const success = this.resolveCollisionsAndPush(item, plate, pw, ph);

        if (!success) {
            // Rebotar al lugar de origen: restaurar backups
            backups.forEach(b => {
                b.item.x = b.x;
                b.item.y = b.y;
            });
            // Asegurar que el item arrastrado vuelva a su posición original
            item.x = lastPos.x;
            item.y = lastPos.y;
            console.log("[SmartCut] No hay espacio libre disponible. La pieza vuelve a su posición original.");
        }

        this.dragState.dragging = false;
        canvas.style.cursor = 'grab';

        // Actualizar estadísticas al soltar
        this.renderStats(this.plates.indexOf(plate), plate, pw, ph);

        this.refreshCanvas(canvas, plate);
        if (onUpdate) onUpdate(this.getResult());
        if (this.onUpdateCallback) this.onUpdateCallback(this.getResult());
    }

    resolveCollisionsAndPush(item, plate, pw, ph) {
        // Encontrar todas las piezas que colisionan con item
        let collidingItems = [];
        plate.strips.forEach(strip => {
            strip.items.forEach(other => {
                if (other === item) return;
                // Verificar intersección
                if (item.x < other.x + other.l && item.x + item.l > other.x &&
                    item.y < other.y + other.h && item.y + item.h > other.y) {
                    collidingItems.push(other);
                }
            });
        });

        if (collidingItems.length === 0) return true; // No hay colisión, todo ok!

        // Intentar desplazar las piezas colisionadas
        for (const other of collidingItems) {
            // Calcular las 4 opciones de empuje posibles
            const pushRight = item.x + item.l;
            const pushLeft = item.x - other.l;
            const pushDown = item.y + item.h;
            const pushUp = item.y - other.h;

            const options = [];

            // Opción 1: Empujar a la derecha
            if (pushRight + other.l <= pw) {
                options.push({ x: pushRight, y: other.y, dist: Math.abs(pushRight - other.x) });
            }
            // Opción 2: Empujar a la izquierda
            if (pushLeft >= 0) {
                options.push({ x: pushLeft, y: other.y, dist: Math.abs(pushLeft - other.x) });
            }
            // Opción 3: Empujar hacia abajo
            if (pushDown + other.h <= ph) {
                options.push({ x: other.x, y: pushDown, dist: Math.abs(pushDown - other.y) });
            }
            // Opción 4: Empujar hacia arriba
            if (pushUp >= 0) {
                options.push({ x: other.x, y: pushUp, dist: Math.abs(pushUp - other.y) });
            }

            // Ordenar opciones por menor desplazamiento (para empujar lo mínimo indispensable)
            options.sort((a, b) => a.dist - b.dist);

            let pushed = false;
            const originalOtherX = other.x;
            const originalOtherY = other.y;

            for (const opt of options) {
                other.x = opt.x;
                other.y = opt.y;

                // Verificar si esta nueva posición de other causa colisión con CUALQUIER OTRA pieza
                // (excluyendo item y ella misma)
                let collisionWithOthers = false;
                for (const s of plate.strips) {
                    for (const check of s.items) {
                        if (check === other || check === item) continue;
                        if (other.x < check.x + check.l && other.x + other.l > check.x &&
                            other.y < check.y + check.h && other.y + other.h > check.y) {
                            collisionWithOthers = true;
                            break;
                        }
                    }
                    if (collisionWithOthers) break;
                }

                if (!collisionWithOthers) {
                    pushed = true;
                    break; // Empuje exitoso!
                }
            }

            if (!pushed) {
                // Restaurar posición y abortar (indica que no se pudo empujar)
                other.x = originalOtherX;
                other.y = originalOtherY;
                return false;
            }
        }

        return true;
    }

    rotateSelectedItem() {
        const item = this.selectedItem;
        const plate = this.selectedPlate;
        const canvas = this.selectedCanvas;
        if (!item || !plate || !canvas) return;

        const pw = (canvas.width / this.scale) - 100;
        const ph = (canvas.height / this.scale) - 100;

        // Respaldar estado original para reversión limpia si falla la ubicación
        const originalL = item.l;
        const originalH = item.h;
        const originalNomL = item.nominalL;
        const originalNomH = item.nominalH;
        const originalX = item.x;
        const originalY = item.y;
        const originalEdges = item.edges ? { ...item.edges } : null;

        // Intercambiar dimensiones geométricas y nominales
        item.l = originalH;
        item.h = originalL;
        item.nominalL = originalNomH;
        item.nominalH = originalNomL;

        // Rotar los tapacantos 90 grados en sentido horario
        if (item.edges) {
            item.edges.t = originalEdges.l;
            item.edges.r = originalEdges.t;
            item.edges.b = originalEdges.r;
            item.edges.l = originalEdges.b;
        }

        // Mantener dentro del plano del tablero
        item.x = Math.max(0, Math.min(item.x, pw - item.l));
        item.y = Math.max(0, Math.min(item.y, ph - item.h));

        // Verificar colisión
        let hasCollision = this.checkCollision(item, plate);
        if (hasCollision) {
            // Respaldar todas las posiciones originales de la placa por si falla el empuje
            const backups = [];
            plate.strips.forEach(s => s.items.forEach(i => {
                backups.push({ item: i, x: i.x, y: i.y });
            }));

            // Usar la nueva lógica de empuje industrial
            const success = this.resolveCollisionsAndPush(item, plate, pw, ph);

            if (!success) {
                // Revertir el empuje
                backups.forEach(b => {
                    b.item.x = b.x;
                    b.item.y = b.y;
                });

                // Revertir la rotación de la pieza
                item.l = originalL;
                item.h = originalH;
                item.nominalL = originalNomL;
                item.nominalH = originalNomH;
                item.x = originalX;
                item.y = originalY;
                if (item.edges && originalEdges) {
                    item.edges.t = originalEdges.t;
                    item.edges.r = originalEdges.r;
                    item.edges.b = originalEdges.b;
                    item.edges.l = originalEdges.l;
                }
                console.log("[SmartCut] No hay espacio libre disponible para girar la pieza.");
                return;
            }
        }

        // Refrescar y notificar cambio global de metros y totales
        this.refreshCanvas(canvas, plate);
        this.renderStats(this.plates.indexOf(plate), plate, pw, ph);
        if (this.onUpdateCallback) {
            this.onUpdateCallback(this.getResult());
        }
    }

    drawRotationTooltip(ctx, item, pw, ph) {
        ctx.save();
        
        const text = "⎵ BARRA ESPACIADORA para girar";
        const fontSizeOnCanvas = 11 / this.scale;
        ctx.font = `bold ${fontSizeOnCanvas}px Inter`;
        const textWidth = ctx.measureText(text).width;
        
        const padX = 12 / this.scale;
        const padY = 6 / this.scale;
        const bgW = textWidth + padX * 2;
        const bgH = 24 / this.scale;
        
        // Posicionar arriba, o abajo si toca el borde superior
        let tx = item.x + item.l / 2 - bgW / 2;
        let ty = item.y - bgH - (10 / this.scale);
        
        if (ty < 10 / this.scale) {
            ty = item.y + item.h + (10 / this.scale);
        }
        
        // Mantener dentro del eje X
        tx = Math.max(10 / this.scale, Math.min(tx, pw - bgW - 10 / this.scale));
        
        const isLightMode = document.body.getAttribute('data-theme') !== 'dark';
        
        // Fondo elegante en alto contraste
        ctx.fillStyle = isLightMode ? 'rgba(10, 10, 12, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 12 * this.scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4 * this.scale;
        
        ctx.beginPath();
        ctx.roundRect(tx, ty, bgW, bgH, 6 / this.scale);
        ctx.fill();
        
        // Texto
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = isLightMode ? '#ffffff' : '#0a0a0c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tx + bgW / 2, ty + bgH / 2);
        
        ctx.restore();
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

        // Dibujar tooltip de rotación en pieza seleccionada
        if (this.selectedItem && this.selectedPlate === plate) {
            this.drawRotationTooltip(ctx, this.selectedItem, pw, ph);
        }

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
        const isSelected = this.selectedItem === item;
        
        // Cuerpo de la pieza
        if (isLightMode) {
            ctx.fillStyle = isDragging ? 'rgba(0,0,0,0.05)' : (isSelected ? 'rgba(37, 211, 102, 0.1)' : '#ffffff');
            ctx.strokeStyle = isSelected ? '#25d366' : '#000000';
            ctx.lineWidth = isSelected ? 2 : 1;
        } else {
            ctx.fillStyle = isDragging ? 'oklch(62.8% 0.25 29.23 / 40%)' : (isSelected ? 'oklch(62.8% 0.25 29.23 / 15%)' : 'oklch(20% 0.01 280)');
            ctx.strokeStyle = isSelected ? 'oklch(62.8% 0.25 29.23)' : 'oklch(100% 0 0 / 15%)';
            ctx.lineWidth = isSelected ? 2 : 1;
        }
        ctx.lineWidth = isSelected ? 2 : 1;
        
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

export function initCatalog() {
    const searchInput = document.getElementById('catalogSearch');
    const brandFilterBtns = document.querySelectorAll('.brand-btn');
    const bucketFilterBtns = document.querySelectorAll('.bucket-btn');
    const cards = document.querySelectorAll('.catalog-item');
    const noResults = document.getElementById('noResults');

    const modal = document.getElementById('productModal');
    const modalCard = document.getElementById('modalCard');
    const closeBtns = document.querySelectorAll('.close-modal, .modal-backdrop');

    const mImage = document.getElementById('modalImage');
    const mMarcaBadge = document.getElementById('modalMarcaBadge');
    const mNombre = document.getElementById('modalNombre');
    const mCategory = document.getElementById('modalCategory');
    const mSpecsContainer = document.getElementById('modalSpecsContainer');
    const mPriceDisplay = document.getElementById('modalPriceDisplay');
    const mPriceL1 = document.getElementById('modalPriceL1');
    const mPriceMain = document.getElementById('modalPriceMain');
    const mStockDisplay = document.getElementById('modalStockDisplay');
    const mWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
    const mSmartMatchBtn = document.getElementById('modalSmartMatchBtn');
    const mEstadoContainer = document.getElementById('modalEstadoContainer');

    if (!searchInput || !cards.length) return;

    let currentBrand = 'Todos';
    let currentBucket = 'Todo';
    let currentSearchTerm = '';
    let currentPage = 1;
    const itemsPerPage = 20;

    const paginationContainer = document.getElementById('paginationContainer');



    function resetBrandFilter() {
        currentBrand = 'Todos';
        brandFilterBtns.forEach(b => {
            // Estilo Inactivo
            b.classList.remove('bg-gray-800', 'text-white', 'border-gray-600', 'shadow-lg', 'active');
            b.classList.add('bg-[#151515]/50', 'text-gray-500', 'border-gray-800');
            
            if (b.dataset.filter === 'Todos') {
                // Estilo Activo para "Todas"
                b.classList.remove('bg-[#151515]/50', 'text-gray-500', 'border-gray-800');
                b.classList.add('bg-gray-800', 'text-white', 'border-gray-600', 'shadow-lg', 'active');
            }
        });
    }

    bucketFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            bucketFilterBtns.forEach(b => {
                b.classList.remove('active');
            });

            const target = e.currentTarget;
            target.classList.add('active');

            currentBucket = target.dataset.bucket;
            currentPage = 1; // Reset a pag 1
            filterCards();
        });
    });

    brandFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            brandFilterBtns.forEach(b => {
                b.classList.remove('bg-gray-800', 'text-white', 'border-gray-600', 'shadow-lg', 'active');
                b.classList.add('bg-[#151515]/50', 'text-gray-500', 'border-gray-800');
            });

            const target = e.currentTarget;
            target.classList.remove('bg-[#151515]/50', 'text-gray-500', 'border-gray-800');
            target.classList.add('bg-gray-800', 'text-white', 'border-gray-600', 'shadow-lg', 'active');

            currentBrand = target.dataset.filter;
            currentPage = 1; // Reset a pag 1
            filterCards();
        });
    });

    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase().trim();
        currentPage = 1; // Reset a pag 1
        filterCards();
    });

    function renderPagination(totalItems) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;

        // Limitar número de botones visibles si hay demasiados (ej: 10 max)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // Botón Anterior
        if (currentPage > 1) {
            createPageBtn('Anterior', currentPage - 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            createPageBtn(i, i, i === currentPage);
        }

        // Botón Siguiente
        if (currentPage < totalPages) {
            createPageBtn('Siguiente', currentPage + 1);
        }
    }

    function createPageBtn(label, pageNum, isActive = false) {
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
            isActive 
            ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
            : 'bg-[#151515] text-gray-500 border-gray-800 hover:border-gray-600 hover:text-white'
        }`;
        btn.textContent = label;
        btn.onclick = () => {
            currentPage = pageNum;
            filterCards();
            window.scrollTo({ top: searchInput.offsetTop - 100, behavior: 'smooth' });
        };
        paginationContainer.appendChild(btn);
    }

    function renderCards(pageItems) {
        const catalogGrid = document.getElementById('catalogGrid');
        if (!catalogGrid) return;
        
        let html = '';
        pageItems.forEach(placa => {
            const isFallback = placa.imagen && placa.imagen.includes('assets/209a486b');
            const brandUpper = (placa.brand || '').toUpperCase().trim();
            const nameUpper = (placa.name || '').toUpperCase().trim();
            const displayTitle = (brandUpper && nameUpper.startsWith(brandUpper))
              ? placa.name.substring(brandUpper.length).trim()
              : placa.name;
              
            const bucketColor = placa.bucket === "Tableros" ? 'bg-primary text-black' : 'bg-gray-700 text-white';
            const imgClass = isFallback ? 'object-contain p-12 bg-[#1a1a1a]' : 'object-cover';
            
            let estadoHtml = '';
            if (placa.estado) {
                const tags = Array.isArray(placa.estado) ? placa.estado : [placa.estado];
                estadoHtml = `<div class="flex flex-wrap gap-1">` + tags.map(tag => {
                    let color = 'bg-gray-800 text-gray-400';
                    if (tag === 'Stock') color = 'bg-[#c0c0c0] text-black';
                    else if (tag === 'Sin Stock') color = 'bg-red-900/30 text-red-500 border border-red-500/20';
                    else if (tag === 'Outlet') color = 'bg-[#FFD60A] text-black';
                    else if (tag === 'Nuevo') color = 'bg-[#007AFF] text-white';
                    else if (tag === 'Descontinuado') color = 'bg-red-600 text-white';
                    return `<span class="text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm ${color}">${tag}</span>`;
                }).join('') + `</div>`;
            }
            
            let specsHtml = '';
            if (placa.specs && placa.specs.length > 0) {
                specsHtml = `<div class="flex flex-wrap gap-1.5 mb-4">` + placa.specs.map(spec => `<span class="bg-gray-900 text-gray-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-medium">${spec}</span>`).join('') + `</div>`;
            }

            const dataFull = JSON.stringify(placa).replace(/"/g, '&quot;');
            
            html += `
            <div class="catalog-item group flex flex-col bg-[#111111] rounded-2xl overflow-hidden border border-gray-800/50 transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer h-full relative"
                 data-bucket="${placa.bucket}" data-brand="${placa.brand}" data-full="${dataFull}">
                <div class="absolute top-4 left-4 z-10">
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter shadow-lg ${bucketColor}">${placa.bucket}</span>
                </div>
                <div class="aspect-square overflow-hidden bg-[#0a0a0a] relative">
                    <img src="${placa.imagen}" alt="${placa.name}" loading="lazy" class="w-full h-full transition-transform duration-700 group-hover:scale-105 ${imgClass}" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40"></div>
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <div class="mb-4">
                        <div class="flex items-center gap-2 mb-1">
                            <p class="text-primary text-[10px] font-bold uppercase tracking-widest">${placa.brand}</p>
                            ${estadoHtml}
                        </div>
                        <h3 class="text-white font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                            ${displayTitle}
                        </h3>
                    </div>
                    <div class="mt-auto pt-4 border-t border-gray-800/40">
                        ${specsHtml}
                        <div class="flex items-center justify-between">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-[10px] text-gray-600 font-mono">${placa.code || '-'}</span>
                                ${placa.model ? `<span class="text-[9px] text-gray-500 font-bold uppercase tracking-tight">${placa.model}</span>` : ''}
                            </div>
                            <div class="flex gap-2">
                                <button class="bg-[#25D366]/10 text-[#25D366] p-2 rounded-lg hover:bg-[#25D366] hover:text-white transition-all">
                                    <i class="fab fa-whatsapp text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        catalogGrid.innerHTML = html;
        
        // Re-attach modal listeners to newly rendered cards
        const renderedCards = document.querySelectorAll('.catalog-item');
        renderedCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return; // WhatsApp btn click
                const data = JSON.parse(card.dataset.full);
                openModal(data);
            });
        });
    }

    function filterCards() {
        const searchTerms = currentSearchTerm.split(' ').filter(term => term.length > 0);
        const items = window.CATALOG_ITEMS || [];
        
        // 1. Elementos que coinciden con Rubro y Búsqueda (ignorar marca) para actualizar botones
        let itemsForBrandCalc = items.filter(placa => {
            const matchesBucket = currentBucket === 'Todo' || placa.bucket === currentBucket;
            let matchesSearch = true;
            if (searchTerms.length > 0) {
              let searchString = `${placa.name} ${placa.brand} ${placa.category} ${placa.code}`.toLowerCase();
              
              // Expansión inteligente de abreviaturas en el texto a buscar
              if (searchString.includes('egg')) searchString += ' egger';
              if (searchString.includes('fap')) searchString += ' faplac';
              if (searchString.includes('sad')) searchString += ' sadepan';
              if (searchString.includes('ench')) searchString += ' enchapado';
              if (searchString.includes('tpc') || searchString.includes('tapacanto')) searchString += ' tpc tapacanto tapacantos';
              if (searchString.includes('bco')) searchString += ' blanco';
              if (searchString.includes('ngro') || searchString.includes('neg')) searchString += ' negro';

              matchesSearch = searchTerms.every(term => {
                  // Mapeo inverso: si el usuario escribe la palabra completa, aceptamos la abreviatura
                  if (term === 'egger' && searchString.includes('egg')) return true;
                  if (term === 'faplac' && searchString.includes('fap')) return true;
                  if (term === 'sadepan' && searchString.includes('sad')) return true;
                  if (term === 'enchapado' && searchString.includes('ench')) return true;
                  if (term === 'blanco' && searchString.includes('bco')) return true;
                  if (term === 'negro' && (searchString.includes('ngro') || searchString.includes('neg'))) return true;
                  return searchString.includes(term);
              });
            }
            return matchesBucket && matchesSearch;
        });

        const availableBrands = new Set(itemsForBrandCalc.map(i => i.brand ? i.brand.toUpperCase().trim() : ''));

        brandFilterBtns.forEach(btn => {
            const brandName = btn.dataset.filter;
            if (brandName === 'Todos') return;
            if (availableBrands.has(brandName.toUpperCase().trim())) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        });

        if (currentBrand !== 'Todos' && !availableBrands.has(currentBrand.toUpperCase().trim())) {
            resetBrandFilter();
        }

        // 2. Elementos que realmente se muestran (aplicando filtro de marca)
        let matchingItems = itemsForBrandCalc.filter(placa => {
            return currentBrand === 'Todos' || 
                   (placa.brand && placa.brand.toUpperCase().trim() === currentBrand.toUpperCase().trim());
        });

        // Paginación
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = matchingItems.slice(start, end);

        renderCards(pageItems);
        renderPagination(matchingItems.length);

        if (noResults) {
            if (matchingItems.length === 0) noResults.classList.remove('hidden');
            else noResults.classList.add('hidden');
        }
    }

    // Initial render is handled by filterCards() which is called at the end.
    
    function openModal(data) {
        const isTablero = data.bucket === "Tableros";
        const isHerramienta = data.bucket === "Herramientas";

            if (mImage) {
                const LOGO_FALLBACK = "https://admin.alvarezplacas.com.ar/assets/209a486b-8623-4c3e-8f8e-2a3288f1f0fd";
                mImage.src = data.imagen || LOGO_FALLBACK;
                mImage.style.display = 'block';
                mImage.onerror = () => { mImage.src = LOGO_FALLBACK; };
            }

            if (mMarcaBadge) mMarcaBadge.textContent = data.brand;
            if (mNombre) mNombre.textContent = data.name;
            
            mCategory.textContent = data.bucket === "Tableros" && data.category ? `${data.bucket} - ${data.category}` : data.category || data.bucket;
            
            const descContainer = document.getElementById('modalDescriptionContainer');
            const descText = document.getElementById('modalDescription');
            if (data.descripcion && data.descripcion.trim() !== '') {
                descText.textContent = data.descripcion;
                descContainer.classList.remove('hidden');
            } else {
                descContainer.classList.add('hidden');
            }

            if (mCategory) {
                mCategory.className = `text-xs font-bold uppercase tracking-widest ${isTablero ? 'text-primary' : (isHerramienta ? 'text-red-500' : 'text-blue-400')}`;
            }

            if (mEstadoContainer) {
                mEstadoContainer.innerHTML = '';
                if (data.estado) {
                    const states = Array.isArray(data.estado) ? data.estado : [data.estado];
                    states.forEach(tag => {
                        const badge = document.createElement('span');
                        const colorClass = 
                            tag === 'Stock' ? 'bg-[#c0c0c0] text-black' :
                            tag === 'Sin Stock' ? 'bg-red-900/30 text-red-500 border border-red-500/20' :
                            tag === 'Outlet' ? 'bg-[#FFD60A] text-black' :
                            tag === 'Nuevo' ? 'bg-[#007AFF] text-white' :
                            tag === 'Descontinuado' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400';
                        badge.className = `text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter shadow-sm ${colorClass}`;
                        badge.textContent = tag;
                        mEstadoContainer.appendChild(badge);
                    });
                }
            }

            // Fill Specs & Interactive Selectors
            if (mSpecsContainer) {
                mSpecsContainer.innerHTML = '';
                
                if (isTablero && data.variants && data.variants.length > 0) {
                    const MASTER_SUPPORTS = ["MDF", "AGLO", "RH"];
                    const availableSupports = [...new Set(data.variants.map(v => v.soporte.toUpperCase()))];
                    let activeSupport = availableSupports.includes("MDF") ? "MDF" : (availableSupports.includes("AGLO") ? "AGLO" : availableSupports[0]);

                    const renderVariants = (support) => {
                        const existingGrid = mSpecsContainer.querySelector('.variants-grid-container');
                        if (existingGrid) existingGrid.remove();

                        const container = document.createElement('div');
                        container.className = 'variants-grid-container animate-fade-in';

                        const vTitle = document.createElement('span');
                        vTitle.className = 'text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 block';
                        vTitle.textContent = `Espesores Disponibles`;
                        container.appendChild(vTitle);

                        const vGrid = document.createElement('div');
                        vGrid.className = 'grid grid-cols-3 gap-2';

                        const variantsForSupport = data.variants.filter(v => v.soporte.toUpperCase() === support);
                        const uniqueThicknesses = [...new Set(variantsForSupport.map(v => v.espesor))].sort((a,b) => parseFloat(a) - parseFloat(b));

                        uniqueThicknesses.forEach(esp => {
                            const btn = document.createElement('button');
                            btn.className = 'variant-opt-btn bg-white/5 border border-white/10 p-3 rounded-xl text-center transition-all hover:bg-white/10 group/opt';
                            btn.innerHTML = `<span class="text-gray-400 text-xs font-bold block group-hover/opt:text-white transition-colors">${esp}</span>`;
                            btn.onclick = () => {
                                document.querySelectorAll('.variant-opt-btn').forEach(b => {
                                    b.classList.remove('bg-white/20', 'border-white/30');
                                    b.querySelector('span').classList.replace('text-white', 'text-gray-400');
                                });
                                btn.classList.add('bg-white/20', 'border-white/30');
                                btn.querySelector('span').classList.replace('text-gray-400', 'text-white');
                                updateWhatsApp(esp, support);
                                updatePrice(esp, support);
                            };
                            vGrid.appendChild(btn);
                        });

                        container.appendChild(vGrid);
                        mSpecsContainer.appendChild(container);
                        if (uniqueThicknesses.length > 0) {
                            updateWhatsApp(uniqueThicknesses[0], support);
                            updatePrice(uniqueThicknesses[0], support);
                        }
                    };

                    const sContainer = document.createElement('div');
                    sContainer.className = 'mb-8';
                    const sTitle = document.createElement('span');
                    sTitle.className = 'text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 block';
                    sTitle.textContent = 'Seleccionar Soporte';
                    sContainer.appendChild(sTitle);

                    const sGrid = document.createElement('div');
                    sGrid.className = 'flex gap-2';

                    MASTER_SUPPORTS.forEach(sup => {
                        const isAvailable = availableSupports.some(as => as.includes(sup) || sup.includes(as));
                        const sBtn = document.createElement('button');
                        const isActive = sup === activeSupport;

                        sBtn.className = `flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            isActive 
                            ? 'bg-white/20 text-white border-white/30 shadow-lg' 
                            : (isAvailable ? 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20' : 'bg-transparent text-gray-800 border-gray-900 cursor-not-allowed opacity-30')
                        }`;
                        
                        sBtn.textContent = sup === "RH" ? "RH (Antihumedad)" : sup;
                        
                        if (isAvailable) {
                            sBtn.onclick = () => {
                                sGrid.querySelectorAll('button').forEach(b => {
                                    if (!b.classList.contains('cursor-not-allowed')) {
                                        b.classList.remove('bg-white/20', 'text-white', 'border-white/30', 'shadow-lg');
                                        b.classList.add('bg-white/5', 'text-gray-500', 'border-white/10');
                                    }
                                });
                                sBtn.classList.remove('bg-white/5', 'text-gray-500', 'border-white/10');
                                sBtn.classList.add('bg-white/20', 'text-white', 'border-white/30', 'shadow-lg');
                                renderVariants(sup);
                            };
                        }
                        sGrid.appendChild(sBtn);
                    });
                    
                    sContainer.appendChild(sGrid);
                    mSpecsContainer.appendChild(sContainer);
                    renderVariants(activeSupport);
                }

                function updateWhatsApp(esp, sup) {
                    if (mWhatsAppBtn) {
                        const msg = `Hola Alvarez Placas, consulto disponibilidad de:\n*${data.name}*\nMarca: ${data.brand}\nSoporte: *${sup}*\nEspesor: *${esp}*`;
                        mWhatsAppBtn.href = `https://wa.me/5491161411842?text=${encodeURIComponent(msg)}`;
                    }
                }
            }

            function formatCurrency(value) {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
            }

            function updatePrice(esp, sup) {
                if (!mPriceDisplay) return;
                
                // Si showPrices es falso globalmente (opcional, pero asumimos true por requerimiento)
                mPriceDisplay.classList.remove('hidden');
                mPriceL1.classList.add('hidden');
                mPriceMain.textContent = "Consultar por whatsapp!";
                mPriceMain.classList.remove('text-primary');
                mPriceMain.classList.add('text-white');

                let targetVariant = null;
                if (isTablero && data.variants) {
                    const matchingVariants = data.variants.filter(v => v.espesor === esp && v.soporte.toUpperCase() === sup);
                    // Prioritize variants that have final price or cost configured
                    targetVariant = matchingVariants.find(v => 
                        (v.precio_efectivo && parseFloat(v.precio_efectivo) > 0) || 
                        (v.precio_L1 && parseFloat(v.precio_L1) > 0)
                    );
                    // Fallback to the first matching variant if none have prices
                    if (!targetVariant && matchingVariants.length > 0) {
                        targetVariant = matchingVariants[0];
                    }
                } else {
                    targetVariant = data;
                }

                if (targetVariant) {
                    let finalPrice = null;
                    let isEfectivo = false;

                    const pEfectivo = parseFloat(targetVariant.precio_efectivo);
                    const pL1 = parseFloat(targetVariant.precio_L1);

                    // Escenario 1: Viene pre-configurado desde el Excel (precio_efectivo)
                    if (pEfectivo && !isNaN(pEfectivo) && pEfectivo > 0) {
                        finalPrice = pEfectivo;
                        isEfectivo = true;
                    } 
                    // Escenario 2: Cálculo Dinámico a partir del Costo (L1)
                    else if (pL1 && !isNaN(pL1) && pL1 > 0) {
                        const iva = (parseFloat(targetVariant.iva_porcentaje) || 21) / 100;
                        const margenEfc = (parseFloat(targetVariant.margen_efectivo) || 30) / 100;
                        finalPrice = pL1 * (1 + iva) * (1 + margenEfc);
                        isEfectivo = true;
                    }

                    if (finalPrice !== null && finalPrice > 0) {
                        mPriceMain.textContent = formatCurrency(finalPrice);
                        mPriceMain.classList.add('text-primary');
                        mPriceMain.classList.remove('text-white');
                        
                        const labelSpan = mPriceDisplay.querySelector('span:first-child');
                        if (labelSpan) {
                            labelSpan.textContent = isEfectivo ? "Precio Efectivo" : "Precio Final";
                        }
                    }

                    // Stock display logic
                    if (mStockDisplay) {
                        if (targetVariant.stock_actual && parseFloat(targetVariant.stock_actual) > 0) {
                            const qty = parseFloat(targetVariant.stock_actual);
                            const qtyFormatted = Number.isInteger(qty) ? qty : qty.toFixed(1);
                            mStockDisplay.textContent = `Stock Disponible: ${qtyFormatted} ${qty === 1 ? 'unidad' : 'unidades'}`;
                            mStockDisplay.classList.remove('hidden');
                        } else {
                            mStockDisplay.classList.add('hidden');
                        }
                    }
                }
            }

            // Para productos sueltos (sin variantes), mostramos el precio directamente
            if (!isTablero || !data.variants || data.variants.length === 0) {
                updatePrice(null, null);
                if (mWhatsAppBtn) {
                    const msg = `Hola Alvarez Placas, consulto disponibilidad de:\n*${data.name}*\nMarca: ${data.brand}`;
                    mWhatsAppBtn.href = `https://wa.me/5491161411842?text=${encodeURIComponent(msg)}`;
                }
            }

            // WhatsApp Style Update
            if (mWhatsAppBtn) {
                mWhatsAppBtn.className = "w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-sm uppercase py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:border-primary/40";
            }

            // Smart Match Button (Solo para Tableros con IMAGEN)
            if (mSmartMatchBtn) {
                const LOGO_ID = "209a486b-8623-4c3e-8f8e-2a3288f1f0fd";
                const hasImage = data.imagen && !data.imagen.includes(LOGO_ID);
                
                if (isTablero && hasImage) {
                    mSmartMatchBtn.classList.remove('hidden');
                    mSmartMatchBtn.classList.add('flex');
                    mSmartMatchBtn.onclick = () => {
                        window.location.href = `/herramientas/smart-match?id=${data.id}`;
                    };
                } else {
                    mSmartMatchBtn.classList.add('hidden');
                    mSmartMatchBtn.classList.remove('flex');
                }
            }

            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    if (modalCard) {
                        modalCard.classList.remove('scale-95');
                        modalCard.classList.add('scale-100');
                    }
                }, 10);
                document.body.style.overflow = 'hidden';
            }
        }
    }

    const closeModalFunc = () => {
        if (modal) {
            modal.classList.add('opacity-0');
            if (modalCard) {
                modalCard.classList.remove('scale-100');
                modalCard.classList.add('scale-95');
            }

            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = '';
            }, 300);
        }
    };

    closeBtns.forEach(btn => btn.addEventListener('click', closeModalFunc));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModalFunc();
        }
    });

    filterCards(); // ACTIVAR PAGINACION AL INICIO

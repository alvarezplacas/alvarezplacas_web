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
    const mWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
    const mSmartMatchBtn = document.getElementById('modalSmartMatchBtn');

    if (!searchInput || !cards.length) return;

    let currentBrand = 'Todos';
    let currentBucket = 'Todo';
    let currentSearchTerm = '';

    function updateBrandButtons(bucket) {
        const validBrands = window.BRANDS_BY_BUCKET[bucket] || [];
        
        brandFilterBtns.forEach(btn => {
            const brandName = btn.dataset.filter;
            if (brandName === 'Todos') return;

            if (bucket === 'Todo' || validBrands.includes(brandName)) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        });

        if (currentBrand !== 'Todos') {
            const currentBtn = Array.from(brandFilterBtns).find(b => b.dataset.filter === currentBrand);
            if (currentBtn && currentBtn.classList.contains('hidden')) {
                resetBrandFilter();
            }
        }
    }

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
                b.classList.remove('bg-primary', 'text-black', 'border-primary', 'active');
                b.classList.add('bg-[#151515]', 'text-gray-400', 'border-gray-800');
            });

            const target = e.currentTarget;
            target.classList.remove('bg-[#151515]', 'text-gray-400', 'border-gray-800');
            target.classList.add('bg-primary', 'text-black', 'border-primary', 'active');

            currentBucket = target.dataset.bucket;
            updateBrandButtons(currentBucket);
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
            filterCards();
        });
    });

    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase().trim();
        filterCards();
    });

    function filterCards() {
        let visibleCount = 0;
        const searchTerms = currentSearchTerm.split(' ').filter(term => term.length > 0);

        cards.forEach(card => {
            const cardBucket = card.dataset.bucket;
            const cardBrand = card.dataset.brand;

            // 1. Filtrado por Grandes Grupos (Buckets)
            const matchesBucket = currentBucket === 'Todo' || cardBucket === currentBucket;
            
            // 2. Filtrado por Marca (Case-Insensitive)
            const matchesBrand = currentBrand === 'Todos' || 
                               cardBrand.toUpperCase().trim() === currentBrand.toUpperCase().trim();
            
            // 3. Búsqueda SEGMENTADA (solo busca dentro del bucket activo)
            let matchesSearch = true;
            if (searchTerms.length > 0) {
                const cardDataString = card.dataset.search || "";
                matchesSearch = searchTerms.every(term => cardDataString.includes(term));
            }

            if (matchesBucket && matchesBrand && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noResults) {
            if (visibleCount === 0) noResults.classList.remove('hidden');
            else noResults.classList.add('hidden');
        }
    }

    // Modal Handling
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) return;

            const dataStr = card.dataset.full;
            if (!dataStr) return;

            const data = JSON.parse(dataStr);
            const isTablero = data.bucket === "Tableros";
            const isHerramienta = data.bucket === "Herramientas";

            if (mImage) {
                const LOGO_FALLBACK = "https://admin.alvarezplacas.com.ar/assets/76aefcd2-775b-48c7-a64c-4ebd5627557c";
                mImage.src = data.imagen || LOGO_FALLBACK;
                mImage.style.display = 'block';
                mImage.onerror = () => { mImage.src = LOGO_FALLBACK; };
            }

            if (mMarcaBadge) mMarcaBadge.textContent = data.brand;
            if (mNombre) mNombre.textContent = data.name;
            if (mCategory) {
                mCategory.textContent = data.category;
                mCategory.className = `text-xs font-bold uppercase tracking-widest ${isTablero ? 'text-primary' : (isHerramienta ? 'text-red-500' : 'text-blue-400')}`;
            }
            // Fill Specs & Interactive Selectors
            if (mSpecsContainer) {
                mSpecsContainer.innerHTML = '';
                
                if (isTablero && data.variants && data.variants.length > 0) {
                    // 1. Definir Soportes Maestros
                    const MASTER_SUPPORTS = ["MDF", "AGLOMERADO", "RH"];
                    const availableSupports = [...new Set(data.variants.map(v => v.soporte.toUpperCase()))];
                    
                    // Elegir el primero disponible como activo
                    let activeSupport = availableSupports.includes("MDF") ? "MDF" : (availableSupports.includes("AGLOMERADO") ? "AGLOMERADO" : availableSupports[0]);

                    // 2. Función de Renderizado de Variantes
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

                        // Filtrado y DEDUPLICACIÓN de espesores
                        const variantsForSupport = data.variants.filter(v => v.soporte.toUpperCase() === support);
                        const uniqueThicknesses = [...new Set(variantsForSupport.map(v => v.espesor))].sort((a,b) => parseFloat(a) - parseFloat(b));

                        const finalThicknesses = uniqueThicknesses.filter(esp => {
                            if (support.includes('AGLO') || support.includes('AGLOMERADO')) {
                                const val = parseFloat(esp);
                                if (val === 3 || val === 5.5) return false;
                            }
                            return true;
                        });

                        if (finalThicknesses.length === 0) {
                            const empty = document.createElement('p');
                            empty.className = 'text-gray-600 text-xs italic col-span-3 py-4';
                            empty.textContent = 'No hay espesores disponibles para este soporte.';
                            vGrid.appendChild(empty);
                        }

                        finalThicknesses.forEach(esp => {
                            const btn = document.createElement('button');
                            btn.className = 'variant-opt-btn bg-white/5 border border-white/10 p-3 rounded-xl text-center transition-all hover:border-primary/50 group/opt';
                            btn.innerHTML = `<span class="text-white text-xs font-bold block group-hover/opt:text-primary transition-colors">${esp}</span>`;
                            btn.onclick = () => {
                                document.querySelectorAll('.variant-opt-btn').forEach(b => b.classList.remove('border-primary', 'bg-primary/10'));
                                btn.classList.add('border-primary', 'bg-primary/10');
                                updateWhatsApp(esp, support);
                            };
                            vGrid.appendChild(btn);
                        });

                        container.appendChild(vGrid);
                        mSpecsContainer.appendChild(container);
                        
                        // Default WhatsApp update with first thickness
                        if (finalThicknesses.length > 0) updateWhatsApp(finalThicknesses[0], support);
                    };

                    // 3. Renderizar Selector de Soporte Maestro
                    const sContainer = document.createElement('div');
                    sContainer.className = 'mb-6';
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

                        sBtn.className = `flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                            isActive 
                            ? 'bg-primary text-black border-primary shadow-[0_5px_15px_rgba(255,77,0,0.3)]' 
                            : (isAvailable ? 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30' : 'bg-transparent text-gray-800 border-gray-900 cursor-not-allowed opacity-50')
                        }`;
                        
                        sBtn.textContent = sup === "RH" ? "RH (Antihumedad)" : sup;
                        
                        if (isAvailable) {
                            sBtn.onclick = () => {
                                activeSupport = sup;
                                sGrid.querySelectorAll('button').forEach(b => {
                                    if (!b.classList.contains('cursor-not-allowed')) {
                                        b.classList.remove('bg-primary', 'text-black', 'border-primary', 'shadow-[0_5px_15px_rgba(255,77,0,0.3)]');
                                        b.classList.add('bg-white/5', 'text-gray-400', 'border-white/10');
                                    }
                                });
                                sBtn.classList.remove('bg-white/5', 'text-gray-400', 'border-white/10');
                                sBtn.classList.add('bg-primary', 'text-black', 'border-primary', 'shadow-[0_5px_15px_rgba(255,77,0,0.3)]');
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
                        const priceText = data.price || "Consultar";
                        const msg = `Hola Alvarez Placas, consulto disponibilidad de:\n*${data.name}*\nMarca: ${data.brand}\nSoporte: *${sup}*\nEspesor: *${esp}*\nPrecio: ${priceText}`;
                        mWhatsAppBtn.href = `https://wa.me/5491100000000?text=${encodeURIComponent(msg)}`;
                    }
                }
            }

            // Smart Match Button (Solo para Tableros)
            if (mSmartMatchBtn) {
                if (isTablero) {
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
        });
    });

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

    updateBrandButtons(currentBucket);
}

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
        brandFilterBtns.forEach(btn => {
            const brandName = btn.dataset.filter;
            if (brandName === 'Todos') return;

            const parentBucket = btn.dataset.parentBucket;
            if (bucket === 'Todo' || parentBucket === bucket) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        });

        // Reset brand filter if current brand is not visible in new bucket
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
            b.classList.remove('bg-gray-800', 'text-white', 'border-gray-600', 'active');
            b.classList.add('bg-transparent', 'text-gray-500', 'border-gray-800');
            if (b.dataset.filter === 'Todos') {
                b.classList.remove('bg-transparent', 'text-gray-500', 'border-gray-800');
                b.classList.add('bg-gray-800', 'text-white', 'border-gray-600', 'active');
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
                b.classList.remove('bg-gray-800', 'text-white', 'border-gray-600', 'active');
                b.classList.add('bg-transparent', 'text-gray-500', 'border-gray-800');
            });

            const target = e.currentTarget;
            target.classList.remove('bg-transparent', 'text-gray-500', 'border-gray-800');
            target.classList.add('bg-gray-800', 'text-white', 'border-gray-600', 'active');

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
            
            // 2. Filtrado por Marca
            const matchesBrand = currentBrand === 'Todos' || cardBrand === currentBrand;
            
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
                mImage.src = data.image || '';
                mImage.style.display = data.image ? 'block' : 'none';
            }

            if (mMarcaBadge) mMarcaBadge.textContent = data.brand;
            if (mNombre) mNombre.textContent = data.name;
            if (mCategory) {
                mCategory.textContent = data.category;
                mCategory.className = `text-xs font-bold uppercase tracking-widest ${isTablero ? 'text-primary' : (isHerramienta ? 'text-red-500' : 'text-blue-400')}`;
            }

            // Fill Specs
            if (mSpecsContainer) {
                mSpecsContainer.innerHTML = '';
                
                // Mostrar info contextual según tipo
                if (isTablero) {
                    const infoPill = document.createElement('div');
                    infoPill.className = 'bg-primary/10 border border-primary/20 p-4 rounded-xl mb-4';
                    infoPill.innerHTML = '<span class="text-primary text-xs font-bold">PROPIEDADES DE PLACA</span><p class="text-gray-400 text-xs mt-1">Ideal para mobiliario y revestimientos de alta calidad.</p>';
                    mSpecsContainer.appendChild(infoPill);
                }

                if (data.specs && data.specs.length > 0) {
                    data.specs.forEach(spec => {
                        const div = document.createElement('div');
                        div.className = 'flex flex-col border-b border-gray-800 pb-3 last:border-0';
                        const parts = spec.split(':');
                        const label = parts.length > 1 ? parts[0] : (spec.includes('mm') ? 'Espesor' : 'Info');
                        const value = parts.length > 1 ? parts[1].trim() : spec;
                        
                        div.innerHTML = `
                            <span class="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">${label}</span>
                            <span class="text-white font-medium text-base">${value}</span>
                        `;
                        mSpecsContainer.appendChild(div);
                    });
                }
            }

            if (mWhatsAppBtn) {
                const priceText = data.price || "Consultar";
                const msg = `Hola Alvarez Placas, consulto disponibilidad de:\n*${data.name}*\nMarca: ${data.brand}\nPrecio: ${priceText}`;
                mWhatsAppBtn.href = `https://wa.me/5491100000000?text=${encodeURIComponent(msg)}`;
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

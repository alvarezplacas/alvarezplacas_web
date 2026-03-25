/**
 * catalog-logic.js - Lógica de filtrado y modal del catálogo.
 * Propiedad del Agente 4 (Frontend/Catalogo).
 */
export function initCatalog() {
    const searchInput = document.getElementById('catalogSearch');
    const brandFilterBtns = document.querySelectorAll('.brand-btn');
    const categoryFilterBtns = document.querySelectorAll('.category-btn');
    const cards = document.querySelectorAll('.catalog-item');
    const noResults = document.getElementById('noResults');

    const modal = document.getElementById('productModal');
    const modalCard = document.getElementById('modalCard');
    const closeBtns = document.querySelectorAll('.close-modal, .modal-backdrop');

    const mImage = document.getElementById('modalImage');
    const mMarcaBadge = document.getElementById('modalMarcaBadge');
    const mNombre = document.getElementById('modalNombre');
    const mCategory = document.getElementById('modalCategory');
    const mCodigo = document.getElementById('modalCodigo');
    const mSpecsContainer = document.getElementById('modalSpecsContainer');
    const mWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
    const mSmartMatchBtn = document.getElementById('modalSmartMatchBtn');

    if (!searchInput || !cards.length) {
        return;
    }

    let currentBrand = 'Todos';
    let currentCategory = 'Todas';
    let currentSearchTerm = '';

    function updateBrandButtons(category) {
        brandFilterBtns.forEach(btn => {
            const filter = btn.dataset.filter;
            if (filter === 'Todos') {
                btn.style.display = 'block';
                return;
            }

            const categories = btn.dataset.brandCategories ? btn.dataset.brandCategories.split(',') : [];
            if (category === 'Todas' || categories.includes(category)) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });

        if (currentBrand !== 'Todos') {
            const currentBtn = Array.from(brandFilterBtns).find(b => b.dataset.filter === currentBrand);
            if (currentBtn && currentBtn.style.display === 'none') {
                resetBrandFilter();
            }
        }
    }

    function resetBrandFilter() {
        currentBrand = 'Todos';
        brandFilterBtns.forEach(b => {
            b.classList.remove('bg-gray-800', 'text-white', 'border-gray-600', 'active');
            b.classList.add('bg-transparent', 'text-gray-400', 'border-gray-800');
            if (b.dataset.filter === 'Todos') {
                b.classList.remove('bg-transparent', 'text-gray-400', 'border-gray-800');
                b.classList.add('bg-gray-800', 'text-white', 'border-gray-600', 'active');
            }
        });
    }

    categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryFilterBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-black', 'border-primary', 'active');
                b.classList.add('bg-transparent', 'text-gray-400', 'border-gray-800');
            });

            const target = e.currentTarget;
            target.classList.remove('bg-transparent', 'text-gray-400', 'border-gray-800');
            target.classList.add('bg-primary', 'text-black', 'border-primary', 'active');

            currentCategory = target.dataset.category;
            updateBrandButtons(currentCategory);
            filterCards();
        });
    });

    brandFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            brandFilterBtns.forEach(b => {
                b.classList.remove('bg-gray-800', 'text-white', 'border-gray-600', 'active');
                b.classList.add('bg-transparent', 'text-gray-400', 'border-gray-800');
            });

            const target = e.currentTarget;
            target.classList.remove('bg-transparent', 'text-gray-400', 'border-gray-800');
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
            const cardCategory = card.dataset.category;
            const cardBrand = card.dataset.brand;

            const matchesCategory = currentCategory === 'Todas' || cardCategory === currentCategory;
            const matchesBrand = currentBrand === 'Todos' || cardBrand === currentBrand;
            let matchesSearch = true;

            if (searchTerms.length > 0) {
                const cardDataString = card.dataset.search || "";
                matchesSearch = searchTerms.every(term => cardDataString.includes(term));
            }

            if (matchesCategory && matchesBrand && matchesSearch) {
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

            if (mImage) {
                mImage.src = data.imagen || '';
                mImage.style.display = data.imagen ? 'block' : 'none';
            }

            if (mMarcaBadge) mMarcaBadge.textContent = data.brand;
            if (mNombre) mNombre.textContent = data.name;
            if (mCategory) mCategory.textContent = data.category;
            if (mCodigo) mCodigo.textContent = data.code || "-";

            // Fill Specs
            if (mSpecsContainer) {
                mSpecsContainer.innerHTML = '';
                if (data.specs && data.specs.length > 0) {
                    data.specs.forEach(spec => {
                        const div = document.createElement('div');
                        div.className = 'flex flex-col border-b border-gray-800 pb-3 last:border-0';
                        const [label, ...valParts] = spec.split(':');
                        const value = valParts.join(':').trim();
                        
                        div.innerHTML = `
                            <span class="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">${label}</span>
                            <span class="text-white font-medium text-base">${value || spec}</span>
                        `;
                        mSpecsContainer.appendChild(div);
                    });
                }
            }

            if (mWhatsAppBtn) {
                const showPrices = localStorage.getItem('admin_show_prices') !== 'false';
                const priceText = showPrices ? data.price : "Consultar";
                const msg = `Hola, quiero pedir presupuesto por el producto:\n*${data.name}*\nCódigo: ${data.code}\nPrecio: ${priceText}`;
                mWhatsAppBtn.href = `https://wa.me/5491100000000?text=${encodeURIComponent(msg)}`;
            }

            // Smart Match Button
            if (mSmartMatchBtn) {
                const cat = (data.category || "").toUpperCase();
                const isPlaca = data.isPlaca || cat.includes('PLACA') || cat.includes('TABLERO') || cat.includes('MADERA');
                
                if (isPlaca) {
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

    updateBrandButtons(currentCategory);
}

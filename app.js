/**
 * ============================================================
 *  RB STORE — MASTER AUTHORIZED DISTRIBUTOR PORTAL
 *  APP LOGIC: app.js
 *  Handles rendering, sidebar filters, and shopping cart.
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const { BRANDS, PRODUCTS, NAV_CATEGORIES, NAV_FILTER_MAP, FOOTER_POLICIES, CONTACT_INFO, SOCIAL_LINKS } = window.RBStoreData;

    // ── DOM Refs ──────────────────────────────────────────────────
    const navEl            = document.getElementById('main-nav');
    const sidebarCatEl     = document.getElementById('sidebar-categories');
    const sidebarBrandEl   = document.getElementById('sidebar-brands');
    const productGridEl    = document.getElementById('product-grid');
    const productCountEl   = document.getElementById('product-count');
    const pageTitleEl      = document.getElementById('page-title');
    const socialLinksEl    = document.getElementById('social-links');
    const contactInfoEl    = document.getElementById('contact-info');
    const footerPoliciesEl = document.getElementById('footer-policies');
    const loadMoreWrap     = document.getElementById('load-more-wrap');
    const loadMoreBtn      = document.getElementById('load-more-btn');
    const loadMoreProgress = document.getElementById('load-more-progress');
    const loadMoreDone     = document.getElementById('load-more-done');
    const recSection       = document.getElementById('recommendations-section');
    const recTrack         = document.getElementById('recommendations-track');
    const recSubtitle      = document.getElementById('recommendations-subtitle');
    const recentSection    = document.getElementById('recently-viewed-section');
    const recentTrack      = document.getElementById('recently-viewed-track');
    const navBarEl         = document.querySelector('.nav-bar');

    // Cart DOM refs
    const cartDrawerEl    = document.getElementById('cart-drawer');
    const cartOverlayEl   = document.getElementById('cart-overlay');
    const cartItemsListEl = document.getElementById('cart-items-list');
    const cartFooterEl    = document.getElementById('cart-footer');
    const cartSubtotalEl  = document.getElementById('cart-subtotal');
    const cartDrawerCount = document.getElementById('cart-drawer-count');
    const headerBadge     = document.getElementById('header-cart-badge');
    const toastContainer  = document.getElementById('toast-container');

    // ── Filter State ──────────────────────────────────────────────
    let activeCategory = 'All';
    let activeNavId    = 'all';
    let activeBrands   = new Set();
    let filteredCache  = [];
    let visibleCount   = 6;
    const PAGE_SIZE    = 6;
    let prevCartQty    = 0;
    const RECENT_KEY   = 'rb_recently_viewed';
    const PRICE_TOTAL_MIN = 0;
    const PRICE_TOTAL_MAX = 200000;
    let priceMin = PRICE_TOTAL_MIN;
    let priceMax = PRICE_TOTAL_MAX;
    let activeSort = 'best-selling'; // 'best-selling' | 'price-asc' | 'price-desc' | 'newest'
    let currentLayout = localStorage.getItem('rb_layout') || 'grid';

    // ── Cart State ────────────────────────────────────────────────
    let cart = []; // [{ productId: string, qty: number }]

    // ── Wishlist State ────────────────────────────────────────────
    let wishlist = JSON.parse(localStorage.getItem('rb_wishlist')) || [];

    // ── Compare State ─────────────────────────────────────────────
    let compareList = [];

    // ── Quote State ─────────────────────────────────────────────
    let quotes = JSON.parse(localStorage.getItem('rb_quotes')) || [];

    // ════════════════════════════════════════════════════════════
    //  TOAST NOTIFICATION SYSTEM
    // ════════════════════════════════════════════════════════════

    function getToastConfig() {
        const theme = document.documentElement.getAttribute('data-theme') || 'white-black';
        const dark = theme === 'black-white' || theme === 'gray-white';
        return {
            success: {
                icon: 'fa-check-circle',
                bg: dark ? '#14532d' : '#f0fdf4',
                border: dark ? '#22c55e' : '#86efac',
                iconColor: '#4ade80',
                textColor: dark ? '#dcfce7' : '#15803d',
                progressColor: '#22c55e'
            },
            error: {
                icon: 'fa-times-circle',
                bg: dark ? '#450a0a' : '#fef2f2',
                border: dark ? '#ef4444' : '#fca5a5',
                iconColor: '#f87171',
                textColor: dark ? '#fecaca' : '#b91c1c',
                progressColor: '#ef4444'
            },
            info: {
                icon: 'fa-info-circle',
                bg: dark ? '#1f1f1f' : '#1a1a1a',
                border: dark ? '#404040' : '#2d2d2d',
                iconColor: '#ffffff',
                textColor: '#f0f0f0',
                progressColor: '#E30613'
            }
        };
    }

    function dismissToast(el) {
        if (el._dismissing) return;
        el._dismissing = true;
        clearTimeout(el._timer);
        el.classList.add('rb-toast-out');
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }

    function showToast(message, type = 'info') {
        const TOAST_CONFIG = getToastConfig();
        const cfg  = TOAST_CONFIG[type] || TOAST_CONFIG.info;
        const wrap = document.createElement('div');
        wrap.className = 'rb-toast';
        wrap.setAttribute('role', 'alert');

        wrap.innerHTML = `
        <div style="
            display:flex; align-items:flex-start; gap:12px;
            padding:14px 16px 17px;
            background:${cfg.bg};
            border:1px solid ${cfg.border};
            border-radius:12px;
            box-shadow:0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
            min-width:272px; max-width:340px;
            position:relative; overflow:hidden;
            font-family:'Inter',sans-serif;">
            <i class="fas ${cfg.icon}"
               style="color:${cfg.iconColor}; font-size:16px; margin-top:1px; flex-shrink:0;"></i>
            <span style="font-size:0.875rem; font-weight:500; color:${cfg.textColor};
                         flex-grow:1; line-height:1.45;">${message}</span>
            <button class="toast-close-btn"
                    style="background:none; border:none; cursor:pointer; padding:2px 0 0 4px;
                           color:${cfg.iconColor}; opacity:0.55; flex-shrink:0; line-height:1;"
                    aria-label="Dismiss notification">
                <i class="fas fa-times" style="font-size:11px; pointer-events:none;"></i>
            </button>
            <div class="toast-progress" style="background:${cfg.progressColor};"></div>
        </div>`;

        // Close on button click
        wrap.querySelector('.toast-close-btn').addEventListener('click', () => dismissToast(wrap));

        toastContainer.appendChild(wrap);
        wrap._timer = setTimeout(() => dismissToast(wrap), 3500);

        // Pause auto-dismiss on hover
        wrap.addEventListener('mouseenter', () => {
            clearTimeout(wrap._timer);
            const prog = wrap.querySelector('.toast-progress');
            if (prog) prog.style.animationPlayState = 'paused';
        });
        wrap.addEventListener('mouseleave', () => {
            const prog = wrap.querySelector('.toast-progress');
            if (prog) prog.style.animationPlayState = 'running';
            wrap._timer = setTimeout(() => dismissToast(wrap), 1800);
        });
    }

    // Expose globally for inline HTML buttons (wishlist, comparison, etc.)
    window.showToast = showToast;


    // ════════════════════════════════════════════════════════════
    //  CART LOGIC
    // ════════════════════════════════════════════════════════════

    function cartItem(productId) {
        return cart.find(i => i.productId === productId);
    }

    function addToCart(productId) {
        const existing = cartItem(productId);
        if (existing) {
            existing.qty += 1;
            showToast('Quantity updated in cart ✓', 'success');
        } else {
            cart.push({ productId, qty: 1 });
            const p = PRODUCTS.find(p => p.id === productId);
            showToast(`Added to cart ✓ — ${p ? p.name.split(' ').slice(0,3).join(' ') : ''}`, 'success');
        }
        syncCartBadge();
        renderCartDrawer();
        openCartDrawer();
    }

    function removeFromCart(productId) {
        cart = cart.filter(i => i.productId !== productId);
        syncCartBadge();
        renderCartDrawer();
        showToast('Item removed from cart', 'info');
    }

    function updateQty(productId, delta) {
        const item = cartItem(productId);
        if (!item) return;
        item.qty = Math.max(0, item.qty + delta);
        if (item.qty === 0) {
            removeFromCart(productId);
            return;
        }
        syncCartBadge();
        renderCartDrawer();
    }

    function clearCart() {
        cart = [];
        syncCartBadge();
        renderCartDrawer();
        showToast('Cart cleared', 'info');
    }

    function cartTotal() {
        return cart.reduce((sum, item) => {
            const p = PRODUCTS.find(p => p.id === item.productId);
            return sum + (p ? p.price * item.qty : 0);
        }, 0);
    }

    function cartTotalQty() {
        return cart.reduce((s, i) => s + i.qty, 0);
    }

    function fmtPKR(n) {
        return 'PKR ' + n.toLocaleString('en-PK');
    }

    function syncCartBadge() {
        const qty = cartTotalQty();
        if (headerBadge) {
            headerBadge.textContent = qty;
            if (qty > prevCartQty) {
                headerBadge.classList.remove('cart-badge-bounce');
                void headerBadge.offsetWidth;
                headerBadge.classList.add('cart-badge-bounce');
            }
        }
        if (cartDrawerCount) cartDrawerCount.textContent = qty;
        prevCartQty = qty;
        updateMobileStickyCount();
    }

    function updateMobileStickyCount() {
        const countEl = document.getElementById('mobile-sticky-count');
        const cartBtn = document.getElementById('mobile-view-cart-btn');
        const n = filteredCache.length;
        const cartN = cartTotalQty();
        if (countEl) countEl.textContent = n === 1 ? '1 product' : `${n} products`;
        if (cartBtn) cartBtn.querySelector('span').textContent = `View Cart (${cartN})`;
    }

    // ── Cart Drawer Open / Close ──────────────────────────────────
    function openCartDrawer() {
        renderCartDrawer();
        cartDrawerEl.style.transform  = 'translateX(0)';
        cartOverlayEl.style.opacity   = '1';
        cartOverlayEl.style.pointerEvents = 'auto';
        document.body.style.overflow  = 'hidden';
        trapFocus(cartDrawerEl);
    }

    function closeCartDrawer() {
        cartDrawerEl.style.transform  = 'translateX(100%)';
        cartOverlayEl.style.opacity   = '0';
        cartOverlayEl.style.pointerEvents = 'none';
        document.body.style.overflow  = '';
        if (focusTrapEl === cartDrawerEl) releaseFocusTrap();
    }

    // ── Cart Drawer Render ────────────────────────────────────────
    function renderCartDrawer() {
        if (cart.length === 0) {
            cartItemsListEl.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center py-16">
                <div class="w-20 h-20 rounded-full flex items-center justify-center mb-5 border-2 border-dashed"
                     style="background:var(--light-gray); border-color:var(--border-gray);">
                    <i class="fas fa-shopping-cart text-3xl" style="color:var(--text-light); opacity:0.5;"></i>
                </div>
                <h3 class="font-bold text-lg mb-1" style="color:var(--text-dark);">Your cart is empty</h3>
                <p class="text-sm" style="color:var(--text-light);">Add products to get started.</p>
            </div>`;
            cartFooterEl.classList.add('hidden');
            return;
        }

        cartFooterEl.classList.remove('hidden');
        cartSubtotalEl.textContent = fmtPKR(cartTotal());

        cartItemsListEl.innerHTML = cart.map(item => {
            const product = PRODUCTS.find(p => p.id === item.productId);
            const brand   = BRANDS.find(b => b.id === product.brandId);
            const line    = product.price * item.qty;

            return `
            <div class="flex gap-3 bg-white border border-border-gray rounded-xl p-3 relative group cart-item-row"
                 data-product-id="${product.id}">

                <!-- Thumbnail -->
                <div class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                     style="background:var(--light-gray);">
                    <img src="${product.imagePath}"
                         alt="${product.name}"
                         class="object-contain w-full h-full p-2"
                         onload="this.classList.add('loaded')"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="img-fallback w-full h-full hidden" style="--fallback-bg:${product.fallbackBg};">
                        <span class="text-[9px] font-bold text-white tracking-widest">${product.fallbackInitials}</span>
                    </div>
                </div>

                <!-- Details -->
                <div class="flex-grow min-w-0">
                    <span class="text-[10px] font-bold uppercase tracking-wider"
                          style="color:${brand.logoColor};">${brand.name}</span>
                    <p class="text-xs font-semibold leading-snug mt-0.5 line-clamp-2"
                       style="color:var(--text-dark);">${product.name}</p>

                    <!-- Qty Controls -->
                    <div class="flex items-center gap-2 mt-2">
                        <button class="cart-qty-btn w-6 h-6 rounded border flex items-center justify-center text-xs transition-colors hover:border-primary hover:text-primary"
                                style="border-color:var(--border-gray); color:var(--text-dark);"
                                data-action="decrement" data-pid="${product.id}" aria-label="Decrease quantity">
                            <i class="fas fa-minus pointer-events-none"></i>
                        </button>
                        <span class="text-sm font-bold w-6 text-center cart-qty-label">${item.qty}</span>
                        <button class="cart-qty-btn w-6 h-6 rounded border flex items-center justify-center text-xs transition-colors hover:border-primary hover:text-primary"
                                style="border-color:var(--border-gray); color:var(--text-dark);"
                                data-action="increment" data-pid="${product.id}" aria-label="Increase quantity">
                            <i class="fas fa-plus pointer-events-none"></i>
                        </button>
                    </div>

                    <div class="font-bold text-sm mt-1.5" style="color:var(--primary);">${fmtPKR(line)}</div>
                </div>

                <!-- Remove -->
                <button class="cart-remove-btn absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                               opacity-0 group-hover:opacity-100"
                        style="background:#fee2e2; color:#f87171;"
                        data-pid="${product.id}" aria-label="Remove item">
                    <i class="fas fa-times pointer-events-none"></i>
                </button>
            </div>`;
        }).join('');
    }

    // ── Cart Drawer Event Wiring ──────────────────────────────────
    function initCartDrawer() {
        // Open from header
        document.getElementById('header-cart-btn').addEventListener('click', e => {
            e.preventDefault();
            openCartDrawer();
        });

        // Close buttons
        document.getElementById('cart-close-btn').addEventListener('click', closeCartDrawer);
        cartOverlayEl.addEventListener('click', closeCartDrawer);

        // Qty & Remove — delegation inside items list
        cartItemsListEl.addEventListener('click', e => {
            const qtyBtn    = e.target.closest('.cart-qty-btn');
            const removeBtn = e.target.closest('.cart-remove-btn');

            if (qtyBtn) {
                const pid   = qtyBtn.dataset.pid;
                const delta = qtyBtn.dataset.action === 'increment' ? 1 : -1;
                updateQty(pid, delta);
            }
            if (removeBtn) {
                removeFromCart(removeBtn.dataset.pid);
            }
        });

        // Clear cart
        document.getElementById('cart-clear-btn').addEventListener('click', clearCart);

        // Quote button
        document.getElementById('cart-quote-btn').addEventListener('click', () => {
            closeCartDrawer();
            showToast('Bulk Quote Request submitted! We\'ll contact you in 24h.', 'success');
        });

    }

    // ── Add to Cart from Product Grid — delegation ────────────────
    function initGridCartButtons() {
        productGridEl.addEventListener('click', e => {
            const btn = e.target.closest('.atc-btn');
            if (!btn) return;
            const productId = btn.dataset.productId;
            if (productId) addToCart(productId);
        });
    }

    // ════════════════════════════════════════════════════════════
    //  HELPERS — ratings, nav, recommendations, pagination
    // ════════════════════════════════════════════════════════════

    const CATEGORY_TO_NAV = {
        'All': 'all',
        'Refrigerators': 'refrigerators',
        'Air Conditioners': 'air-conditioners',
        'Washing Machines': 'appliances',
        'LED TVs': 'appliances',
        'Kitchen Appliances': 'appliances',
        'Microwaves': 'appliances',
        'Deep Freezers': 'appliances',
        'Nails & Fasteners': 'hardware',
        'Pipes & Plumbing': 'pipes-plumbing',
        'Hand Tools': 'tools',
        'Power Tools': 'tools',
        'Tools & Hardware': 'tools',
        'Builders Hardware': 'hardware',
        'Paints & Coatings': 'paints',
        'Electrical Supplies': 'electrical',
        'Furniture & Seating': 'furniture',
        'Safety & PPE': 'hardware',
        'Cleaning & Janitorial': 'hardware',
        'Adhesives & Sealants': 'hardware',
        'Ladders & Access': 'tools',
        'Garden & Outdoor': 'hardware',
        'Sanitary Ware': 'pipes-plumbing',
        'Steel & Pipes': 'pipes-plumbing',
    };

    function getReviewCount(product) {
        const raw = (product.rating || 0) * 23 + product.id.length * 7;
        return Math.round(raw / 10) * 10;
    }

    function starSvg(type) {
        const paths = {
            full: '<path fill="#C9A84C" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
            half: '<path fill="#C9A84C" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"/><path fill="#E5E7EB" d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 0l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 6.82 20.02 7 14.14 2 9.27l6.91-1.01L12 2z" opacity=".35"/>',
            empty: '<path fill="#E5E7EB" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type]}</svg>`;
    }

    function renderStarRatingHTML(rating, reviewCount) {
        const r = rating || 0;
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (r >= i) stars += starSvg('full');
            else if (r >= i - 0.5) stars += starSvg('half');
            else stars += starSvg('empty');
        }
        return `
        <div class="star-rating flex items-center gap-1.5 mt-1 mb-2" aria-label="Rating ${r} out of 5, ${reviewCount} reviews">
            <span class="flex gap-0.5">${stars}</span>
            <span class="text-[11px] font-semibold text-text-dark">${r.toFixed(1)}</span>
            <span class="text-[10px] text-text-light">(${reviewCount})</span>
        </div>`;
    }

    function isPriceFiltered() {
        return priceMin > PRICE_TOTAL_MIN || priceMax < PRICE_TOTAL_MAX;
    }

    function getActiveFilterCount() {
        let n = 0;
        if (activeCategory !== 'All') n++;
        n += activeBrands.size;
        if (isPriceFiltered()) n++;
        return n;
    }

    function updateFilterBadge() {
        const badge = document.getElementById('filter-active-badge');
        if (!badge) return;
        const n = getActiveFilterCount();
        if (n > 0) {
            badge.textContent = n;
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        } else {
            badge.classList.add('hidden');
            badge.classList.remove('flex');
        }
    }

    function matchesNavFilter(product, navId) {
        const cfg = NAV_FILTER_MAP[navId] || NAV_FILTER_MAP.all;
        switch (cfg.type) {
            case 'all':
                return true;
            case 'category':
                return product.category === cfg.value;
            case 'categories':
                return cfg.values.includes(product.category);
            case 'best-sellers':
                return (product.rating || 0) >= 4.7 || product.badge === 'Best Seller';
            case 'services':
                return false;
            default:
                return true;
        }
    }

    function getFilteredProducts() {
        return PRODUCTS.filter(product => {
            let catMatch;
            if (activeCategory !== 'All') {
                catMatch = product.category === activeCategory;
            } else if (activeNavId !== 'all') {
                catMatch = matchesNavFilter(product, activeNavId);
            } else {
                catMatch = true;
            }
            const brandMatch = activeBrands.size === 0 || activeBrands.has(product.brandId);
            const priceMatch = product.price >= priceMin && product.price <= priceMax;
            return catMatch && brandMatch && priceMatch;
        });
    }

    function updatePageTitle() {
        if (!pageTitleEl) return;
        if (activeNavId === 'services') {
            pageTitleEl.textContent = 'Services';
            return;
        }
        const cfg = NAV_FILTER_MAP[activeNavId];
        if (cfg && activeNavId !== 'all' && activeNavId !== 'home' && activeCategory === 'All') {
            pageTitleEl.textContent = cfg.label;
        } else if (activeCategory === 'All') {
            pageTitleEl.textContent = 'All Products';
        } else {
            pageTitleEl.textContent = activeCategory;
        }
    }

    function syncNavHighlight(navId) {
        activeNavId = navId || 'all';
        navEl.querySelectorAll('[data-nav-id]').forEach(el => {
            const on = el.dataset.navId === activeNavId;
            el.classList.toggle('nav-item-active', on);
            el.classList.toggle('text-gray-300', !on);
            el.classList.toggle('font-bold', on);
        });
    }

    function syncNavFromCategory(cat) {
        const navId = CATEGORY_TO_NAV[cat] || (cat === 'All' ? 'all' : null);
        if (navId) syncNavHighlight(navId);
        else if (cat !== 'All') syncNavHighlight('all');
    }

    function scrollToProductGrid() {
        document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getRecentlyViewed() {
        try {
            return JSON.parse(sessionStorage.getItem(RECENT_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveRecentlyViewed(ids) {
        sessionStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 6)));
    }

    function trackProductView(productId) {
        let ids = getRecentlyViewed().filter(id => id !== productId);
        ids.unshift(productId);
        saveRecentlyViewed(ids);
        renderRecentlyViewed();
    }

    function hasOnlyDefaultFilters() {
        return activeCategory === 'All' &&
            activeNavId === 'all' &&
            activeBrands.size === 0 &&
            !isPriceFiltered();
    }

    function getRecommendations(filtered, visibleIds) {
        const visibleSet = new Set(visibleIds);
        const pool = PRODUCTS.filter(p => !visibleSet.has(p.id));

        if (hasOnlyDefaultFilters()) {
            const featured = PRODUCTS.filter(p => p.featured).slice(0, 4);
            return { items: featured.length ? featured : pool.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4), mode: 'featured' };
        }
        if (activeBrands.size === 1) {
            const brandId = [...activeBrands][0];
            const items = pool.filter(p => p.brandId === brandId).slice(0, 4);
            return { items, mode: 'brand', brandId };
        }
        if (activeCategory !== 'All' || (activeNavId !== 'all' && activeNavId !== 'home')) {
            const cat = activeCategory !== 'All' ? activeCategory : (NAV_FILTER_MAP[activeNavId]?.value || null);
            const items = pool.filter(p => {
                if (NAV_FILTER_MAP[activeNavId]?.type === 'categories') {
                    return NAV_FILTER_MAP[activeNavId].values.includes(p.category);
                }
                return cat ? p.category === cat : matchesNavFilter(p, activeNavId);
            }).slice(0, 4);
            return { items, mode: 'category', category: cat };
        }
        return { items: pool.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4), mode: 'default' };
    }

    function renderRecommendationCard(product, idx, featured) {
        const brand = BRANDS.find(b => b.id === product.brandId);
        const featuredCls = featured ? 'rec-card-featured' : '';
        const badge = featured
            ? '<span class="badge-recommended absolute top-2 left-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded z-10">Recommended</span>'
            : '';
        return `
        <article class="stagger-fade-in bg-white border border-border-gray rounded-xl p-3 w-[200px] lg:w-auto flex-shrink-0 relative ${featuredCls}"
                 style="animation-delay:${idx * 80}ms" role="listitem">
            ${badge}
            <button type="button" class="rec-quick-view w-full text-left" data-product-id="${product.id}" tabindex="0">
                <div class="h-32 bg-light-gray rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    <img src="${product.imagePath}" alt="" class="object-contain max-h-full p-2" onerror="this.style.display='none'">
                </div>
                <span class="text-[9px] font-bold uppercase" style="color:${brand?.logoColor || '#666'}">${brand?.name || ''}</span>
                <p class="text-xs font-semibold text-text-dark line-clamp-2 mt-0.5">${product.name}</p>
                <p class="text-sm font-bold text-primary mt-1">${product.priceLabel}</p>
            </button>
        </article>`;
    }

    function renderRecommendations() {
        if (!recSection || !recTrack) return;
        const visibleIds = filteredCache.slice(0, visibleCount).map(p => p.id);
        const { items, mode, brandId, category } = getRecommendations(filteredCache, visibleIds);
        if (!items.length) {
            recSection.classList.add('hidden');
            return;
        }
        recSection.classList.remove('hidden');
        const isFeatured = mode === 'featured';
        if (isFeatured) recSubtitle.textContent = 'Hand-picked featured products for you';
        else if (mode === 'brand') {
            const b = BRANDS.find(x => x.id === brandId);
            recSubtitle.textContent = `More from ${b?.name || 'this brand'}`;
        } else if (mode === 'category') recSubtitle.textContent = `More in ${category || 'this category'}`;
        else recSubtitle.textContent = 'Based on your browsing';
        recTrack.innerHTML = items.map((p, i) => renderRecommendationCard(p, i, isFeatured)).join('');
        recTrack.querySelectorAll('.rec-quick-view').forEach(btn => {
            btn.addEventListener('click', () => openQuickViewFromRec(btn.dataset.productId));
        });
    }

    function openQuickViewFromRec(productId) {
        const btn = productGridEl.querySelector(`.quick-view-btn[data-product-id="${productId}"]`);
        if (btn) btn.click();
        else {
            trackProductView(productId);
            window.__rbOpenQuickView?.(productId);
        }
    }

    function renderRecentlyViewed() {
        if (!recentSection || !recentTrack) return;
        const ids = getRecentlyViewed();
        if (!ids.length) {
            recentSection.classList.add('hidden');
            return;
        }
        recentSection.classList.remove('hidden');
        recentTrack.innerHTML = ids.map(id => {
            const p = PRODUCTS.find(x => x.id === id);
            if (!p) return '';
            return `
            <article class="bg-white border border-border-gray rounded-lg p-2 w-[140px] flex-shrink-0" role="listitem">
                <button type="button" class="recent-item w-full text-left" data-product-id="${p.id}">
                    <div class="h-20 bg-light-gray rounded flex items-center justify-center mb-2 overflow-hidden">
                        <img src="${p.imagePath}" alt="${p.name}" class="object-contain max-h-full p-1">
                    </div>
                    <p class="text-[11px] font-semibold text-text-dark line-clamp-2 leading-tight">${p.name}</p>
                    <p class="text-xs font-bold text-primary mt-1">${p.priceLabel}</p>
                </button>
            </article>`;
        }).join('');
        recentTrack.querySelectorAll('.recent-item').forEach(btn => {
            btn.addEventListener('click', () => openQuickViewFromRec(btn.dataset.productId));
        });
    }

    function updateLoadMoreUI() {
        if (!loadMoreWrap) return;
        const total = filteredCache.length;
        const shown = Math.min(visibleCount, total);
        if (total === 0) {
            loadMoreWrap.classList.add('hidden');
            return;
        }
        loadMoreWrap.classList.remove('hidden');
        if (loadMoreProgress) loadMoreProgress.textContent = `${shown} of ${total} products`;
        const allShown = shown >= total;
        if (loadMoreBtn) loadMoreBtn.classList.toggle('hidden', allShown);
        if (loadMoreDone) loadMoreDone.classList.toggle('hidden', !allShown);
    }

    function loadMoreProducts() {
        const prev = visibleCount;
        visibleCount = Math.min(visibleCount + PAGE_SIZE, filteredCache.length);
        const slice = filteredCache.slice(0, visibleCount);
        renderProductGrid(slice, prev);
        updateLoadMoreUI();
        renderRecommendations();
    }

    // ════════════════════════════════════════════════════════════
    //  FILTER LOGIC
    // ════════════════════════════════════════════════════════════

    // ── Sort ────────────────────────────────────────────────
    function sortProducts(list) {
        // Work on a shallow copy — never mutate PRODUCTS
        const arr = [...list];
        switch (activeSort) {
            case 'price-asc':
                return arr.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return arr.sort((a, b) => b.price - a.price);
            case 'newest':
                // Reverse of source-data order (last-defined = newest)
                return arr.reverse();
            case 'best-selling':
            default:
                return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
    }

    // ── Apply all active filters + sort, then re-render ───────
    function applyFilters(resetPagination = true) {
        if (resetPagination) visibleCount = PAGE_SIZE;
        filteredCache = sortProducts(getFilteredProducts());

        productGridEl.style.transition = 'none';
        productGridEl.style.opacity    = '0';
        productGridEl.style.transform  = 'translateY(10px)';

        requestAnimationFrame(() => {
            const toShow = filteredCache.slice(0, visibleCount);
            renderProductGrid(toShow);
            updateProductCount(filteredCache.length);
            updatePageTitle();
            updateCategoryBadgeCounts();
            updateFilterBadge();
            updateLoadMoreUI();
            renderRecommendations();
            renderRecentlyViewed();
            updateMobileStickyCount();

            void productGridEl.offsetHeight;

            productGridEl.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
            productGridEl.style.opacity    = '1';
            productGridEl.style.transform  = 'translateY(0)';
        });
    }

    function updateProductCount(count) {
        productCountEl.textContent =
            count === 1 ? '1 product found' : `${count} products found`;
        const statsEl = document.getElementById('catalog-stats');
        if (statsEl) {
            const hwCats = NAV_FILTER_MAP.hardware?.values || [];
            const hw = PRODUCTS.filter(p => hwCats.includes(p.category)).length;
            const appN = PRODUCTS.length - hw;
            statsEl.textContent = hw
                ? `${appN} home appliances · ${hw} hardware & daily-use · ${PRODUCTS.length} total SKUs`
                : `${PRODUCTS.length} products in catalog`;
        }
    }

    function updateCategoryBadgeCounts() {
        sidebarCatEl.querySelectorAll('li[data-category]').forEach(li => {
            const cat = li.dataset.category;
            const count = cat === 'All'
                ? PRODUCTS.filter(p => activeBrands.size === 0 || activeBrands.has(p.brandId)).length
                : PRODUCTS.filter(p => p.category === cat && (activeBrands.size === 0 || activeBrands.has(p.brandId))).length;
            const badge = li.querySelector('.cat-count');
            if (badge) badge.textContent = count;
        });
    }

    // ════════════════════════════════════════════════════════════
    //  RENDER FUNCTIONS
    // ════════════════════════════════════════════════════════════

    function renderNav() {
        navEl.innerHTML = NAV_CATEGORIES.map(cat => {
            const isActive = cat.id === activeNavId;
            return `
            <li>
                <button type="button" data-nav-id="${cat.id}"
                        class="nav-item pb-3 transition-colors flex items-center gap-2 bg-transparent border-0 cursor-pointer text-sm
                               ${isActive ? 'nav-item-active text-white' : 'text-gray-300 hover:text-white hover:border-b-2 hover:border-gray-500'}">
                    ${cat.icon ? `<span aria-hidden="true">${cat.icon}</span>` : ''}
                    ${cat.label}
                </button>
            </li>`;
        }).join('');

        navEl.querySelectorAll('[data-nav-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const navId = btn.dataset.navId;
                syncNavHighlight(navId);
                activeCategory = 'All';
                highlightSidebarCategory('All');
                applyFilters(true);
                scrollToProductGrid();
            });
        });
    }

    function highlightSidebarCategory(cat) {
        sidebarCatEl.querySelectorAll('li[data-category]').forEach(el => {
            const active = el.dataset.category === cat ||
                (cat === 'All' && el.dataset.category === 'All');
            el.classList.toggle('bg-primary/10', active);
            el.classList.toggle('font-semibold', active);
            const span = el.querySelector('span.flex');
            const icon = el.querySelector('i');
            const badge = el.querySelector('.cat-count');
            if (span) { span.classList.toggle('text-primary', active); span.classList.toggle('text-text-dark', !active); }
            if (icon) { icon.classList.toggle('text-primary', active); icon.classList.toggle('text-text-light', !active); }
            if (badge) {
                badge.classList.toggle('bg-primary/20', active);
                badge.classList.toggle('text-primary', active);
                badge.classList.toggle('border-primary/30', active);
                badge.classList.toggle('bg-light-gray', !active);
                badge.classList.toggle('text-text-light', !active);
                badge.classList.toggle('border-border-gray', !active);
            }
        });
    }

    function renderSidebarCategories() {
        const categoryCounts = PRODUCTS.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});

        const categories = ['All', ...Object.keys(categoryCounts).sort()];

        sidebarCatEl.innerHTML = categories.map(cat => {
            const count    = cat === 'All' ? PRODUCTS.length : (categoryCounts[cat] || 0);
            const isActive = cat === activeCategory;
            return `
            <li data-category="${cat}"
                class="flex items-center justify-between cursor-pointer group rounded-lg px-2 py-1.5 transition-all
                       ${isActive ? 'bg-primary/10 font-semibold' : 'hover:bg-light-gray'}">
                <span class="flex items-center gap-2 text-sm transition-colors
                             ${isActive ? 'text-primary' : 'text-text-dark group-hover:text-primary'}">
                    <i class="fas fa-chevron-right text-[8px] ${isActive ? 'text-primary' : 'text-text-light group-hover:text-primary'}"></i>
                    ${cat}
                </span>
                <span class="cat-count text-xs py-1 px-2 rounded-full border
                             ${isActive
                                ? 'bg-primary/20 text-primary border-primary/30'
                                : 'bg-light-gray text-text-light border-border-gray'}">
                    ${count}
                </span>
            </li>`;
        }).join('');

        sidebarCatEl.addEventListener('click', e => {
            const li = e.target.closest('li[data-category]');
            if (!li) return;
            activeCategory = li.dataset.category;
            syncNavFromCategory(activeCategory);
            scrollToProductGrid();

            sidebarCatEl.querySelectorAll('li[data-category]').forEach(el => {
                const active = el.dataset.category === activeCategory;
                el.classList.toggle('bg-primary/10', active);
                el.classList.toggle('font-semibold', active);
                const span  = el.querySelector('span');
                const icon  = el.querySelector('i');
                const badge = el.querySelector('.cat-count');
                if (span)  { span.classList.toggle('text-primary', active);      span.classList.toggle('text-text-dark', !active); }
                if (icon)  { icon.classList.toggle('text-primary', active);      icon.classList.toggle('text-text-light', !active); }
                if (badge) {
                    badge.classList.toggle('bg-primary/20', active);
                    badge.classList.toggle('text-primary', active);
                    badge.classList.toggle('border-primary/30', active);
                    badge.classList.toggle('bg-light-gray', !active);
                    badge.classList.toggle('text-text-light', !active);
                    badge.classList.toggle('border-border-gray', !active);
                }
            });

            applyFilters();
        });
    }

    function renderSidebarBrands() {
        const brandCounts = PRODUCTS.reduce((acc, p) => {
            acc[p.brandId] = (acc[p.brandId] || 0) + 1;
            return acc;
        }, {});

        sidebarBrandEl.innerHTML = BRANDS.map(brand => {
            const count = brandCounts[brand.id] || 0;
            if (count === 0) return '';
            return `
            <label class="flex items-center justify-between cursor-pointer group">
                <div class="flex items-center gap-3">
                    <div class="relative flex items-center justify-center w-5 h-5 border border-border-gray rounded bg-white group-hover:border-primary transition-colors">
                        <input type="checkbox"
                               data-brand-id="${brand.id}"
                               class="brand-checkbox peer appearance-none w-full h-full cursor-pointer absolute">
                        <i class="fas fa-check text-[10px] text-primary opacity-0 peer-checked:opacity-100 transition-opacity z-10"></i>
                    </div>
                    <span class="text-sm text-text-dark group-hover:text-primary transition-colors">${brand.name}</span>
                </div>
                <span class="text-xs text-text-light">(${count})</span>
            </label>`;
        }).join('');

        sidebarBrandEl.addEventListener('change', e => {
            const cb = e.target.closest('input.brand-checkbox');
            if (!cb) return;
            if (cb.checked) { activeBrands.add(cb.dataset.brandId); }
            else            { activeBrands.delete(cb.dataset.brandId); }
            applyFilters();
        });
    }

    function renderProductGrid(products, animStartIndex = 0) {
        if (currentLayout === 'list') {
            productGridEl.className = 'grid grid-cols-1 gap-4';
        } else {
            productGridEl.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
        }

        if (!products || products.length === 0) {
            productGridEl.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <div class="w-24 h-24 rounded-full flex items-center justify-center mb-6 border-2 border-dashed"
                     style="background:var(--light-gray); border-color:var(--border-gray);">
                    <i class="fas fa-box-open text-4xl" style="color:var(--text-light); opacity:0.6;"></i>
                </div>
                <h3 class="text-xl font-bold mb-2" style="color:var(--text-dark);">${activeNavId === 'services' ? 'Service Inquiries' : 'No products found'}</h3>
                <p class="text-sm max-w-xs" style="color:var(--text-light);">
                    ${activeNavId === 'services'
                        ? 'Contact us via WhatsApp or request a bulk quote for installation, warranty, and B2B support.'
                        : 'No products match your current filters. Try a different category or clear some brand filters.'}
                </p>
                <button onclick="window.__rbResetFilters()"
                        class="mt-6 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-md transition-colors"
                        style="background:var(--primary);">
                    Clear All Filters
                </button>
            </div>`;
            return;
        }

        productGridEl.innerHTML = products.map((product, cardIdx) => {
            const brand    = BRANDS.find(b => b.id === product.brandId);
            const isATC    = product.cta === 'Add to Cart';
            const ctaIcon  = isATC ? '<i class="fas fa-shopping-cart text-xs pointer-events-none"></i>'
                                   : '<i class="fas fa-file-invoice text-xs pointer-events-none"></i>';
            const isWished = wishlist.includes(product.id);
            const heartIcon = isWished ? 'fas fa-heart text-primary' : 'far fa-heart text-text-light group-hover/wish:text-primary';
            const rating = product.rating || 0;
            const reviewCount = getReviewCount(product);
            const starsHTML = renderStarRatingHTML(rating, reviewCount);
            const topRatedBadge = rating >= 4.8
                ? '<span class="badge-top-rated absolute top-4 left-4 z-10 text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">Top Rated</span>'
                : '';
            const delayMs = (animStartIndex + cardIdx) * (cardIdx >= animStartIndex ? 80 : 50);
            const animCls = cardIdx >= animStartIndex ? 'card-load-more' : 'product-card';
            const animStyle = `animation-delay:${delayMs}ms`;
            const badgeBlock = product.badge && rating < 4.8 ? `
                        <div class="absolute top-4 left-4 z-10">
                            <span class="bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded shadow-sm">${product.badge}</span>
                        </div>` : '';

            if (currentLayout === 'list') {
                return `
                <div class="${animCls} product-card bg-white border border-border-gray rounded-xl p-4 flex flex-col sm:flex-row relative hover:border-primary hover-lift transition-all group overflow-hidden gap-4 items-center"
                     style="${animStyle}" tabindex="0" role="button" data-product-id="${product.id}" aria-label="Quick view ${product.name}">
                    ${topRatedBadge}${badgeBlock}

                    <button class="wishlist-btn absolute top-4 right-4 z-20 w-8 h-8 bg-white border border-border-gray rounded-full shadow-sm flex items-center justify-center group/wish transition-colors hover:border-primary" data-product-id="${product.id}" aria-label="Toggle Wishlist">
                        <i class="${heartIcon} transition-colors pointer-events-none"></i>
                    </button>

                    <!-- Image -->
                    <div class="relative w-full sm:w-[120px] h-48 sm:h-[120px] flex-shrink-0 bg-light-gray rounded-lg overflow-hidden flex items-center justify-center">
                        <img src="${product.imagePath}" alt="${product.name}" class="object-contain max-h-full max-w-full p-2 transition-transform duration-500 group-hover:scale-105 z-10 relative" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                        <div class="img-fallback absolute inset-0 hidden" style="--fallback-bg:${product.fallbackBg};">
                            <div class="z-10 flex flex-col items-center justify-center h-full">
                                <span class="text-xl opacity-50 mb-1"><i class="fas fa-box-open"></i></span>
                                <span class="tracking-widest font-bold opacity-80 text-xs">${product.fallbackInitials}</span>
                            </div>
                        </div>
                        <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                            <button class="quick-view-btn px-4 py-2 bg-white text-text-dark rounded-full font-bold text-xs shadow-lg hover:text-primary transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 pointer-events-auto" data-product-id="${product.id}">
                                Quick View
                            </button>
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="flex-grow flex flex-col py-2 self-start">
                        <span class="text-xs font-bold uppercase tracking-wider" style="color:${brand.logoColor};">${brand.name}</span>
                        ${starsHTML}
                        <h3 class="font-bold text-text-dark text-base leading-tight mt-1 mb-2" title="${product.name}">${product.name}</h3>
                        <ul class="space-y-1 mt-auto hidden sm:block">
                            ${product.specs.slice(0, 3).map(spec => `<li class="text-[11px] text-text-light flex items-center gap-1.5"><i class="fas fa-circle text-[4px] text-border-gray"></i> ${spec}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- Price & CTA -->
                    <div class="flex flex-col sm:items-end justify-center flex-shrink-0 sm:w-48 sm:pl-4 sm:border-l border-border-gray mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 self-stretch">
                        <div class="mb-4 sm:text-right flex items-end justify-between sm:block">
                            <div>
                                <div class="font-bold text-xl text-primary">${product.priceLabel}</div>
                                <div class="text-[10px] text-text-light uppercase">${product.taxNote}</div>
                            </div>
                        </div>
                        <div class="mt-auto w-full space-y-3">
                            <label class="flex items-center sm:justify-end gap-2 cursor-pointer group w-max sm:w-auto ml-auto">
                                <input type="checkbox" class="compare-cb w-4 h-4 text-primary rounded border-border-gray focus:ring-primary cursor-pointer" data-product-id="${product.id}" ${compareList.includes(product.id) ? 'checked' : ''}>
                                <span class="text-[11px] font-medium text-text-light group-hover:text-primary transition-colors">Compare</span>
                            </label>
                            <button class="w-full sm:w-auto px-6 py-2 rounded font-bold text-sm btn-primary flex items-center justify-center gap-2 ${isATC ? 'atc-btn' : ''}" ${isATC ? `data-product-id="${product.id}"` : ''}>
                                ${ctaIcon} ${product.cta}
                            </button>
                        </div>
                    </div>
                </div>`;
            }

            return `
            <div class="${animCls} product-card bg-white border border-border-gray rounded-xl p-4 flex flex-col relative
                        hover:border-primary hover-lift transition-all group overflow-hidden"
                 style="${animStyle}" tabindex="0" role="button" data-product-id="${product.id}" aria-label="Quick view ${product.name}">

                ${topRatedBadge}${badgeBlock}

                <button class="wishlist-btn absolute top-4 right-4 z-20 w-8 h-8 bg-white border border-border-gray rounded-full shadow-sm flex items-center justify-center group/wish transition-colors hover:border-primary" data-product-id="${product.id}" aria-label="Add ${product.name} to wishlist">
                    <i class="${heartIcon} transition-colors pointer-events-none"></i>
                </button>

                <!-- Image -->
                <div class="relative h-56 w-full mb-4 bg-light-gray rounded-lg overflow-hidden flex items-center justify-center">
                    <img src="${product.imagePath}"
                         alt="${product.name}"
                         class="object-contain max-h-full max-w-full p-4 transition-transform duration-500 group-hover:scale-105 z-10 relative"
                         onload="this.classList.add('loaded')"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="img-fallback absolute inset-0 hidden" style="--fallback-bg:${product.fallbackBg};">
                        <div class="z-10 flex flex-col items-center">
                            <span class="text-2xl opacity-50 mb-2"><i class="fas fa-box-open"></i></span>
                            <span class="tracking-widest font-bold opacity-80">${product.fallbackInitials}</span>
                            <span class="text-[10px] uppercase font-normal mt-1 opacity-60">Image Pending</span>
                        </div>
                    </div>
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                        <button class="quick-view-btn px-4 py-2 bg-white text-text-dark rounded-full font-bold text-xs shadow-lg hover:text-primary transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 pointer-events-auto" data-product-id="${product.id}">
                            Quick View
                        </button>
                    </div>
                </div>

                <!-- Brand & Name -->
                <div class="mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider" style="color:${brand.logoColor};">${brand.name}</span>
                    ${starsHTML}
                    <h3 class="font-bold text-text-dark text-sm leading-tight mt-1 mb-2 line-clamp-2" title="${product.name}">
                        ${product.name}
                    </h3>
                </div>

                <!-- Specs -->
                <ul class="mb-4 space-y-1">
                    ${product.specs.slice(0, 2).map(spec => `
                        <li class="text-[11px] text-text-light flex items-center gap-1.5">
                            <i class="fas fa-circle text-[4px] text-border-gray"></i> ${spec}
                        </li>`).join('')}
                </ul>

                <div class="mt-auto">
                    <!-- Price -->
                    <div class="mb-4">
                        <div class="font-bold text-lg text-primary">${product.priceLabel}</div>
                        <div class="text-[10px] text-text-light uppercase">${product.taxNote}</div>
                    </div>

                    <div class="space-y-3 mt-auto w-full">
                        <label class="flex items-center gap-2 cursor-pointer group w-max">
                            <input type="checkbox" class="compare-cb w-4 h-4 text-primary rounded border-border-gray focus:ring-primary cursor-pointer" data-product-id="${product.id}" ${compareList.includes(product.id) ? 'checked' : ''}>
                            <span class="text-[11px] font-medium text-text-light group-hover:text-primary transition-colors">Add to Compare</span>
                        </label>
                        <!-- CTA Button -->
                        <button class="w-full py-2.5 rounded font-bold text-sm btn-primary flex items-center justify-center gap-2 ${isATC ? 'atc-btn' : ''}" ${isATC ? `data-product-id="${product.id}"` : ''}>
                            ${ctaIcon} ${product.cta}
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');

        initProductCardA11y();
    }

    function initProductCardA11y() {
        productGridEl.querySelectorAll('.product-card[tabindex="0"]').forEach(card => {
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const id = card.dataset.productId;
                    const qv = card.querySelector('.quick-view-btn') || productGridEl.querySelector(`.quick-view-btn[data-product-id="${id}"]`);
                    if (qv) qv.click();
                }
            });
        });
    }

    // ── Global reset (called from empty-state button) ─────────────
    window.__rbResetFilters = function () {
        activeCategory = 'All';
        activeNavId = 'all';
        syncNavHighlight('all');
        activeBrands.clear();
        sidebarBrandEl.querySelectorAll('input.brand-checkbox').forEach(cb => cb.checked = false);

        sidebarCatEl.querySelectorAll('li[data-category]').forEach(el => {
            const isAll = el.dataset.category === 'All';
            el.classList.toggle('bg-primary/10', isAll);
            el.classList.toggle('font-semibold', isAll);
            const span  = el.querySelector('span');
            const icon  = el.querySelector('i');
            const badge = el.querySelector('.cat-count');
            if (span)  { span.classList.toggle('text-primary', isAll);  span.classList.toggle('text-text-dark', !isAll); }
            if (icon)  { icon.classList.toggle('text-primary', isAll);  icon.classList.toggle('text-text-light', !isAll); }
            if (badge) {
                badge.classList.toggle('bg-primary/20', isAll);
                badge.classList.toggle('text-primary', isAll);
                badge.classList.toggle('border-primary/30', isAll);
                badge.classList.toggle('bg-light-gray', !isAll);
                badge.classList.toggle('text-text-light', !isAll);
                badge.classList.toggle('border-border-gray', !isAll);
            }
        });

        priceMin = PRICE_TOTAL_MIN;
        priceMax = PRICE_TOTAL_MAX;
        document.getElementById('price-reset-btn')?.click();
        applyFilters(true);
    };

    function renderFooter() {
        socialLinksEl.innerHTML = SOCIAL_LINKS.map(link => `
            <a href="${link.href}"
               class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:-translate-y-1 transition-transform"
               aria-label="${link.platform}">
                ${link.platform === 'Facebook'  ? '<i class="fab fa-facebook-f"></i>'  :
                  link.platform === 'Pinterest'  ? '<i class="fab fa-pinterest-p"></i>' :
                  link.platform === 'Instagram'  ? '<i class="fab fa-instagram"></i>'   :
                  link.platform === 'LinkedIn'   ? '<i class="fab fa-linkedin-in"></i>' :
                  link.platform === 'YouTube'    ? '<i class="fab fa-youtube"></i>'     :
                                                   '<i class="fab fa-tiktok"></i>'}
            </a>`).join('');

        const waNum = CONTACT_INFO.whatsapp.replace(/\D/g, '');
        const waMsg = encodeURIComponent('Hello, I am interested in bulk pricing for [products]');
        const waHref = `https://wa.me/${waNum}?text=${waMsg}`;
        contactInfoEl.innerHTML = `
            <p class="font-bold text-white mb-2">${CONTACT_INFO.company}</p>
            <p class="flex items-start gap-2"><i class="fas fa-map-marker-alt mt-1"></i> <span>${CONTACT_INFO.address}</span></p>
            <p class="flex items-center gap-2 mt-2"><i class="fas fa-envelope"></i> <strong>Email:</strong> ${CONTACT_INFO.email}</p>
            <p class="flex items-center gap-2"><i class="fas fa-phone-alt"></i> <strong>Telephone:</strong> ${CONTACT_INFO.telephone}</p>
            <p class="flex items-center gap-2 mt-2">
                <i class="fab fa-whatsapp text-[#25D366]"></i>
                <a href="${waHref}" target="_blank" rel="noopener" class="text-[#25D366] hover:underline font-semibold">${CONTACT_INFO.whatsapp}</a>
            </p>`;

        const payRow = document.getElementById('payment-methods-row');
        if (payRow) {
            const methods = [
                { label: 'JazzCash', color: '#d4142a' },
                { label: 'EasyPaisa', color: '#00a651' },
                { label: 'Bank Transfer', color: '#4a5568' },
                { label: 'Visa', color: '#1a1f71' },
                { label: 'Mastercard', color: '#eb001b' },
            ];
            payRow.innerHTML = methods.map(m =>
                `<span class="payment-pill" style="border-color:${m.color}55;color:${m.color === '#4a5568' ? '#ccc' : m.color}">${m.label}</span>`
            ).join('');
        }

        footerPoliciesEl.innerHTML = FOOTER_POLICIES.map(policy => `
            <li><a href="#" class="hover:text-primary transition-colors flex items-center gap-2">
                <i class="fas fa-angle-right text-xs"></i> ${policy}
            </a></li>`).join('');
    }

    // ════════════════════════════════════════════════════════════
    //  DUAL-HANDLE PRICE SLIDER
    // ════════════════════════════════════════════════════════════

    function initPriceSlider() {
        const handleMin  = document.getElementById('price-handle-min');
        const handleMax  = document.getElementById('price-handle-max');
        const inputMin   = document.getElementById('price-min-input');
        const inputMax   = document.getElementById('price-max-input');
        const fillEl     = document.getElementById('price-track-fill');
        const labelMin   = document.getElementById('price-label-min');
        const labelMax   = document.getElementById('price-label-max');
        const resetBtn   = document.getElementById('price-reset-btn');
        const RANGE      = PRICE_TOTAL_MAX - PRICE_TOTAL_MIN;
        const MIN_GAP    = 5000; // minimum PKR gap between handles

        function fmtPKR(v) {
            return 'PKR ' + Number(v).toLocaleString('en-IN');
        }

        function pct(v) {
            return ((v - PRICE_TOTAL_MIN) / RANGE) * 100;
        }

        // Update the red fill track between the two thumbs
        function updateTrack() {
            const lo = pct(priceMin);
            const hi = pct(priceMax);
            fillEl.style.left  = lo + '%';
            fillEl.style.width = (hi - lo) + '%';

            // Toggle at-max class so min handle doesn't block max handle
            handleMin.classList.toggle('at-max', priceMin >= PRICE_TOTAL_MAX - MIN_GAP);
        }

        // Sync all UI elements from current priceMin/priceMax state
        function syncUI() {
            handleMin.value  = priceMin;
            handleMax.value  = priceMax;
            inputMin.value   = priceMin;
            inputMax.value   = priceMax;
            labelMin.textContent = fmtPKR(priceMin);
            labelMax.textContent = fmtPKR(priceMax);
            updateTrack();

            const isFiltered = priceMin > PRICE_TOTAL_MIN || priceMax < PRICE_TOTAL_MAX;
            resetBtn.classList.toggle('hidden', !isFiltered);
        }

        // ── Range handle events ─────────────────────────────
        handleMin.addEventListener('input', () => {
            const v = parseInt(handleMin.value);
            // Enforce minimum gap
            if (v > priceMax - MIN_GAP) {
                handleMin.value = priceMax - MIN_GAP;
            }
            priceMin = parseInt(handleMin.value);
            syncUI();
            applyFilters();
        });

        handleMax.addEventListener('input', () => {
            const v = parseInt(handleMax.value);
            if (v < priceMin + MIN_GAP) {
                handleMax.value = priceMin + MIN_GAP;
            }
            priceMax = parseInt(handleMax.value);
            syncUI();
            applyFilters();
        });

        // ── Number input events ─────────────────────────────
        function onMinInput() {
            let v = parseInt(inputMin.value) || PRICE_TOTAL_MIN;
            v = Math.max(PRICE_TOTAL_MIN, Math.min(v, priceMax - MIN_GAP));
            priceMin = v;
            syncUI();
            applyFilters();
        }
        function onMaxInput() {
            let v = parseInt(inputMax.value) || PRICE_TOTAL_MAX;
            v = Math.min(PRICE_TOTAL_MAX, Math.max(v, priceMin + MIN_GAP));
            priceMax = v;
            syncUI();
            applyFilters();
        }
        inputMin.addEventListener('change', onMinInput);
        inputMax.addEventListener('change', onMaxInput);
        // Also react on Enter key
        inputMin.addEventListener('keydown', e => { if (e.key === 'Enter') onMinInput(); });
        inputMax.addEventListener('keydown', e => { if (e.key === 'Enter') onMaxInput(); });

        // ── Reset ────────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            priceMin = PRICE_TOTAL_MIN;
            priceMax = PRICE_TOTAL_MAX;
            syncUI();
            applyFilters();
            showToast('Price filter cleared', 'info');
        });

        // Initial draw
        syncUI();
    }

    // ════════════════════════════════════════════════════════════
    //  WISHLIST LOGIC
    // ════════════════════════════════════════════════════════════

    function initWishlist() {
        const badgeEl       = document.getElementById('header-wishlist-badge');
        const btnHeader     = document.getElementById('header-wishlist-btn');
        const modal         = document.getElementById('wishlist-modal');
        const overlay       = document.getElementById('wishlist-modal-overlay');
        const closeBtn      = document.getElementById('close-wishlist-modal');
        const container     = document.getElementById('wishlist-items-container');
        const countEl       = document.getElementById('wishlist-modal-count');
        const clearBtn      = document.getElementById('clear-wishlist-btn');

        if (!btnHeader || !modal) return;

        function syncBadge() {
            if (wishlist.length > 0) {
                badgeEl.textContent = wishlist.length;
                badgeEl.classList.remove('hidden');
            } else {
                badgeEl.classList.add('hidden');
            }
        }

        function saveWishlist() {
            localStorage.setItem('rb_wishlist', JSON.stringify(wishlist));
            syncBadge();
        }

        function toggleWishlist(productId, btn) {
            const idx = wishlist.indexOf(productId);
            if (idx > -1) {
                wishlist.splice(idx, 1);
                showToast('Removed from saved items', 'info');
                if (btn) btn.innerHTML = `<i class="far fa-heart text-text-light group-hover/wish:text-primary transition-colors pointer-events-none"></i>`;
            } else {
                wishlist.push(productId);
                showToast('Saved to wishlist ♥', 'success');
                if (btn) btn.innerHTML = `<i class="fas fa-heart text-primary transition-colors pointer-events-none"></i>`;
            }
            saveWishlist();
            if (modal.classList.contains('pointer-events-auto')) {
                renderModal();
            }
        }

        function renderModal() {
            countEl.textContent = `${wishlist.length} item${wishlist.length !== 1 ? 's' : ''}`;
            if (wishlist.length === 0) {
                container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center h-full">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-border-gray shadow-sm">
                        <i class="far fa-heart text-3xl text-border-gray"></i>
                    </div>
                    <h3 class="text-lg font-bold text-text-dark mb-1">Your wishlist is empty</h3>
                    <p class="text-sm text-text-light">Save items you like to review them later.</p>
                </div>`;
                return;
            }

            const itemsHTML = wishlist.map(id => {
                const p = PRODUCTS.find(prod => prod.id === id);
                if (!p) return '';
                const brand = BRANDS.find(b => b.id === p.brandId);
                return `
                <div class="bg-white border border-border-gray rounded-lg p-3 flex items-center gap-4 hover:border-primary transition-colors">
                    <div class="w-20 h-20 bg-light-gray rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        <img src="${p.imagePath}" alt="${p.name}" class="object-contain max-h-full max-w-full p-1" onerror="this.style.display='none'">
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="text-[10px] font-bold uppercase tracking-wider mb-1" style="color:${brand?.logoColor || '#666'}">${brand?.name || 'Brand'}</div>
                        <h4 class="font-bold text-sm text-text-dark truncate">${p.name}</h4>
                        <div class="text-primary font-bold text-sm mt-1">${p.priceLabel}</div>
                    </div>
                    <button class="remove-wishlist-btn text-text-light hover:text-primary transition-colors w-8 h-8 flex items-center justify-center flex-shrink-0" data-id="${p.id}" aria-label="Remove item">
                        <i class="fas fa-trash-alt pointer-events-none"></i>
                    </button>
                </div>`;
            }).join('');

            container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${itemsHTML}</div>`;
        }

        function openModal() {
            renderModal();
            modal.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            modal.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }

        function closeModal() {
            modal.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
            modal.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            overlay.classList.remove('opacity-100', 'pointer-events-auto');
            overlay.classList.add('opacity-0', 'pointer-events-none');
            // Re-render grid to update heart icons just in case they were modified via modal
            applyFilters();
        }

        // Grid delegation for heart icons
        productGridEl.addEventListener('click', e => {
            const btn = e.target.closest('.wishlist-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const id = btn.dataset.productId;
            if (id) toggleWishlist(id, btn);
        });

        // Modal delegation for remove buttons
        container.addEventListener('click', e => {
            const btn = e.target.closest('.remove-wishlist-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            if (id) toggleWishlist(id, null);
        });

        clearBtn.addEventListener('click', () => {
            if(wishlist.length === 0) return;
            wishlist = [];
            saveWishlist();
            renderModal();
            showToast('Wishlist cleared', 'info');
        });

        btnHeader.addEventListener('click', e => { e.preventDefault(); openModal(); });
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        syncBadge();
    }

    // ════════════════════════════════════════════════════════════
    //  QUICK VIEW LOGIC
    // ════════════════════════════════════════════════════════════

    function initQuickView() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        const closeBtn = document.getElementById('close-quick-view');
        const content = document.getElementById('quick-view-content');

        if (!modal) return;

        function openQuickView(productId) {
            const product = PRODUCTS.find(p => p.id === productId);
            if (!product) return;
            trackProductView(productId);
            const brand = BRANDS.find(b => b.id === product.brandId);
            const isATC = product.cta === 'Add to Cart';
            const ctaIcon = isATC ? '<i class="fas fa-shopping-cart text-xs pointer-events-none"></i>' : '<i class="fas fa-file-invoice text-xs pointer-events-none"></i>';

            const rating = product.rating || 0;
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                if (rating >= i) {
                    starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
                } else if (rating >= i - 0.5) {
                    starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
                } else {
                    starsHTML += '<i class="far fa-star text-yellow-400"></i>';
                }
            }

            content.innerHTML = `
                <!-- Left: Image -->
                <div class="w-full md:w-1/2 bg-light-gray p-8 flex items-center justify-center relative min-h-[300px]">
                    <img src="${product.imagePath}" alt="${product.name}" class="max-w-full max-h-[400px] object-contain z-10" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="img-fallback absolute inset-0 hidden" style="--fallback-bg:${product.fallbackBg};">
                        <div class="z-10 flex flex-col items-center justify-center h-full">
                            <span class="text-6xl opacity-50 mb-4"><i class="fas fa-box-open"></i></span>
                            <span class="tracking-widest font-bold opacity-80 text-2xl">${product.fallbackInitials}</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Details -->
                <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white">
                    <div class="mb-2">
                        <span class="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white mb-3" style="background-color:${brand?.logoColor || '#333'};">${brand?.name || 'Brand'}</span>
                        <h2 class="text-2xl font-bold text-text-dark leading-tight mb-2">${product.name}</h2>
                        <div class="flex items-center gap-2 mb-4">
                            <div class="flex text-sm">${starsHTML}</div>
                            <span class="text-xs text-text-light">(${product.rating || 'N/A'})</span>
                        </div>
                    </div>

                    <div class="mb-6">
                        <div class="font-bold text-3xl text-primary mb-1">${product.priceLabel}</div>
                        <div class="text-xs text-text-light uppercase tracking-wide">${product.taxNote}</div>
                    </div>

                    <div class="mb-8 flex-grow">
                        <h3 class="font-bold text-sm text-text-dark mb-3 border-b border-border-gray pb-2">Key Specifications</h3>
                        <ul class="space-y-2">
                            ${product.specs.map(spec => `<li class="text-sm text-text-light flex gap-2"><i class="fas fa-check text-primary mt-1 flex-shrink-0"></i> <span>${spec}</span></li>`).join('')}
                        </ul>
                    </div>

                    <div class="mt-auto space-y-4">
                        <label class="flex items-center gap-2 cursor-pointer group w-max">
                            <input type="checkbox" class="compare-cb w-4 h-4 text-primary rounded border-border-gray focus:ring-primary cursor-pointer" data-product-id="${product.id}" ${compareList.includes(product.id) ? 'checked' : ''}>
                            <span class="text-sm font-medium text-text-dark group-hover:text-primary transition-colors">Add to Compare</span>
                        </label>
                        
                        <button class="w-full py-3.5 rounded-lg font-bold text-base btn-primary flex items-center justify-center gap-2 shadow-md ${isATC ? 'atc-btn' : ''}" ${isATC ? `data-product-id="${product.id}"` : ''}>
                            ${ctaIcon} ${product.cta}
                        </button>
                    </div>
                </div>
            `;

            modal.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            modal.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
            trapFocus(modal);
        }

        function closeModal() {
            modal.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
            modal.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            overlay.classList.remove('opacity-100', 'pointer-events-auto');
            overlay.classList.add('opacity-0', 'pointer-events-none');
            releaseFocusTrap();
        }

        window.__rbOpenQuickView = openQuickView;

        productGridEl.addEventListener('click', e => {
            const btn = e.target.closest('.quick-view-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const id = btn.dataset.productId;
            if (id) openQuickView(id);
        });

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }

    // ════════════════════════════════════════════════════════════
    //  COMPARE LOGIC
    // ════════════════════════════════════════════════════════════

    function initCompare() {
        const bar = document.getElementById('compare-bar');
        const itemsContainer = document.getElementById('compare-bar-items');
        const countSpan = document.getElementById('compare-count');
        const clearBtn = document.getElementById('compare-clear-btn');
        const nowBtn = document.getElementById('compare-now-btn');
        const modal = document.getElementById('compare-modal');
        const closeBtn = document.getElementById('close-compare-modal');
        const modalContent = document.getElementById('compare-modal-content');

        if (!bar) return;

        function updateBarUI() {
            countSpan.textContent = compareList.length;
            
            if (compareList.length > 0) {
                bar.classList.remove('translate-y-full');
            } else {
                bar.classList.add('translate-y-full');
            }

            itemsContainer.innerHTML = compareList.map(id => {
                const p = PRODUCTS.find(prod => prod.id === id);
                return p ? `
                <div class="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5 border border-white/20 fade-in">
                    <img src="${p.imagePath}" class="w-6 h-6 object-contain rounded bg-white" onerror="this.style.display='none'">
                    <span class="text-xs font-medium truncate max-w-[120px]">${p.name}</span>
                    <button class="remove-compare text-gray-400 hover:text-white ml-1 transition-colors" data-id="${p.id}" aria-label="Remove item"><i class="fas fa-times"></i></button>
                </div>` : '';
            }).join('');
        }

        function toggleCompare(productId, isChecked) {
            if (isChecked) {
                if (compareList.length >= 4) {
                    showToast('You can compare up to 4 products at a time.', 'error');
                    // Uncheck visually
                    document.querySelectorAll(`.compare-cb[data-product-id="${productId}"]`).forEach(cb => cb.checked = false);
                    return;
                }
                if (!compareList.includes(productId)) {
                    compareList.push(productId);
                    showToast('Added to comparison ✓', 'success');
                }
            } else {
                if (compareList.includes(productId)) {
                    compareList = compareList.filter(id => id !== productId);
                    showToast('Removed from comparison', 'info');
                }
            }
            
            // Sync all checkboxes for this product
            document.querySelectorAll(`.compare-cb[data-product-id="${productId}"]`).forEach(cb => {
                cb.checked = compareList.includes(productId);
            });
            
            updateBarUI();
        }

        // Global delegation for checkboxes
        document.body.addEventListener('change', e => {
            if (e.target.classList.contains('compare-cb')) {
                toggleCompare(e.target.dataset.productId, e.target.checked);
            }
        });

        // Delegation for remove buttons in bar
        itemsContainer.addEventListener('click', e => {
            const btn = e.target.closest('.remove-compare');
            if (btn) toggleCompare(btn.dataset.id, false);
        });

        clearBtn.addEventListener('click', () => {
            compareList.forEach(id => {
                document.querySelectorAll(`.compare-cb[data-product-id="${id}"]`).forEach(cb => cb.checked = false);
            });
            compareList = [];
            updateBarUI();
        });

        nowBtn.addEventListener('click', () => {
            if (compareList.length < 2) {
                showToast('Select at least 2 products to compare.', 'info');
                return;
            }
            renderCompareTable();
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden'; // Prevent bg scroll
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('opacity-100', 'pointer-events-auto');
            modal.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = '';
        });

        function renderCompareTable() {
            const products = compareList.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
            if (products.length === 0) return;

            // Find best values
            const prices = products.map(p => p.price);
            const minPrice = Math.min(...prices);
            
            const ratings = products.map(p => p.rating || 0);
            const maxRating = Math.max(...ratings);

            // Collect all unique specs
            const allSpecs = new Set();
            products.forEach(p => p.specs.forEach(s => {
                const key = s.includes(':') ? s.split(':')[0].trim() : s;
                allSpecs.add(key);
            }));

            let html = `
            <div class="bg-white rounded-xl shadow-lg border border-border-gray overflow-x-auto relative">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr>
                            <th class="p-4 border-b border-border-gray bg-light-gray w-48 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Product Features</th>
                            ${products.map(p => `
                                <th class="p-4 border-b border-border-gray align-top min-w-[250px] bg-white relative">
                                    <div class="flex justify-between items-start mb-2">
                                        <img src="${p.imagePath}" class="h-24 w-auto object-contain" onerror="this.style.display='none'">
                                        <button class="remove-compare-modal text-text-light hover:text-primary p-1 transition-colors" data-id="${p.id}" aria-label="Remove from compare"><i class="fas fa-times"></i></button>
                                    </div>
                                    <h3 class="font-bold text-sm text-text-dark leading-tight">${p.name}</h3>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Brand -->
                        <tr>
                            <td class="p-4 border-b border-border-gray font-semibold text-sm bg-light-gray sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Brand</td>
                            ${products.map(p => {
                                const brand = BRANDS.find(b => b.id === p.brandId);
                                return `<td class="p-4 border-b border-border-gray text-sm bg-white"><span class="font-bold uppercase tracking-wider" style="color:${brand?.logoColor || '#666'}">${brand?.name || '-'}</span></td>`;
                            }).join('')}
                        </tr>
                        <!-- Category -->
                        <tr>
                            <td class="p-4 border-b border-border-gray font-semibold text-sm bg-light-gray sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Category</td>
                            ${products.map(p => `<td class="p-4 border-b border-border-gray text-sm bg-white">${p.category}</td>`).join('')}
                        </tr>
                        <!-- Price -->
                        <tr>
                            <td class="p-4 border-b border-border-gray font-semibold text-sm bg-light-gray sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Price</td>
                            ${products.map(p => {
                                const isBest = p.price === minPrice && p.price > 0 && products.length > 1;
                                return `<td class="p-4 border-b border-border-gray font-bold ${isBest ? 'text-green-600 bg-green-50/50' : 'text-primary bg-white'} text-lg">
                                    ${p.priceLabel}
                                    ${isBest ? '<span class="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">Best Value</span>' : ''}
                                </td>`;
                            }).join('')}
                        </tr>
                        <!-- Rating -->
                        <tr>
                            <td class="p-4 border-b border-border-gray font-semibold text-sm bg-light-gray sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Rating</td>
                            ${products.map(p => {
                                const isBest = (p.rating || 0) === maxRating && maxRating > 0 && products.length > 1;
                                return `<td class="p-4 border-b border-border-gray text-sm ${isBest ? 'bg-green-50/50 text-green-700 font-bold' : 'bg-white'}">
                                    <i class="fas fa-star ${isBest ? 'text-green-500' : 'text-yellow-400'}"></i> ${p.rating || 'N/A'}
                                </td>`;
                            }).join('')}
                        </tr>
                        <!-- Specs -->
                        ${Array.from(allSpecs).map(specKey => {
                            return `
                            <tr>
                                <td class="p-4 border-b border-border-gray font-semibold text-sm bg-light-gray sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">${specKey}</td>
                                ${products.map(p => {
                                    const spec = p.specs.find(s => s.includes(specKey) || s === specKey);
                                    let val = '-';
                                    if (spec) {
                                        val = spec.includes(':') ? spec.substring(spec.indexOf(':') + 1).trim() : '<i class="fas fa-check text-green-500"></i>';
                                    }
                                    return `<td class="p-4 border-b border-border-gray text-sm text-text-light bg-white">${val}</td>`;
                                }).join('')}
                            </tr>`;
                        }).join('')}
                        <!-- CTA -->
                        <tr>
                            <td class="p-4 bg-light-gray sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-bl-xl"></td>
                            ${products.map(p => {
                                const isATC = p.cta === 'Add to Cart';
                                return `<td class="p-4 bg-white">
                                    <button class="w-full py-2.5 rounded font-bold text-sm btn-primary flex items-center justify-center gap-2 ${isATC ? 'atc-btn' : ''}" ${isATC ? `data-product-id="${p.id}"` : ''}>
                                        ${p.cta}
                                    </button>
                                </td>`;
                            }).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>`;

            modalContent.innerHTML = html;

            modalContent.querySelectorAll('.remove-compare-modal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    toggleCompare(e.currentTarget.dataset.id, false);
                    if (compareList.length < 2) {
                        closeBtn.click();
                    } else {
                        renderCompareTable();
                    }
                });
            });
        }
    }

    // ════════════════════════════════════════════════════════════
    //  QUOTE LOGIC
    // ════════════════════════════════════════════════════════════

    function initQuote() {
        const modal = document.getElementById('quote-modal');
        const overlay = document.getElementById('quote-overlay');
        const closeBtn = document.getElementById('close-quote-modal');
        const form = document.getElementById('quote-form');
        const successState = document.getElementById('quote-success');
        const successIcon = document.getElementById('quote-success-icon');
        const doneBtn = document.getElementById('quote-done-btn');
        const productIdInput = document.getElementById('quote-product-id');
        const cartQuoteBtn = document.getElementById('cart-quote-btn'); 

        if (!modal) return;

        function openModal(productId = '') {
            productIdInput.value = productId;
            form.reset();
            form.classList.remove('hidden');
            successState.classList.add('hidden');
            successState.classList.remove('flex');
            successIcon.classList.remove('scale-100');
            successIcon.classList.add('scale-0');

            modal.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            modal.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }

        function closeModal() {
            modal.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
            modal.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            overlay.classList.remove('opacity-100', 'pointer-events-auto');
            overlay.classList.add('opacity-0', 'pointer-events-none');
        }

        // Delegate "Get a Quote" buttons in main grid/list
        document.body.addEventListener('click', e => {
            const btn = e.target.closest('.btn-primary');
            if (!btn || btn.classList.contains('atc-btn') || btn.id === 'compare-now-btn' || btn.id === 'cart-quote-btn' || btn.type === 'submit') return;
            
            if (btn.textContent.includes('Get a Quote') || btn.textContent.includes('Request Bulk Quote')) {
                e.preventDefault();
                const pid = btn.dataset.productId || '';
                openModal(pid);
            }
        });

        // Bulk quote from Cart
        if (cartQuoteBtn) {
            cartQuoteBtn.addEventListener('click', () => {
                if (cart.length === 0) return;
                const pids = cart.map(c => c.productId).join(',');
                document.getElementById('cart-close-btn').click(); 
                openModal(pids); 
            });
        }

        form.addEventListener('submit', e => {
            e.preventDefault();
            
            const submission = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                productIds: productIdInput.value,
                name: document.getElementById('quote-name').value.trim(),
                company: document.getElementById('quote-company').value.trim(),
                phone: document.getElementById('quote-phone').value.trim(),
                city: document.getElementById('quote-city').value,
                quantity: document.getElementById('quote-qty').value,
                message: document.getElementById('quote-message').value.trim()
            };

            quotes.push(submission);
            localStorage.setItem('rb_quotes', JSON.stringify(quotes));

            // Transition to success state
            form.classList.add('hidden');
            successState.classList.remove('hidden');
            successState.classList.add('flex');
            
            requestAnimationFrame(() => {
                setTimeout(() => {
                    successIcon.classList.remove('scale-0');
                    successIcon.classList.add('scale-100');
                }, 50);
            });
        });

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        doneBtn.addEventListener('click', closeModal);
    }

    // ════════════════════════════════════════════════════════════
    //  HERO SLIDER LOGIC
    // ════════════════════════════════════════════════════════════

    function initHeroSlider() {
        const slider = document.getElementById('hero-slider');
        if (!slider) return;

        const track = document.getElementById('hero-track');
        const prevBtn = document.getElementById('hero-prev');
        const nextBtn = document.getElementById('hero-next');
        const dots = document.querySelectorAll('.hero-dot');
        const totalSlides = 4;
        let currentSlide = 0;
        let autoPlayTimer;

        function updateSlider() {
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.classList.add('bg-white', 'w-6');
                    dot.classList.remove('bg-white/50', 'w-2');
                } else {
                    dot.classList.remove('bg-white', 'w-6');
                    dot.classList.add('bg-white/50', 'w-2');
                }
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayTimer = setInterval(nextSlide, 5000);
        }

        function stopAutoPlay() {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
        }

        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoPlay();
        });

        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoPlay();
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                currentSlide = parseInt(dot.dataset.idx, 10);
                updateSlider();
                startAutoPlay();
            });
        });

        slider.addEventListener('mouseenter', stopAutoPlay);
        slider.addEventListener('mouseleave', startAutoPlay);

        // Init
        updateSlider();
        startAutoPlay();
    }

    // ════════════════════════════════════════════════════════════
    //  BRANDS MARQUEE
    // ════════════════════════════════════════════════════════════

    function initBrandsMarquee() {
        const track = document.getElementById('brands-marquee-track');
        if (!track) return;

        const displayBrands = BRANDS.filter(b => b.featured).slice(0, 16);
        const marqueeBrands = displayBrands.length >= 8 ? displayBrands : BRANDS.slice(0, 16);
        
        const renderTile = (b) => `
            <button class="marquee-brand-btn flex items-center justify-center min-w-[160px] h-[60px] bg-white rounded-lg border border-border-gray shadow-sm hover:shadow-md transition-all group hover-lift" data-brand="${b.name}">
                <span class="font-extrabold text-xl tracking-wider uppercase transition-colors" style="color: ${b.logoColor || '#333'};">
                    ${b.name}
                </span>
            </button>
        `;

        const tilesHTML = marqueeBrands.map(renderTile).join('');
        track.innerHTML = tilesHTML + tilesHTML; // Duplicate for seamless scroll

        track.addEventListener('click', e => {
            const btn = e.target.closest('.marquee-brand-btn');
            if (!btn) return;
            
            const brandName = btn.dataset.brand;
            const brandCheckboxes = document.querySelectorAll('input[name="brand"]');
            
            let found = false;
            brandCheckboxes.forEach(cb => {
                if (cb.value === brandName) {
                    cb.checked = true;
                    found = true;
                } else {
                    cb.checked = false;
                }
            });

            const brand = BRANDS.find(b => b.name === brandName);
            if (brand) {
                activeBrands.clear();
                activeBrands.add(brand.id);
                sidebarBrandEl.querySelectorAll('input.brand-checkbox').forEach(cb => {
                    cb.checked = cb.dataset.brandId === brand.id;
                });
                applyFilters(true);
                scrollToProductGrid();
            }
        });
    }

    // ════════════════════════════════════════════════════════════
    //  GLOBAL LIVE SEARCH
    // ════════════════════════════════════════════════════════════

    function initGlobalSearch() {
        const input    = document.getElementById('global-search');
        const dropdown = document.getElementById('search-dropdown');
        let activeIdx  = -1;
        let debounce;

        // ── Helpers ──────────────────────────────────────────
        function hl(text, q) {
            if (!q) return text;
            const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return text.replace(new RegExp(`(${safe})`, 'gi'),
                '<mark>$1</mark>');
        }

        function rows() { return dropdown.querySelectorAll('.search-row'); }

        function openDD() {
            dropdown.classList.add('sd-open');
            input.setAttribute('aria-expanded', 'true');
        }

        function closeDD() {
            dropdown.classList.remove('sd-open');
            input.setAttribute('aria-expanded', 'false');
            activeIdx = -1;
        }

        function setActive(idx) {
            rows().forEach((r, i) => r.classList.toggle('search-row-active', i === idx));
            activeIdx = idx;
            const el = rows()[idx];
            if (el) el.scrollIntoView({ block: 'nearest' });
        }

        // ── Render ──────────────────────────────────────────
        function renderDD(rawQuery) {
            const q = rawQuery.trim();
            if (!q) { closeDD(); return; }
            const lq = q.toLowerCase();

            const matchedBrands = BRANDS.filter(b =>
                b.name.toLowerCase().includes(lq) ||
                b.category.toLowerCase().includes(lq) ||
                b.country.toLowerCase().includes(lq)
            ).slice(0, 3);

            const matchedProducts = PRODUCTS.filter(p =>
                p.name.toLowerCase().includes(lq) ||
                p.sku.toLowerCase().includes(lq)  ||
                p.category.toLowerCase().includes(lq) ||
                p.brandId.toLowerCase().includes(lq)
            ).slice(0, 7);

            // Empty state
            if (!matchedBrands.length && !matchedProducts.length) {
                dropdown.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p><strong>No results</strong> for &ldquo;${q}&rdquo;</p>
                    <p style="font-size:0.75rem;margin-top:4px;">Try a brand name, category, or SKU</p>
                </div>`;
                openDD(); return;
            }

            let html = '';

            // ── Brands ───────────────────────────────────────
            if (matchedBrands.length) {
                html += `<div class="search-section-label">Brands</div>`;
                html += matchedBrands.map(b => `
                <div class="search-row" data-type="brand" data-id="${b.id}" role="option" tabindex="-1">
                    <div class="search-row-icon"
                         style="background:${b.logoColor}1a; border:1px solid ${b.logoColor}33;">
                        <i class="fas fa-tag" style="color:${b.logoColor}; font-size:13px;"></i>
                    </div>
                    <div class="search-row-body">
                        <span class="search-row-name">${hl(b.name, q)}</span>
                        <span class="search-row-meta">${b.category} · ${b.country}</span>
                    </div>
                    <span class="search-row-badge">Brand</span>
                </div>`).join('');
            }

            // ── Products ───────────────────────────────────
            if (matchedProducts.length) {
                html += `<div class="search-section-label">Products</div>`;
                html += matchedProducts.map(p => {
                    const b = BRANDS.find(b => b.id === p.brandId);
                    return `
                    <div class="search-row" data-type="product" data-id="${p.id}" role="option" tabindex="-1">
                        <div class="search-row-icon" style="background:var(--light-gray); border:1px solid var(--border-gray);">
                            <img src="${p.imagePath}" alt=""
                                 style="width:100%;height:100%;object-fit:contain;padding:4px;"
                                 onload="this.classList.add('loaded')"
                                 onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\'fas fa-box\' style=\'font-size:13px;color:var(--text-light)\'></i>';">
                        </div>
                        <div class="search-row-body">
                            <span class="search-row-name">${hl(p.name, q)}</span>
                            <span class="search-row-meta">
                                <span style="color:${b?.logoColor};font-weight:600;">${b?.name}</span>
                                &nbsp;·&nbsp;${p.category}
                            </span>
                        </div>
                        <span class="search-row-price">${p.priceLabel}</span>
                    </div>`;
                }).join('');
            }

            // ── Footer ──────────────────────────────────────
            const total = matchedBrands.length + matchedProducts.length;
            html += `<div class="search-footer">
                <i class="fas fa-search"></i>
                &ldquo;${q}&rdquo; &mdash; ${total} result${total !== 1 ? 's' : ''}
            </div>`;

            dropdown.innerHTML = html;
            openDD();
            activeIdx = -1;

            // ── Row interaction ─────────────────────────────
            dropdown.querySelectorAll('.search-row').forEach(row => {
                // Hover — sync activeIdx visually
                row.addEventListener('mouseenter', () => {
                    rows().forEach(r => r.classList.remove('search-row-active'));
                    row.classList.add('search-row-active');
                });

                // Click — act on result
                row.addEventListener('click', () => {
                    const type  = row.dataset.type;
                    const id    = row.dataset.id;
                    const label = row.querySelector('.search-row-name')?.textContent || id;

                    // Reset filters, then narrow
                    activeCategory = 'All';
                    activeBrands.clear();
                    sidebarBrandEl.querySelectorAll('input.brand-checkbox')
                        .forEach(cb => cb.checked = false);

                    if (type === 'brand') {
                        activeBrands.add(id);
                        const cb = sidebarBrandEl.querySelector(`input[data-brand-id="${id}"]`);
                        if (cb) cb.checked = true;
                        applyFilters();
                        showToast(`Showing all ${label} products`, 'info');

                    } else { // product
                        applyFilters(); // show all, then scroll to card
                        setTimeout(() => {
                            // Find the card by locating any atc-btn or get-quote btn with matching data
                            const btn = productGridEl.querySelector(`.atc-btn[data-product-id="${id}"]`);
                            const card = btn ? btn.closest('.fade-in') : null;
                            if (card) {
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Quick flash highlight
                                card.style.outline = '2px solid var(--primary)';
                                card.style.outlineOffset = '2px';
                                setTimeout(() => { card.style.outline = ''; card.style.outlineOffset = ''; }, 2000);
                            }
                        }, 80);
                        showToast(`Showing: ${label}`, 'success');
                    }

                    input.value = '';
                    closeDD();
                });
            });
        }

        // ── Events ─────────────────────────────────────────
        // Input — debounced 120ms
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => renderDD(input.value), 120);
        });

        // Keyboard navigation
        input.addEventListener('keydown', e => {
            const r = rows();
            if (!dropdown.classList.contains('sd-open')) return;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setActive(Math.min(activeIdx + 1, r.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setActive(Math.max(activeIdx - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (activeIdx >= 0 && r[activeIdx]) r[activeIdx].click();
                    break;
                case 'Escape':
                    closeDD();
                    input.blur();
                    break;
            }
        });

        // Close on outside click
        document.addEventListener('click', e => {
            if (!e.target.closest('#search-wrapper')) closeDD();
        });

        // Search button — trigger or focus
        document.getElementById('search-btn').addEventListener('click', () => {
            const v = input.value.trim();
            if (v) renderDD(v);
            else   input.focus();
        });
    }

    // ════════════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════════════
    //  SORT DROPDOWN
    // ════════════════════════════════════════════════════════════

    // Map <option> text → internal sort key
    const SORT_MAP = {
        'Best Selling':       'best-selling',
        'Price: Low to High': 'price-asc',
        'Price: High to Low': 'price-desc',
        'Newest Arrivals':    'newest',
    };

    function initSort() {
        const sortEl = document.getElementById('sort');
        if (!sortEl) return;

        sortEl.addEventListener('change', () => {
            const label = sortEl.options[sortEl.selectedIndex].text;
            const key   = SORT_MAP[label] || 'best-selling';

            if (key === activeSort) return; // no-op
            activeSort = key;
            applyFilters();

            const labels = {
                'best-selling': 'Sorted by Best Selling',
                'price-asc':    'Sorted: Price Low → High',
                'price-desc':   'Sorted: Price High → Low',
                'newest':       'Sorted by Newest Arrivals',
            };
            showToast(labels[key] || 'Sorted', 'info');
        });
    }

    // ════════════════════════════════════════════════════════════
    //  VIEW TOGGLE (GRID/LIST)
    // ════════════════════════════════════════════════════════════

    function initViewToggle() {
        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');
        if (!btnGrid || !btnList) return;

        function updateStyles() {
            if (currentLayout === 'grid') {
                btnGrid.classList.add('text-primary', 'border-primary');
                btnGrid.classList.remove('text-text-dark', 'text-text-light', 'border-border-gray');
                btnList.classList.add('text-text-light', 'border-border-gray');
                btnList.classList.remove('text-primary', 'border-primary', 'text-text-dark');
            } else {
                btnList.classList.add('text-primary', 'border-primary');
                btnList.classList.remove('text-text-dark', 'text-text-light', 'border-border-gray');
                btnGrid.classList.add('text-text-light', 'border-border-gray');
                btnGrid.classList.remove('text-primary', 'border-primary', 'text-text-dark');
            }
        }

        btnGrid.addEventListener('click', () => {
            if (currentLayout === 'grid') return;
            currentLayout = 'grid';
            localStorage.setItem('rb_layout', 'grid');
            updateStyles();
            applyFilters();
        });

        btnList.addEventListener('click', () => {
            if (currentLayout === 'list') return;
            currentLayout = 'list';
            localStorage.setItem('rb_layout', 'list');
            updateStyles();
            applyFilters();
        });

        updateStyles();
    }

    // ════════════════════════════════════════════════════════════
    //  ACCESSIBILITY, MOBILE, NEWSLETTER, POLISH
    // ════════════════════════════════════════════════════════════

    let focusTrapEl = null;
    let focusTrapPrev = null;

    function getFocusable(container) {
        return [...container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )].filter(el => el.offsetParent !== null);
    }

    function trapFocus(container) {
        focusTrapEl = container;
        focusTrapPrev = document.activeElement;
        const items = getFocusable(container);
        if (items[0]) items[0].focus();
    }

    function releaseFocusTrap() {
        focusTrapEl = null;
        if (focusTrapPrev?.focus) focusTrapPrev.focus();
        focusTrapPrev = null;
    }

    function initGlobalEscape() {
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            const qv = document.getElementById('quick-view-modal');
            if (qv?.classList.contains('pointer-events-auto')) {
                document.getElementById('close-quick-view')?.click();
                return;
            }
            const wish = document.getElementById('wishlist-modal');
            if (wish?.classList.contains('pointer-events-auto')) {
                document.getElementById('close-wishlist-modal')?.click();
                return;
            }
            const quote = document.getElementById('quote-modal');
            if (quote?.classList.contains('pointer-events-auto')) {
                document.getElementById('close-quote-modal')?.click();
                return;
            }
            const cmp = document.getElementById('compare-modal');
            if (cmp?.classList.contains('pointer-events-auto')) {
                document.getElementById('close-compare-modal')?.click();
                return;
            }
            if (document.getElementById('sidebar')?.classList.contains('drawer-open')) {
                closeMobileDrawer();
                return;
            }
            closeCartDrawer();
        });

        document.addEventListener('keydown', e => {
            if (e.key !== 'Tab' || !focusTrapEl) return;
            const items = getFocusable(focusTrapEl);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    function openMobileDrawer() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-drawer-overlay');
        const btn = document.getElementById('mobile-filters-btn');
        if (!sidebar) return;
        sidebar.classList.add('drawer-open');
        overlay?.classList.add('active');
        document.body.classList.add('drawer-open');
        if (btn) btn.setAttribute('aria-expanded', 'true');
    }

    function closeMobileDrawer() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-drawer-overlay');
        const btn = document.getElementById('mobile-filters-btn');
        sidebar?.classList.remove('drawer-open');
        overlay?.classList.remove('active');
        document.body.classList.remove('drawer-open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function initMobileDrawer() {
        document.getElementById('mobile-filters-btn')?.addEventListener('click', openMobileDrawer);
        document.getElementById('sidebar-drawer-close')?.addEventListener('click', closeMobileDrawer);
        document.getElementById('sidebar-drawer-overlay')?.addEventListener('click', closeMobileDrawer);
        sidebarBrandEl.addEventListener('change', () => {
            if (window.innerWidth < 1024) closeMobileDrawer();
        });
        sidebarCatEl.addEventListener('click', e => {
            if (e.target.closest('li[data-category]') && window.innerWidth < 1024) {
                setTimeout(closeMobileDrawer, 150);
            }
        });
    }

    function initLoadMore() {
        loadMoreBtn?.addEventListener('click', loadMoreProducts);
    }

    function initRecentlyViewedClear() {
        document.getElementById('clear-recently-viewed')?.addEventListener('click', () => {
            sessionStorage.removeItem(RECENT_KEY);
            renderRecentlyViewed();
            showToast('Recently viewed cleared', 'info');
        });
    }

    function initNewsletter() {
        const form = document.getElementById('newsletter-form');
        const emailInput = document.getElementById('newsletter-email');
        const success = document.getElementById('newsletter-success');
        const submitBtn = document.getElementById('newsletter-submit');
        if (!form) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!valid) {
                showToast('Please enter a valid email address', 'error');
                emailInput.focus();
                return;
            }
            success.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribed ✓';
            emailInput.value = '';
            showToast('Welcome! Check your inbox for B2B deals.', 'success');
        });
    }

    function initNavScrollBlur() {
        const onScroll = () => {
            if (!navBarEl) return;
            navBarEl.classList.toggle('nav-scrolled', window.scrollY > 20);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function initMobileStickyBar() {
        const bar = document.getElementById('mobile-sticky-bar');
        const backTop = document.getElementById('back-to-top');
        const header = document.querySelector('.header');
        if (!bar) return;

        document.getElementById('mobile-view-cart-btn')?.addEventListener('click', () => openCartDrawer());

        const onScroll = () => {
            const headerBottom = header ? header.getBoundingClientRect().bottom : 120;
            const pastToolbar = headerBottom < 0;
            const y = window.scrollY;
            bar.classList.toggle('visible', pastToolbar && y > 0);
            bar.setAttribute('aria-hidden', pastToolbar && y > 0 ? 'false' : 'true');
            if (backTop) {
                const showTop = y > 400;
                backTop.classList.toggle('visible', showTop);
                if (y <= 0) backTop.classList.remove('visible');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        onScroll();
    }

    function initFilterSections() {
        document.querySelectorAll('.filter-section').forEach(section => {
            const toggle = section.querySelector('.filter-section-toggle');
            const body = section.querySelector('.filter-section-body');
            if (!toggle || !body) return;
            toggle.addEventListener('click', () => {
                const collapsed = body.classList.toggle('collapsed');
                toggle.classList.toggle('collapsed', collapsed);
            });
        });
    }

    // ════════════════════════════════════════════════════════════
    //  THEME SWITCHER (Light / Dark / Gray)
    // ════════════════════════════════════════════════════════════

    const THEME_STORAGE_KEY = 'rb_theme';
    const VALID_THEMES = ['white-black', 'black-white', 'gray-white'];
    const DEFAULT_THEME = 'white-black';

    const THEME_META_COLORS = {
        'white-black': '#FFFFFF',
        'black-white': '#0A0A0A',
        'gray-white': '#2B2B2B',
    };

    function getStoredTheme() {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            return VALID_THEMES.includes(saved) ? saved : DEFAULT_THEME;
        } catch {
            return DEFAULT_THEME;
        }
    }

    function updateThemeMeta(theme) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = THEME_META_COLORS[theme] || THEME_META_COLORS[DEFAULT_THEME];
    }

    function setActiveThemeButton(theme) {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const on = btn.dataset.theme === theme;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function applyTheme(theme, persist = true) {
        const next = VALID_THEMES.includes(theme) ? theme : DEFAULT_THEME;
        document.documentElement.setAttribute('data-theme', next);
        document.documentElement.classList.toggle('dark', next === 'black-white' || next === 'gray-white');
        if (persist) {
            try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* private browsing */ }
        }
        updateThemeMeta(next);
        setActiveThemeButton(next);
    }

    function initThemeSwitcher() {
        applyTheme(getStoredTheme(), false);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (!theme || theme === document.documentElement.getAttribute('data-theme')) return;
                applyTheme(theme, true);
                const labels = {
                    'white-black': 'Light mode enabled',
                    'black-white': 'Dark mode enabled',
                    'gray-white': 'Gray mode enabled',
                };
                showToast(labels[theme] || 'Theme updated', 'info');
            });
        });
    }

    // ════════════════════════════════════════════════════════════
    //  BOOTSTRAP
    // ════════════════════════════════════════════════════════════

    function renderSkeletons() {
        const grid = document.getElementById('product-grid');
        const filterCat = document.getElementById('filter-categories');
        const filterBrands = document.getElementById('filter-brands');

        if (filterCat) {
            filterCat.innerHTML = Array(6).fill('').map(() => `
                <div class="flex items-center justify-between mb-3">
                    <div class="skeleton h-4 w-24"></div>
                    <div class="skeleton h-4 w-6 rounded-full"></div>
                </div>
            `).join('');
        }

        if (filterBrands) {
            filterBrands.innerHTML = Array(6).fill('').map(() => `
                <div class="flex items-center gap-2 mb-3">
                    <div class="skeleton w-4 h-4 rounded"></div>
                    <div class="skeleton h-4 w-20"></div>
                </div>
            `).join('');
        }

        if (grid) {
            if (currentLayout === 'list') {
                grid.innerHTML = Array(9).fill('').map(() => `
                    <div class="bg-white rounded-xl shadow-sm border border-border-gray overflow-hidden flex flex-col sm:flex-row p-4 gap-6 h-auto sm:h-[180px]">
                        <div class="skeleton w-full sm:w-32 h-40 sm:h-full rounded-lg flex-shrink-0"></div>
                        <div class="flex-grow flex flex-col justify-center py-2 min-w-0">
                            <div class="skeleton w-16 h-3 mb-2"></div>
                            <div class="skeleton w-3/4 h-5 mb-3"></div>
                            <div class="skeleton w-1/2 h-3 mb-2"></div>
                            <div class="skeleton w-1/3 h-3 mb-2"></div>
                        </div>
                        <div class="flex flex-col sm:items-end justify-center flex-shrink-0 sm:w-48 sm:pl-4 sm:border-l border-border-gray mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 self-stretch">
                            <div class="skeleton w-24 h-6 mb-2"></div>
                            <div class="skeleton w-12 h-3 mb-4"></div>
                            <div class="mt-auto w-full space-y-3">
                                <div class="skeleton w-16 h-3 ml-auto mb-2"></div>
                                <div class="skeleton w-full h-10 rounded"></div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = Array(9).fill('').map(() => `
                    <div class="bg-white rounded-xl shadow-sm border border-border-gray overflow-hidden flex flex-col p-4 h-[420px]">
                        <div class="skeleton w-full h-40 rounded-lg mb-4"></div>
                        <div class="skeleton w-16 h-3 mb-2"></div>
                        <div class="skeleton w-3/4 h-4 mb-4"></div>
                        <div class="skeleton w-1/2 h-3 mb-2"></div>
                        <div class="skeleton w-1/2 h-3 mb-4"></div>
                        <div class="mt-auto w-full">
                            <div class="skeleton w-24 h-5 mb-2"></div>
                            <div class="skeleton w-16 h-3 mb-4"></div>
                            <div class="space-y-3 mt-auto w-full">
                                <div class="skeleton w-20 h-4"></div>
                                <div class="skeleton w-full h-10 rounded"></div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    initThemeSwitcher();
    renderNav();
    syncNavHighlight('all');
    renderFooter();
    initCartDrawer();
    initSort();
    initViewToggle();
    initWishlist();
    initQuickView();
    initCompare();
    initQuote();
    initHeroSlider();
    initBrandsMarquee();
    initGlobalSearch();
    initGlobalEscape();
    initMobileDrawer();
    initLoadMore();
    initRecentlyViewedClear();
    initNewsletter();
    initNavScrollBlur();
    initMobileStickyBar();
    initFilterSections();

    renderSkeletons();

    setTimeout(() => {
        renderSidebarCategories();
        renderSidebarBrands();
        filteredCache = sortProducts(PRODUCTS);
        visibleCount = PAGE_SIZE;
        applyFilters(false);
        if (typeof initGridCartButtons === 'function') initGridCartButtons();
        initPriceSlider();
        prevCartQty = cartTotalQty();
        renderRecentlyViewed();
    }, 1200);
});


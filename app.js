// Acchiappasogni - Catalogo + Ordini WhatsApp
// Carica config.json e products.json, filtra, ordina e apre chat WhatsApp con messaggio precompilato.

const state = {
  config: null,
  products: [],
  filtered: [],
  selectedTags: new Set(),
  activeCategory: "all",
  search: "",
  sort: "featured",
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  selectedProduct: null,
};

const el = (id) => document.getElementById(id);

const gridEl = () => el("grid");
const statsEl = () => el("stats");

const searchInput = () => el("searchInput");
const categorySelect = () => el("categorySelect");
const sortSelect = () => el("sortSelect");
const minPriceInput = () => el("minPrice");
const maxPriceInput = () => el("maxPrice");
const applyPriceBtn = () => el("applyPrice");
const inStockOnly = () => el("inStockOnly");
const tagChips = () => el("tagChips");
const resetFiltersBtn = () => el("resetFilters");

const modal = () => el("modal");
const modalImage = () => el("modalImage");
const modalTitle = () => el("modalTitle");
const modalDesc = () => el("modalDesc");
const modalCategory = () => el("modalCategory");
const modalPrice = () => el("modalPrice");
const modalStock = () => el("modalStock");
const modalSku = () => el("modalSku");
const modalTags = () => el("modalTags");
const qtyInput = () => el("qtyInput");
const qtyMinus = () => el("qtyMinus");
const qtyPlus = () => el("qtyPlus");
const whatsappBtn = () => el("whatsappBtn");
const copyBtn = () => el("copyBtn");

function formatPriceEUR(value) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function safeText(str) {
  return (str || "").toString();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isInStock(product) {
  if (product == null) return false;
  if (typeof product.inStock === "boolean") return product.inStock;
  if (typeof product.stock === "number") return product.stock > 0;
  // fallback: if not specified, consider as available
  return true;
}

function productMatchesSearch(product, q) {
  const query = normalize(q);
  if (!query) return true;
  const hay = [
    product.name,
    product.description,
    product.category,
    ...(product.tags || []),
    ...(product.colors || []),
    product.sku,
  ]
    .filter(Boolean)
    .map(normalize)
    .join(" ");
  return hay.includes(query);
}

function productMatchesCategory(product, cat) {
  if (!cat || cat === "all") return true;
  return normalize(product.category) === normalize(cat);
}

function productMatchesTags(product, selectedTags) {
  if (!selectedTags || selectedTags.size === 0) return true;
  const tags = new Set((product.tags || []).map(normalize));
  for (const t of selectedTags) {
    if (!tags.has(normalize(t))) return false;
  }
  return true;
}

function productMatchesPrice(product, minP, maxP) {
  const p = Number(product.price);
  if (isNaN(p)) return false;
  if (minP != null && p < minP) return false;
  if (maxP != null && p > maxP) return false;
  return true;
}

function applyFilters() {
  const q = state.search;
  const cat = state.activeCategory;
  const minP = state.minPrice;
  const maxP = state.maxPrice;
  const inStock = state.inStockOnly;
  const tags = state.selectedTags;

  state.filtered = state.products
    .filter((p) => productMatchesSearch(p, q))
    .filter((p) => productMatchesCategory(p, cat))
    .filter((p) => productMatchesTags(p, tags))
    .filter((p) => productMatchesPrice(p, minP, maxP))
    .filter((p) => (inStock ? isInStock(p) : true));

  applySort();
  render();
}

function applySort() {
  const s = state.sort;
  const arr = [...state.filtered];

  const featuredOrder = (p) => {
    // featured true comes first, then optional featuredRank
    const ft = p.featured ? 0 : 1;
    const rank = typeof p.featuredRank === "number" ? p.featuredRank : 9999;
    return [ft, rank, normalize(p.name)];
  };

  const cmpTuple = (a, b) => {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  };

  arr.sort((a, b) => {
    if (s === "price_asc") return Number(a.price) - Number(b.price);
    if (s === "price_desc") return Number(b.price) - Number(a.price);
    if (s === "name_asc") return normalize(a.name).localeCompare(normalize(b.name));
    if (s === "name_desc") return normalize(b.name).localeCompare(normalize(a.name));
    // default featured
    return cmpTuple(featuredOrder(a), featuredOrder(b));
  });

  state.filtered = arr;
}

function uniqueCategories(products) {
  const set = new Set();
  products.forEach((p) => {
    if (p.category) set.add(p.category);
  });
  return Array.from(set).sort((a, b) => normalize(a).localeCompare(normalize(b)));
}

function uniqueTags(products) {
  const set = new Set();
  products.forEach((p) => {
    (p.tags || []).forEach((t) => set.add(t));
  });
  return Array.from(set).sort((a, b) => normalize(a).localeCompare(normalize(b)));
}

function renderCategories() {
  const cats = uniqueCategories(state.products);
  const sel = categorySelect();
  sel.innerHTML = `
    <option value="all">Tutte le categorie</option>
    ${cats.map((c) => `<option value="${safeText(c)}">${safeText(c)}</option>`).join("")}
  `;
  sel.value = state.activeCategory;
}

function renderTags() {
  const tags = uniqueTags(state.products);
  const root = tagChips();
  root.innerHTML = tags
    .map((t) => {
      const active = state.selectedTags.has(t);
      return `<button class="chip ${active ? "active" : ""}" data-tag="${safeText(t)}">${safeText(t)}</button>`;
    })
    .join("");

  // attach listeners
  root.querySelectorAll("[data-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.getAttribute("data-tag");
      if (!tag) return;
      if (state.selectedTags.has(tag)) state.selectedTags.delete(tag);
      else state.selectedTags.add(tag);
      renderTags();
      applyFilters();
    });
  });
}

function renderStats() {
  const total = state.products.length;
  const showing = state.filtered.length;

  const activeBits = [];
  if (state.search) activeBits.push(`Ricerca: <b>${safeText(state.search)}</b>`);
  if (state.activeCategory !== "all") activeBits.push(`Categoria: <b>${safeText(state.activeCategory)}</b>`);
  if (state.selectedTags.size > 0) activeBits.push(`Tag: <b>${Array.from(state.selectedTags).map(safeText).join(", ")}</b>`);
  if (state.minPrice != null) activeBits.push(`Min: <b>${formatPriceEUR(state.minPrice)}</b>`);
  if (state.maxPrice != null) activeBits.push(`Max: <b>${formatPriceEUR(state.maxPrice)}</b>`);
  if (state.inStockOnly) activeBits.push(`<b>Solo disponibili</b>`);

  statsEl().innerHTML = `
    <div class="stats-card">
      <div><b>${showing}</b> prodotti mostrati su <b>${total}</b></div>
      <div class="muted tiny">${activeBits.length ? activeBits.join(" • ") : "Nessun filtro attivo"}</div>
    </div>
  `;
}

function buildCard(product) {
  const img = product.image || product.imageUrl || product.photo || "";
  const price = formatPriceEUR(product.price);
  const stock = isInStock(product);
  const badge = stock ? `<span class="badge ok">Disponibile</span>` : `<span class="badge no">Non disponibile</span>`;
  const featured = product.featured ? `<span class="badge featured">In evidenza</span>` : "";

  return `
    <article class="card" data-id="${safeText(product.id)}">
      <div class="card-media">
        ${img ? `<img loading="lazy" src="${safeText(img)}" alt="${safeText(product.name)}" />` : `<div class="img-ph">Nessuna immagine</div>`}
      </div>

      <div class="card-body">
        <h3 class="card-title">${safeText(product.name)}</h3>
        <p class="card-desc muted">${safeText(product.short || product.description || "")}</p>

        <div class="card-row">
          <div class="price">${price}</div>
          <div class="badges">${featured}${badge}</div>
        </div>

        <div class="card-tags">
          ${(product.tags || []).slice(0, 3).map((t) => `<span class="mini-tag">${safeText(t)}</span>`).join("")}
        </div>

        <button class="btn primary full">Dettagli</button>
      </div>
    </article>
  `;
}

function renderGrid() {
  const root = gridEl();
  if (!state.filtered.length) {
    root.innerHTML = `
      <div class="empty">
        <h3>Nessun prodotto trovato</h3>
        <p class="muted">Prova a cambiare i filtri o la ricerca.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = state.filtered.map(buildCard).join("");

  root.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      const p = state.products.find((x) => safeText(x.id) === safeText(id));
      if (!p) return;
      openModal(p);
    });
  });
}

function render() {
  renderStats();
  renderGrid();
}

function openModal(product) {
  state.selectedProduct = product;

  const img = product.image || product.imageUrl || product.photo || "";
  modalImage().src = img || "";
  modalImage().alt = safeText(product.name || "");
  modalTitle().textContent = safeText(product.name || "");
  modalDesc().textContent = safeText(product.description || product.short || "");
  modalCategory().textContent = safeText(product.category || "—");
  modalPrice().textContent = formatPriceEUR(product.price);
  modalStock().textContent = isInStock(product) ? "Disponibile" : "Non disponibile";
  modalSku().textContent = safeText(product.sku || product.code || "—");

  modalTags().innerHTML = (product.tags || []).map((t) => `<span class="chip static">${safeText(t)}</span>`).join("");

  qtyInput().value = 1;

  modal().classList.remove("hidden");
  modal().setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  state.selectedProduct = null;
  modal().classList.add("hidden");
  modal().setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function buildWhatsAppMessage(product, qty) {
  const cfg = state.config || {};
  const shopName = cfg.shopName || "Acchiappasogni";
  const url = cfg.shopUrl || "";
  const note = cfg.orderNote || "";
  const sku = product.sku || product.code || product.id || "";
  const price = formatPriceEUR(product.price);

  const lines = [
    `Ciao! Vorrei ordinare da ${shopName} 🪶`,
    ``,
    `• Prodotto: ${safeText(product.name)}`,
    sku ? `• Codice: ${safeText(sku)}` : null,
    `• Quantità: ${qty}`,
    `• Prezzo: ${price}`,
    product.category ? `• Categoria: ${safeText(product.category)}` : null,
    product.tags && product.tags.length ? `• Tag: ${product.tags.map(safeText).join(", ")}` : null,
    url ? `` : null,
    url ? `Link: ${url}` : null,
    note ? `` : null,
    note ? safeText(note) : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function openWhatsApp(product, qty) {
  const cfg = state.config || {};
  const phone = (cfg.whatsappPhone || "").replace(/[^\d+]/g, "");
  const msg = buildWhatsAppMessage(product, qty);

  // WhatsApp click-to-chat
  const base = "https://wa.me/";
  const target = phone ? `${base}${encodeURIComponent(phone)}` : "https://wa.me/";
  const full = `${target}?text=${encodeURIComponent(msg)}`;
  window.open(full, "_blank", "noopener");
}

async function copyDetails(product, qty) {
  const text = buildWhatsAppMessage(product, qty);
  try {
    await navigator.clipboard.writeText(text);
    copyBtn().textContent = "Copiato ✅";
    setTimeout(() => (copyBtn().textContent = "Copia dettagli"), 1200);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    copyBtn().textContent = "Copiato ✅";
    setTimeout(() => (copyBtn().textContent = "Copia dettagli"), 1200);
  }
}

function wireUI() {
  searchInput().addEventListener("input", (e) => {
    state.search = e.target.value || "";
    applyFilters();
  });

  categorySelect().addEventListener("change", (e) => {
    state.activeCategory = e.target.value || "all";
    applyFilters();
  });

  sortSelect().addEventListener("change", (e) => {
    state.sort = e.target.value || "featured";
    applyFilters();
  });

  applyPriceBtn().addEventListener("click", () => {
    const minV = minPriceInput().value.trim();
    const maxV = maxPriceInput().value.trim();

    state.minPrice = minV ? Number(minV) : null;
    state.maxPrice = maxV ? Number(maxV) : null;

    if (state.minPrice != null && isNaN(state.minPrice)) state.minPrice = null;
    if (state.maxPrice != null && isNaN(state.maxPrice)) state.maxPrice = null;

    applyFilters();
  });

  inStockOnly().addEventListener("change", (e) => {
    state.inStockOnly = !!e.target.checked;
    applyFilters();
  });

  resetFiltersBtn().addEventListener("click", () => {
    state.selectedTags.clear();
    state.activeCategory = "all";
    state.search = "";
    state.sort = "featured";
    state.minPrice = null;
    state.maxPrice = null;
    state.inStockOnly = false;

    searchInput().value = "";
    categorySelect().value = "all";
    sortSelect().value = "featured";
    minPriceInput().value = "";
    maxPriceInput().value = "";
    inStockOnly().checked = false;

    renderTags();
    applyFilters();
  });

  // Modal close: backdrop or close button
  modal().addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "true") closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal().classList.contains("hidden")) closeModal();
  });

  qtyMinus().addEventListener("click", () => {
    const v = Number(qtyInput().value || 1);
    qtyInput().value = clamp(v - 1, 1, 999);
  });

  qtyPlus().addEventListener("click", () => {
    const v = Number(qtyInput().value || 1);
    qtyInput().value = clamp(v + 1, 1, 999);
  });

  whatsappBtn().addEventListener("click", () => {
    if (!state.selectedProduct) return;
    const qty = clamp(Number(qtyInput().value || 1), 1, 999);
    openWhatsApp(state.selectedProduct, qty);
  });

  copyBtn().addEventListener("click", () => {
    if (!state.selectedProduct) return;
    const qty = clamp(Number(qtyInput().value || 1), 1, 999);
    copyDetails(state.selectedProduct, qty);
  });

  el("year").textContent = new Date().getFullYear();
}

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Errore caricamento ${path}: ${res.status}`);
  return await res.json();
}

async function init() {
  try {
    const [cfg, products] = await Promise.all([
      loadJSON("data/config.json"),
      loadJSON("data/products.json"),
    ]);

    state.config = cfg;
    state.products = Array.isArray(products) ? products : (products.items || []);
    state.filtered = [...state.products];

    // prefill WhatsApp button label if present
    if (cfg && cfg.whatsappLabel) whatsappBtn().textContent = cfg.whatsappLabel;

    renderCategories();
    renderTags();
    wireUI();
    applyFilters();
  } catch (err) {
    console.error(err);
    gridEl().innerHTML = `
      <div class="empty">
        <h3>Errore caricamento</h3>
        <p class="muted">Controlla che i file <b>data/config.json</b> e <b>data/products.json</b> siano presenti.</p>
        <pre class="tiny muted">${safeText(err.message || err)}</pre>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", init);

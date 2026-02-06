const state = {
  config: null,
  products: [],
  baseProducts: [],
  categories: [],
  activeCategory: "Tutti",
  query: "",
  cart: {}
};

const $ = (s) => document.querySelector(s);

// =====================
//  IMMAGINI (fallback)
// =====================
const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="#f1f1f1"/>
    <text x="50%" y="50%" font-size="28" text-anchor="middle" fill="#777" font-family="Arial">
      Immagine non trovata
    </text>
  </svg>`);

function buildImageCandidates(raw) {
  const original = String(raw || "").trim();
  const candidates = [];
  if (original) candidates.push(original);

  if (original && original.startsWith("assets/")) candidates.push("./" + original);
  if (original && original.startsWith("./assets/")) candidates.push(original.replace("./", ""));

  return Array.from(new Set(candidates.filter(Boolean)));
}

function attachImageFallback(imgEl, rawImageValue) {
  const tries = buildImageCandidates(rawImageValue);
  let i = 0;

  function tryNext() {
    if (i >= tries.length) {
      imgEl.src = IMG_PLACEHOLDER;
      return;
    }
    imgEl.src = tries[i++];
  }

  imgEl.onerror = () => tryNext();
  tryNext();
}

// =====================
//  UTILS
// =====================
function euroFromCents(c) {
  return `€ ${(c / 100).toFixed(2).replace(".", ",")}`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}
function parseCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "{}") || {}; }
  catch { return {}; }
}
function saveCart() { localStorage.setItem("cart", JSON.stringify(state.cart)); }
function cartCount() { return Object.values(state.cart).reduce((a, b) => a + b, 0); }
function updateCartBadge() { $("#cartCount").textContent = cartCount(); }

function openCart() {
  $("#drawer").classList.remove("hidden");
  $("#drawerBackdrop").classList.remove("hidden");
  $("#drawer").setAttribute("aria-hidden", "false");
}
function closeCart() {
  $("#drawer").classList.add("hidden");
  $("#drawerBackdrop").classList.add("hidden");
  $("#drawer").setAttribute("aria-hidden", "true");
}

// Prezzi: supporta priceCents, price, price_from
function productPriceCents(p) {
  if (typeof p.priceCents === "number") return p.priceCents;
  if (typeof p.price === "number") return Math.round(p.price * 100);
  if (typeof p.price_from === "number") return Math.round(p.price_from * 100);
  return 0;
}

// =====================
//  ADMIN STORAGE
// =====================
const LS_ADMIN_PASSWORD = "admin_password_v1";
const LS_PRODUCTS_OVERRIDE = "products_override_v1";
const LS_ADMIN_UNLOCKED = "admin_unlocked_v1";
const LS_SORT_MODE = "sort_mode_v1";

function getAdminPassword() { return localStorage.getItem(LS_ADMIN_PASSWORD) || "1234"; }
function setAdminPassword(p) { localStorage.setItem(LS_ADMIN_PASSWORD, p); }

function loadOverrideProducts() {
  try {
    const raw = localStorage.getItem(LS_PRODUCTS_OVERRIDE);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch { return null; }
}
function saveOverrideProducts(arr) { localStorage.setItem(LS_PRODUCTS_OVERRIDE, JSON.stringify(arr)); }
function resetOverrideProducts() { localStorage.removeItem(LS_PRODUCTS_OVERRIDE); }

function getSortMode() { return localStorage.getItem(LS_SORT_MODE) || "featured"; }
function setSortMode(m) { localStorage.setItem(LS_SORT_MODE, m); }

// =====================
//  FILTRI + SORT
// =====================
function matches(p) {
  const q = state.query.trim().toLowerCase();
  const catOk = state.activeCategory === "Tutti" || (p.category || "") === state.activeCategory;
  if (!q) return catOk;
  const hay = `${p.title || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
  return catOk && hay.includes(q);
}

function sortProducts(list) {
  const mode = getSortMode();

  if (mode === "featured") {
    // featured first, poi newest
    return list.sort((a, b) => {
      const fa = a.featured ? 1 : 0;
      const fb = b.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      const da = Number(a.createdAt || 0);
      const db = Number(b.createdAt || 0);
      return db - da;
    });
  }

  if (mode === "newest") {
    return list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }

  if (mode === "title") {
    return list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "it"));
  }

  if (mode === "priceAsc") {
    return list.sort((a, b) => productPriceCents(a) - productPriceCents(b));
  }

  if (mode === "priceDesc") {
    return list.sort((a, b) => productPriceCents(b) - productPriceCents(a));
  }

  return list;
}

// =====================
//  CART
// =====================
function setQty(id, qty) {
  qty = Math.max(0, qty | 0);
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;

  saveCart();
  updateCartBadge();
  renderCart();
  renderTotals();
  renderGrid();
}

// =====================
//  GRID
// =====================
function renderGrid() {
  const grid = $("#grid");
  grid.innerHTML = "";

  const list = sortProducts(state.products.filter(matches).slice());

  if (!list.length) {
    grid.innerHTML = `<div style="color:var(--muted); padding:12px;">Nessun prodotto trovato.</div>`;
    return;
  }

  list.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img loading="lazy" data-img alt="${escapeHtml(p.title)}" />
      <div class="content">
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml(p.category || "")}</div>
        <div class="price">${euroFromCents(productPriceCents(p))}</div>
        <div class="row">
          <div class="qty">
            <button data-minus>-</button>
            <span>${state.cart[p.id] || 0}</span>
            <button data-plus>+</button>
          </div>
          <button class="btn small" data-add>Aggiungi</button>
        </div>
      </div>`;

    attachImageFallback(card.querySelector("[data-img]"), p.image);

    card.querySelector("[data-minus]").onclick = () => setQty(p.id, (state.cart[p.id] || 0) - 1);
    card.querySelector("[data-plus]").onclick = () => setQty(p.id, (state.cart[p.id] || 0) + 1);
    card.querySelector("[data-add]").onclick = () => { setQty(p.id, (state.cart[p.id] || 0) + 1); openCart(); };

    grid.appendChild(card);
  });
}

// =====================
//  CART RENDER
// =====================
function renderCart() {
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  const ids = Object.keys(state.cart);

  if (!ids.length) {
    wrap.innerHTML = `<div style="color:var(--muted); padding:10px;">Carrello vuoto.</div>`;
    return;
  }

  ids.forEach((id) => {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;

    const qty = state.cart[id] || 0;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img data-img alt="${escapeHtml(p.title)}"/>
      <div>
        <div class="ci-title">${escapeHtml(p.title)}</div>
        <div class="ci-meta">${escapeHtml(p.category || "")}</div>
        <div class="ci-price">${euroFromCents(productPriceCents(p))}</div>
      </div>
      <div class="qty" style="justify-content:flex-end; align-self:center;">
        <button data-minus>-</button>
        <span>${qty}</span>
        <button data-plus>+</button>
      </div>`;

    attachImageFallback(div.querySelector("[data-img]"), p.image);

    div.querySelector("[data-minus]").onclick = () => setQty(id, qty - 1);
    div.querySelector("[data-plus]").onclick = () => setQty(id, qty + 1);

    wrap.appendChild(div);
  });
}

// =====================
//  TOTALS
// =====================
function renderTotals() {
  const ids = Object.keys(state.cart);
  let subtotal = 0;

  ids.forEach((id) => {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    subtotal += productPriceCents(p) * (state.cart[id] || 0);
  });

  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
  let shipping = 0;
  let hint = "";

  if (delivery === "pickup") {
    shipping = 0;
    hint = "Ritiro/consegna a mano: niente spedizione.";
  } else {
    const cfg = state.config || {};
    const base = typeof cfg.shippingBaseCents === "number" ? cfg.shippingBaseCents : 0;
    const freeOver = typeof cfg.freeShippingOverCents === "number" ? cfg.freeShippingOverCents : null;

    if (freeOver != null && subtotal >= freeOver) {
      shipping = 0;
      hint = `Spedizione gratuita sopra ${euroFromCents(freeOver)} ✅`;
    } else {
      shipping = base;
      if (freeOver != null) {
        const missing = Math.max(0, freeOver - subtotal);
        hint = missing > 0 ? `Aggiungi ${euroFromCents(missing)} per la spedizione gratuita.` : "";
      }
    }
  }

  $("#subtotal").textContent = euroFromCents(subtotal);
  $("#shipping").textContent = euroFromCents(shipping);
  $("#total").textContent = euroFromCents(subtotal + shipping);
  $("#shippingHint").textContent = hint;
}

// =====================
//  WHATSAPP
// =====================
function buildWhatsAppMessage() {
  const ids = Object.keys(state.cart);
  const lines = [];
  lines.push(`Ciao! Vorrei ordinare:`);
  lines.push("");

  ids.forEach((id) => {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    const qty = state.cart[id] || 0;
    lines.push(`• ${qty} x ${p.title} — ${euroFromCents(productPriceCents(p))}`);
  });

  lines.push("");
  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
  lines.push(`Consegna: ${delivery === "pickup" ? "Ritiro / a mano" : "Spedizione"}`);

  const name = $("#name").value.trim();
  const street = $("#street").value.trim();
  const cap = $("#cap").value.trim();
  const city = $("#city").value.trim();
  const notes = $("#notes").value.trim();

  if (name) lines.push(`Nome: ${name}`);
  if (delivery !== "pickup") {
    if (street) lines.push(`Indirizzo: ${street}`);
    if (cap || city) lines.push(`CAP/Città: ${cap} ${city}`.trim());
  }
  if (notes) { lines.push(""); lines.push(`Note: ${notes}`); }

  return lines.join("\n");
}

// =====================
//  TABS
// =====================
function renderTabs() {
  const tabs = $("#tabs");
  tabs.innerHTML = "";

  state.categories.forEach((cat) => {
    const b = document.createElement("button");
    b.className = "tab" + (cat === state.activeCategory ? " active" : "");
    b.textContent = cat;
    b.onclick = () => {
      state.activeCategory = cat;
      renderTabs();
      renderGrid();
    };
    tabs.appendChild(b);
  });
}

function rebuildCategories() {
  const cats = new Set(["Tutti"]);
  state.products.forEach((p) => cats.add(p.category || "Altro"));
  state.categories = Array.from(cats);

  if (!state.categories.includes(state.activeCategory)) state.activeCategory = "Tutti";
  renderTabs();
}

// =====================
//  SETTINGS UI
// =====================
function openSettings() {
  $("#settingsModal").classList.remove("hidden");
  $("#settingsBackdrop").classList.remove("hidden");
  $("#settingsModal").setAttribute("aria-hidden", "false");

  const unlocked = localStorage.getItem(LS_ADMIN_UNLOCKED) === "1";
  $("#settingsLocked").classList.toggle("hidden", unlocked);
  $("#settingsPanel").classList.toggle("hidden", !unlocked);

  if ($("#sortMode")) $("#sortMode").value = getSortMode();
  if (unlocked) renderAdminList();
}

function closeSettings() {
  $("#settingsModal").classList.add("hidden");
  $("#settingsBackdrop").classList.add("hidden");
  $("#settingsModal").setAttribute("aria-hidden", "true");
}

function renderAdminList() {
  const wrap = $("#adminList");
  wrap.innerHTML = "";

  const list = sortProducts(state.products.slice());

  list.forEach((p) => {
    const row = document.createElement("div");
    row.style.border = "1px solid rgba(0,0,0,.08)";
    row.style.borderRadius = "12px";
    row.style.padding = "10px";
    row.style.marginBottom = "10px";

    row.innerHTML = `
      <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(p.title)}</div>

      <div style="display:flex; gap:8px; margin-bottom:10px;">
        <button class="btn small" data-dup>Duplica</button>
        <button class="btn danger small" data-del>Elimina</button>
      </div>

      <div style="display:grid; gap:8px;">
        <label class="field">
          <span>Prezzo (€)</span>
          <input data-price type="number" step="0.01" value="${(productPriceCents(p) / 100).toFixed(2)}" />
        </label>

        <label class="field">
          <span>Categoria</span>
          <input data-category type="text" value="${escapeHtml(p.category || "")}" />
        </label>

        <label class="field">
          <span>Immagine (path)</span>
          <input data-image type="text" value="${escapeHtml(p.image || "")}" />
        </label>

        <label style="display:flex; gap:8px; align-items:center;">
          <input data-featured type="checkbox" ${p.featured ? "checked" : ""} />
          <span>In evidenza</span>
        </label>
      </div>
    `;

    row.querySelector("[data-price]").dataset.id = p.id;
    row.querySelector("[data-category]").dataset.id = p.id;
    row.querySelector("[data-image]").dataset.id = p.id;
    row.querySelector("[data-featured]").dataset.id = p.id;

    row.querySelector("[data-dup]").onclick = () => duplicateProduct(p.id);
    row.querySelector("[data-del]").onclick = () => deleteProduct(p.id);

    wrap.appendChild(row);
  });
}

function applyAdminEditsToState() {
  const priceInputs = Array.from(document.querySelectorAll("#adminList [data-price]"));
  const catInputs = Array.from(document.querySelectorAll("#adminList [data-category]"));
  const imgInputs = Array.from(document.querySelectorAll("#adminList [data-image]"));
  const featInputs = Array.from(document.querySelectorAll("#adminList [data-featured]"));

  const map = new Map(state.products.map((p) => [p.id, p]));

  priceInputs.forEach((i) => {
    const p = map.get(i.dataset.id);
    if (!p) return;
    const v = parseFloat(i.value);
    if (!Number.isFinite(v)) return;
    p.price_from = v;
    p.price = v;
    delete p.priceCents;
  });

  catInputs.forEach((i) => {
    const p = map.get(i.dataset.id);
    if (!p) return;
    p.category = i.value.trim() || "Altro";
  });

  imgInputs.forEach((i) => {
    const p = map.get(i.dataset.id);
    if (!p) return;
    p.image = i.value.trim();
  });

  featInputs.forEach((i) => {
    const p = map.get(i.dataset.id);
    if (!p) return;
    p.featured = !!i.checked;
  });
}

function addNewProductFromForm() {
  const title = $("#newTitle").value.trim();
  const category = $("#newCategory").value.trim() || "Altro";
  const price = parseFloat($("#newPrice").value);
  const description =
    $("#newDesc").value.trim() ||
    "Prodotto artigianale fatto a mano da Erika. Personalizzabile su richiesta.";
  const image = $("#newImage").value.trim();
  const featured = $("#newFeatured").checked;

  if (!title) return alert("Inserisci un titolo.");
  if (!Number.isFinite(price)) return alert("Inserisci un prezzo valido.");
  if (!image) return alert("Inserisci il path immagine.");

  const id = "AE-" + Date.now();

  const p = {
    id,
    title,
    category,
    price,
    price_from: price,
    description,
    image,
    featured,
    createdAt: Date.now()
  };

  state.products.unshift(p);
  rebuildCategories();
  renderGrid();
  renderAdminList();

  $("#newTitle").value = "";
  $("#newCategory").value = "";
  $("#newPrice").value = "";
  $("#newDesc").value = "";
  $("#newImage").value = "";
  $("#newFeatured").checked = false;

  alert("Progetto aggiunto ✅");
}

function duplicateProduct(id) {
  const original = state.products.find(p => p.id === id);
  if (!original) return;

  const copy = JSON.parse(JSON.stringify(original));
  copy.id = "AE-" + Date.now();
  copy.title = (copy.title || "Prodotto") + " (copia)";
  copy.createdAt = Date.now();

  state.products.unshift(copy);
  rebuildCategories();
  renderGrid();
  renderAdminList();
}

function deleteProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  if (!confirm(`Eliminare "${p.title}"?`)) return;

  // rimuovi dal catalogo
  state.products = state.products.filter(x => x.id !== id);

  // rimuovi dal carrello se presente
  if (state.cart[id]) {
    delete state.cart[id];
    saveCart();
    updateCartBadge();
  }

  rebuildCategories();
  renderGrid();
  renderCart();
  renderTotals();
  renderAdminList();
}

// =====================
//  LOAD DATA
// =====================
async function loadData() {
  try {
    const cfg = await fetch("data/config.json").then((r) => r.json());
    state.config = cfg;
    if (cfg.brandName) $("#brandName").textContent = cfg.brandName;
  } catch {
    state.config = {};
  }

  const prods = await fetch("data/products.json").then((r) => r.json());
  const baseArr = Array.isArray(prods) ? prods : (prods.products || []);
  state.baseProducts = baseArr;

  const override = loadOverrideProducts();
  state.products = override ? override : baseArr;

  // se mancano createdAt, aggiungilo una volta (solo in memoria)
  state.products.forEach((p, idx) => {
    if (!p.createdAt) p.createdAt = Date.now() - idx;
  });

  rebuildCategories();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge();
}

// =====================
//  EVENTS
// =====================
function hookEvents() {
  // cart
  $("#btnCart").onclick = () => openCart();
  $("#btnCloseCart").onclick = () => closeCart();
  $("#drawerBackdrop").onclick = () => closeCart();

  // search
  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value || "";
    renderGrid();
  });

  // delivery toggle
  document.querySelectorAll('input[name="delivery"]').forEach((r) => {
    r.addEventListener("change", () => {
      const v = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
      $("#shippingFields").style.display = v === "pickup" ? "none" : "";
      renderTotals();
    });
  });

  // whatsapp
  $("#btnSend").onclick = () => {
    const msg = buildWhatsAppMessage();
    const phone = state.config?.whatsappPhone ? state.config.whatsappPhone : "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // clear cart
  $("#btnClear").onclick = () => {
    if (confirm("Vuoi svuotare il carrello?")) {
      state.cart = {};
      saveCart();
      updateCartBadge();
      renderCart();
      renderTotals();
      renderGrid();
    }
  };

  // custom
  $("#btnCustom").onclick = () => {
    const phone = state.config?.whatsappPhone ? state.config.whatsappPhone : "";
    const msg = "Ciao! Vorrei un prodotto personalizzato. 😊";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // settings
  $("#btnSettings").onclick = () => openSettings();
  $("#btnCloseSettings").onclick = () => closeSettings();
  $("#settingsBackdrop").onclick = () => closeSettings();

  // unlock
  $("#btnUnlock").onclick = () => {
    const pass = $("#adminPass").value;
    if (pass === getAdminPassword()) {
      localStorage.setItem(LS_ADMIN_UNLOCKED, "1");
      $("#adminPass").value = "";
      $("#settingsLocked").classList.add("hidden");
      $("#settingsPanel").classList.remove("hidden");
      $("#sortMode").value = getSortMode();
      renderAdminList();
    } else {
      alert("Password errata.");
    }
  };

  // change password
  $("#btnChangePass").onclick = () => {
    const p1 = $("#newAdminPass").value.trim();
    const p2 = $("#newAdminPass2").value.trim();

    if (p1.length < 4) return alert("Password troppo corta (minimo 4 caratteri).");
    if (p1 !== p2) return alert("Le due password non coincidono.");

    setAdminPassword(p1);
    $("#newAdminPass").value = "";
    $("#newAdminPass2").value = "";
    alert("Password aggiornata ✅");
  };

  // sort apply
  $("#btnApplySort").onclick = () => {
    setSortMode($("#sortMode").value);
    renderGrid();
    renderAdminList();
    alert("Ordinamento applicato ✅");
  };

  // add product
  $("#btnAddProduct").onclick = () => addNewProductFromForm();

  // save edits
  $("#btnSaveAll").onclick = () => {
    applyAdminEditsToState();
    saveOverrideProducts(state.products);
    rebuildCategories();
    renderGrid();
    renderCart();
    renderTotals();
    renderAdminList();
    alert("Modifiche salvate ✅");
  };

  // reset
  $("#btnResetAll").onclick = () => {
    if (confirm("Ripristinare i prodotti originali (da products.json)?")) {
      resetOverrideProducts();
      localStorage.removeItem(LS_ADMIN_UNLOCKED);
      state.products = state.baseProducts;

      state.products.forEach((p, idx) => {
        if (!p.createdAt) p.createdAt = Date.now() - idx;
      });

      rebuildCategories();
      renderGrid();
      renderCart();
      renderTotals();
      alert("Ripristinato ✅");
      closeSettings();
    }
  };
}

(function init() {
  state.cart = parseCart();
  hookEvents();
  loadData();
})();

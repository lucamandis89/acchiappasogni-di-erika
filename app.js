// ===============================
// PATHS + LOCAL OVERRIDE KEY
// ===============================
const CONFIG_URL = "data/config.json";
const PRODUCTS_URL = "data/products.json";
const ADMIN_LOCAL_KEY = "AE_PRODUCTS_OVERRIDE_V1";

// ===============================
// HELPERS
// ===============================
const $ = (s) => document.querySelector(s);

function euro(v) {
  const n = Number(v || 0);
  return "€ " + n.toFixed(2).replace(".", ",");
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}

function safeNum(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

// ===============================
// CART STORAGE
// ===============================
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "{}") || {};
  } catch {
    return {};
  }
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}
function cartCount(cart) {
  return Object.values(cart).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

// ===============================
// PRODUCTS FETCH (LOCAL OVERRIDE)
// ===============================
async function fetchProductsWithLocalOverride() {
  // 1) Se esistono prodotti modificati in locale (da pannello admin), usa quelli
  const local = localStorage.getItem(ADMIN_LOCAL_KEY);
  if (local) {
    try {
      const arr = JSON.parse(local);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) {
      console.warn("Errore JSON localStorage prodotti:", e);
    }
  }

  // 2) Altrimenti carica dal file GitHub
  const res = await fetch(PRODUCTS_URL + "?t=" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error("Errore caricamento products.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("products.json non valido (non è un array)");
  return data;
}

// ===============================
// STATE
// ===============================
const state = {
  config: null,
  products: [],
  categories: [],
  activeCategory: "Tutti",
  searchQuery: "",
  cart: loadCart(),
};

// ===============================
// CONFIG NORMALIZATION (supporta più nomi campo)
// ===============================
function getWhatsappNumber() {
  // supporto vari nomi possibili
  const raw =
    state.config?.whatsappNumber ||
    state.config?.whatsapp ||
    state.config?.phone ||
    "";
  return String(raw).replace(/\D/g, "");
}

function getShippingFee() {
  // supporto: shippingFee, shippingFeeCents
  if (state.config?.shippingFeeCents != null) return safeNum(state.config.shippingFeeCents, 0) / 100;
  return safeNum(state.config?.shippingFee, 0);
}

function getFreeOver() {
  // supporto: freeShippingOver, freeOverCents
  if (state.config?.freeOverCents != null) return safeNum(state.config.freeOverCents, 0) / 100;
  return safeNum(state.config?.freeShippingOver, 0);
}

// ===============================
// UI: CATEGORIES / TABS
// ===============================
function buildCategories() {
  const set = new Set(["Tutti"]);
  state.products.forEach((p) => {
    const c = String(p.category || "").trim();
    if (c) set.add(c);
  });
  state.categories = Array.from(set);
}

function renderTabs() {
  const tabs = $("#tabs");
  if (!tabs) return;
  tabs.innerHTML = "";

  state.categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "tab" + (cat === state.activeCategory ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      state.activeCategory = cat;
      renderTabs();
      renderGrid();
    };
    tabs.appendChild(btn);
  });
}

function matchProduct(p) {
  const catOk =
    state.activeCategory === "Tutti" ||
    String(p.category || "").trim() === state.activeCategory;

  const text = (String(p.title || "") + " " + String(p.description || "")).toLowerCase();
  const qOk = !state.searchQuery || text.includes(state.searchQuery);

  return catOk && qOk;
}

// ===============================
// UI: GRID
// ===============================
function renderGrid() {
  const grid = $("#grid");
  if (!grid) return;
  grid.innerHTML = "";

  const list = state.products.filter(matchProduct);

  if (!list.length) {
    grid.innerHTML = `<div style="padding:12px; opacity:.7;">Nessun prodotto trovato.</div>`;
    return;
  }

  // featured prima
  list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  list.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";

    const imgHtml = p.image
      ? `<img class="card-img" src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy"
           onerror="this.style.display='none';" />`
      : "";

    const price = (p.price_from == null) ? 5 : p.price_from;

    card.innerHTML = `
      ${imgHtml}
      <div class="card-body">
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="card-cat">${escapeHtml(p.category || "")}</div>
        <div class="card-price">${euro(price)}</div>

        <div class="card-actions">
          <button class="btn small" data-minus>-</button>
          <span class="qty" data-qty>1</span>
          <button class="btn small" data-plus>+</button>
          <button class="btn primary" data-add>Aggiungi</button>
        </div>
      </div>
    `;

    let qty = 1;
    const qtyEl = card.querySelector("[data-qty]");
    card.querySelector("[data-minus]").onclick = () => {
      qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
    };
    card.querySelector("[data-plus]").onclick = () => {
      qty++;
      qtyEl.textContent = qty;
    };
    card.querySelector("[data-add]").onclick = () => {
      addToCart(p.id, qty);
      openCart();
    };

    grid.appendChild(card);
  });
}

// ===============================
// CART
// ===============================
function updateCartBadge() {
  const badge = $("#cartCount");
  if (!badge) return;
  badge.textContent = cartCount(state.cart);
}

function addToCart(id, qty) {
  state.cart[id] = (state.cart[id] || 0) + qty;
  if (state.cart[id] <= 0) delete state.cart[id];
  saveCart(state.cart);
  updateCartBadge();
}

function setCartQty(id, qty) {
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;

  saveCart(state.cart);
  updateCartBadge();
  renderCart();
  renderTotals();
}

function computeSubtotal() {
  let sum = 0;
  for (const [id, qty] of Object.entries(state.cart)) {
    const p = state.products.find((x) => x.id === id);
    if (!p) continue;
    const price = (p.price_from == null) ? 5 : safeNum(p.price_from, 5);
    sum += price * safeNum(qty, 0);
  }
  return sum;
}

function currentDelivery() {
  return document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
}

function computeShipping(subtotal) {
  if (currentDelivery() !== "shipping") return 0;

  const fee = getShippingFee();
  const freeOver = getFreeOver();
  if (freeOver > 0 && subtotal >= freeOver) return 0;

  return fee;
}

function renderShippingHint(sub, ship) {
  const hint = $("#shippingHint");
  if (!hint) return;

  if (currentDelivery() !== "shipping") {
    hint.textContent = "";
    return;
  }

  const freeOver = getFreeOver();
  if (freeOver > 0) {
    if (sub >= freeOver) {
      hint.textContent = "Spedizione gratis applicata.";
    } else {
      const diff = freeOver - sub;
      hint.textContent = `Mancano ${euro(diff)} per la spedizione gratis.`;
    }
  } else {
    hint.textContent = ship > 0 ? `Spedizione: ${euro(ship)}` : "";
  }
}

function renderTotals() {
  const sub = computeSubtotal();
  const ship = computeShipping(sub);
  const tot = sub + ship;

  $("#subtotal").textContent = euro(sub);
  $("#shipping").textContent = euro(ship);
  $("#total").textContent = euro(tot);

  renderShippingHint(sub, ship);
}

function renderCart() {
  const wrap = $("#cartItems");
  if (!wrap) return;

  wrap.innerHTML = "";

  const ids = Object.keys(state.cart);
  if (!ids.length) {
    wrap.innerHTML = `<div style="padding:10px; opacity:.7;">Carrello vuoto.</div>`;
    return;
  }

  ids.forEach((id) => {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;

    const qty = state.cart[id];
    const price = (p.price_from == null) ? 5 : safeNum(p.price_from, 5);

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      ${p.image ? `<img src="${p.image}" onerror="this.style.display='none';" />` : ""}
      <div class="ci-info">
        <div class="ci-title">${escapeHtml(p.title)}</div>
        <div class="ci-meta">${escapeHtml(p.category || "")}</div>
        <div class="ci-price">${euro(price)}</div>
      </div>
      <div class="ci-qty">
        <button class="btn small" data-minus>-</button>
        <span>${qty}</span>
        <button class="btn small" data-plus>+</button>
      </div>
    `;

    row.querySelector("[data-minus]").onclick = () => setCartQty(id, qty - 1);
    row.querySelector("[data-plus]").onclick = () => setCartQty(id, qty + 1);

    wrap.appendChild(row);
  });
}

// ===============================
// CART OPEN/CLOSE
// ===============================
function openCart() {
  $("#drawer")?.classList.remove("hidden");
  $("#drawerBackdrop")?.classList.remove("hidden");
  renderCart();
  renderTotals();
}
function closeCart() {
  $("#drawer")?.classList.add("hidden");
  $("#drawerBackdrop")?.classList.add("hidden");
}

// ===============================
// DELIVERY UI (mostra/nasconde campi spedizione)
// ===============================
function updateDeliveryFields() {
  const wrap = $("#shippingFields");
  if (!wrap) return;
  wrap.style.display = currentDelivery() === "shipping" ? "" : "none";
  renderTotals();
}

// ===============================
// WHATSAPP ORDER (ADATTATO AL TUO HTML)
// ===============================
function buildOrderMessage() {
  const name = $("#name")?.value.trim() || "";
  const street = $("#street")?.value.trim() || "";
  const cap = $("#cap")?.value.trim() || "";
  const city = $("#city")?.value.trim() || "";
  const notes = $("#notes")?.value.trim() || "";

  if (!name) {
    alert("Inserisci Nome e cognome.");
    return null;
  }

  const delivery = currentDelivery();

  let text = `Ciao Erika! ✨\nVorrei ordinare:\n\n`;

  let i = 1;
  for (const [id, qty] of Object.entries(state.cart)) {
    const p = state.products.find((x) => x.id === id);
    if (!p) continue;

    const price = (p.price_from == null) ? 5 : safeNum(p.price_from, 5);
    text += `${i}) ${p.title} x${qty} (${euro(price)})\n`;
    i++;
  }

  const sub = computeSubtotal();
  const ship = computeShipping(sub);
  const tot = sub + ship;

  text += `\nConsegna: ${delivery === "shipping" ? "Spedizione" : "Ritiro / consegna a mano"}\n`;
  text += `Subtotale: ${euro(sub)}\n`;
  text += `Spedizione: ${euro(ship)}\n`;
  text += `Totale: ${euro(tot)}\n\n`;

  text += `Dati:\n`;
  text += `Nome: ${name}\n`;

  if (delivery === "shipping") {
    if (!street || !cap || !city) {
      alert("Per la spedizione compila: Via/indirizzo, CAP e Città.");
      return null;
    }
    text += `Indirizzo: ${street}\n`;
    text += `CAP: ${cap}\n`;
    text += `Città: ${city}\n`;
  } else {
    text += `Ritiro / consegna a mano\n`;
  }

  text += `Note: ${notes || "-"}\n`;

  return text;
}

function sendWhatsApp(text) {
  const num = getWhatsappNumber();
  if (!num) {
    alert("Numero WhatsApp non configurato in data/config.json");
    return;
  }
  const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// ===============================
// INIT
// ===============================
async function init() {
  try {
    const configRes = await fetch(CONFIG_URL + "?t=" + Date.now(), { cache: "no-store" });
    state.config = await configRes.json();

    state.products = await fetchProductsWithLocalOverride();

    // default: se price_from non esiste, metti 5
    state.products = state.products.map((p) => ({
      ...p,
      price_from: (p.price_from === undefined || p.price_from === null) ? 5 : p.price_from,
    }));

    if ($("#brandName")) $("#brandName").textContent = state.config.brandName || "Acchiappasogni di Erika";

    buildCategories();
    renderTabs();
    renderGrid();

    // search
    $("#search")?.addEventListener("input", (e) => {
      state.searchQuery = String(e.target.value || "").trim().toLowerCase();
      renderGrid();
    });

    // cart open/close
    $("#btnCart")?.addEventListener("click", openCart);
    $("#btnCloseCart")?.addEventListener("click", closeCart);
    $("#drawerBackdrop")?.addEventListener("click", closeCart);

    // delivery toggle
    document.querySelectorAll('input[name="delivery"]').forEach((r) => {
      r.addEventListener("change", updateDeliveryFields);
    });
    updateDeliveryFields();

    // clear cart
    $("#btnClear")?.addEventListener("click", () => {
      if (!confirm("Vuoi svuotare il carrello?")) return;
      state.cart = {};
      saveCart(state.cart);
      updateCartBadge();
      renderCart();
      renderTotals();
    });

    // send order
    $("#btnSend")?.addEventListener("click", () => {
      if (!Object.keys(state.cart).length) {
        alert("Carrello vuoto.");
        return;
      }
      const msg = buildOrderMessage();
      if (!msg) return;
      sendWhatsApp(msg);
    });

    // custom
    $("#btnCustom")?.addEventListener("click", () => {
      const msg =
        "Ciao Erika! ✨\n" +
        "Vorrei un ACCHIAPPASOGNI PERSONALIZZATO.\n\n" +
        "1) Evento/occasione:\n" +
        "2) Colori preferiti:\n" +
        "3) Nome o scritta:\n" +
        "4) Misura (piccolo/medio/grande):\n" +
        "5) Budget indicativo:\n" +
        "6) Data entro cui ti serve:\n\n" +
        "Grazie 😊";
      sendWhatsApp(msg);
    });

    updateCartBadge();
    renderTotals();
  } catch (err) {
    console.error(err);
    alert("Errore caricamento dati. Controlla console.");
  }
}

init();
```1

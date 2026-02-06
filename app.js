// =========================
//  APP - Acchiappasogni di Erika
//  Repo structure (from your screenshots):
//   - data/products.json
//   - data/config.json
//   - images in duplicated folders (various)
//  Fix: robust JSON load + image fallback across multiple base paths
// =========================

const state = {
  config: {
    brandName: "Acchiappasogni di Erika",
    whatsappNumber: "393440260906",
    shippingFeeCents: 0,
    freeOverCents: 0,
  },
  products: [],
  categories: [],
  activeCategory: "Tutti",
  query: "",
  cart: {},
};

const $ = (s) => document.querySelector(s);

// ✅ Percorsi possibili immagini (in base alle tue cartelle duplicate)
const IMAGE_BASES = [
  "assets/assets/images/assets/images/acchiappasogni_hd/",
  "assets/assets/images/acchiappasogni_hd/",
  "assets/assets/images/assets/images/",
  "assets/assets/images/",
  "assets/images/assets/images/acchiappasogni_hd/",
  "assets/images/acchiappasogni_hd/",
  "assets/images/assets/images/",
  "assets/images/",
  "images/",
  ""
];

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c]));
}

function euroFromCents(cents) {
  const n = (Number(cents) || 0) / 100;
  return `€ ${n.toFixed(2).replace(".", ",")}`;
}

function parseCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "{}") || {}; }
  catch { return {}; }
}
function saveCart() { localStorage.setItem("cart", JSON.stringify(state.cart)); }
function cartCount() { return Object.values(state.cart).reduce((a, b) => a + b, 0); }
function updateCartBadge() { const el = $("#cartCount"); if (el) el.textContent = cartCount(); }

function productPriceCents(p) {
  return (Number(p.price_from) || 0) * 100;
}

// ---- Image helpers ----
function getFileName(anyPath) {
  const p = String(anyPath || "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p; // absolute URL
  return p.split("/").pop() || "";
}

function buildImageCandidates(anyPath) {
  const file = getFileName(anyPath);
  if (!file) return [];

  // absolute URL
  if (/^https?:\/\//i.test(file)) return [file];

  // basic file sanity (allow even if extension missing, but better if present)
  const candidates = [];

  IMAGE_BASES.forEach(base => candidates.push(base + file));

  // extension fallback jpg/jpeg
  const lower = file.toLowerCase();
  if (lower.endsWith(".jpg")) {
    const alt = file.slice(0, -4) + ".jpeg";
    IMAGE_BASES.forEach(base => candidates.push(base + alt));
  } else if (lower.endsWith(".jpeg")) {
    const alt = file.slice(0, -5) + ".jpg";
    IMAGE_BASES.forEach(base => candidates.push(base + alt));
  }

  // remove duplicates
  return [...new Set(candidates)];
}

// Called from inline onerror
window.imgFallback = function (imgEl) {
  const list = (imgEl.getAttribute("data-fallback") || "").split("||").filter(Boolean);
  if (!list.length) {
    // no more candidates -> hide image
    imgEl.style.display = "none";
    return;
  }
  const next = list.shift();
  imgEl.setAttribute("data-fallback", list.join("||"));
  imgEl.src = next;
};

// ---- Categories / filters ----
function buildCategories() {
  const set = new Set(["Tutti"]);
  state.products.forEach((p) => set.add(p.category || "Da classificare"));
  state.categories = Array.from(set);
}

function setActiveCategory(cat) {
  state.activeCategory = cat;
  renderTabs();
  renderGrid();
}

function matches(p) {
  const inCat = state.activeCategory === "Tutti" || p.category === state.activeCategory;
  const text = ((p.title || "") + " " + (p.description || "")).toLowerCase();
  const inQ = !state.query || text.includes(state.query);
  return inCat && inQ;
}

function renderTabs() {
  const tabs = $("#tabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  state.categories.forEach((cat) => {
    const b = document.createElement("button");
    b.className = "tab" + (cat === state.activeCategory ? " active" : "");
    b.textContent = cat;
    b.onclick = () => setActiveCategory(cat);
    tabs.appendChild(b);
  });
}

// ---- Cart ----
function addToCart(id, qty) {
  state.cart[id] = (state.cart[id] || 0) + qty;
  if (state.cart[id] <= 0) delete state.cart[id];
  saveCart();
  updateCartBadge();
}

function setQty(id, qty) {
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;
  saveCart();
  updateCartBadge();
  renderCart();
  renderTotals();
}

// ---- UI render ----
function renderGrid() {
  const grid = $("#grid");
  if (!grid) return;

  const list = state.products.filter(matches);
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<div style="color:var(--muted); padding:12px;">Nessun prodotto trovato.</div>`;
    return;
  }

  list.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";

    const cands = buildImageCandidates(p.image);

    const imgHtml = cands.length
      ? `<img loading="lazy"
              src="${cands[0]}"
              data-fallback="${escapeHtml(cands.slice(1).join("||"))}"
              alt="${escapeHtml(p.title)}"
              onerror="imgFallback(this);" />`
      : ``;

    card.innerHTML = `
      ${imgHtml}
      <div class="content">
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml(p.category || "")}</div>
        <div class="price">${euroFromCents(productPriceCents(p))}</div>
        <div class="row">
          <div class="qty">
            <button data-act="minus">-</button>
            <span data-qty>1</span>
            <button data-act="plus">+</button>
          </div>
          <button class="btn primary" data-buy>Aggiungi</button>
        </div>
      </div>
    `;

    let qty = 1;
    const qtyEl = card.querySelector("[data-qty]");
    card.querySelector('[data-act="minus"]').onclick = () => {
      qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
    };
    card.querySelector('[data-act="plus"]').onclick = () => {
      qty = qty + 1;
      qtyEl.textContent = qty;
    };
    card.querySelector("[data-buy]").onclick = () => {
      addToCart(p.id, qty);
      openCart();
    };

    grid.appendChild(card);
  });
}

function renderCart() {
  const wrap = $("#cartItems");
  if (!wrap) return;

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

    const cands = buildImageCandidates(p.image);
    const imgHtml = cands.length
      ? `<img src="${cands[0]}"
              data-fallback="${escapeHtml(cands.slice(1).join("||"))}"
              alt="${escapeHtml(p.title)}"
              onerror="imgFallback(this);" />`
      : ``;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      ${imgHtml}
      <div>
        <div class="ci-title">${escapeHtml(p.title)}</div>
        <div class="ci-meta">${escapeHtml(p.category || "")}</div>
        <div class="ci-price">${euroFromCents(productPriceCents(p))}</div>
      </div>
      <div class="qty" style="justify-content:flex-end; align-self:center;">
        <button data-minus>-</button>
        <span>${qty}</span>
        <button data-plus>+</button>
      </div>
    `;
    div.querySelector("[data-minus]").onclick = () => setQty(id, qty - 1);
    div.querySelector("[data-plus]").onclick = () => setQty(id, qty + 1);
    wrap.appendChild(div);
  });
}

function computeSubtotalCents() {
  let sum = 0;
  for (const [id, qty] of Object.entries(state.cart)) {
    const p = state.products.find((x) => x.id === id);
    if (!p) continue;
    sum += productPriceCents(p) * qty;
  }
  return sum;
}

function isShipping() {
  return document.querySelector('input[name="delivery"]:checked')?.value === "shipping";
}

function computeShippingCents(sub) {
  if (!isShipping()) return 0;
  const fee = Number(state.config.shippingFeeCents || 0);
  const freeOver = Number(state.config.freeOverCents || 0);
  if (freeOver > 0 && sub >= freeOver) return 0;
  return fee;
}

function renderTotals() {
  const sub = computeSubtotalCents();
  const ship = computeShippingCents(sub);
  const tot = sub + ship;

  $("#subtotal").textContent = euroFromCents(sub);
  $("#shipping").textContent = euroFromCents(ship);
  $("#total").textContent = euroFromCents(tot);

  const hint = $("#shippingHint");
  const freeOver = Number(state.config.freeOverCents || 0);

  if (isShipping() && freeOver > 0 && sub < freeOver) {
    hint.textContent = `Spedizione gratis sopra ${euroFromCents(freeOver)}. Mancano ${euroFromCents(freeOver - sub)}.`;
  } else if (isShipping() && freeOver > 0) {
    hint.textContent = `Spedizione gratis attiva ✅`;
  } else {
    hint.textContent = "";
  }

  const sf = $("#shippingFields");
  if (sf) sf.style.display = isShipping() ? "block" : "none";
}

function openCart() {
  $("#drawer").classList.remove("hidden");
  $("#drawerBackdrop").classList.remove("hidden");
  renderCart();
  renderTotals();
}
function closeCart() {
  $("#drawer").classList.add("hidden");
  $("#drawerBackdrop").classList.add("hidden");
}

// ---- WhatsApp order ----
function buildOrderId() {
  const s = Date.now().toString();
  return "AE-" + s.slice(-6);
}

function buildOrderMessage() {
  const name = ($("#name").value || "").trim() || "Cliente";
  const notes = ($("#notes").value || "").trim();

  let delivery = isShipping() ? "Spedizione" : "Ritiro / consegna a mano";
  if (isShipping()) {
    const street = ($("#street").value || "").trim();
    const cap = ($("#cap").value || "").trim();
    const city = ($("#city").value || "").trim();
    if (!street || !cap || !city) {
      alert("Per la spedizione inserisci Via, CAP e Città.");
      return null;
    }
    delivery = `Spedizione: ${street}, ${cap} ${city}`;
  }

  const orderId = buildOrderId();
  const lines = [];
  lines.push(`🧾 ID ORDINE: #${orderId}`);
  lines.push("");
  lines.push(`👤 Nome: ${name}`);
  lines.push(`📦 Consegna: ${delivery}`);
  lines.push("");
  lines.push("🛒 Articoli:");

  for (const [id, qty] of Object.entries(state.cart)) {
    const p = state.products.find((x) => x.id === id);
    if (!p) continue;
    lines.push(`- ${p.title} x${qty} (${euroFromCents(productPriceCents(p))})`);
  }

  const sub = computeSubtotalCents();
  const ship = computeShippingCents(sub);
  const tot = sub + ship;

  lines.push("");
  lines.push(`Subtotale: ${euroFromCents(sub)}`);
  lines.push(`Spedizione: ${euroFromCents(ship)}`);
  lines.push(`Totale: ${euroFromCents(tot)}`);

  if (notes) {
    lines.push("");
    lines.push(`📝 Note: ${notes}`);
  }

  return { orderId, text: lines.join("\n") };
}

function openWhatsApp(text) {
  const encoded = encodeURIComponent(text);
  const num = String(state.config.whatsappNumber || "393440260906").replace(/\D/g, "");
  window.open(`https://wa.me/${num}?text=${encoded}`, "_blank");
}

// ---- Load JSON ----
async function safeFetchJson(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`);
  return await r.json();
}

function showFatal(msg) {
  const grid = $("#grid");
  if (!grid) return;
  grid.innerHTML = `
    <div style="padding:12px; color:var(--muted);">
      <b>Errore:</b> ${escapeHtml(msg)}
      <div style="opacity:.8; font-size:12px; margin-top:6px;">
        Controlla che esista: <b>data/products.json</b>
      </div>
    </div>
  `;
}

async function init() {
  // UI listeners
  state.cart = parseCart();
  updateCartBadge();

  const search = $("#search");
  if (search) {
    search.addEventListener("input", (e) => {
      state.query = (e.target.value || "").trim().toLowerCase();
      renderGrid();
    });
  }

  const btnCart = $("#btnCart");
  if (btnCart) btnCart.onclick = openCart;

  const btnCloseCart = $("#btnCloseCart");
  if (btnCloseCart) btnCloseCart.onclick = closeCart;

  const drawerBackdrop = $("#drawerBackdrop");
  if (drawerBackdrop) drawerBackdrop.onclick = closeCart;

  document.querySelectorAll('input[name="delivery"]').forEach((r) =>
    r.addEventListener("change", () => renderTotals())
  );

  const btnClear = $("#btnClear");
  if (btnClear) {
    btnClear.onclick = () => {
      if (!confirm("Vuoi svuotare il carrello?")) return;
      state.cart = {};
      saveCart();
      updateCartBadge();
      renderCart();
      renderTotals();
    };
  }

  const btnSend = $("#btnSend");
  if (btnSend) {
    btnSend.onclick = () => {
      if (!Object.keys(state.cart).length) {
        alert("Carrello vuoto.");
        return;
      }
      const o = buildOrderMessage();
      if (!o) return;
      localStorage.setItem("lastOrderId", o.orderId);
      openWhatsApp(o.text);
    };
  }

  const btnCustom = $("#btnCustom");
  if (btnCustom) {
    btnCustom.onclick = () => {
      const msg =
        "Ciao Erika! Vorrei un ACCHIAPPASOGNI PERSONALIZZATO ✨\n\n" +
        "1) Evento/occasione (es. regalo, battesimo, matrimonio):\n" +
        "2) Colori preferiti:\n" +
        "3) Nome o scritta (se vuoi):\n" +
        "4) Misura (piccolo/medio/grande):\n" +
        "5) Budget indicativo:\n" +
        "6) Data entro cui ti serve:\n\n" +
        "Grazie! 😊";
      openWhatsApp(msg);
    };
  }

  // Load data
  try {
    const products = await safeFetchJson("data/products.json");
    if (!Array.isArray(products)) throw new Error("products.json non è un array");
    state.products = products;

    // config optional (if fails, app still works)
    try {
      const cfg = await safeFetchJson("data/config.json");
      state.config = { ...state.config, ...(cfg || {}) };
    } catch {}

    const brand = $("#brandName");
    if (brand) brand.textContent = state.config.brandName || "Acchiappasogni di Erika";

    buildCategories();
    renderTabs();
    renderGrid();
  } catch (e) {
    console.error(e);
    showFatal(e.message || String(e));
  }
}

init();

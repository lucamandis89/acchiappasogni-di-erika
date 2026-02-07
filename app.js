/* ============================
   Acchiappasogni di Erika - app.js
   - GitHub Pages (statico)
   - Admin (password 1234) con salvataggio su telefono (localStorage)
   - Foto: upload -> dataURL (solo locale)
   - DESCRIZIONE: COMPLETAMENTE RIMOSSA
   ============================ */

const DATA_PRODUCTS_URL = "data/products.json";
const DATA_CONFIG_URL = "data/config.json";
const LS_PRODUCTS_OVERRIDE = "ae_products_override_v1";
const LS_ADMIN_UNLOCKED = "ae_admin_unlocked_v1";

/* ---------- Helpers ---------- */
function euro(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v);
}
function safeText(s) {
  return (s ?? "").toString();
}
function escapeHtml(str) {
  return safeText(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function uid(prefix = "AE") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
function parseJsonSafe(text) {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  return JSON.parse(cleaned);
}

/* ---------- Data loading ---------- */
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
  const text = await res.text();
  return parseJsonSafe(text);
}

async function fetchProductsRemote() {
  const data = await fetchJSON(DATA_PRODUCTS_URL);
  if (!Array.isArray(data)) throw new Error("products.json non è un array");
  // ✅ RIMUOVE QUALSIASI CAMPO description SE PRESENTE
  return data.map(p => {
    const { description, ...rest } = p || {};
    return rest;
  });
}

// ✅ QUESTA È LA FUNZIONE CHE VOLEVI
async function fetchProductsWithLocalOverride() {
  const overrideRaw = localStorage.getItem(LS_PRODUCTS_OVERRIDE);
  if (overrideRaw) {
    try {
      const parsed = parseJsonSafe(overrideRaw);
      if (Array.isArray(parsed)) {
        return parsed.map(p => {
          const { description, ...rest } = p || {};
          return rest;
        });
      }
    } catch (e) {
      console.warn("Override locale non valido, uso remoto.", e);
    }
  }
  return await fetchProductsRemote();
}

function saveProductsOverride(products) {
  // ✅ SALVA SENZA description
  const cleaned = (products || []).map(p => {
    const { description, ...rest } = p || {};
    return rest;
  });
  localStorage.setItem(LS_PRODUCTS_OVERRIDE, JSON.stringify(cleaned, null, 2));
}
function clearProductsOverride() {
  localStorage.removeItem(LS_PRODUCTS_OVERRIDE);
}

/* ---------- Config ---------- */
async function fetchConfig() {
  try {
    return await fetchJSON(DATA_CONFIG_URL);
  } catch {
    return {
      brandName: "Acchiappasogni di Erika",
      whatsappNumber: "", // es: "393401234567"
      whatsappPrefill: "Ciao! Vorrei ordinare questi acchiappasogni:",
    };
  }
}

/* ---------- DOM ---------- */
const elBrandName = document.getElementById("brandName");
const elSearch = document.getElementById("search");
const elTabAll = document.getElementById("tabAll");
const elTabFeatured = document.getElementById("tabFeatured");
const elGrid = document.getElementById("grid");
const elBtnCart = document.getElementById("btnCart");
const elCartCount = document.getElementById("cartCount");
const elBackdrop = document.getElementById("drawerBackdrop");
const elDrawer = document.getElementById("drawer");
const elDrawerClose = document.getElementById("drawerClose");
const elCartItems = document.getElementById("cartItems");
const elCartTotal = document.getElementById("cartTotal");
const elCheckout = document.getElementById("checkout");
const elBtnCustom = document.getElementById("btnCustom");

/* ---------- State ---------- */
let CONFIG = null;
let PRODUCTS = [];
let FILTER = { q: "", featuredOnly: false };
let CART = new Map(); // id -> qty

/* ---------- UI: Settings button + modal ---------- */
function ensureSettingsButton() {
  const actions = document.querySelector(".actions");
  if (!actions) return;

  if (document.getElementById("btnSettings")) return;

  const btn = document.createElement("button");
  btn.id = "btnSettings";
  btn.className = "btn ghost";
  btn.textContent = "Impostazioni";
  btn.addEventListener("click", openAdminGate);

  actions.insertBefore(btn, actions.firstChild);
}

function openAdminGate() {
  const already = localStorage.getItem(LS_ADMIN_UNLOCKED) === "1";
  if (already) {
    openAdminModal();
    return;
  }
  const pass = prompt("Password Impostazioni:");
  if (pass === null) return;
  if (pass.trim() === "1234") {
    localStorage.setItem(LS_ADMIN_UNLOCKED, "1");
    openAdminModal();
  } else {
    alert("Password errata.");
  }
}

function buildAdminModal() {
  if (document.getElementById("adminModal")) return;

  const wrap = document.createElement("div");
  wrap.id = "adminModal";
  wrap.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: none; align-items: center; justify-content: center;
    background: rgba(0,0,0,.55); padding: 16px;
  `;

  wrap.innerHTML = `
    <div style="
      width: min(920px, 100%);
      max-height: 90vh;
      overflow: auto;
      background: rgba(20,24,35,.98);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      padding: 14px;
      color: #fff;
    ">
      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size:18px; font-weight:700;">Impostazioni</div>
          <div style="opacity:.75; font-size:12px;">Salvataggio: solo su questo telefono. (Descrizione disattivata)</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button id="adminClose" class="btn">Chiudi</button>
        </div>
      </div>

      <hr style="border:0; border-top:1px solid rgba(255,255,255,.12); margin:12px 0;">

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <button id="btnAllTo5" class="btn">Imposta tutti i prezzi a 5€</button>
        <button id="btnAddProduct" class="btn">Aggiungi progetto</button>
        <button id="btnExportJson" class="btn">Esporta JSON</button>
        <button id="btnResetLocal" class="btn ghost">Ripristina (torna a GitHub)</button>
        <button id="btnLock" class="btn ghost">Blocca Impostazioni</button>
      </div>

      <div id="adminList"></div>

      <div id="adminEditor" style="
        margin-top:12px;
        padding:12px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:14px;
        display:none;
      "></div>
    </div>
  `;

  document.body.appendChild(wrap);

  document.getElementById("adminClose").addEventListener("click", closeAdminModal);
  wrap.addEventListener("click", (e) => { if (e.target === wrap) closeAdminModal(); });

  document.getElementById("btnAllTo5").addEventListener("click", () => {
    PRODUCTS = PRODUCTS.map(p => ({ ...p, price_from: 5 }));
    persistAndRefresh();
    alert("Ok: tutti i prezzi sono a 5€.");
  });

  document.getElementById("btnAddProduct").addEventListener("click", () => openEditor(null));

  document.getElementById("btnExportJson").addEventListener("click", () => {
    const json = JSON.stringify(PRODUCTS, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.json";
    a.click();
    URL.revokeObjectURL(url);
    alert("Scaricato products.json (senza descrizioni).");
  });

  document.getElementById("btnResetLocal").addEventListener("click", () => {
    if (!confirm("Vuoi tornare ai prodotti originali di GitHub?")) return;
    clearProductsOverride();
    location.reload();
  });

  document.getElementById("btnLock").addEventListener("click", () => {
    localStorage.removeItem(LS_ADMIN_UNLOCKED);
    alert("Impostazioni bloccate.");
    closeAdminModal();
  });
}

function openAdminModal() {
  buildAdminModal();
  renderAdminList();
  document.getElementById("adminModal").style.display = "flex";
}
function closeAdminModal() {
  const m = document.getElementById("adminModal");
  if (m) m.style.display = "none";
}

/* ---------- Admin list + editor ---------- */
function renderAdminList() {
  const list = document.getElementById("adminList");
  if (!list) return;

  list.innerHTML = `
    <div style="overflow:auto; border:1px solid rgba(255,255,255,.12); border-radius:14px;">
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background:rgba(255,255,255,.06); text-align:left;">
            <th style="padding:10px;">#</th>
            <th style="padding:10px;">Titolo</th>
            <th style="padding:10px;">Prezzo</th>
            <th style="padding:10px;">In evidenza</th>
            <th style="padding:10px;">Azioni</th>
          </tr>
        </thead>
        <tbody>
          ${PRODUCTS.map((p, idx) => `
            <tr style="border-top:1px solid rgba(255,255,255,.08);">
              <td style="padding:10px; opacity:.85;">${idx + 1}</td>
              <td style="padding:10px;">${escapeHtml(p.title || "")}</td>
              <td style="padding:10px;">${euro(p.price_from)}</td>
              <td style="padding:10px;">${p.featured ? "✅" : "—"}</td>
              <td style="padding:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn" data-edit="${escapeHtml(p.id)}">Modifica</button>
                <button class="btn ghost" data-del="${escapeHtml(p.id)}">Elimina</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll("[data-edit]").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-edit");
      const p = PRODUCTS.find(x => x.id === id);
      openEditor(p);
    });
  });

  list.querySelectorAll("[data-del]").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-del");
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return;
      if (!confirm(`Eliminare "${p.title}"?`)) return;
      PRODUCTS = PRODUCTS.filter(x => x.id !== id);
      persistAndRefresh();
      renderAdminList();
    });
  });
}

function openEditor(product) {
  const ed = document.getElementById("adminEditor");
  if (!ed) return;

  const isNew = !product;
  const p = product ? { ...product } : {
    id: uid("AE"),
    title: "Acchiappasogni - Modello X",
    category: "Acchiappasogni Classici",
    price_from: 5,
    image: "",
    featured: false
  };

  ed.style.display = "block";
  ed.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
      <div style="font-weight:700;">${isNew ? "Aggiungi progetto" : "Modifica progetto"}</div>
      <button id="btnEdClose" class="btn ghost">Chiudi</button>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
      <label style="display:flex; flex-direction:column; gap:6px;">
        <span style="opacity:.8; font-size:12px;">Titolo</span>
        <input id="edTitle" value="${escapeHtml(p.title)}" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.25); color:#fff;">
      </label>

      <label style="display:flex; flex-direction:column; gap:6px;">
        <span style="opacity:.8; font-size:12px;">Categoria</span>
        <input id="edCategory" value="${escapeHtml(p.category)}" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.25); color:#fff;">
      </label>

      <label style="display:flex; flex-direction:column; gap:6px;">
        <span style="opacity:.8; font-size:12px;">Prezzo (numero)</span>
        <input id="edPrice" type="number" value="${Number(p.price_from || 0)}" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.25); color:#fff;">
      </label>

      <label style="display:flex; flex-direction:column; gap:6px;">
        <span style="opacity:.8; font-size:12px;">In evidenza</span>
        <select id="edFeatured" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.25); color:#fff;">
          <option value="0" ${p.featured ? "" : "selected"}>No</option>
          <option value="1" ${p.featured ? "selected" : ""}>Sì</option>
        </select>
      </label>

      <div style="grid-column:1 / -1; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <div style="display:flex; flex-direction:column; gap:6px;">
          <span style="opacity:.8; font-size:12px;">Foto (upload dal telefono)</span>
          <input id="edFile" type="file" accept="image/*">
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <span style="opacity:.8; font-size:12px;">Oppure URL/Path immagine (GitHub)</span>
          <input id="edImg" value="${escapeHtml(p.image || "")}" style="min-width:260px; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.25); color:#fff;">
        </div>
      </div>

      <div style="grid-column:1 / -1; display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:8px;">
        <button id="btnEdSave" class="btn">${isNew ? "Aggiungi" : "Salva"}</button>
        <button id="btnEdCancel" class="btn ghost">Annulla</button>
        <span id="edInfo" style="opacity:.7; font-size:12px;"></span>
      </div>

      <div id="edPreviewWrap" style="grid-column:1 / -1; display:none; margin-top:8px;">
        <div style="opacity:.8; font-size:12px; margin-bottom:6px;">Anteprima foto</div>
        <img id="edPreview" style="max-width:240px; border-radius:12px; border:1px solid rgba(255,255,255,.12);" />
      </div>
    </div>
  `;

  const btnEdClose = document.getElementById("btnEdClose");
  const btnEdCancel = document.getElementById("btnEdCancel");
  const btnEdSave = document.getElementById("btnEdSave");
  const edFile = document.getElementById("edFile");
  const edImg = document.getElementById("edImg");
  const edPreviewWrap = document.getElementById("edPreviewWrap");
  const edPreview = document.getElementById("edPreview");
  const edInfo = document.getElementById("edInfo");

  function setPreview(src) {
    if (!src) {
      edPreviewWrap.style.display = "none";
      return;
    }
    edPreview.src = src;
    edPreviewWrap.style.display = "block";
  }
  setPreview(p.image);

  btnEdClose.addEventListener("click", () => { ed.style.display = "none"; });
  btnEdCancel.addEventListener("click", () => { ed.style.display = "none"; });

  edFile.addEventListener("change", async () => {
    const file = edFile.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert("Foto troppo grande. Consiglio sotto 2.5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      edImg.value = dataUrl;
      setPreview(dataUrl);
      edInfo.textContent = "Foto caricata (salvata sul telefono).";
    };
    reader.readAsDataURL(file);
  });

  btnEdSave.addEventListener("click", () => {
    const newP = {
      ...p,
      title: safeText(document.getElementById("edTitle").value).trim(),
      category: safeText(document.getElementById("edCategory").value).trim(),
      price_from: Number(document.getElementById("edPrice").value || 0),
      image: safeText(edImg.value).trim(),
      featured: document.getElementById("edFeatured").value === "1",
    };

    if (!newP.title) {
      alert("Titolo obbligatorio.");
      return;
    }

    if (isNew) PRODUCTS = [newP, ...PRODUCTS];
    else PRODUCTS = PRODUCTS.map(x => x.id === newP.id ? newP : x);

    persistAndRefresh();
    renderAdminList();
    ed.style.display = "none";
  });
}

/* ---------- Catalog rendering ---------- */
function normalizeForSearch(p) {
  const t = `${p.title || ""} ${p.category || ""}`.toLowerCase();
  return t;
}

function getFilteredProducts() {
  let list = [...PRODUCTS];

  if (FILTER.featuredOnly) list = list.filter(p => !!p.featured);

  const q = FILTER.q.trim().toLowerCase();
  if (q) list = list.filter(p => normalizeForSearch(p).includes(q));

  list.sort((a, b) => safeText(a.id).localeCompare(safeText(b.id)));
  return list;
}

function renderProducts() {
  const list = getFilteredProducts();

  elGrid.innerHTML = list.map((p, i) => {
    const displayTitle = `Acchiappasogni - Modello ${i + 1}`;
    const imgId = `img-${escapeHtml(p.id)}`;

    // ✅ immagine con fallback (se non carica)
    const imgHtml = p.image
      ? `<img id="${imgId}" class="card-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(displayTitle)}" loading="lazy">`
      : `<div class="card-img ph"></div>`;

    return `
      <article class="card">
        ${imgHtml}
        <div class="card-body">
          <div class="card-title">${escapeHtml(displayTitle)}</div>
          <div class="card-sub">${escapeHtml(p.category || "")}</div>

          <div class="card-row">
            <div class="price">${euro(p.price_from)}</div>
            <div class="qty">
              <button class="qty-btn" data-dec="${escapeHtml(p.id)}">-</button>
              <div class="qty-val" id="qty-${escapeHtml(p.id)}">${CART.get(p.id) || 0}</div>
              <button class="qty-btn" data-inc="${escapeHtml(p.id)}">+</button>
            </div>
            <button class="btn add" data-add="${escapeHtml(p.id)}">Aggiungi</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // bind + fallback immagini
  list.forEach(p => {
    if (!p.image) return;
    const el = document.getElementById(`img-${p.id}`);
    if (!el) return;
    el.addEventListener("error", () => {
      // sostituisce l’immagine con placeholder senza rompere layout
      const ph = document.createElement("div");
      ph.className = "card-img ph";
      el.replaceWith(ph);
    });
  });

  elGrid.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => inc(b.dataset.inc)));
  elGrid.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => dec(b.dataset.dec)));
  elGrid.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addToCart(b.dataset.add)));

  updateCartBadge();
}

function inc(id) {
  CART.set(id, (CART.get(id) || 0) + 1);
  updateQty(id);
  updateCartBadge();
}
function dec(id) {
  const v = (CART.get(id) || 0) - 1;
  if (v <= 0) CART.delete(id);
  else CART.set(id, v);
  updateQty(id);
  updateCartBadge();
}
function addToCart(id) {
  if (!CART.get(id)) CART.set(id, 1);
  updateQty(id);
  updateCartBadge();
  openDrawer();
}
function updateQty(id) {
  const q = CART.get(id) || 0;
  const el = document.getElementById(`qty-${id}`);
  if (el) el.textContent = String(q);
}
function updateCartBadge() {
  let count = 0;
  for (const v of CART.values()) count += v;
  elCartCount.textContent = String(count);
}

/* ---------- Drawer / Checkout ---------- */
function openDrawer() {
  elBackdrop.classList.add("open");
  elDrawer.classList.add("open");
  renderCart();
}
function closeDrawer() {
  elBackdrop.classList.remove("open");
  elDrawer.classList.remove("open");
}
function renderCart() {
  const items = [];
  let total = 0;

  const map = new Map(PRODUCTS.map(p => [p.id, p]));

  for (const [id, qty] of CART.entries()) {
    const p = map.get(id);
    if (!p) continue;
    const sub = Number(p.price_from || 0) * qty;
    total += sub;
    items.push({ id, qty, title: p.title || id, price: p.price_from || 0, sub });
  }

  elCartItems.innerHTML = items.length
    ? items.map(it => `
        <div class="cart-row">
          <div class="cart-left">
            <div class="cart-title">${escapeHtml(it.title)}</div>
            <div class="cart-sub">${euro(it.price)} × ${it.qty}</div>
          </div>
          <div class="cart-right">
            <div class="cart-subtotal">${euro(it.sub)}</div>
            <div class="cart-actions">
              <button class="qty-btn" data-cdec="${escapeHtml(it.id)}">-</button>
              <button class="qty-btn" data-cinc="${escapeHtml(it.id)}">+</button>
              <button class="qty-btn" data-crm="${escapeHtml(it.id)}">×</button>
            </div>
          </div>
        </div>
      `).join("")
    : `<div style="opacity:.75; padding: 10px 0;">Carrello vuoto.</div>`;

  elCartTotal.textContent = euro(total);

  elCartItems.querySelectorAll("[data-cinc]").forEach(b => b.addEventListener("click", () => { inc(b.dataset.cinc); renderCart(); renderProducts(); }));
  elCartItems.querySelectorAll("[data-cdec]").forEach(b => b.addEventListener("click", () => { dec(b.dataset.cdec); renderCart(); renderProducts(); }));
  elCartItems.querySelectorAll("[data-crm]").forEach(b => b.addEventListener("click", () => { CART.delete(b.dataset.crm); updateCartBadge(); renderCart(); renderProducts(); }));
}

function checkoutWhatsApp() {
  if (!CONFIG?.whatsappNumber) {
    alert("Numero WhatsApp non configurato in data/config.json");
    return;
  }
  const map = new Map(PRODUCTS.map(p => [p.id, p]));
  const lines = [];
  let total = 0;

  for (const [id, qty] of CART.entries()) {
    const p = map.get(id);
    if (!p) continue;
    const sub = Number(p.price_from || 0) * qty;
    total += sub;
    lines.push(`- ${p.title || id} x${qty} (${euro(sub)})`);
  }

  if (!lines.length) {
    alert("Carrello vuoto.");
    return;
  }

  const msg = [
    CONFIG.whatsappPrefill || "Ciao! Vorrei ordinare:",
    ...lines,
    `Totale: ${euro(total)}`
  ].join("\n");

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/* ---------- Persist & refresh ---------- */
function persistAndRefresh() {
  saveProductsOverride(PRODUCTS);
  renderProducts();
  updateCartBadge();
}

/* ---------- Init ---------- */
async function init() {
  ensureSettingsButton();

  CONFIG = await fetchConfig();
  if (elBrandName) elBrandName.textContent = CONFIG.brandName || "Acchiappasogni di Erika";

  PRODUCTS = await fetchProductsWithLocalOverride();

  renderProducts();

  elSearch?.addEventListener("input", () => {
    FILTER.q = elSearch.value || "";
    renderProducts();
  });

  elTabAll?.addEventListener("click", () => {
    FILTER.featuredOnly = false;
    elTabAll.classList.add("active");
    elTabFeatured.classList.remove("active");
    renderProducts();
  });

  elTabFeatured?.addEventListener("click", () => {
    FILTER.featuredOnly = true;
    elTabFeatured.classList.add("active");
    elTabAll.classList.remove("active");
    renderProducts();
  });

  elBtnCart?.addEventListener("click", openDrawer);
  elDrawerClose?.addEventListener("click", closeDrawer);
  elBackdrop?.addEventListener("click", closeDrawer);

  elCheckout?.addEventListener("click", checkoutWhatsApp);

  elBtnCustom?.addEventListener("click", () => {
    if (!CONFIG?.whatsappNumber) {
      alert("Numero WhatsApp non configurato in data/config.json");
      return;
    }
    const msg = "Ciao! Vorrei un acchiappasogni personalizzato 😊\nMi dici tempi e prezzo?";
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });
}

document.addEventListener("DOMContentLoaded", init);

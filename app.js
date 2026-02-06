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
  if (!original) return [];
  if (original.startsWith("data:image/")) return [original];

  const candidates = [original];
  if (original.startsWith("assets/")) candidates.push("./" + original);
  if (original.startsWith("./assets/")) candidates.push(original.replace("./", ""));
  return Array.from(new Set(candidates.filter(Boolean)));
}

function attachImageFallback(imgEl, rawImageValue) {
  const tries = buildImageCandidates(rawImageValue);
  let i = 0;
  function tryNext() {
    if (i >= tries.length) { imgEl.src = IMG_PLACEHOLDER; return; }
    imgEl.src = tries[i++];
  }
  imgEl.onerror = () => tryNext();
  tryNext();
}

// =====================
//  UTILS
// =====================
function euroFromCents(c) { return `€ ${(c / 100).toFixed(2).replace(".", ",")}`; }
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;","<": "&lt;",">": "&gt;",'"': "&quot;","'": "&#039;"
  }[m]));
}
function parseCart() { try { return JSON.parse(localStorage.getItem("cart") || "{}") || {}; } catch { return {}; } }
function saveCart() { localStorage.setItem("cart", JSON.stringify(state.cart)); }
function cartCount() { return Object.values(state.cart).reduce((a, b) => a + b, 0); }
function updateCartBadge() { $("#cartCount").textContent = cartCount(); }
function openCart() { $("#drawer").classList.remove("hidden"); $("#drawerBackdrop").classList.remove("hidden"); $("#drawer").setAttribute("aria-hidden","false"); }
function closeCart() { $("#drawer").classList.add("hidden"); $("#drawerBackdrop").classList.add("hidden"); $("#drawer").setAttribute("aria-hidden","true"); }

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
//  FILE -> BASE64
// =====================
function fileToDataUrl(file, maxW = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Read error"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image error"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function pickImage(useCamera) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (useCamera) input.setAttribute("capture", "environment");
    input.style.display = "none";
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) return resolve(null);
      try { resolve(await fileToDataUrl(file)); } catch { resolve(null); }
    };
    input.click();
  });
}

// =====================
//  FILTER + SORT
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
    return list.sort((a, b) => {
      const fa = a.featured ? 1 : 0, fb = b.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  }
  if (mode === "newest") return list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (mode === "title") return list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "it"));
  if (mode === "priceAsc") return list.sort((a, b) => productPriceCents(a) - productPriceCents(b));
  if (mode === "priceDesc") return list.sort((a, b) => productPriceCents(b) - productPriceCents(a));
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
  let shipping = 0, hint = "";

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
//  WHATSAPP (ordine)
// =====================
function buildWhatsAppMessage() {
  const ids = Object.keys(state.cart);
  const lines = [];
  lines.push(`Ciao! Vorrei ordinare:`); lines.push("");

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
    b.onclick = () => { state.activeCategory = cat; renderTabs(); renderGrid(); };
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
//  SETTINGS (admin)
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
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        <button class="btn small" data-dup>Duplica</button>
        <button class="btn danger small" data-del>Elimina</button>
        <button class="btn small" data-pick>Scegli immagine</button>
        <button class="btn small" data-cam>Scatta foto</button>
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
          <span>Immagine (path o base64)</span>
          <input data-image type="text" value="${escapeHtml(p.image || "")}" />
        </label>
        <label style="display:flex; gap:8px; align-items:center;">
          <input data-featured type="checkbox" ${p.featured ? "checked" : ""} />
          <span>In evidenza</span>
        </label>
        <img data-preview style="width:100%; max-height:200px; object-fit:cover; border-radius:12px; display:${p.image ? "block":"none"};" />
      </div>
    `;

    const preview = row.querySelector("[data-preview]");
    if (p.image) attachImageFallback(preview, p.image);

    row.querySelector("[data-price]").dataset.id = p.id;
    row.querySelector("[data-category]").dataset.id = p.id;
    row.querySelector("[data-image]").dataset.id = p.id;
    row.querySelector("[data-featured]").dataset.id = p.id;

    row.querySelector("[data-dup]").onclick = () => duplicateProduct(p.id);
    row.querySelector("[data-del]").onclick = () => deleteProduct(p.id);

    row.querySelector("[data-pick]").onclick = async () => {
      const dataUrl = await pickImage(false);
      if (!dataUrl) return;
      const input = row.querySelector("[data-image]");
      input.value = dataUrl;
      preview.style.display = "block";
      preview.src = dataUrl;
    };
    row.querySelector("[data-cam]").onclick = async () => {
      const dataUrl = await pickImage(true);
      if (!dataUrl) return;
      const input = row.querySelector("[data-image]");
      input.value = dataUrl;
      preview.style.display = "block";
      preview.src = dataUrl;
    };

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
    p.price_from = v; p.price = v; delete p.priceCents;
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
  const description = $("#newDesc").value.trim() || "Prodotto artigianale fatto a mano da Erika. Personalizzabile su richiesta.";
  const image = $("#newImage").value.trim();
  const featured = $("#newFeatured").checked;

  if (!title) return alert("Inserisci un titolo.");
  if (!Number.isFinite(price)) return alert("Inserisci un prezzo valido.");
  if (!image) return alert("Scegli/scatta un’immagine oppure inserisci un path.");

  const id = "AE-" + Date.now();
  const p = { id, title, category, price, price_from: price, description, image, featured, createdAt: Date.now() };

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
  $("#newImagePreview").style.display = "none";
  $("#newImagePreview").src = "";

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
  rebuildCategories(); renderGrid(); renderAdminList();
}

function deleteProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Eliminare "${p.title}"?`)) return;

  state.products = state.products.filter(x => x.id !== id);
  if (state.cart[id]) { delete state.cart[id]; saveCart(); updateCartBadge(); }
  rebuildCategories(); renderGrid(); renderCart(); renderTotals(); renderAdminList();
}

function hookNewImageButtons(){
  const preview = $("#newImagePreview");
  $("#btnPickImageNew").onclick = async () => {
    const dataUrl = await pickImage(false);
    if (!dataUrl) return;
    $("#newImage").value = dataUrl;
    preview.style.display = "block";
    preview.src = dataUrl;
  };
  $("#btnTakePhotoNew").onclick = async () => {
    const dataUrl = await pickImage(true);
    if (!dataUrl) return;
    $("#newImage").value = dataUrl;
    preview.style.display = "block";
    preview.src = dataUrl;
  };
  $("#btnClearImageNew").onclick = () => {
    $("#newImage").value = "";
    preview.style.display = "none";
    preview.src = "";
  };
}

// =====================
//  SYNC (GitHub)
// =====================
async function fetchJson(url){
  const bust = (url.includes("?") ? "&" : "?") + "v=" + Date.now();
  const res = await fetch(url + bust, { cache: "no-store" });
  if(!res.ok) throw new Error("fetch failed");
  return await res.json();
}

function normalizeProductsForExport(arr){
  return (arr || []).map((p, idx) => ({
    id: String(p.id || ("AE-" + (Date.now()+idx))),
    title: p.title || "",
    category: p.category || "Altro",
    price: (typeof p.price === "number") ? p.price : (typeof p.price_from === "number" ? p.price_from : 0),
    price_from: (typeof p.price_from === "number") ? p.price_from : (typeof p.price === "number" ? p.price : 0),
    description: p.description || "",
    image: p.image || "",
    featured: !!p.featured,
    createdAt: Number(p.createdAt || (Date.now()-idx))
  }));
}

async function copyToClipboard(text){
  try{ await navigator.clipboard.writeText(text); return true; }
  catch{
    try{
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    }catch{ return false; }
  }
}

async function exportProductsJson(){
  applyAdminEditsToState();
  const clean = normalizeProductsForExport(state.products);
  const json = JSON.stringify(clean, null, 2);
  const ok = await copyToClipboard(json);
  alert(ok ? "JSON copiato ✅ Ora incollalo su GitHub in data/products.json" : "Copia non riuscita ❌");
}

async function importProductsJson(){
  const text = prompt("Incolla qui il JSON completo (array di prodotti):");
  if(!text) return;
  try{
    const arr = JSON.parse(text);
    if(!Array.isArray(arr)) throw new Error("non array");
    const clean = normalizeProductsForExport(arr);
    state.products = clean;
    saveOverrideProducts(clean);
    rebuildCategories(); renderGrid(); renderCart(); renderTotals(); renderAdminList();
    alert("Import completato ✅");
  }catch{ alert("JSON non valido ❌"); }
}

async function reloadFromSite(){
  resetOverrideProducts();
  localStorage.removeItem(LS_ADMIN_UNLOCKED);
  await loadData(true);
  alert("Ricaricato dal sito ✅");
}

async function loadData(forceRemote=false) {
  try {
    state.config = await fetchJson("data/config.json");
    if (state.config.brandName) $("#brandName").textContent = state.config.brandName;
  } catch { state.config = {}; }

  let baseArr = [];
  try{
    if(state.config?.productsUrl) baseArr = await fetchJson(state.config.productsUrl);
    else baseArr = await fetchJson("data/products.json");
  }catch{
    try{ baseArr = await fetchJson("data/products.json"); }catch{ baseArr = []; }
  }

  baseArr = Array.isArray(baseArr) ? baseArr : (baseArr.products || []);
  baseArr = normalizeProductsForExport(baseArr);

  state.baseProducts = baseArr;

  const override = loadOverrideProducts();
  state.products = override && !forceRemote ? override : baseArr;

  rebuildCategories();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge();
}

// =====================
//  CONFIGURATORE + ACCESSORI CLIC
// =====================
const dream = {
  diameter: 35, feathers: 3, featherLen: 95, ringWidth: 5,
  colRings: "#222222", colWeb: "#222222", colFeathers: "#333333", colBeads: "#b50000",
  beadsOn: true, beadsQty: 10, glitter: false,
  textTop: "", colText: "#b50000", symbol: "none",
  charms: true, charmSize: 34
};

const dreamUI = {
  canvas: null, ctx: null,
  tool: "bead", // bead | glitter | symbol | miniFeather
  placed: [] // elementi piazzati dall’utente
};

function openDesigner(){
  $("#designerModal").classList.remove("hidden");
  $("#designerBackdrop").classList.remove("hidden");
  $("#designerModal").setAttribute("aria-hidden","false");
  initDreamOnce();
  renderDream();
  $("#designerHint").textContent = "Seleziona uno strumento e tocca sull’anteprima per aggiungere dettagli.";
}
function closeDesigner(){
  $("#designerModal").classList.add("hidden");
  $("#designerBackdrop").classList.add("hidden");
  $("#designerModal").setAttribute("aria-hidden","true");
}

function setTool(t){
  dreamUI.tool = t;
  const ids = ["toolBead","toolGlitter","toolSymbol","toolMiniFeather"];
  ids.forEach(id=>{
    const el = $("#"+id);
    if(!el) return;
    el.classList.remove("primary");
  });
  if(t==="bead") $("#toolBead").classList.add("primary");
  if(t==="glitter") $("#toolGlitter").classList.add("primary");
  if(t==="symbol") $("#toolSymbol").classList.add("primary");
  if(t==="miniFeather") $("#toolMiniFeather").classList.add("primary");
}

function initDreamOnce(){
  if(dreamUI.canvas) return;

  const canvas = $("#designerCanvas");
  const ctx = canvas.getContext("2d");
  dreamUI.canvas = canvas;
  dreamUI.ctx = ctx;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderDream();
  };

  resize();
  window.addEventListener("resize", () => {
    if(!$("#designerModal").classList.contains("hidden")) resize();
  });

  // click/tap placement
  canvas.addEventListener("pointerdown", (ev)=>{
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left);
    const y = (ev.clientY - rect.top);

    dreamUI.placed.push({
      type: dreamUI.tool,
      x, y,
      color: (dreamUI.tool==="bead") ? dream.colBeads :
             (dreamUI.tool==="glitter") ? "#dcb43c" :
             (dreamUI.tool==="symbol") ? dream.colRings :
             dream.colFeathers,
      symbol: dream.symbol
    });
    renderDream();
  });

  // bind tools
  $("#toolBead").onclick = ()=>setTool("bead");
  $("#toolGlitter").onclick = ()=>setTool("glitter");
  $("#toolSymbol").onclick = ()=>setTool("symbol");
  $("#toolMiniFeather").onclick = ()=>setTool("miniFeather");
  $("#toolUndo").onclick = ()=>{
    dreamUI.placed.pop();
    renderDream();
  };
  setTool("bead");

  // controls
  $("#optDiameter").oninput = (e)=>{ dream.diameter = Number(e.target.value)||35; renderDream(); };
  $("#optFeathers").oninput = (e)=>{ dream.feathers = Number(e.target.value)||3; renderDream(); };
  $("#optFeatherLen").oninput = (e)=>{ dream.featherLen = Number(e.target.value)||95; renderDream(); };
  $("#optRingWidth").oninput = (e)=>{ dream.ringWidth = Number(e.target.value)||5; renderDream(); };

  $("#colRings").oninput = (e)=>{ dream.colRings = e.target.value; renderDream(); };
  $("#colWeb").oninput = (e)=>{ dream.colWeb = e.target.value; renderDream(); };
  $("#colFeathers").oninput = (e)=>{ dream.colFeathers = e.target.value; renderDream(); };
  $("#colBeads").oninput = (e)=>{ dream.colBeads = e.target.value; renderDream(); };

  $("#optBeadsOn").onchange = (e)=>{ dream.beadsOn = !!e.target.checked; renderDream(); };
  $("#optBeadsQty").oninput = (e)=>{ dream.beadsQty = Number(e.target.value)||0; renderDream(); };
  $("#optGlitter").onchange = (e)=>{ dream.glitter = !!e.target.checked; renderDream(); };

  $("#optTextTop").oninput = (e)=>{ dream.textTop = e.target.value || ""; renderDream(); };
  $("#colText").oninput = (e)=>{ dream.colText = e.target.value; renderDream(); };
  $("#optSymbol").onchange = (e)=>{ dream.symbol = e.target.value; renderDream(); };

  $("#optCharms").onchange = (e)=>{ dream.charms = !!e.target.checked; renderDream(); };
  $("#optCharmSize").oninput = (e)=>{ dream.charmSize = Number(e.target.value)||34; renderDream(); };

  // presets
  $("#presetBase").onclick = ()=>applyPreset("base");
  $("#presetPhoto").onclick = ()=>applyPreset("photo");
  $("#presetRomantic").onclick = ()=>applyPreset("heart");
  $("#presetMoon").onclick = ()=>applyPreset("moon");
  $("#presetStar").onclick = ()=>applyPreset("star");

  // send / download
  $("#btnDownloadDesign").onclick = async () => {
    const blob = await canvasToBlob(dreamUI.canvas);
    downloadBlob(blob, "acchiappasogni_progetto.png");
  };
  $("#btnSendDesign").onclick = async () => {
    await sendDreamToWhatsApp();
  };
}

function applyPreset(p){
  dreamUI.placed = []; // reset accessori piazzati
  if(p==="base"){
    Object.assign(dream, {
      diameter: 35, feathers: 3, featherLen: 95, ringWidth: 5,
      colRings:"#222222", colWeb:"#222222", colFeathers:"#333333", colBeads:"#b50000",
      beadsOn:true, beadsQty:10, glitter:false,
      textTop:"", colText:"#b50000", symbol:"none",
      charms:false, charmSize:34
    });
  }
  if(p==="photo"){
    Object.assign(dream, {
      diameter: 42, feathers: 3, featherLen: 110, ringWidth: 6,
      colRings:"#1f1f1f", colWeb:"#1f1f1f", colFeathers:"#3a3a3a", colBeads:"#b50000",
      beadsOn:true, beadsQty:14, glitter:true,
      textTop:"REAL HASTA LA MUERTE", colText:"#b50000", symbol:"AA",
      charms:true, charmSize:40
    });
  }
  if(p==="heart"){ Object.assign(dream, { symbol:"heart", textTop:"", charms:false, glitter:false, beadsOn:true }); }
  if(p==="moon"){ Object.assign(dream, { symbol:"moon", textTop:"", charms:false, glitter:false, beadsOn:true }); }
  if(p==="star"){ Object.assign(dream, { symbol:"star", textTop:"", charms:false, glitter:false, beadsOn:true }); }

  // sync inputs
  $("#optDiameter").value = dream.diameter;
  $("#optFeathers").value = dream.feathers;
  $("#optFeatherLen").value = dream.featherLen;
  $("#optRingWidth").value = dream.ringWidth;
  $("#colRings").value = dream.colRings;
  $("#colWeb").value = dream.colWeb;
  $("#colFeathers").value = dream.colFeathers;
  $("#colBeads").value = dream.colBeads;
  $("#optBeadsOn").checked = dream.beadsOn;
  $("#optBeadsQty").value = dream.beadsQty;
  $("#optGlitter").checked = dream.glitter;
  $("#optTextTop").value = dream.textTop;
  $("#colText").value = dream.colText;
  $("#optSymbol").value = dream.symbol;
  $("#optCharms").checked = dream.charms;
  $("#optCharmSize").value = dream.charmSize;

  renderDream();
}

function renderDream(){
  const canvas = dreamUI.canvas, ctx = dreamUI.ctx;
  if(!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const W = rect.width, H = rect.height;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,W,H);

  const cx = W/2;
  const topY = H*0.38;
  const t = (dream.diameter - 12) / (60 - 12);
  const radius = 55 + t*85;

  // rings
  ctx.lineWidth = dream.ringWidth;
  ctx.strokeStyle = dream.colRings;
  ctx.beginPath(); ctx.arc(cx, topY, radius, 0, Math.PI*2); ctx.stroke();
  ctx.lineWidth = Math.max(2, dream.ringWidth - 2);
  ctx.beginPath(); ctx.arc(cx, topY, radius*0.72, 0, Math.PI*2); ctx.stroke();

  // web
  ctx.strokeStyle = dream.colWeb; ctx.lineWidth = 1.6;
  const spokes = 14;
  for(let i=0;i<spokes;i++){
    const a = (Math.PI*2/spokes)*i;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a)*radius*0.15, topY + Math.sin(a)*radius*0.15);
    ctx.lineTo(cx + Math.cos(a)*radius*0.70, topY + Math.sin(a)*radius*0.70);
    ctx.stroke();
  }
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for(let k=0;k<70;k++){
    const a = k*0.35;
    const rr = (radius*0.12) + (k/70)*(radius*0.58);
    const x = cx + Math.cos(a)*rr;
    const y = topY + Math.sin(a)*rr;
    if(k===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();

  // glitter dots ring
  if(dream.glitter){
    ctx.fillStyle = "rgba(220,180,60,0.9)";
    for(let i=0;i<22;i++){
      const a = (Math.PI*2/22)*i;
      const rr = radius*0.88;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a)*rr, topY + Math.sin(a)*rr, 2.2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // text top
  if((dream.textTop||"").trim()){
    ctx.save();
    ctx.fillStyle = dream.colText;
    ctx.font = "700 16px Arial";
    const text = dream.textTop.trim();
    const chars = text.split("");
    const startAngle = -Math.PI*0.92;
    const endAngle = -Math.PI*0.08;
    const step = (endAngle - startAngle) / Math.max(1, chars.length-1);
    for(let i=0;i<chars.length;i++){
      const a = startAngle + step*i;
      const x = cx + Math.cos(a)*(radius*0.93);
      const y = topY + Math.sin(a)*(radius*0.93);
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(a + Math.PI/2);
      ctx.fillText(chars[i], -4, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // center dot
  ctx.fillStyle = "rgba(180,120,40,0.9)";
  ctx.beginPath(); ctx.arc(cx, topY, 7, 0, Math.PI*2); ctx.fill();

  // center symbol
  drawSymbol(ctx, cx, topY + radius*0.52, dream.symbol, dream.colRings);

  // charms
  if(dream.charms){
    drawCharm(ctx, cx - radius*0.88, topY + radius*0.75, dream.charmSize, dream.colRings);
    drawCharm(ctx, cx + radius*0.88, topY + radius*0.75, dream.charmSize, dream.colRings);
  }

  // feathers
  const n = Math.max(1, Math.min(7, dream.feathers|0));
  const baseY = topY + radius*0.92;
  const spread = radius*0.95;
  for(let i=0;i<n;i++){
    const frac = (n===1) ? 0 : (i/(n-1))*2 - 1;
    const x = cx + frac*(spread*0.55);
    const y = baseY + Math.abs(frac)*6;

    if(dream.beadsOn && dream.beadsQty>0) drawBeadString(ctx, x, y - 8, dream.beadsQty, dream.colBeads);
    drawFeather(ctx, x, y + 18, dream.featherLen, dream.colFeathers);
  }

  // placed accessories (click)
  dreamUI.placed.forEach(item=>{
    if(item.type==="bead"){
      ctx.fillStyle = item.color;
      ctx.beginPath(); ctx.arc(item.x, item.y, 6, 0, Math.PI*2); ctx.fill();
    } else if(item.type==="glitter"){
      ctx.fillStyle = "rgba(220,180,60,0.95)";
      ctx.beginPath(); ctx.arc(item.x, item.y, 3.3, 0, Math.PI*2); ctx.fill();
    } else if(item.type==="symbol"){
      drawSymbol(ctx, item.x, item.y, item.symbol || dream.symbol, item.color || dream.colRings);
    } else if(item.type==="miniFeather"){
      drawFeather(ctx, item.x, item.y, 55, item.color || dream.colFeathers);
    }
  });
}

function drawSymbol(ctx, x, y, type, col){
  if(type==="none") return;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  if(type==="AA"){
    ctx.font = "900 34px Arial";
    ctx.fillStyle = col;
    ctx.fillText("AA", x - 22, y + 12);
  } else if(type==="heart"){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - 25, y - 25, x - 55, y + 10, x, y + 45);
    ctx.bezierCurveTo(x + 55, y + 10, x + 25, y - 25, x, y);
    ctx.stroke();
  } else if(type==="moon"){
    ctx.beginPath();
    ctx.arc(x - 8, y + 6, 22, 0.2, Math.PI*1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 4, y + 6, 22, 0.35, Math.PI*1.65);
    ctx.stroke();
  } else if(type==="star"){
    const spikes = 5, outer = 26, inner = 12;
    let rot = Math.PI/2*3;
    ctx.beginPath();
    ctx.moveTo(x, y - outer);
    for(let i=0;i<spikes;i++){
      ctx.lineTo(x + Math.cos(rot)*outer, y + Math.sin(rot)*outer);
      rot += Math.PI/spikes;
      ctx.lineTo(x + Math.cos(rot)*inner, y + Math.sin(rot)*inner);
      rot += Math.PI/spikes;
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCharm(ctx, x, y, size, col){
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = "rgba(255,220,220,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, size/2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x - size*0.12, y - size*0.08, 2.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + size*0.12, y - size*0.08, 2.3, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(180,80,80,0.9)";
  ctx.beginPath(); ctx.arc(x, y + size*0.05, size*0.16, 0, Math.PI); ctx.stroke();
  ctx.restore();
}

function drawBeadString(ctx, x, y, qty, col){
  ctx.save();
  ctx.fillStyle = col;
  for(let i=0;i<qty;i++){
    const yy = y + i*10;
    ctx.beginPath();
    ctx.arc(x, yy, (i%2===0)?3.5:2.6, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFeather(ctx, x, y, len, col){
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  for(let i=0;i<20;i++){
    const t = i/20;
    const yy = y + t*len;
    const w = (1 - Math.abs(t-0.45))*26;
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - w, yy + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + 6); ctx.stroke();
  }
  ctx.restore();
}

function canvasToBlob(canvas){
  return new Promise((resolve)=> canvas.toBlob((b)=>resolve(b), "image/png", 1));
}
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function sendDreamToWhatsApp(){
  const phone = state.config?.whatsappPhone || "393440260906";
  const name = ($("#designerName")?.value || "").trim();
  const notes = ($("#designerNotes")?.value || "").trim();

  const summary = [
    "Ciao! Ho creato un acchiappasogni personalizzato:",
    `• Diametro: ${dream.diameter} cm`,
    `• Piume: ${dream.feathers} (lunghezza ${dream.featherLen})`,
    `• Cerchi: ${dream.colRings} / Rete: ${dream.colWeb}`,
    `• Piume colore: ${dream.colFeathers}`,
    dream.beadsOn ? `• Perline: sì (${dream.beadsQty}) colore ${dream.colBeads}` : "• Perline: no",
    dream.glitter ? "• Brillantini: sì" : "• Brillantini: no",
    dream.textTop ? `• Scritta: ${dream.textTop}` : null,
    dream.symbol !== "none" ? `• Simbolo: ${dream.symbol}` : null,
    dream.charms ? `• Charms laterali: sì (size ${dream.charmSize})` : "• Charms laterali: no",
    dreamUI.placed.length ? `• Accessori aggiunti manualmente: ${dreamUI.placed.length}` : null,
    name ? `Nome: ${name}` : null,
    notes ? `Note: ${notes}` : null,
    "Ti invio l’immagine in allegato."
  ].filter(Boolean).join("\n");

  const blob = await canvasToBlob(dreamUI.canvas);
  const file = new File([blob], "progetto_acchiappasogni.png", { type: "image/png" });

  try{
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ title: "Progetto Acchiappasogni", text: summary, files: [file] });
      $("#designerHint").textContent = "Condivisione avviata ✅ scegli WhatsApp.";
      return;
    }
  }catch{}

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(summary)}`;
  window.open(url, "_blank");
  $("#designerHint").textContent = "WhatsApp aperto ✅ ora premi “Scarica immagine” e allegala in chat.";
}

// =====================
//  EVENTS
// =====================
function hookEvents() {
  $("#btnCart").onclick = () => openCart();
  $("#btnCloseCart").onclick = () => closeCart();
  $("#drawerBackdrop").onclick = () => closeCart();

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value || "";
    renderGrid();
  });

  document.querySelectorAll('input[name="delivery"]').forEach((r) => {
    r.addEventListener("change", () => {
      const v = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
      $("#shippingFields").style.display = v === "pickup" ? "none" : "";
      renderTotals();
    });
  });

  $("#btnSend").onclick = () => {
    const msg = buildWhatsAppMessage();
    const phone = state.config?.whatsappPhone ? state.config.whatsappPhone : "393440260906";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

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

  $("#btnCustom").onclick = () => {
    const phone = state.config?.whatsappPhone ? state.config.whatsappPhone : "393440260906";
    const msg = "Ciao! Vorrei un prodotto personalizzato. 😊";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  $("#btnSettings").onclick = () => openSettings();
  $("#btnCloseSettings").onclick = () => closeSettings();
  $("#settingsBackdrop").onclick = () => closeSettings();

  $("#btnDesigner").onclick = () => openDesigner();
  $("#btnCloseDesigner").onclick = () => closeDesigner();
  $("#designerBackdrop").onclick = () => closeDesigner();

  $("#btnUnlock").onclick = () => {
    const pass = $("#adminPass").value;
    if (pass === getAdminPassword()) {
      localStorage.setItem(LS_ADMIN_UNLOCKED, "1");
      $("#adminPass").value = "";
      $("#settingsLocked").classList.add("hidden");
      $("#settingsPanel").classList.remove("hidden");
      $("#sortMode").value = getSortMode();
      renderAdminList();
    } else alert("Password errata.");
  };

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

  $("#btnApplySort").onclick = () => {
    setSortMode($("#sortMode").value);
    renderGrid();
    renderAdminList();
    alert("Ordinamento applicato ✅");
  };

  $("#btnAddProduct").onclick = () => addNewProductFromForm();

  $("#btnSaveAll").onclick = () => {
    applyAdminEditsToState();
    saveOverrideProducts(state.products);
    rebuildCategories(); renderGrid(); renderCart(); renderTotals(); renderAdminList();
    alert("Modifiche salvate ✅ (solo sul tuo telefono)");
  };

  $("#btnResetAll").onclick = () => {
    if (confirm("Ripristinare i prodotti originali (dal sito / products.json)?")) {
      resetOverrideProducts();
      localStorage.removeItem(LS_ADMIN_UNLOCKED);
      state.products = state.baseProducts;
      rebuildCategories(); renderGrid(); renderCart(); renderTotals();
      alert("Ripristinato ✅");
      closeSettings();
    }
  };

  $("#btnExportJson").onclick = () => exportProductsJson();
  $("#btnImportJson").onclick = () => importProductsJson();
  $("#btnReloadFromSite").onclick = () => reloadFromSite();

  hookNewImageButtons();
}

// =====================
//  INIT
// =====================
(function init() {
  state.cart = parseCart();
  hookEvents();
  loadData(false);
})();

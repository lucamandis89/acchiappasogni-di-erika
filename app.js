// =====================
//  HELPERS
// =====================
const $ = (s) => document.querySelector(s);

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}
function euroFromCents(c) { return `€ ${(c / 100).toFixed(2).replace(".", ",")}`; }
function centsFromEuro(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
function safeId(prefix="ID"){ return `${prefix}-${Date.now()}-${Math.floor(Math.random()*10000)}`; }

// helper: set value only if element exists
function setVal(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value;
}
function setChecked(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.checked = !!value;
}

// =====================
//  STORAGE KEYS
// =====================
const CART_KEY = "ae_cart";
const ADMIN_PIN_KEY = "ae_admin_pin";
const PRICING_KEY = "ae_pricing";
const LOCAL_PRODUCTS_KEY = "ae_products_override";
const DREAMS_KEY = "ae_saved_dreams";

// =====================
//  DEFAULTS
// =====================
const DEFAULT_PIN = "1234";
const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="#f1f1f1"/>
    <text x="50%" y="50%" font-size="28" text-anchor="middle" fill="#777" font-family="Arial">
      Immagine non trovata
    </text>
  </svg>`);

// =====================
//  STATE
// =====================
const state = {
  config: {},
  productsBase: [],
  products: [],
  categories: [],
  activeCategory: "Tutti",
  query: "",
  cart: {}
};

// =====================
//  IMAGE FALLBACK (FIX POTENTE)
// =====================
function buildImageCandidates(raw) {
  const original = String(raw || "").trim();
  if (!original) return [];
  if (original.startsWith("data:image/")) return [original];

  const list = [];

  const add = (p)=>{
    if(!p) return;
    list.push(p);
    if(!p.startsWith("./")) list.push("./" + p);
  };

  // 1) così com'è
  add(original);

  // 2) se ti passa solo il nome file (FB_IMG_....jpg)
  const filenameOnly = original.split("/").pop();
  if (filenameOnly && filenameOnly !== original) add(filenameOnly);

  // 3) percorsi "standard" usati finora
  add("assets/" + filenameOnly);
  add("assets/images/assets/" + filenameOnly);

  // 4) percorsi "doppi" visti nel tuo repo (screenshot):
  //    assets/assets/images/assets/images/acchiappasogni_hd/...
  add("assets/assets/images/assets/images/" + filenameOnly);
  add("assets/assets/images/assets/images/acchiappasogni_hd/" + filenameOnly);
  add("assets/assets/images/assets/images/assets/" + filenameOnly);
  add("assets/assets/images/assets/" + filenameOnly);

  // 5) varianti HD che spesso crei
  add("assets/images/assets/acchiappasogni_hd/" + filenameOnly);
  add("assets/images/acchiappasogni_hd/" + filenameOnly);
  add("assets/acchiappasogni_hd/" + filenameOnly);

  // 6) se nel JSON ti arriva già tipo assets/...
  if (original.startsWith("assets/")) {
    add(original.replace("assets/", "assets/images/assets/"));
    add(original.replace("assets/", "assets/assets/images/assets/images/"));
  }

  // pulizia duplicati
  return Array.from(new Set(list.filter(Boolean)));
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
//  JSON FETCH
// =====================
async function fetchJson(url){
  const bust = (url.includes("?") ? "&" : "?") + "v=" + Date.now();
  const res = await fetch(url + bust, { cache: "no-store" });
  if(!res.ok) throw new Error("fetch failed");
  return await res.json();
}

// =====================
//  PRODUCTS
// =====================
function normalizeProducts(arr){
  return (arr || []).map((p, idx) => ({
    id: String(p.id || safeId("P")),
    title: p.title || p.name || "",
    category: p.category || "Altro",
    price: (typeof p.price === "number") ? p.price : (typeof p.price_from === "number" ? p.price_from : 0),
    description: p.description || "",
    image: p.image || "",
    featured: !!p.featured,
    createdAt: Number(p.createdAt || (Date.now()-idx))
  }));
}
function productPriceCents(p) {
  if (typeof p.priceCents === "number") return p.priceCents;
  if (typeof p.price === "number") return Math.round(p.price * 100);
  return 0;
}
function loadLocalProducts(){
  try{
    const x = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "null");
    return Array.isArray(x) ? x : null;
  }catch{ return null; }
}
function saveLocalProducts(arr){
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(arr));
}
function resetLocalProducts(){
  localStorage.removeItem(LOCAL_PRODUCTS_KEY);
}
function mergedProducts(){
  const local = loadLocalProducts();
  if(local && local.length) return normalizeProducts(local);
  return normalizeProducts(state.productsBase);
}

// =====================
//  CART
// =====================
function parseCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "{}") || {}; }
  catch { return {}; }
}
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); }
function cartCount(){ return Object.values(state.cart).reduce((a,b)=>a+(b||0),0); }
function updateCartBadge(){ const el=$("#cartCount"); if(el) el.textContent = cartCount(); }

function setQty(id, qty){
  qty = Math.max(0, qty|0);
  if(qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;

  saveCart();
  updateCartBadge();
  renderGrid();
  renderCart();
  renderTotals();
}

// =====================
//  CATEGORIES + FILTER
// =====================
function rebuildCategories(){
  const cats = new Set(["Tutti"]);
  state.products.forEach(p => cats.add(p.category || "Altro"));
  state.categories = Array.from(cats);
  if(!state.categories.includes(state.activeCategory)) state.activeCategory = "Tutti";
}
function matches(p){
  const q = state.query.trim().toLowerCase();
  const catOk = state.activeCategory === "Tutti" || (p.category || "") === state.activeCategory;
  if(!q) return catOk;
  const hay = `${p.title || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
  return catOk && hay.includes(q);
}
function sortProducts(list){
  return list.sort((a,b)=>{
    const fa = a.featured ? 1 : 0;
    const fb = b.featured ? 1 : 0;
    if(fb !== fa) return fb - fa;
    return Number(b.createdAt||0) - Number(a.createdAt||0);
  });
}
function renderTabs(){
  const tabs = $("#tabs");
  if(!tabs) return;
  tabs.innerHTML = "";
  state.categories.forEach(cat=>{
    const b = document.createElement("button");
    b.className = "tab" + (cat === state.activeCategory ? " active" : "");
    b.textContent = cat;
    b.onclick = ()=>{
      state.activeCategory = cat;
      renderTabs();
      renderGrid();
    };
    tabs.appendChild(b);
  });
}

// =====================
//  GRID
// =====================
function renderGrid(){
  const grid = $("#grid");
  if(!grid) return;
  grid.innerHTML = "";

  const list = sortProducts(state.products.filter(matches).slice());
  if(!list.length){
    grid.innerHTML = `<div style="color:var(--muted); padding:12px;">Nessun prodotto trovato.</div>`;
    return;
  }

  list.forEach(p=>{
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
      </div>
    `;

    attachImageFallback(card.querySelector("[data-img]"), p.image);

    card.querySelector("[data-minus]").onclick = ()=> setQty(p.id, (state.cart[p.id]||0)-1);
    card.querySelector("[data-plus]").onclick = ()=> setQty(p.id, (state.cart[p.id]||0)+1);
    card.querySelector("[data-add]").onclick = ()=> { setQty(p.id, (state.cart[p.id]||0)+1); openCart(); };

    grid.appendChild(card);
  });
}

// =====================
//  CART UI
// =====================
function openCart(){
  $("#drawer")?.classList.remove("hidden");
  $("#drawerBackdrop")?.classList.remove("hidden");
}
function closeCart(){
  $("#drawer")?.classList.add("hidden");
  $("#drawerBackdrop")?.classList.add("hidden");
}
function renderCart(){
  const wrap = $("#cartItems");
  if(!wrap) return;

  wrap.innerHTML = "";
  const ids = Object.keys(state.cart);

  if(!ids.length){
    wrap.innerHTML = `<div style="color:var(--muted); padding:10px;">Carrello vuoto.</div>`;
    return;
  }

  ids.forEach(id=>{
    const p = state.products.find(x=>x.id===id);
    if(!p) return;

    const qty = state.cart[id]||0;

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
      </div>
    `;

    attachImageFallback(div.querySelector("[data-img]"), p.image);

    div.querySelector("[data-minus]").onclick = ()=> setQty(id, qty-1);
    div.querySelector("[data-plus]").onclick = ()=> setQty(id, qty+1);

    wrap.appendChild(div);
  });
}
function renderTotals(){
  const ids = Object.keys(state.cart);
  let subtotal = 0;
  ids.forEach(id=>{
    const p = state.products.find(x=>x.id===id);
    if(!p) return;
    subtotal += productPriceCents(p) * (state.cart[id]||0);
  });

  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
  let shipping = 0;
  let hint = "";

  if(delivery === "pickup"){
    shipping = 0;
    hint = "Ritiro/consegna a mano: niente spedizione.";
  } else {
    shipping = 0;
  }

  if($("#subtotal")) $("#subtotal").textContent = euroFromCents(subtotal);
  if($("#shipping")) $("#shipping").textContent = euroFromCents(shipping);
  if($("#total")) $("#total").textContent = euroFromCents(subtotal + shipping);
  if($("#shippingHint")) $("#shippingHint").textContent = hint;
}

// =====================
//  WHATSAPP ORDER
// =====================
function buildWhatsAppMessage(){
  const ids = Object.keys(state.cart);
  const lines = [];
  lines.push(`Ciao! Vorrei ordinare:`);
  lines.push("");

  ids.forEach(id=>{
    const p = state.products.find(x=>x.id===id);
    if(!p) return;
    const qty = state.cart[id]||0;
    lines.push(`• ${qty} x ${p.title} — ${euroFromCents(productPriceCents(p))}`);
  });

  lines.push("");
  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
  lines.push(`Consegna: ${delivery === "pickup" ? "Ritiro / a mano" : "Spedizione"}`);

  const name = $("#name")?.value?.trim() || "";
  const street = $("#street")?.value?.trim() || "";
  const cap = $("#cap")?.value?.trim() || "";
  const city = $("#city")?.value?.trim() || "";
  const notes = $("#notes")?.value?.trim() || "";

  if(name) lines.push(`Nome: ${name}`);

  if(delivery !== "pickup"){
    if(street) lines.push(`Indirizzo: ${street}`);
    if(cap || city) lines.push(`CAP/Città: ${cap} ${city}`.trim());
  }

  if(notes){
    lines.push("");
    lines.push(`Note: ${notes}`);
  }

  return lines.join("\n");
}

// =====================
//  ADMIN: PIN + PRICING
// =====================
function getAdminPin(){
  return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;
}
function setAdminPin(pin){
  localStorage.setItem(ADMIN_PIN_KEY, String(pin || "").trim());
}
function askPin(){
  const pin = prompt("Inserisci PIN Admin:");
  if(pin == null) return false;
  return String(pin).trim() === getAdminPin();
}
function getPricing(){
  const defaults = {
    photoExtraCents: 300,
    glitterExtraCents: 200,
    charmsExtraCents: 200,
    textExtraCents: 150
  };
  try {
    const saved = JSON.parse(localStorage.getItem(PRICING_KEY) || "null");
    return { ...defaults, ...(saved || {}) };
  } catch {
    return defaults;
  }
}
function savePricing(p){ localStorage.setItem(PRICING_KEY, JSON.stringify(p)); }

// =====================
//  ADMIN PANEL (inject)
// =====================
function ensureAdminPanel(){
  if($("#aeAdminPanel")) return;

  const wrap = document.createElement("div");
  wrap.id = "aeAdminPanel";
  wrap.style.cssText = "position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,.6); padding:14px; overflow:auto; display:none;";

  wrap.innerHTML = `
    <div style="max-width:900px; margin:0 auto; background:#0f172a; color:#e5e7eb;
      border-radius:18px; padding:14px; border:1px solid rgba(255,255,255,.08); font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="font-size:18px; font-weight:900;">⚙️ Impostazioni (Admin)</div>
        <button id="aeAdminClose" style="border:0; background:rgba(255,255,255,.12); color:#fff; padding:10px 12px; border-radius:14px; cursor:pointer;">Chiudi</button>
      </div>

      <div style="margin-top:10px; font-size:12px; opacity:.85;">
        Nota: le modifiche qui si salvano sul tuo telefono (localStorage). Per pubblicare a tutti: Esporta JSON e incollalo su GitHub in data/products.json.
      </div>

      <div style="display:grid; gap:12px; margin-top:12px;">
        <div style="padding:12px; background:rgba(255,255,255,.06); border-radius:16px;">
          <div style="font-weight:900;">🔐 Sicurezza</div>
          <label style="display:block; margin:8px 0 6px;">Nuovo PIN (min 4 cifre)</label>
          <input id="aeNewPin" type="password" inputmode="numeric"
            style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
          <button id="aeSavePin" style="margin-top:10px; width:100%; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:rgba(255,255,255,.12); color:#fff;">Salva PIN</button>
          <div style="font-size:12px; opacity:.85; margin-top:6px;">PIN default: <b>${DEFAULT_PIN}</b></div>
        </div>

        <div style="padding:12px; background:rgba(255,255,255,.06); border-radius:16px;">
          <div style="font-weight:900;">💶 Prezzi extra configuratore</div>
          <div style="display:grid; gap:8px; margin-top:8px;">
            <label style="font-size:12px; opacity:.9;">Extra Foto (€)</label>
            <input id="aePricePhoto" type="number" step="0.5" min="0" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">

            <label style="font-size:12px; opacity:.9;">Extra Brillantini (€)</label>
            <input id="aePriceGlitter" type="number" step="0.5" min="0" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">

            <label style="font-size:12px; opacity:.9;">Extra Charms (€)</label>
            <input id="aePriceCharms" type="number" step="0.5" min="0" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">

            <label style="font-size:12px; opacity:.9;">Extra Testo (€)</label>
            <input id="aePriceText" type="number" step="0.5" min="0" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">

            <button id="aeSavePricing" style="margin-top:6px; width:100%; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:#22c55e; color:#052e14;">Salva prezzi extra</button>
          </div>
        </div>

        <div style="padding:12px; background:rgba(255,255,255,.06); border-radius:16px;">
          <div style="font-weight:900;">🧩 Gestione prodotti</div>

          <div style="display:grid; gap:10px; margin-top:10px;">
            <input id="aePId" placeholder="ID (lascia vuoto per nuovo)" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            <input id="aePTitle" placeholder="Titolo" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            <input id="aePCat" placeholder="Categoria" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            <input id="aePPrice" type="number" step="0.5" min="0" placeholder="Prezzo (€)" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            <textarea id="aePDesc" rows="3" placeholder="Descrizione (facoltativa)" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;"></textarea>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <input id="aePImagePath" placeholder="Percorso immagine (GitHub) es: assets/images/assets/foto.jpg"
                style="flex:1; min-width:250px; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
              <button id="aePickImage" style="border:0; cursor:pointer; padding:10px 12px; border-radius:14px; font-weight:900; background:rgba(255,255,255,.12); color:#fff;">📷 Da galleria</button>
            </div>

            <div id="aePrevWrap" style="display:none; gap:10px; align-items:center; flex-wrap:wrap;">
              <img id="aePrevImg" style="width:120px; height:80px; object-fit:cover; border-radius:12px; border:1px solid rgba(255,255,255,.12);">
              <div style="font-size:12px; opacity:.85;">Foto da galleria = solo sul tuo telefono. Per tutti: caricala su GitHub e usa il percorso.</div>
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="aeSaveProd" style="flex:1; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:#60a5fa; color:#061226;">Salva prodotto</button>
              <button id="aeClearProd" style="flex:1; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:rgba(255,255,255,.12); color:#fff;">Svuota campi</button>
            </div>

            <div style="margin-top:6px; font-weight:900;">Prodotti attuali</div>
            <div id="aeProdList"></div>

            <div style="margin-top:10px; font-weight:900;">Esporta / Importa</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="aeExport" style="flex:1; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:#22c55e; color:#052e14;">Esporta JSON</button>
              <button id="aeImport" style="flex:1; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:#f59e0b; color:#1f1200;">Importa JSON</button>
              <button id="aeReset" style="flex:1; border:0; cursor:pointer; padding:12px; border-radius:14px; font-weight:900; background:#ef4444; color:#2a0505;">Reset (GitHub)</button>
            </div>
            <textarea id="aeJsonBox" rows="10" style="margin-top:8px; width:100%; padding:10px; border-radius:14px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;"></textarea>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  $("#aeAdminClose").onclick = ()=> wrap.style.display="none";
  wrap.addEventListener("click", (e)=>{ if(e.target===wrap) wrap.style.display="none"; });
}

function openAdmin(){
  ensureAdminPanel();
  if(!askPin()) return;

  const wrap = $("#aeAdminPanel");
  wrap.style.display = "block";

  const pr = getPricing();
  $("#aePricePhoto").value = (pr.photoExtraCents/100).toString();
  $("#aePriceGlitter").value = (pr.glitterExtraCents/100).toString();
  $("#aePriceCharms").value = (pr.charmsExtraCents/100).toString();
  $("#aePriceText").value = (pr.textExtraCents/100).toString();

  adminRenderProductList();
}

function adminClearForm(){
  $("#aePId").value = "";
  $("#aePTitle").value = "";
  $("#aePCat").value = "";
  $("#aePPrice").value = "";
  $("#aePDesc").value = "";
  $("#aePImagePath").value = "";
  $("#aePImagePath").dataset.dataurl = "";
  $("#aePrevWrap").style.display = "none";
  $("#aePrevImg").src = "";
}

function adminGetWorkingProducts(){
  const local = loadLocalProducts();
  if(local && Array.isArray(local)) return normalizeProducts(local);
  return normalizeProducts(state.productsBase);
}
function adminSaveWorkingProducts(arr){
  saveLocalProducts(arr);
  state.products = mergedProducts();
  rebuildCategories();
  renderTabs();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge();
  adminRenderProductList();
}

function adminRenderProductList(){
  const list = $("#aeProdList");
  if(!list) return;

  const arr = adminGetWorkingProducts().slice().sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
  if(!arr.length){
    list.innerHTML = `<div style="opacity:.85; font-size:12px;">Nessun prodotto.</div>`;
    return;
  }

  list.innerHTML = "";
  arr.forEach(p=>{
    const row = document.createElement("div");
    row.style.cssText = "border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:10px; margin:10px 0; background:rgba(255,255,255,.04);";
    row.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center;">
        <img data-img style="width:70px; height:54px; object-fit:cover; border-radius:12px; border:1px solid rgba(255,255,255,.12);" />
        <div style="flex:1;">
          <div style="font-weight:900;">${escapeHtml(p.title)}</div>
          <div style="font-size:12px; opacity:.8;">${escapeHtml(p.category)} • ${euroFromCents(productPriceCents(p))}</div>
          <div style="font-size:11px; opacity:.75;">ID: ${escapeHtml(p.id)}</div>
        </div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        <button data-edit style="border:0; cursor:pointer; padding:10px 12px; border-radius:14px; font-weight:900; background:rgba(255,255,255,.12); color:#fff;">Modifica</button>
        <button data-del style="border:0; cursor:pointer; padding:10px 12px; border-radius:14px; font-weight:900; background:#ef4444; color:#2a0505;">Elimina</button>
      </div>
    `;
    attachImageFallback(row.querySelector("[data-img]"), p.image);

    row.querySelector("[data-edit]").onclick = ()=>{
      $("#aePId").value = p.id;
      $("#aePTitle").value = p.title || "";
      $("#aePCat").value = p.category || "";
      $("#aePPrice").value = (productPriceCents(p)/100).toFixed(2);
      $("#aePDesc").value = p.description || "";
      $("#aePImagePath").value = (p.image && !String(p.image).startsWith("data:image/")) ? p.image : "";
      $("#aePImagePath").dataset.dataurl = (p.image && String(p.image).startsWith("data:image/")) ? p.image : "";
      if($("#aePImagePath").dataset.dataurl){
        $("#aePrevWrap").style.display = "flex";
        $("#aePrevImg").src = $("#aePImagePath").dataset.dataurl;
      } else {
        $("#aePrevWrap").style.display = "none";
        $("#aePrevImg").src = "";
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert("Modifica i campi e premi Salva prodotto.");
    };

    row.querySelector("[data-del]").onclick = ()=>{
      if(!confirm("Eliminare questo prodotto?")) return;
      const cur = adminGetWorkingProducts();
      const next = cur.filter(x=>x.id !== p.id);
      adminSaveWorkingProducts(next);
    };

    list.appendChild(row);
  });
}

// pick image -> dataurl
function pickImageToDataUrl(){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display="none";
  document.body.appendChild(input);

  input.onchange = ()=>{
    const file = input.files && input.files[0];
    document.body.removeChild(input);
    if(!file) return;

    const reader = new FileReader();
    reader.onload = ()=>{
      $("#aePImagePath").dataset.dataurl = reader.result;
      $("#aePImagePath").value = "";
      $("#aePrevWrap").style.display = "flex";
      $("#aePrevImg").src = reader.result;
      alert("Foto caricata ✅ ora salva il prodotto.");
    };
    reader.readAsDataURL(file);
  };

  input.click();
}

function adminSaveProductFromForm(){
  const id = ($("#aePId").value || "").trim();
  const title = ($("#aePTitle").value || "").trim();
  const category = ($("#aePCat").value || "Altro").trim();
  const priceCents = centsFromEuro($("#aePPrice").value);
  const desc = ($("#aePDesc").value || "").trim();

  if(!title){ alert("Titolo obbligatorio."); return; }

  const dataUrl = $("#aePImagePath").dataset.dataurl || "";
  const path = ($("#aePImagePath").value || "").trim();
  const image = dataUrl || path;

  const cur = adminGetWorkingProducts();
  const now = Date.now();

  if(id){
    const idx = cur.findIndex(x=>x.id===id);
    if(idx >= 0){
      cur[idx] = { ...cur[idx], title, category, price: priceCents/100, description: desc, image };
    } else {
      cur.unshift({ id, title, category, price: priceCents/100, description: desc, image, featured:false, createdAt: now });
    }
  } else {
    cur.unshift({ id: safeId("P"), title, category, price: priceCents/100, description: desc, image, featured:false, createdAt: now });
  }

  adminSaveWorkingProducts(cur);
  adminClearForm();
  alert("Prodotto salvato ✅");
}

function adminExportJson(){
  const cur = adminGetWorkingProducts();
  const json = JSON.stringify(cur, null, 2);
  $("#aeJsonBox").value = json;
}
function adminImportJson(){
  const raw = ($("#aeJsonBox").value || "").trim();
  if(!raw) return alert("Incolla un JSON valido.");
  try{
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed)) return alert("Il JSON deve essere un array [ ... ]");
    adminSaveWorkingProducts(parsed);
    alert("Import completato ✅");
  }catch{
    alert("JSON non valido.");
  }
}

// =====================
//  DESIGNER (10 cerchi + scelta colori)
// =====================
const dream = {
  diameter: 35,
  ringWidth: 5,
  ringCount: 2,
  ringGap: 18,
  webDensity: 14,

  colRings: "#222222",
  multiRingColors: false,
  ringColors: Array(10).fill("#222222"),

  colWeb: "#222222",
  colFeathers: "#333333",
  colBeads: "#b50000",
  colText: "#b50000",

  feathers: 3,
  featherLen: 95,

  beadsOn: true,
  beadsQty: 10,
  glitter: false,

  textTop: "",
  symbol: "none",

  charms: true,
  charmSize: 34,

  placed: [],
  tool: "bead",
  hasCustomPhoto: false
};

let designerCanvas = null;
let designerCtx = null;

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function calcDreamExtraCents(){
  const p = getPricing();
  let total = 0;
  if(dream.glitter) total += p.glitterExtraCents;
  if(dream.charms) total += p.charmsExtraCents;
  if((dream.textTop||"").trim()) total += p.textExtraCents;
  if(dream.hasCustomPhoto) total += p.photoExtraCents;
  return Math.max(0,total);
}
function updateDreamPriceUI(){
  const el = $("#dreamPrice");
  if(el) el.textContent = euroFromCents(calcDreamExtraCents());
}

function renderRingColorInputs(){
  const wrap = $("#ringColorsWrap");
  const list = $("#ringColorsList");
  const chk = $("#optMultiRingColors");
  if(!wrap || !list || !chk) return;

  wrap.style.display = chk.checked ? "block" : "none";
  list.innerHTML = "";

  const count = clamp(dream.ringCount|0, 1, 10);
  for(let i=0;i<count;i++){
    const box = document.createElement("label");
    box.style.cssText = "display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:900;";
    box.innerHTML = `
      <span>Cerchio ${i+1}</span>
      <input type="color" data-ringcolor="${i}" value="${dream.ringColors[i] || dream.colRings}">
    `;
    const input = box.querySelector("input");
    input.oninput = (e)=>{
      dream.ringColors[i] = e.target.value;
      renderDream();
    };
    list.appendChild(box);
  }
}
function setAllRingColorsFromMain(){
  for(let i=0;i<10;i++) dream.ringColors[i] = dream.colRings;
}

function drawEmoji(ctx, x, y, emoji){
  ctx.save();
  ctx.font = "32px Arial";
  ctx.fillText(emoji, x - 16, y + 12);
  ctx.restore();
}
function drawSymbol(ctx, x, y, type, col){
  if(type==="none") return;
  ctx.save();
  ctx.fillStyle = col;

  if(type==="AA"){
    ctx.font = "900 34px Arial";
    ctx.fillText("AA", x - 22, y + 12);
  } else if(type==="heart") drawEmoji(ctx,x,y,"❤️");
  else if(type==="moon") drawEmoji(ctx,x,y,"🌙");
  else if(type==="star") drawEmoji(ctx,x,y,"⭐");
  else if(type==="cross") drawEmoji(ctx,x,y,"✝️");

  ctx.restore();
}
function drawFeather(ctx, x, y, len, col){
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + len);
  ctx.stroke();

  for(let i=0;i<20;i++){
    const t = i/20;
    const yy = y + t*len;
    const w = (1 - Math.abs(t-0.45))*26;
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - w, yy + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + 6); ctx.stroke();
  }
  ctx.restore();
}

function initDesigner(){
  if(designerCanvas) return;

  designerCanvas = $("#designerCanvas");
  designerCtx = designerCanvas.getContext("2d");

  const resize = () => {
    const rect = designerCanvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    designerCanvas.width = Math.round(rect.width * dpr);
    designerCanvas.height = Math.round(rect.height * dpr);
    designerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderDream();
  };

  resize();
  window.addEventListener("resize", resize);

  designerCanvas.addEventListener("pointerdown", async (ev)=>{
    const rect = designerCanvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    if(dream.tool === "photo"){
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      document.body.appendChild(input);

      input.onchange = async () => {
        const file = input.files && input.files[0];
        document.body.removeChild(input);
        if(!file) return;

        const reader = new FileReader();
        reader.onload = ()=>{
          dream.placed.push({ type:"photo", x, y, dataUrl: reader.result });
          dream.hasCustomPhoto = true;
          renderDream();
        };
        reader.readAsDataURL(file);
      };

      input.click();
      return;
    }

    if(dream.tool === "letter"){
      const txt = prompt("Inserisci una lettera:");
      if(!txt) return;
      dream.placed.push({ type:"text", x, y, text: txt.substring(0,2), color: dream.colText });
      renderDream();
      return;
    }

    if(dream.tool === "number"){
      const txt = prompt("Inserisci un numero:");
      if(!txt) return;
      dream.placed.push({ type:"text", x, y, text: txt.substring(0,3), color: dream.colText });
      renderDream();
      return;
    }

    const toolMap = {
      heart:"❤️", rings:"💍", bouquet:"💐", rose:"🌹", crown:"👑",
      angel:"👼", dove:"🕊️", baby:"👶", ribbon:"🎀", cross:"✝️",
      moon:"🌙", star:"⭐", butterfly:"🦋", flower:"🌸", sparkle:"✨"
    };

    if(toolMap[dream.tool]){
      dream.placed.push({ type:"emoji", x, y, emoji: toolMap[dream.tool] });
      renderDream();
      return;
    }

    if(dream.tool === "bead"){
      dream.placed.push({ type:"bead", x, y });
      renderDream();
      return;
    }
    if(dream.tool === "glitter"){
      dream.placed.push({ type:"glitter", x, y });
      renderDream();
      return;
    }
  });
}

function renderDream(){
  if(!designerCanvas || !designerCtx) return;

  const rect = designerCanvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;

  const ctx = designerCtx;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,W,H);

  const cx = W/2;
  const topY = H*0.38;

  const t = (dream.diameter - 12) / (60 - 12);
  const radius = 55 + t*85;

  const ringCount = clamp(dream.ringCount|0, 1, 10);
  const ringGap = clamp(Number(dream.ringGap)||18, 4, 40);

  // ✅ CERCHI con scelta colore singolo/multiplo
  for(let i=0;i<ringCount;i++){
    const r = radius - i*ringGap;
    if(r < 18) break;

    const ringColor = dream.multiRingColors
      ? (dream.ringColors[i] || dream.colRings)
      : dream.colRings;

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = dream.ringWidth;
    ctx.beginPath();
    ctx.arc(cx, topY, r, 0, Math.PI*2);
    ctx.stroke();
  }

  // rete usa l’ultimo cerchio valido
  const innerRadius = Math.max(26, radius - (ringCount-1)*ringGap);

  // web
  const spokes = clamp(dream.webDensity|0, 8, 28);
  ctx.strokeStyle = dream.colWeb;
  ctx.lineWidth = 1.6;

  for(let i=0;i<spokes;i++){
    const a = (Math.PI*2/spokes)*i;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a)*innerRadius*0.15, topY + Math.sin(a)*innerRadius*0.15);
    ctx.lineTo(cx + Math.cos(a)*innerRadius*0.86, topY + Math.sin(a)*innerRadius*0.86);
    ctx.stroke();
  }

  // spiral
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for(let k=0;k<70;k++){
    const a = k*0.35;
    const rr = (innerRadius*0.12) + (k/70)*(innerRadius*0.66);
    const x = cx + Math.cos(a)*rr;
    const y = topY + Math.sin(a)*rr;
    if(k===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();

  // glitter dots
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
    ctx.font = "900 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(dream.textTop.trim(), cx, topY - radius - 12);
    ctx.restore();
  }

  // center dot
  ctx.fillStyle = "rgba(180,120,40,0.9)";
  ctx.beginPath(); ctx.arc(cx, topY, 7, 0, Math.PI*2); ctx.fill();

  // symbol
  drawSymbol(ctx, cx, topY + innerRadius*0.52, dream.symbol, dream.colRings);

  // charms
  if(dream.charms){
    drawEmoji(ctx, cx - radius*0.88, topY + radius*0.75, "🎀");
    drawEmoji(ctx, cx + radius*0.88, topY + radius*0.75, "🎀");
  }

  // feathers
  const n = clamp(dream.feathers|0, 1, 9);
  const baseY = topY + radius*0.92;
  const spread = radius*0.95;

  for(let i=0;i<n;i++){
    const frac = (n===1) ? 0 : (i/(n-1))*2 - 1;
    const x = cx + frac*(spread*0.55);
    const y = baseY + Math.abs(frac)*6;

    if(dream.beadsOn){
      ctx.fillStyle = dream.colBeads;
      for(let b=0;b<3;b++){
        ctx.beginPath();
        ctx.arc(x, y - 6 + b*10, 3.5, 0, Math.PI*2);
        ctx.fill();
      }
    }
    drawFeather(ctx, x, y + 18, dream.featherLen, dream.colFeathers);
  }

  // placed
  dream.placed.forEach(item=>{
    if(item.type==="bead"){
      ctx.fillStyle = dream.colBeads;
      ctx.beginPath(); ctx.arc(item.x, item.y, 6, 0, Math.PI*2); ctx.fill();
    } else if(item.type==="glitter"){
      ctx.fillStyle = "rgba(220,180,60,0.95)";
      ctx.beginPath(); ctx.arc(item.x, item.y, 3.3, 0, Math.PI*2); ctx.fill();
    } else if(item.type==="emoji"){
      drawEmoji(ctx, item.x, item.y, item.emoji);
    } else if(item.type==="text"){
      ctx.save();
      ctx.fillStyle = item.color || "#111";
      ctx.font = "900 20px Arial";
      ctx.fillText(item.text || "", item.x - 10, item.y + 8);
      ctx.restore();
    } else if(item.type==="photo" && item.dataUrl){
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, item.x - 25, item.y - 25, 50, 50); };
      img.src = item.dataUrl;
    }
  });

  updateDreamPriceUI();
}

function openDesigner(){
  $("#designerModal")?.classList.remove("hidden");
  $("#designerBackdrop")?.classList.remove("hidden");
  initDesigner();
  renderRingColorInputs();
  renderDream();
}
function closeDesigner(){
  $("#designerModal")?.classList.add("hidden");
  $("#designerBackdrop")?.classList.add("hidden");
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

// =====================
//  DREAMS SAVE/LOAD
// =====================
function loadDreams(){
  try{
    const arr = JSON.parse(localStorage.getItem(DREAMS_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}
function saveDreams(arr){
  localStorage.setItem(DREAMS_KEY, JSON.stringify(arr));
}
function saveCurrentDream(){
  const name = prompt("Nome progetto:");
  if(!name) return;

  const eventType = ($("#eventType")?.value || "").trim();
  const eventQty = ($("#eventQty")?.value || "").trim();
  const eventDate = ($("#eventDate")?.value || "").trim();
  const eventTheme = ($("#eventTheme")?.value || "").trim();
  const designerName = ($("#designerName")?.value || "").trim();
  const designerNotes = ($("#designerNotes")?.value || "").trim();

  const arr = loadDreams();
  arr.unshift({
    id: safeId("DREAM"),
    name,
    event: { eventType, eventQty, eventDate, eventTheme },
    info: { designerName, designerNotes },
    dream: JSON.parse(JSON.stringify(dream)),
    createdAt: Date.now()
  });
  saveDreams(arr);
  alert("Progetto salvato ✅");
}

function openMyDreams(){
  $("#myDreamsModal")?.classList.remove("hidden");
  $("#myDreamsBackdrop")?.classList.remove("hidden");
  renderMyDreams();
}
function closeMyDreams(){
  $("#myDreamsModal")?.classList.add("hidden");
  $("#myDreamsBackdrop")?.classList.add("hidden");
}
function renderMyDreams(){
  const wrap = $("#myDreamsList");
  if(!wrap) return;
  wrap.innerHTML = "";
  const arr = loadDreams();

  if(!arr.length){
    wrap.innerHTML = `<div style="color:var(--muted); padding:10px;">Nessun progetto salvato.</div>`;
    return;
  }

  arr.forEach(item=>{
    const box = document.createElement("div");
    box.style.border = "1px solid rgba(0,0,0,.08)";
    box.style.borderRadius = "14px";
    box.style.padding = "10px";
    box.style.marginBottom = "10px";
    box.style.background = "rgba(255,255,255,.65)";

    box.innerHTML = `
      <div style="font-weight:900; margin-bottom:6px;">${escapeHtml(item.name)}</div>
      <div style="font-size:12px; opacity:.8; margin-bottom:8px;">
        ${escapeHtml(item.event?.eventType || "Evento libero")}
        ${item.event?.eventQty ? " • Qty: " + escapeHtml(item.event.eventQty) : ""}
        ${item.event?.eventDate ? " • Data: " + escapeHtml(item.event.eventDate) : ""}
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn small" data-open>Apri</button>
        <button class="btn danger small" data-del>Elimina</button>
      </div>
    `;

    box.querySelector("[data-open]").onclick = ()=>{
      Object.assign(dream, JSON.parse(JSON.stringify(item.dream || {})));
      setVal("eventType", item.event?.eventType || "");
      setVal("eventQty", item.event?.eventQty || "");
      setVal("eventDate", item.event?.eventDate || "");
      setVal("eventTheme", item.event?.eventTheme || "");
      setVal("designerName", item.info?.designerName || "");
      setVal("designerNotes", item.info?.designerNotes || "");
      renderRingColorInputs();
      renderDream();
      closeMyDreams();
      openDesigner();
    };

    box.querySelector("[data-del]").onclick = ()=>{
      if(!confirm("Eliminare progetto?")) return;
      saveDreams(loadDreams().filter(x=>x.id !== item.id));
      renderMyDreams();
    };

    wrap.appendChild(box);
  });
}

// =====================
//  SEND DESIGN TO WHATSAPP
// =====================
async function sendDreamToWhatsApp(){
  const phone = state.config?.whatsappPhone || "393440260906";

  const eventType = ($("#eventType")?.value || "").trim();
  const eventQty = ($("#eventQty")?.value || "").trim();
  const eventDate = ($("#eventDate")?.value || "").trim();
  const eventTheme = ($("#eventTheme")?.value || "").trim();

  const name = ($("#designerName")?.value || "").trim();
  const notes = ($("#designerNotes")?.value || "").trim();

  const extraCents = calcDreamExtraCents();

  const msg = [
    "Ciao! Ho creato un acchiappasogni personalizzato:",
    "",
    eventType ? `🎁 Evento: ${eventType}` : null,
    eventQty ? `📦 Quantità bomboniere: ${eventQty}` : null,
    eventDate ? `📅 Data evento: ${eventDate}` : null,
    eventTheme ? `🎨 Tema: ${eventTheme}` : null,
    "",
    `• Diametro: ${dream.diameter} cm`,
    `• Cerchi: ${dream.ringCount} (gap ${dream.ringGap})`,
    `• Rete densità: ${dream.webDensity}`,
    `• Piume: ${dream.feathers} (lunghezza ${dream.featherLen})`,
    `• Colore cerchi: ${dream.multiRingColors ? "MULTI" : "SINGOLO"}`,
    dream.multiRingColors ? `• Colori cerchi: ${dream.ringColors.slice(0, clamp(dream.ringCount,1,10)).join(", ")}` : null,
    `• Rete colore: ${dream.colWeb}`,
    `• Piume colore: ${dream.colFeathers}`,
    dream.beadsOn ? `• Perline: sì (${dream.beadsQty}) colore ${dream.colBeads}` : "• Perline: no",
    dream.glitter ? "• Brillantini: sì" : "• Brillantini: no",
    dream.charms ? `• Charms laterali: sì (size ${dream.charmSize})` : "• Charms laterali: no",
    dream.textTop ? `• Scritta: ${dream.textTop}` : null,
    dream.symbol !== "none" ? `• Simbolo: ${dream.symbol}` : null,
    dream.hasCustomPhoto ? "• Foto personalizzata: sì" : "• Foto personalizzata: no",
    dream.placed.length ? `• Accessori aggiunti: ${dream.placed.length}` : null,
    "",
    `💶 Extra configurazione: ${euroFromCents(extraCents)}`,
    "",
    name ? `Nome cliente: ${name}` : null,
    notes ? `Note: ${notes}` : null,
    "",
    "Ti invio l’immagine in allegato."
  ].filter(Boolean).join("\n");

  const blob = await canvasToBlob(designerCanvas);
  const file = new File([blob], "progetto_acchiappasogni.png", { type: "image/png" });

  try{
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ title: "Progetto Acchiappasogni", text: msg, files: [file] });
      const hint = $("#designerHint");
      if(hint) hint.textContent = "Condivisione avviata ✅ scegli WhatsApp.";
      return;
    }
  }catch{}

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
  downloadBlob(blob, "progetto_acchiappasogni.png");
  const hint = $("#designerHint");
  if(hint) hint.textContent = "WhatsApp aperto ✅ (se non allega, allega l’immagine scaricata).";
}

// =====================
//  PRESETS
// =====================
function presetClassic(){
  Object.assign(dream, {
    diameter: 35,
    ringWidth: 5,
    ringCount: 2,
    ringGap: 18,
    webDensity: 14,

    colRings: "#222222",
    multiRingColors: false,
    ringColors: Array(10).fill("#222222"),

    colWeb: "#222222",
    colFeathers: "#333333",
    colBeads: "#b50000",
    colText: "#b50000",

    feathers: 3,
    featherLen: 95,

    beadsOn: true,
    beadsQty: 10,
    glitter: false,

    textTop: "",
    symbol: "none",

    charms: true,
    charmSize: 34,

    placed: [],
    tool: "bead",
    hasCustomPhoto: false
  });
  syncDesignerInputs();
  renderRingColorInputs();
  renderDream();
}
function presetPhoto(){
  presetClassic();
  dream.textTop = "REAL HASTA LA MUERTE";
  dream.symbol = "AA";
  dream.glitter = true;
  dream.ringCount = 3;
  dream.ringGap = 16;
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}
function presetMarriage(){
  presetClassic();
  dream.textTop = "MATRIMONIO";
  dream.symbol = "heart";
  dream.colRings = "#ffffff";
  dream.colWeb = "#ffffff";
  dream.colFeathers = "#ffffff";
  dream.colBeads = "#ffd700";
  dream.glitter = true;
  dream.ringCount = 4;
  dream.ringGap = 14;
  setAllRingColorsFromMain();
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}
function presetBaptism(){
  presetClassic();
  dream.textTop = "BATTESIMO";
  dream.symbol = "cross";
  dream.colRings = "#87ceeb";
  dream.colWeb = "#87ceeb";
  dream.colFeathers = "#ffffff";
  dream.colBeads = "#ffd700";
  dream.glitter = true;
  dream.ringCount = 3;
  dream.ringGap = 16;
  setAllRingColorsFromMain();
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}
function presetCresima(){
  presetClassic();
  dream.textTop = "CRESIMA";
  dream.symbol = "cross";
  dream.glitter = true;
  dream.ringCount = 3;
  dream.ringGap = 16;
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}
function presetLaurea(){
  presetClassic();
  dream.textTop = "LAUREA";
  dream.symbol = "star";
  dream.glitter = true;
  dream.ringCount = 4;
  dream.ringGap = 14;
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}
function presetBaby(){
  presetClassic();
  dream.textTop = "NASCITA";
  dream.symbol = "heart";
  dream.colRings = "#ffc0cb";
  dream.colWeb = "#ffc0cb";
  dream.colFeathers = "#ffffff";
  dream.colBeads = "#ffd700";
  dream.glitter = true;
  dream.ringCount = 3;
  dream.ringGap = 16;
  setAllRingColorsFromMain();
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}
function presetFantasy(){
  presetClassic();
  dream.textTop = "FANTASY";
  dream.symbol = "moon";
  dream.colRings = "#1b1b3a";
  dream.colWeb = "#1b1b3a";
  dream.colFeathers = "#2b2b5a";
  dream.colBeads = "#ffd700";
  dream.glitter = true;
  dream.ringCount = 5;
  dream.ringGap = 12;
  setAllRingColorsFromMain();
  syncDesignerInputs(); renderRingColorInputs(); renderDream();
}

function syncDesignerInputs(){
  setVal("optDiameter", dream.diameter);
  setVal("optFeathers", dream.feathers);
  setVal("optFeatherLen", dream.featherLen);

  setVal("optRingWidth", dream.ringWidth);
  setVal("optRingCount", dream.ringCount);
  setVal("optRingGap", dream.ringGap);
  setVal("optWebDensity", dream.webDensity);

  setVal("colRings", dream.colRings);
  setChecked("optMultiRingColors", !!dream.multiRingColors);

  setVal("colWeb", dream.colWeb);
  setVal("colFeathers", dream.colFeathers);
  setVal("colBeads", dream.colBeads);
  setVal("colText", dream.colText);

  setChecked("optBeadsOn", !!dream.beadsOn);
  setVal("optBeadsQty", dream.beadsQty);
  setChecked("optGlitter", !!dream.glitter);

  setVal("optTextTop", dream.textTop);
  setVal("optSymbol", dream.symbol);

  setChecked("optCharms", !!dream.charms);
  setVal("optCharmSize", dream.charmSize);

  renderRingColorInputs();
}

// =====================
//  LOAD DATA
// =====================
async function loadData(){
  try{
    state.config = await fetchJson("data/config.json");
    if(state.config.brandName) $("#brandName").textContent = state.config.brandName;
  }catch{
    state.config = {};
  }

  let arr = [];
  try{
    if(state.config.productsUrl) arr = await fetchJson(state.config.productsUrl);
    else arr = await fetchJson("data/products.json");
  }catch{
    arr = [];
  }

  arr = Array.isArray(arr) ? arr : (arr.products || []);
  state.productsBase = arr;
  state.products = mergedProducts();

  rebuildCategories();
  renderTabs();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge();
}

// =====================
//  EVENTS
// =====================
function hookEvents(){
  // cart
  $("#btnCart") && ($("#btnCart").onclick = openCart);
  $("#btnCloseCart") && ($("#btnCloseCart").onclick = closeCart);
  $("#drawerBackdrop") && ($("#drawerBackdrop").onclick = closeCart);

  // admin
  $("#btnAdmin") && ($("#btnAdmin").onclick = openAdmin);

  // admin panel events
  ensureAdminPanel();
  $("#aeSavePin").onclick = ()=>{
    const pin = String($("#aeNewPin").value||"").trim();
    if(pin.length < 4) return alert("PIN troppo corto (min 4 cifre).");
    setAdminPin(pin);
    $("#aeNewPin").value = "";
    alert("PIN salvato ✅");
  };
  $("#aeSavePricing").onclick = ()=>{
    const p = getPricing();
    p.photoExtraCents = centsFromEuro($("#aePricePhoto").value);
    p.glitterExtraCents = centsFromEuro($("#aePriceGlitter").value);
    p.charmsExtraCents = centsFromEuro($("#aePriceCharms").value);
    p.textExtraCents = centsFromEuro($("#aePriceText").value);
    savePricing(p);
    alert("Prezzi salvati ✅");
    updateDreamPriceUI();
  };
  $("#aePickImage").onclick = pickImageToDataUrl;
  $("#aeSaveProd").onclick = adminSaveProductFromForm;
  $("#aeClearProd").onclick = adminClearForm;
  $("#aeExport").onclick = adminExportJson;
  $("#aeImport").onclick = adminImportJson;
  $("#aeReset").onclick = ()=>{
    if(!confirm("Reset: torna ai prodotti di GitHub (cancella modifiche locali). Procedo?")) return;
    resetLocalProducts();
    state.products = mergedProducts();
    rebuildCategories(); renderTabs(); renderGrid();
    adminRenderProductList();
    alert("Reset completato ✅");
  };

  // designer
  $("#btnDesigner") && ($("#btnDesigner").onclick = openDesigner);
  $("#btnCloseDesigner") && ($("#btnCloseDesigner").onclick = closeDesigner);
  $("#designerBackdrop") && ($("#designerBackdrop").onclick = closeDesigner);

  $("#presetBase") && ($("#presetBase").onclick = presetClassic);
  $("#presetPhoto") && ($("#presetPhoto").onclick = presetPhoto);
  $("#presetMarriage") && ($("#presetMarriage").onclick = presetMarriage);
  $("#presetBaptism") && ($("#presetBaptism").onclick = presetBaptism);
  $("#presetCresima") && ($("#presetCresima").onclick = presetCresima);
  $("#presetLaurea") && ($("#presetLaurea").onclick = presetLaurea);
  $("#presetBaby") && ($("#presetBaby").onclick = presetBaby);
  $("#presetFantasy") && ($("#presetFantasy").onclick = presetFantasy);

  // tools
  const setTool = (t)=>{ dream.tool = t; };
  $("#toolBead") && ($("#toolBead").onclick = ()=>setTool("bead"));
  $("#toolGlitter") && ($("#toolGlitter").onclick = ()=>setTool("glitter"));
  $("#toolHeart") && ($("#toolHeart").onclick = ()=>setTool("heart"));
  $("#toolRings") && ($("#toolRings").onclick = ()=>setTool("rings"));
  $("#toolBouquet") && ($("#toolBouquet").onclick = ()=>setTool("bouquet"));
  $("#toolRose") && ($("#toolRose").onclick = ()=>setTool("rose"));
  $("#toolCrown") && ($("#toolCrown").onclick = ()=>setTool("crown"));
  $("#toolAngel") && ($("#toolAngel").onclick = ()=>setTool("angel"));
  $("#toolDove") && ($("#toolDove").onclick = ()=>setTool("dove"));
  $("#toolBaby") && ($("#toolBaby").onclick = ()=>setTool("baby"));
  $("#toolRibbon") && ($("#toolRibbon").onclick = ()=>setTool("ribbon"));
  $("#toolCross") && ($("#toolCross").onclick = ()=>setTool("cross"));
  $("#toolMoon") && ($("#toolMoon").onclick = ()=>setTool("moon"));
  $("#toolStar") && ($("#toolStar").onclick = ()=>setTool("star"));
  $("#toolButterfly") && ($("#toolButterfly").onclick = ()=>setTool("butterfly"));
  $("#toolFlower") && ($("#toolFlower").onclick = ()=>setTool("flower"));
  $("#toolSparkle") && ($("#toolSparkle").onclick = ()=>setTool("sparkle"));
  $("#toolLetter") && ($("#toolLetter").onclick = ()=>setTool("letter"));
  $("#toolNumber") && ($("#toolNumber").onclick = ()=>setTool("number"));
  $("#toolPhoto") && ($("#toolPhoto").onclick = ()=>setTool("photo"));

  $("#toolUndo") && ($("#toolUndo").onclick = ()=>{ dream.placed.pop(); renderDream(); });
  $("#toolClearAll") && ($("#toolClearAll").onclick = ()=>{
    if(!confirm("Vuoi cancellare tutto?")) return;
    dream.placed = [];
    dream.hasCustomPhoto = false;
    renderDream();
  });

  // designer inputs
  $("#optDiameter") && ($("#optDiameter").oninput = (e)=>{ dream.diameter = Number(e.target.value)||35; renderDream(); });
  $("#optFeathers") && ($("#optFeathers").oninput = (e)=>{ dream.feathers = Number(e.target.value)||3; renderDream(); });
  $("#optFeatherLen") && ($("#optFeatherLen").oninput = (e)=>{ dream.featherLen = Number(e.target.value)||95; renderDream(); });
  $("#optRingWidth") && ($("#optRingWidth").oninput = (e)=>{ dream.ringWidth = Number(e.target.value)||5; renderDream(); });

  $("#optRingCount") && ($("#optRingCount").oninput = (e)=>{
    dream.ringCount = clamp(Number(e.target.value)||2, 1, 10);
    renderRingColorInputs();
    renderDream();
  });
  $("#optRingGap") && ($("#optRingGap").oninput = (e)=>{ dream.ringGap = Number(e.target.value)||18; renderDream(); });
  $("#optWebDensity") && ($("#optWebDensity").oninput = (e)=>{ dream.webDensity = Number(e.target.value)||14; renderDream(); });

  $("#colRings") && ($("#colRings").oninput = (e)=>{
    dream.colRings = e.target.value;
    if(dream.multiRingColors){
      setAllRingColorsFromMain();
      renderRingColorInputs();
    }
    renderDream();
  });

  $("#optMultiRingColors") && ($("#optMultiRingColors").onchange = (e)=>{
    dream.multiRingColors = !!e.target.checked;
    if(dream.multiRingColors && (!dream.ringColors || !dream.ringColors.length)){
      dream.ringColors = Array(10).fill(dream.colRings);
    }
    renderRingColorInputs();
    renderDream();
  });

  $("#colWeb") && ($("#colWeb").oninput = (e)=>{ dream.colWeb = e.target.value; renderDream(); });
  $("#colFeathers") && ($("#colFeathers").oninput = (e)=>{ dream.colFeathers = e.target.value; renderDream(); });
  $("#colBeads") && ($("#colBeads").oninput = (e)=>{ dream.colBeads = e.target.value; renderDream(); });
  $("#colText") && ($("#colText").oninput = (e)=>{ dream.colText = e.target.value; renderDream(); });

  $("#optBeadsOn") && ($("#optBeadsOn").onchange = (e)=>{ dream.beadsOn = !!e.target.checked; renderDream(); });
  $("#optBeadsQty") && ($("#optBeadsQty").oninput = (e)=>{ dream.beadsQty = Number(e.target.value)||0; renderDream(); });
  $("#optGlitter") && ($("#optGlitter").onchange = (e)=>{ dream.glitter = !!e.target.checked; renderDream(); });

  $("#optTextTop") && ($("#optTextTop").oninput = (e)=>{ dream.textTop = e.target.value || ""; renderDream(); });
  $("#optSymbol") && ($("#optSymbol").onchange = (e)=>{ dream.symbol = e.target.value; renderDream(); });

  $("#optCharms") && ($("#optCharms").onchange = (e)=>{ dream.charms = !!e.target.checked; renderDream(); });
  $("#optCharmSize") && ($("#optCharmSize").oninput = (e)=>{ dream.charmSize = Number(e.target.value)||34; renderDream(); });

  // designer actions
  $("#btnSaveDream") && ($("#btnSaveDream").onclick = saveCurrentDream);
  $("#btnMyDreams") && ($("#btnMyDreams").onclick = openMyDreams);
  $("#btnCloseMyDreams") && ($("#btnCloseMyDreams").onclick = closeMyDreams);
  $("#myDreamsBackdrop") && ($("#myDreamsBackdrop").onclick = closeMyDreams);

  $("#btnDownloadDesign") && ($("#btnDownloadDesign").onclick = async ()=>{
    const blob = await canvasToBlob(designerCanvas);
    downloadBlob(blob, "acchiappasogni_progetto.png");
  });
  $("#btnSendDesign") && ($("#btnSendDesign").onclick = sendDreamToWhatsApp);

  // search
  $("#search") && ($("#search").addEventListener("input", (e)=>{
    state.query = e.target.value || "";
    renderGrid();
  }));

  // delivery toggle
  document.querySelectorAll('input[name="delivery"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      const v = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
      const shipFields = $("#shippingFields");
      if(shipFields) shipFields.style.display = v === "pickup" ? "none" : "";
      renderTotals();
    });
  });

  // send order
  $("#btnSend") && ($("#btnSend").onclick = ()=>{
    const msg = buildWhatsAppMessage();
    const phone = state.config?.whatsappPhone || "393440260906";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  });

  // clear cart
  $("#btnClear") && ($("#btnClear").onclick = ()=>{
    if(confirm("Vuoi svuotare il carrello?")){
      state.cart = {};
      saveCart();
      updateCartBadge();
      renderCart();
      renderTotals();
      renderGrid();
    }
  });

  // custom button
  $("#btnCustom") && ($("#btnCustom").onclick = ()=>{
    const phone = state.config?.whatsappPhone || "393440260906";
    const msg = "Ciao! Vorrei un acchiappasogni personalizzato 😊";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  });
}

// =====================
//  INIT
// =====================
(function init(){
  state.cart = parseCart();
  hookEvents();
  loadData();
  presetClassic();
})();

// =====================
//  STATE
// =====================
const state = {
  config: {},
  products: [],
  categories: [],
  activeCategory: "Tutti",
  query: "",
  cart: {}
};

const $ = (s) => document.querySelector(s);

// =====================
//  UTILS
// =====================
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function euroFromCents(c) {
  return `€ ${(c / 100).toFixed(2).replace(".", ",")}`;
}

function parseCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "{}") || {}; }
  catch { return {}; }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
}

function cartCount() {
  return Object.values(state.cart).reduce((a, b) => a + b, 0);
}

function updateCartBadge() {
  const el = $("#cartCount");
  if(el) el.textContent = cartCount();
}

// =====================
//  IMAGE FALLBACK
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
//  COLOR NAME
// =====================
function hexToRgb(hex){
  hex = String(hex || "").trim().replace("#","");
  if (hex.length === 3) hex = hex.split("").map(c=>c+c).join("");
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return null;
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

function colorNameFromHex(hex){
  const rgb = hexToRgb(hex);
  if (!rgb) return "";

  const {r,g,b} = rgb;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const diff = max - min;

  if (diff < 18){
    if (max < 45) return "Nero";
    if (max < 85) return "Grigio scuro";
    if (max < 145) return "Grigio";
    if (max < 205) return "Grigio chiaro";
    return "Bianco";
  }

  let h;
  if (max === r) h = (60 * ((g - b) / diff) + 360) % 360;
  else if (max === g) h = 60 * ((b - r) / diff) + 120;
  else h = 60 * ((r - g) / diff) + 240;

  const v = max / 255;
  const s = diff / max;

  let base;
  if (h < 15 || h >= 345) base = "Rosso";
  else if (h < 45) base = "Arancione";
  else if (h < 70) base = "Giallo";
  else if (h < 160) base = "Verde";
  else if (h < 200) base = "Turchese";
  else if (h < 255) base = "Blu";
  else if (h < 290) base = "Viola";
  else base = "Fucsia";

  if (v < 0.35) base = base + " scuro";
  else if (v > 0.85 && s < 0.55) base = "Pastello " + base.toLowerCase();
  else if (s < 0.45) base = base + " tenue";

  return base;
}

// =====================
//  FETCH JSON
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

function productPriceCents(p) {
  if (typeof p.priceCents === "number") return p.priceCents;
  if (typeof p.price === "number") return Math.round(p.price * 100);
  if (typeof p.price_from === "number") return Math.round(p.price_from * 100);
  return 0;
}

async function loadData(){
  try{
    state.config = await fetchJson("data/config.json");
    if(state.config.brandName) $("#brandName").textContent = state.config.brandName;
  }catch{
    state.config = {};
  }

  let arr = [];
  try{
    if(state.config.productsUrl){
      arr = await fetchJson(state.config.productsUrl);
    } else {
      arr = await fetchJson("data/products.json");
    }
  }catch{
    arr = [];
  }

  arr = Array.isArray(arr) ? arr : (arr.products || []);
  state.products = normalizeProducts(arr);

  rebuildCategories();
  renderTabs();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge();
}

// =====================
//  FILTER + TABS
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
//  CART
// =====================
function openCart(){
  $("#drawer").classList.remove("hidden");
  $("#drawerBackdrop").classList.remove("hidden");
}

function closeCart(){
  $("#drawer").classList.add("hidden");
  $("#drawerBackdrop").classList.add("hidden");
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

  $("#subtotal").textContent = euroFromCents(subtotal);
  $("#shipping").textContent = euroFromCents(shipping);
  $("#total").textContent = euroFromCents(subtotal + shipping);
  $("#shippingHint").textContent = hint;
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

  const name = $("#name").value.trim();
  const street = $("#street").value.trim();
  const cap = $("#cap").value.trim();
  const city = $("#city").value.trim();
  const notes = $("#notes").value.trim();

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
//  DESIGNER DREAMCATCHER
// =====================
const dream = {
  diameter: 35,
  feathers: 3,
  featherLen: 95,
  ringWidth: 5,
  colRings: "#222222",
  colWeb: "#222222",
  colFeathers: "#333333",
  colBeads: "#b50000",
  beadsOn: true,
  beadsQty: 10,
  glitter: false,
  textTop: "",
  colText: "#b50000",
  symbol: "none",
  charms: true,
  charmSize: 34,

  placed: [],
  tool: "bead",
  hasCustomPhoto: false
};

let designerCanvas = null;
let designerCtx = null;

// =====================
//  ADMIN SETTINGS (PIN) + PRICING
// =====================
const ADMIN_KEY = "ae_admin_pin";
const PRICING_KEY = "ae_pricing";

function getPricing(){
  const defaults = {
    baseCents: 0,
    photoExtraCents: 300,
    glitterExtraCents: 200,
    charmsExtraCents: 200,
    textExtraCents: 150,
    stickerExtraCents: 0
  };
  try {
    const saved = JSON.parse(localStorage.getItem(PRICING_KEY) || "null");
    return { ...defaults, ...(saved || {}) };
  } catch {
    return defaults;
  }
}

function savePricing(p){
  localStorage.setItem(PRICING_KEY, JSON.stringify(p));
}

function getAdminPin(){
  return localStorage.getItem(ADMIN_KEY) || "1234";
}

function setAdminPin(pin){
  localStorage.setItem(ADMIN_KEY, String(pin || "").trim());
}

function askPin(){
  const pin = prompt("Inserisci PIN Admin:");
  if(pin == null) return false;
  return String(pin).trim() === getAdminPin();
}

function calcDreamPriceCents(){
  const p = getPricing();
  let total = p.baseCents;

  if (dream.glitter) total += p.glitterExtraCents;
  if (dream.charms) total += p.charmsExtraCents;
  if ((dream.textTop || "").trim().length > 0) total += p.textExtraCents;
  if (dream.hasCustomPhoto) total += p.photoExtraCents;

  // sticker extras se vuoi metterli a pagamento
  if(dream.placed.length > 0) total += p.stickerExtraCents;

  return Math.max(0, total);
}

function formatPriceFromCents(c){
  return `€ ${(c/100).toFixed(2).replace(".", ",")}`;
}

function updateDesignerPriceUI(){
  const el = document.getElementById("dreamPrice");
  if(!el) return;
  el.textContent = formatPriceFromCents(calcDreamPriceCents());
}

// =====================
//  ADMIN PANEL
// =====================
function ensureAdminPanel(){
  if(document.getElementById("aeAdminPanel")) return;

  const wrap = document.createElement("div");
  wrap.id = "aeAdminPanel";
  wrap.style.cssText = `
    position: fixed; inset: 0; display:none; align-items:center; justify-content:center;
    background: rgba(0,0,0,.55); z-index: 9999; padding: 16px;
  `;

  wrap.innerHTML = `
    <div style="
      width: 100%; max-width: 520px; background: #0f172a; color: #e5e7eb;
      border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,.45);
      padding: 16px; border: 1px solid rgba(255,255,255,.08);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="font-size: 18px; font-weight: 800;">Impostazioni Admin</div>
        <button id="aeAdminClose" style="
          border: 0; background: rgba(255,255,255,.12); color:#fff;
          padding: 8px 12px; border-radius: 12px; cursor: pointer;
        ">Chiudi</button>
      </div>

      <div style="margin-top: 14px; opacity:.85; font-size: 13px;">
        Cambia prezzi extra e PIN.
      </div>

      <div style="margin-top: 14px; padding: 12px; background: rgba(255,255,255,.06); border-radius: 14px;">
        <div style="font-weight:700; margin-bottom:10px;">Prezzi extra</div>

        <label style="display:block; margin:10px 0 6px;">Extra Foto personalizzata (€)</label>
        <input id="aePricePhoto" type="number" min="0" step="0.5" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.25); color:#fff;"/>

        <label style="display:block; margin:10px 0 6px;">Extra Brillantini (€)</label>
        <input id="aePriceGlitter" type="number" min="0" step="0.5" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.25); color:#fff;"/>

        <label style="display:block; margin:10px 0 6px;">Extra Charms (€)</label>
        <input id="aePriceCharms" type="number" min="0" step="0.5" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.25); color:#fff;"/>

        <label style="display:block; margin:10px 0 6px;">Extra Testo (€)</label>
        <input id="aePriceText" type="number" min="0" step="0.5" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.25); color:#fff;"/>

        <button id="aeSavePrices" style="margin-top: 12px; width:100%; border:0; cursor:pointer; padding: 12px; border-radius: 14px; font-weight:800; background: #22c55e; color:#052e14;">Salva prezzi</button>
      </div>

      <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,.06); border-radius: 14px;">
        <div style="font-weight:700; margin-bottom:10px;">Sicurezza</div>
        <label style="display:block; margin:10px 0 6px;">Cambia PIN (min 4 cifre)</label>
        <input id="aeNewPin" type="password" inputmode="numeric" style="width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.25); color:#fff;"/>
        <button id="aeSavePin" style="margin-top: 12px; width:100%; border:0; cursor:pointer; padding: 12px; border-radius: 14px; font-weight:800; background: rgba(255,255,255,.12); color:#fff;">Salva PIN</button>
      </div>

      <div style="margin-top: 10px; font-size: 12px; opacity:.8;">
        Apertura Admin: <b>pressione lunga</b> sullo sfondo nero del configuratore.
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  const close = () => wrap.style.display = "none";
  wrap.addEventListener("click", (e)=> { if(e.target === wrap) close(); });
  document.getElementById("aeAdminClose").onclick = close;

  const fill = ()=>{
    const pr = getPricing();
    $("#aePricePhoto").value = (pr.photoExtraCents/100).toString();
    $("#aePriceGlitter").value = (pr.glitterExtraCents/100).toString();
    $("#aePriceCharms").value = (pr.charmsExtraCents/100).toString();
    $("#aePriceText").value = (pr.textExtraCents/100).toString();
  };

  fill();

  document.getElementById("aeSavePrices").onclick = ()=>{
    const pr = getPricing();
    pr.photoExtraCents = Math.round(Number($("#aePricePhoto").value || 0) * 100);
    pr.glitterExtraCents = Math.round(Number($("#aePriceGlitter").value || 0) * 100);
    pr.charmsExtraCents = Math.round(Number($("#aePriceCharms").value || 0) * 100);
    pr.textExtraCents = Math.round(Number($("#aePriceText").value || 0) * 100);
    savePricing(pr);
    alert("Prezzi salvati ✅");
    updateDesignerPriceUI();
  };

  document.getElementById("aeSavePin").onclick = ()=>{
    const pin = String($("#aeNewPin").value || "").trim();
    if(pin.length < 4){
      alert("PIN troppo corto (min 4 cifre).");
      return;
    }
    setAdminPin(pin);
    $("#aeNewPin").value = "";
    alert("PIN salvato ✅");
  };
}

function openAdminPanel(){
  ensureAdminPanel();
  const ok = askPin();
  if(!ok) return;
  document.getElementById("aeAdminPanel").style.display = "flex";
}

function hookAdminOpeners(){
  const backdrop = document.getElementById("designerBackdrop");
  if(!backdrop) return;

  let pressT = null;
  backdrop.addEventListener("touchstart", ()=>{
    pressT = setTimeout(()=> openAdminPanel(), 1200);
  });
  backdrop.addEventListener("touchend", ()=>{
    clearTimeout(pressT);
    pressT = null;
  });
}

// =====================
//  DRAWING / STICKERS
// =====================
function setTool(t){ dream.tool = t; }

function drawEmoji(ctx, x, y, emoji){
  ctx.save();
  ctx.font = "32px Arial";
  ctx.fillText(emoji, x - 16, y + 12);
  ctx.restore();
}

function drawSymbol(ctx, x, y, type, col){
  if(type==="none") return;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 3;

  if(type==="AA"){
    ctx.font = "900 34px Arial";
    ctx.fillText("AA", x - 22, y + 12);
  } else if(type==="heart"){
    drawEmoji(ctx,x,y,"❤️");
  } else if(type==="moon"){
    drawEmoji(ctx,x,y,"🌙");
  } else if(type==="star"){
    drawEmoji(ctx,x,y,"⭐");
  } else if(type==="cross"){
    drawEmoji(ctx,x,y,"✝️");
  }

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
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x - w, yy + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy + 6);
    ctx.stroke();
  }
  ctx.restore();
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

  // rings
  ctx.lineWidth = dream.ringWidth;
  ctx.strokeStyle = dream.colRings;
  ctx.beginPath(); ctx.arc(cx, topY, radius, 0, Math.PI*2); ctx.stroke();
  ctx.lineWidth = Math.max(2, dream.ringWidth - 2);
  ctx.beginPath(); ctx.arc(cx, topY, radius*0.72, 0, Math.PI*2); ctx.stroke();

  // web
  ctx.strokeStyle = dream.colWeb;
  ctx.lineWidth = 1.6;
  const spokes = 14;
  for(let i=0;i<spokes;i++){
    const a = (Math.PI*2/spokes)*i;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a)*radius*0.15, topY + Math.sin(a)*radius*0.15);
    ctx.lineTo(cx + Math.cos(a)*radius*0.70, topY + Math.sin(a)*radius*0.70);
    ctx.stroke();
  }

  // spiral
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

  // glitter ring
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

  // center symbol
  drawSymbol(ctx, cx, topY + radius*0.52, dream.symbol, dream.colRings);

  // charms
  if(dream.charms){
    drawEmoji(ctx, cx - radius*0.88, topY + radius*0.75, "🎀");
    drawEmoji(ctx, cx + radius*0.88, topY + radius*0.75, "🎀");
  }

  // feathers
  const n = Math.max(1, Math.min(9, dream.feathers|0));
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

  // placed items
  dream.placed.forEach(item=>{
    if(item.type==="bead"){
      ctx.fillStyle = dream.colBeads;
      ctx.beginPath(); ctx.arc(item.x, item.y, 6, 0, Math.PI*2); ctx.fill();
    }
    else if(item.type==="glitter"){
      ctx.fillStyle = "rgba(220,180,60,0.95)";
      ctx.beginPath(); ctx.arc(item.x, item.y, 3.3, 0, Math.PI*2); ctx.fill();
    }
    else if(item.type==="emoji"){
      drawEmoji(ctx, item.x, item.y, item.emoji);
    }
    else if(item.type==="text"){
      ctx.save();
      ctx.fillStyle = item.color || "#111";
      ctx.font = "900 20px Arial";
      ctx.fillText(item.text || "", item.x - 10, item.y + 8);
      ctx.restore();
    }
    else if(item.type==="photo" && item.dataUrl){
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, item.x - 25, item.y - 25, 50, 50);
      };
      img.src = item.dataUrl;
    }
  });

  updateDesignerPriceUI();
}

// =====================
//  CANVAS EXPORT
// =====================
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
//  DREAM STORAGE
// =====================
const DREAMS_KEY = "ae_saved_dreams";

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
    id: "DREAM-" + Date.now(),
    name,
    event: { eventType, eventQty, eventDate, eventTheme },
    info: { designerName, designerNotes },
    dream: JSON.parse(JSON.stringify(dream)),
    createdAt: Date.now()
  });

  saveDreams(arr);
  alert("Progetto salvato ✅");
}

function applyDream(d){
  Object.assign(dream, JSON.parse(JSON.stringify(d.dream || d)));
  syncDesignerInputs();
  renderDream();

  if(d.event){
    $("#eventType").value = d.event.eventType || "";
    $("#eventQty").value = d.event.eventQty || "";
    $("#eventDate").value = d.event.eventDate || "";
    $("#eventTheme").value = d.event.eventTheme || "";
  }

  if(d.info){
    $("#designerName").value = d.info.designerName || "";
    $("#designerNotes").value = d.info.designerNotes || "";
  }
}

// =====================
//  MY DREAMS MODAL
// =====================
function openMyDreams(){
  $("#myDreamsModal").classList.remove("hidden");
  $("#myDreamsBackdrop").classList.remove("hidden");
  renderMyDreams();
}

function closeMyDreams(){
  $("#myDreamsModal").classList.add("hidden");
  $("#myDreamsBackdrop").classList.add("hidden");
}

function renderMyDreams(){
  const wrap = $("#myDreamsList");
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
        <button class="btn small" data-send>Invia WhatsApp</button>
        <button class="btn danger small" data-del>Elimina</button>
      </div>
    `;

    box.querySelector("[data-open]").onclick = ()=>{
      applyDream(item);
      closeMyDreams();
    };

    box.querySelector("[data-send]").onclick = async ()=>{
      applyDream(item);
      closeMyDreams();
      await sendDreamToWhatsApp();
    };

    box.querySelector("[data-del]").onclick = ()=>{
      if(!confirm("Eliminare progetto?")) return;
      const newArr = loadDreams().filter(x=>x.id !== item.id);
      saveDreams(newArr);
      renderMyDreams();
    };

    wrap.appendChild(box);
  });
}

// =====================
//  SYNC INPUTS
// =====================
function syncDesignerInputs(){
  $("#optDiameter").value = dream.diameter;
  $("#optFeathers").value = dream.feathers;
  $("#optFeatherLen").value = dream.featherLen;
  $("#optRingWidth").value = dream.ringWidth;

  $("#colRings").value = dream.colRings;
  $("#colWeb").value = dream.colWeb;
  $("#colFeathers").value = dream.colFeathers;
  $("#colBeads").value = dream.colBeads;
  $("#colText").value = dream.colText;

  $("#optBeadsOn").checked = dream.beadsOn;
  $("#optBeadsQty").value = dream.beadsQty;
  $("#optGlitter").checked = dream.glitter;

  $("#optTextTop").value = dream.textTop;
  $("#optSymbol").value = dream.symbol;

  $("#optCharms").checked = dream.charms;
  $("#optCharmSize").value = dream.charmSize;
}

// =====================
//  PRESETS
// =====================
function presetClassic(){
  Object.assign(dream, {
    diameter: 35,
    feathers: 3,
    featherLen: 95,
    ringWidth: 5,
    colRings: "#222222",
    colWeb: "#222222",
    colFeathers: "#333333",
    colBeads: "#b50000",
    beadsOn: true,
    beadsQty: 10,
    glitter: false,
    textTop: "",
    colText: "#b50000",
    symbol: "none",
    charms: true,
    charmSize: 34,
    placed: [],
    tool: "bead",
    hasCustomPhoto: false
  });
  syncDesignerInputs();
  renderDream();
}

function presetPhoto(){
  presetClassic();
  dream.textTop = "REAL HASTA LA MUERTE";
  dream.symbol = "AA";
  dream.glitter = true;
  syncDesignerInputs();
  renderDream();
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
  syncDesignerInputs();
  renderDream();
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
  syncDesignerInputs();
  renderDream();
}

function presetCresima(){
  presetClassic();
  dream.textTop = "CRESIMA";
  dream.symbol = "cross";
  dream.colRings = "#ffffff";
  dream.colWeb = "#ffffff";
  dream.colFeathers = "#ffffff";
  dream.colBeads = "#b50000";
  dream.glitter = true;
  syncDesignerInputs();
  renderDream();
}

function presetLaurea(){
  presetClassic();
  dream.textTop = "LAUREA";
  dream.symbol = "star";
  dream.colRings = "#111111";
  dream.colWeb = "#111111";
  dream.colFeathers = "#111111";
  dream.colBeads = "#b50000";
  dream.glitter = true;
  syncDesignerInputs();
  renderDream();
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
  syncDesignerInputs();
  renderDream();
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
  syncDesignerInputs();
  renderDream();
}

// =====================
//  DESIGNER INIT
// =====================
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

      input.onchange = () => {
        const file = input.files && input.files[0];
        document.body.removeChild(input);
        if(!file) return;

        const reader = new FileReader();
        reader.onload = () => {
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

    // mapping tools to emoji
    const toolMap = {
      heart: "❤️",
      rings: "💍",
      bouquet: "💐",
      rose: "🌹",
      crown: "👑",
      angel: "👼",
      dove: "🕊️",
      baby: "👶",
      ribbon: "🎀",
      cross: "✝️",
      moon: "🌙",
      star: "⭐",
      butterfly: "🦋",
      flower: "🌸",
      sparkle: "✨"
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

// =====================
//  OPEN/CLOSE DESIGNER
// =====================
function openDesigner(){
  $("#designerModal").classList.remove("hidden");
  $("#designerBackdrop").classList.remove("hidden");
  initDesigner();
  renderDream();
}

function closeDesigner(){
  $("#designerModal").classList.add("hidden");
  $("#designerBackdrop").classList.add("hidden");
}

// =====================
//  SEND DREAM TO WHATSAPP
// =====================
async function sendDreamToWhatsApp(){
  const phone = state.config?.whatsappPhone || "393440260906";

  const eventType = ($("#eventType")?.value || "").trim();
  const eventQty = ($("#eventQty")?.value || "").trim();
  const eventDate = ($("#eventDate")?.value || "").trim();
  const eventTheme = ($("#eventTheme")?.value || "").trim();

  const name = ($("#designerName")?.value || "").trim();
  const notes = ($("#designerNotes")?.value || "").trim();

  const totalCents = calcDreamPriceCents();
  const totalTxt = formatPriceFromCents(totalCents);

  const msg = [
    "Ciao! Ho creato un acchiappasogni personalizzato:",
    "",
    eventType ? `🎁 Evento: ${eventType}` : null,
    eventQty ? `📦 Quantità bomboniere: ${eventQty}` : null,
    eventDate ? `📅 Data evento: ${eventDate}` : null,
    eventTheme ? `🎨 Tema: ${eventTheme}` : null,
    "",
    `• Diametro: ${dream.diameter} cm`,
    `• Piume: ${dream.feathers} (lunghezza ${dream.featherLen})`,
    `• Cerchi: ${colorNameFromHex(dream.colRings)}`,
    `• Rete: ${colorNameFromHex(dream.colWeb)}`,
    `• Piume colore: ${colorNameFromHex(dream.colFeathers)}`,
    dream.beadsOn ? `• Perline: sì (${dream.beadsQty}) colore ${colorNameFromHex(dream.colBeads)}` : "• Perline: no",
    dream.glitter ? "• Brillantini: sì" : "• Brillantini: no",
    dream.charms ? `• Charms laterali: sì (size ${dream.charmSize})` : "• Charms laterali: no",
    dream.textTop ? `• Scritta: ${dream.textTop}` : null,
    dream.symbol !== "none" ? `• Simbolo: ${dream.symbol}` : null,
    dream.hasCustomPhoto ? "• Foto personalizzata: sì" : "• Foto personalizzata: no",
    dream.placed.length ? `• Accessori aggiunti: ${dream.placed.length}` : null,
    "",
    `💶 Prezzo extra stimato: ${totalTxt}`,
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
      $("#designerHint").textContent = "Condivisione avviata ✅ scegli WhatsApp.";
      return;
    }
  }catch{}

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");

  $("#designerHint").textContent = "WhatsApp aperto ✅ Se non allega automaticamente, allega l’immagine scaricata.";
  downloadBlob(blob, "progetto_acchiappasogni.png");
}

// =====================
//  EVENTS
// =====================
function hookEvents(){
  // cart
  $("#btnCart").onclick = () => openCart();
  $("#btnCloseCart").onclick = () => closeCart();
  $("#drawerBackdrop").onclick = () => closeCart();

  // designer
  $("#btnDesigner").onclick = () => openDesigner();
  $("#btnCloseDesigner").onclick = () => closeDesigner();
  $("#designerBackdrop").onclick = () => closeDesigner();

  // my dreams modal
  $("#btnMyDreams").onclick = () => openMyDreams();
  $("#btnCloseMyDreams").onclick = () => closeMyDreams();
  $("#myDreamsBackdrop").onclick = () => closeMyDreams();

  // presets
  $("#presetBase").onclick = () => presetClassic();
  $("#presetPhoto").onclick = () => presetPhoto();
  $("#presetMarriage").onclick = () => presetMarriage();
  $("#presetBaptism").onclick = () => presetBaptism();
  $("#presetCresima").onclick = () => presetCresima();
  $("#presetLaurea").onclick = () => presetLaurea();
  $("#presetBaby").onclick = () => presetBaby();
  $("#presetFantasy").onclick = () => presetFantasy();

  // tools
  $("#toolBead").onclick = () => setTool("bead");
  $("#toolGlitter").onclick = () => setTool("glitter");
  $("#toolRose").onclick = () => setTool("rose");
  $("#toolHeart").onclick = () => setTool("heart");
  $("#toolCross").onclick = () => setTool("cross");
  $("#toolStar").onclick = () => setTool("star");
  $("#toolPhoto").onclick = () => setTool("photo");
  $("#toolLetter").onclick = () => setTool("letter");
  $("#toolNumber").onclick = () => setTool("number");

  // extra tools
  $("#toolMoon").onclick = () => setTool("moon");
  $("#toolAngel").onclick = () => setTool("angel");
  $("#toolDove").onclick = () => setTool("dove");
  $("#toolRings").onclick = () => setTool("rings");
  $("#toolBouquet").onclick = () => setTool("bouquet");
  $("#toolCrown").onclick = () => setTool("crown");
  $("#toolBaby").onclick = () => setTool("baby");
  $("#toolRibbon").onclick = () => setTool("ribbon");
  $("#toolButterfly").onclick = () => setTool("butterfly");
  $("#toolFlower").onclick = () => setTool("flower");
  $("#toolSparkle").onclick = () => setTool("sparkle");

  $("#toolUndo").onclick = () => {
    dream.placed.pop();
    renderDream();
  };

  $("#toolClearAll").onclick = () => {
    if(!confirm("Vuoi cancellare tutto?")) return;
    dream.placed = [];
    dream.hasCustomPhoto = false;
    renderDream();
  };

  // save dream
  $("#btnSaveDream").onclick = () => saveCurrentDream();

  // inputs
  $("#optDiameter").oninput = (e)=>{ dream.diameter = Number(e.target.value)||35; renderDream(); };
  $("#optFeathers").oninput = (e)=>{ dream.feathers = Number(e.target.value)||3; renderDream(); };
  $("#optFeatherLen").oninput = (e)=>{ dream.featherLen = Number(e.target.value)||95; renderDream(); };
  $("#optRingWidth").oninput = (e)=>{ dream.ringWidth = Number(e.target.value)||5; renderDream(); };

  $("#colRings").oninput = (e)=>{ dream.colRings = e.target.value; renderDream(); };
  $("#colWeb").oninput = (e)=>{ dream.colWeb = e.target.value; renderDream(); };
  $("#colFeathers").oninput = (e)=>{ dream.colFeathers = e.target.value; renderDream(); };
  $("#colBeads").oninput = (e)=>{ dream.colBeads = e.target.value; renderDream(); };
  $("#colText").oninput = (e)=>{ dream.colText = e.target.value; renderDream(); };

  $("#optBeadsOn").onchange = (e)=>{ dream.beadsOn = !!e.target.checked; renderDream(); };
  $("#optBeadsQty").oninput = (e)=>{ dream.beadsQty = Number(e.target.value)||0; renderDream(); };
  $("#optGlitter").onchange = (e)=>{ dream.glitter = !!e.target.checked; renderDream(); };

  $("#optTextTop").oninput = (e)=>{ dream.textTop = e.target.value || ""; renderDream(); };
  $("#optSymbol").onchange = (e)=>{ dream.symbol = e.target.value; renderDream(); };

  $("#optCharms").onchange = (e)=>{ dream.charms = !!e.target.checked; renderDream(); };
  $("#optCharmSize").oninput = (e)=>{ dream.charmSize = Number(e.target.value)||34; renderDream(); };

  // send + download
  $("#btnDownloadDesign").onclick = async () => {
    const blob = await canvasToBlob(designerCanvas);
    downloadBlob(blob, "acchiappasogni_progetto.png");
  };

  $("#btnSendDesign").onclick = async () => {
    await sendDreamToWhatsApp();
  };

  // search
  $("#search").addEventListener("input", (e)=>{
    state.query = e.target.value || "";
    renderGrid();
  });

  // delivery toggle
  document.querySelectorAll('input[name="delivery"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      const v = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
      $("#shippingFields").style.display = v === "pickup" ? "none" : "";
      renderTotals();
    });
  });

  // send order
  $("#btnSend").onclick = ()=>{
    const msg = buildWhatsAppMessage();
    const phone = state.config?.whatsappPhone || "393440260906";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // clear cart
  $("#btnClear").onclick = ()=>{
    if(confirm("Vuoi svuotare il carrello?")){
      state.cart = {};
      saveCart();
      updateCartBadge();
      renderCart();
      renderTotals();
      renderGrid();
    }
  };

  // custom
  $("#btnCustom").onclick = ()=>{
    const phone = state.config?.whatsappPhone || "393440260906";
    const msg = "Ciao! Vorrei un acchiappasogni personalizzato 😊";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };
}

// =====================
//  MY DREAMS
// =====================
function openMyDreams(){
  $("#myDreamsModal").classList.remove("hidden");
  $("#myDreamsBackdrop").classList.remove("hidden");
  renderMyDreams();
}

function closeMyDreams(){
  $("#myDreamsModal").classList.add("hidden");
  $("#myDreamsBackdrop").classList.add("hidden");
}

function renderMyDreams(){
  const wrap = $("#myDreamsList");
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
        <button class="btn small" data-send>Invia WhatsApp</button>
        <button class="btn danger small" data-del>Elimina</button>
      </div>
    `;

    box.querySelector("[data-open]").onclick = ()=>{
      applyDream(item);
      closeMyDreams();
    };

    box.querySelector("[data-send]").onclick = async ()=>{
      applyDream(item);
      closeMyDreams();
      await sendDreamToWhatsApp();
    };

    box.querySelector("[data-del]").onclick = ()=>{
      if(!confirm("Eliminare progetto?")) return;
      const newArr = loadDreams().filter(x=>x.id !== item.id);
      saveDreams(newArr);
      renderMyDreams();
    };

    wrap.appendChild(box);
  });
}

// =====================
//  INIT
// =====================
(function init(){
  state.cart = parseCart();
  hookEvents();
  hookAdminOpeners();
  loadData();
})();

// =====================
//  HELPERS
// =====================
const $ = (s) => document.querySelector(s);

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

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function cartCount(cart) {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function updateCartBadge(cart) {
  const el = $("#cartCount");
  if (el) el.textContent = cartCount(cart);
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
//  COLOR NAME (NO HEX)
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

  // Grigi / neri / bianchi
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
//  CONFIG + PRODUCTS
// =====================
const state = {
  config: {},
  products: [],
  baseProducts: [],
  categories: [],
  activeCategory: "Tutti",
  query: "",
  cart: {}
};

function productPriceCents(p) {
  if (typeof p.priceCents === "number") return p.priceCents;
  if (typeof p.price === "number") return Math.round(p.price * 100);
  if (typeof p.price_from === "number") return Math.round(p.price_from * 100);
  return 0;
}

function normalizeProducts(arr){
  return arr.map((p, idx) => ({
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

async function fetchJson(url){
  const bust = (url.includes("?") ? "&" : "?") + "v=" + Date.now();
  const res = await fetch(url + bust, { cache: "no-store" });
  if(!res.ok) throw new Error("fetch failed");
  return await res.json();
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
  arr = normalizeProducts(arr);

  state.products = arr;
  state.baseProducts = arr;

  rebuildCategories();
  renderTabs();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge(state.cart);
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

// =====================
//  TABS
// =====================
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
  saveCart(state.cart);
  updateCartBadge(state.cart);
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
//  CART UI
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

// =====================
//  TOTALS
// =====================
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
    const base = typeof state.config.shippingBaseCents === "number" ? state.config.shippingBaseCents : 0;
    const freeOver = typeof state.config.freeShippingOverCents === "number" ? state.config.freeShippingOverCents : null;

    if(freeOver != null && subtotal >= freeOver){
      shipping = 0;
      hint = `Spedizione gratuita sopra ${euroFromCents(freeOver)} ✅`;
    } else {
      shipping = base;
    }
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
  manualAccessories: []
};

let designerCanvas = null;
let designerCtx = null;

function initDesigner(){
  if(designerCanvas) return;
  designerCanvas = $("#designerCanvas");
  if(!designerCanvas) return;
  designerCtx = designerCanvas.getContext("2d");

  const resize = () => {
    const rect = designerCanvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    designerCanvas.width = Math.round(rect.width * dpr);
    designerCanvas.height = Math.round(rect.height * dpr);
    designerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderDreamcatcher();
  };

  resize();
  window.addEventListener("resize", resize);

  designerCanvas.addEventListener("click", (ev)=>{
    const rect = designerCanvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    // aggiunge un accessorio manuale (semplice pallino rosso)
    dream.manualAccessories.push({x, y, type:"bead"});
    renderDreamcatcher();
  });
}

function openDesigner(){
  $("#designerModal").classList.remove("hidden");
  $("#designerBackdrop").classList.remove("hidden");
  initDesigner();
  renderDreamcatcher();
}

function closeDesigner(){
  $("#designerModal").classList.add("hidden");
  $("#designerBackdrop").classList.add("hidden");
}

function drawFeather(x, y, len, color){
  const ctx = designerCtx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + len);
  ctx.stroke();

  // piumetta
  for(let i=0;i<18;i++){
    const yy = y + (i*(len/18));
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x - 12, yy + 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + 12, yy + 10);
    ctx.stroke();
  }
}

function drawSymbol(cx, cy, type){
  const ctx = designerCtx;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#111";
  ctx.lineWidth = 3;

  if(type === "AA"){
    ctx.font = "bold 40px Arial";
    ctx.fillText("AA", -28, 15);
  }
  if(type === "heart"){
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(30, -20, 60, 10, 0, 60);
    ctx.bezierCurveTo(-60, 10, -30, -20, 0, 10);
    ctx.stroke();
  }
  if(type === "moon"){
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(12, -4, 28, 0, Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  if(type === "star"){
    ctx.beginPath();
    for(let i=0;i<5;i++){
      const angle = (Math.PI*2/5)*i - Math.PI/2;
      const x = Math.cos(angle)*30;
      const y = Math.sin(angle)*30;
      ctx.lineTo(x,y);
      const angle2 = angle + Math.PI/5;
      const x2 = Math.cos(angle2)*14;
      const y2 = Math.sin(angle2)*14;
      ctx.lineTo(x2,y2);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function renderDreamcatcher(){
  if(!designerCanvas || !designerCtx) return;

  const ctx = designerCtx;
  const w = designerCanvas.getBoundingClientRect().width;
  const h = designerCanvas.getBoundingClientRect().height;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0,0,w,h);

  const cx = w/2;
  const cy = 120;

  const ringR = Math.max(70, dream.diameter * 2);
  const ringWidth = dream.ringWidth;

  // cerchi
  ctx.strokeStyle = dream.colRings;
  ctx.lineWidth = ringWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI*2);
  ctx.stroke();

  ctx.lineWidth = Math.max(2, ringWidth-2);
  ctx.beginPath();
  ctx.arc(cx, cy, ringR-12, 0, Math.PI*2);
  ctx.stroke();

  // rete
  ctx.strokeStyle = dream.colWeb;
  ctx.lineWidth = 1.5;

  for(let i=0;i<10;i++){
    const rr = (ringR-18) * (i/10);
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI*2);
    ctx.stroke();
  }

  for(let a=0;a<16;a++){
    const ang = (Math.PI*2/16)*a;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang)*(ringR-18), cy + Math.sin(ang)*(ringR-18));
    ctx.stroke();
  }

  // centro oro
  ctx.fillStyle = "#c89a2b";
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI*2);
  ctx.fill();

  // scritta sopra
  if(dream.textTop && dream.textTop.trim().length > 0){
    ctx.fillStyle = dream.colText;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(dream.textTop.trim(), cx, cy - ringR - 12);
  }

  // charms laterali (facce)
  if(dream.charms){
    const size = dream.charmSize;
    ctx.fillStyle = "#ffe6e6";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;

    // sinistra
    ctx.beginPath();
    ctx.arc(cx - ringR + 10, cy + 60, size/2, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // destra
    ctx.beginPath();
    ctx.arc(cx + ringR - 10, cy + 60, size/2, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(cx - ringR + 3, cy + 55, 2, 0, Math.PI*2);
    ctx.arc(cx - ringR + 17, cy + 55, 2, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + ringR - 17, cy + 55, 2, 0, Math.PI*2);
    ctx.arc(cx + ringR - 3, cy + 55, 2, 0, Math.PI*2);
    ctx.fill();
  }

  // simbolo centrale
  if(dream.symbol !== "none"){
    drawSymbol(cx, cy + 50, dream.symbol);
  }

  // piume
  const feathers = dream.feathers;
  const spacing = 70;
  const startX = cx - ((feathers-1)*spacing)/2;

  for(let i=0;i<feathers;i++){
    const fx = startX + i*spacing;
    const fy = cy + ringR - 10;

    // cordino
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy + 35);
    ctx.stroke();

    // perline
    if(dream.beadsOn){
      ctx.fillStyle = dream.colBeads;
      for(let b=0;b<3;b++){
        ctx.beginPath();
        ctx.arc(fx, fy + 12 + b*10, 4, 0, Math.PI*2);
        ctx.fill();
      }
    }

    drawFeather(fx, fy + 40, dream.featherLen, dream.colFeathers);
  }

  // brillantini
  if(dream.glitter){
    ctx.fillStyle = "#ffd700";
    for(let i=0;i<14;i++){
      const ang = Math.random()*Math.PI*2;
      const rr = (ringR-25) * Math.random();
      const gx = cx + Math.cos(ang)*rr;
      const gy = cy + Math.sin(ang)*rr;
      ctx.beginPath();
      ctx.arc(gx, gy, 2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // accessori manuali
  ctx.fillStyle = "#b50000";
  dream.manualAccessories.forEach(a=>{
    ctx.beginPath();
    ctx.arc(a.x, a.y, 5, 0, Math.PI*2);
    ctx.fill();
  });
}

function getDreamImageDataUrl(){
  if(!designerCanvas) return null;
  return designerCanvas.toDataURL("image/png");
}

function downloadDreamImage(){
  const url = getDreamImageDataUrl();
  if(!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.download = "acchiappasogni_personalizzato.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function sendDreamToWhatsApp(){
  const phone = state.config?.whatsappPhone || "393440260906";

  const msg = [
    `Ciao! Ho creato un acchiappasogni personalizzato:`,
    `• Diametro: ${dream.diameter} cm`,
    `• Piume: ${dream.feathers} (lunghezza ${dream.featherLen})`,
    `• Cerchi: ${colorNameFromHex(dream.colRings)} / Rete: ${colorNameFromHex(dream.colWeb)}`,
    `• Piume colore: ${colorNameFromHex(dream.colFeathers)}`,
    dream.beadsOn ? `• Perline: sì (${dream.beadsQty}) colore ${colorNameFromHex(dream.colBeads)}` : "• Perline: no",
    `• Brillantini: ${dream.glitter ? "sì" : "no"}`,
    `• Charms laterali: ${dream.charms ? "sì" : "no"} (size ${dream.charmSize})`,
    dream.textTop ? `• Scritta: ${dream.textTop}` : "",
    dream.symbol !== "none" ? `• Simbolo: ${dream.symbol}` : "",
    `• Accessori aggiunti manualmente: ${dream.manualAccessories.length}`,
    ``,
    `Ti invio l’immagine in allegato.`
  ].filter(Boolean).join("\n");

  const img = getDreamImageDataUrl();

  // se supporta share con immagine
  if (navigator.canShare && navigator.share) {
    try {
      const res = await fetch(img);
      const blob = await res.blob();
      const file = new File([blob], "acchiappasogni.png", { type: "image/png" });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: msg,
          files: [file],
          title: "Acchiappasogni personalizzato"
        });
        return;
      }
    } catch (e) {}
  }

  // fallback: apre whatsapp col testo
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");

  // e scarica anche l'immagine
  downloadDreamImage();
}

// =====================
//  PRESET
// =====================
function presetClassic(){
  dream.diameter = 35;
  dream.feathers = 3;
  dream.featherLen = 95;
  dream.ringWidth = 5;
  dream.colRings = "#222222";
  dream.colWeb = "#222222";
  dream.colFeathers = "#333333";
  dream.colBeads = "#b50000";
  dream.beadsOn = true;
  dream.beadsQty = 10;
  dream.glitter = false;
  dream.textTop = "";
  dream.colText = "#b50000";
  dream.symbol = "none";
  dream.charms = true;
  dream.charmSize = 34;
  dream.manualAccessories = [];
  syncDesignerInputs();
  renderDreamcatcher();
}

function presetPhotoStyle(){
  presetClassic();
  dream.textTop = "REAL HASTA LA MUERTE";
  dream.symbol = "AA";
  dream.glitter = true;
  syncDesignerInputs();
  renderDreamcatcher();
}

function presetRomantic(){
  presetClassic();
  dream.colRings = "#ff2b6a";
  dream.colWeb = "#ff2b6a";
  dream.colFeathers = "#ff2b6a";
  dream.colBeads = "#ffccdd";
  dream.symbol = "heart";
  dream.textTop = "AMORE";
  syncDesignerInputs();
  renderDreamcatcher();
}

function presetMoon(){
  presetClassic();
  dream.colRings = "#1b1b3a";
  dream.colWeb = "#1b1b3a";
  dream.colFeathers = "#2b2b5a";
  dream.colBeads = "#ffd700";
  dream.symbol = "moon";
  dream.textTop = "LUNA";
  dream.glitter = true;
  syncDesignerInputs();
  renderDreamcatcher();
}

function presetStar(){
  presetClassic();
  dream.colRings = "#222222";
  dream.colWeb = "#222222";
  dream.colFeathers = "#111111";
  dream.colBeads = "#ffd700";
  dream.symbol = "star";
  dream.textTop = "STELLA";
  dream.glitter = true;
  syncDesignerInputs();
  renderDreamcatcher();
}

// =====================
//  SYNC INPUTS
// =====================
function syncDesignerInputs(){
  if($("#optDiameter")) $("#optDiameter").value = dream.diameter;
  if($("#optFeathers")) $("#optFeathers").value = dream.feathers;
  if($("#optFeatherLen")) $("#optFeatherLen").value = dream.featherLen;
  if($("#optRingWidth")) $("#optRingWidth").value = dream.ringWidth;

  if($("#colRings")) $("#colRings").value = dream.colRings;
  if($("#colWeb")) $("#colWeb").value = dream.colWeb;
  if($("#colFeathers")) $("#colFeathers").value = dream.colFeathers;
  if($("#colBeads")) $("#colBeads").value = dream.colBeads;
  if($("#colText")) $("#colText").value = dream.colText;

  if($("#optBeadsOn")) $("#optBeadsOn").checked = dream.beadsOn;
  if($("#optBeadsQty")) $("#optBeadsQty").value = dream.beadsQty;
  if($("#optGlitter")) $("#optGlitter").checked = dream.glitter;

  if($("#optTextTop")) $("#optTextTop").value = dream.textTop;
  if($("#optSymbol")) $("#optSymbol").value = dream.symbol;

  if($("#optCharms")) $("#optCharms").checked = dream.charms;
  if($("#optCharmSize")) $("#optCharmSize").value = dream.charmSize;
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
  if($("#btnDesigner")) $("#btnDesigner").onclick = () => openDesigner();
  if($("#btnCloseDesigner")) $("#btnCloseDesigner").onclick = () => closeDesigner();
  if($("#designerBackdrop")) $("#designerBackdrop").onclick = () => closeDesigner();

  // preset buttons
  if($("#presetBase")) $("#presetBase").onclick = () => presetClassic();
  if($("#presetPhoto")) $("#presetPhoto").onclick = () => presetPhotoStyle();
  if($("#presetRomantic")) $("#presetRomantic").onclick = () => presetRomantic();
  if($("#presetMoon")) $("#presetMoon").onclick = () => presetMoon();
  if($("#presetStar")) $("#presetStar").onclick = () => presetStar();

  // inputs designer
  if($("#optDiameter")) $("#optDiameter").oninput = (e)=>{ dream.diameter = Number(e.target.value); renderDreamcatcher(); };
  if($("#optFeathers")) $("#optFeathers").oninput = (e)=>{ dream.feathers = Number(e.target.value); renderDreamcatcher(); };
  if($("#optFeatherLen")) $("#optFeatherLen").oninput = (e)=>{ dream.featherLen = Number(e.target.value); renderDreamcatcher(); };
  if($("#optRingWidth")) $("#optRingWidth").oninput = (e)=>{ dream.ringWidth = Number(e.target.value); renderDreamcatcher(); };

  if($("#colRings")) $("#colRings").oninput = (e)=>{ dream.colRings = e.target.value; renderDreamcatcher(); };
  if($("#colWeb")) $("#colWeb").oninput = (e)=>{ dream.colWeb = e.target.value; renderDreamcatcher(); };
  if($("#colFeathers")) $("#colFeathers").oninput = (e)=>{ dream.colFeathers = e.target.value; renderDreamcatcher(); };
  if($("#colBeads")) $("#colBeads").oninput = (e)=>{ dream.colBeads = e.target.value; renderDreamcatcher(); };
  if($("#colText")) $("#colText").oninput = (e)=>{ dream.colText = e.target.value; renderDreamcatcher(); };

  if($("#optBeadsOn")) $("#optBeadsOn").onchange = (e)=>{ dream.beadsOn = e.target.checked; renderDreamcatcher(); };
  if($("#optBeadsQty")) $("#optBeadsQty").oninput = (e)=>{ dream.beadsQty = Number(e.target.value); renderDreamcatcher(); };
  if($("#optGlitter")) $("#optGlitter").onchange = (e)=>{ dream.glitter = e.target.checked; renderDreamcatcher(); };

  if($("#optTextTop")) $("#optTextTop").oninput = (e)=>{ dream.textTop = e.target.value; renderDreamcatcher(); };
  if($("#optSymbol")) $("#optSymbol").onchange = (e)=>{ dream.symbol = e.target.value; renderDreamcatcher(); };

  if($("#optCharms")) $("#optCharms").onchange = (e)=>{ dream.charms = e.target.checked; renderDreamcatcher(); };
  if($("#optCharmSize")) $("#optCharmSize").oninput = (e)=>{ dream.charmSize = Number(e.target.value); renderDreamcatcher(); };

  // invio / download
  if($("#btnSendDesign")) $("#btnSendDesign").onclick = () => sendDreamToWhatsApp();
  if($("#btnDownloadDesign")) $("#btnDownloadDesign").onclick = () => downloadDreamImage();

  // search
  if($("#search")){
    $("#search").addEventListener("input", (e)=>{
      state.query = e.target.value || "";
      renderGrid();
    });
  }

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
      saveCart(state.cart);
      updateCartBadge(state.cart);
      renderCart();
      renderTotals();
      renderGrid();
    }
  };

  // custom
  $("#btnCustom").onclick = ()=>{
    const phone = state.config?.whatsappPhone || "393440260906";
    const msg = "Ciao! Vorrei un acchiappasogni personalizzato 😊";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };
}

// =====================
//  INIT
// =====================
(function init(){
  state.cart = parseCart();
  hookEvents();
  loadData();
})();

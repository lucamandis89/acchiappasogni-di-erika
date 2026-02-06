const state = { config:null, products:[], categories:[], activeCategory:"Tutti", query:"", cart:{} };
const $ = (s)=>document.querySelector(s);

// --- FIX IMMAGINI (auto-percorsi + fallback) ---
const IMG_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="#f1f1f1"/>
    <text x="50%" y="50%" font-size="28" text-anchor="middle" fill="#777" font-family="Arial">
      Immagine non trovata
    </text>
  </svg>`);

function normalizeImageValue(v){
  v = String(v || "").trim();
  if(!v) return "";

  // Se è già un URL o un path (contiene /) lo lasciamo così com'è
  if (/^(https?:|data:|\/|\.\/|\.\.\/)/i.test(v)) return v;
  if (v.includes("/")) return v;

  // se non ha estensione, proviamo .jpg (molto comune)
  if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(v)) v = v + ".jpg";

  // nome file semplice -> assets/img/
  return "assets/img/" + v;
}

function buildImageCandidates(raw){
  const original = String(raw || "").trim();
  const candidates = [];

  // 1) così com'è
  if (original) candidates.push(original);

  // 2) prova anche con ./ davanti (aiuta GitHub Pages / WebView)
  if (original && original.startsWith("assets/")) candidates.push("./" + original);

  // 3) normalizzato (aggiunge assets/img + .jpg se serve)
  const norm = normalizeImageValue(original);
  if (norm && !candidates.includes(norm)) candidates.push(norm);

  // 4) se il file è dentro assets/ senza img/
  if (original && !/^(https?:|data:)/i.test(original) && !original.includes("/")) {
    const alt = "assets/" + original;
    if (!candidates.includes(alt)) candidates.push(alt);
    if (!candidates.includes("./"+alt)) candidates.push("./"+alt);
  }

  // 5) prova anche altre estensioni
  candidates.slice(0).forEach(c=>{
    const lower = c.toLowerCase();
    if (lower.endsWith(".jpg")) {
      candidates.push(c.slice(0,-4) + ".png");
      candidates.push(c.slice(0,-4) + ".jpeg");
      candidates.push(c.slice(0,-4) + ".webp");
    }
  });

  return Array.from(new Set(candidates.filter(Boolean)));
}

function attachImageFallback(imgEl, rawImageValue){
  const tries = buildImageCandidates(rawImageValue);
  let i = 0;

  function tryNext(){
    if (i >= tries.length) {
      imgEl.src = IMG_PLACEHOLDER;
      return;
    }
    imgEl.src = tries[i++];
  }

  imgEl.onerror = () => tryNext();
  tryNext();
}
// --- FINE FIX IMMAGINI ---

function euroFromCents(c){ return `€ ${(c/100).toFixed(2).replace(".", ",")}`; }
function parseCart(){ try{return JSON.parse(localStorage.getItem("cart")||"{}")||{}}catch{return{}} }
function saveCart(){ localStorage.setItem("cart", JSON.stringify(state.cart)); }
function cartCount(){ return Object.values(state.cart).reduce((a,b)=>a+b,0); }
function updateCartBadge(){ $("#cartCount").textContent = cartCount(); }
function openCart(){ $("#drawer").classList.remove("hidden"); $("#drawerBackdrop").classList.remove("hidden"); $("#drawer").setAttribute("aria-hidden","false"); }
function closeCart(){ $("#drawer").classList.add("hidden"); $("#drawerBackdrop").classList.add("hidden"); $("#drawer").setAttribute("aria-hidden","true"); }

function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

// ✅ Supporta: priceCents, price (euro), price_from (euro)
function productPriceCents(p){
  if(typeof p.priceCents === "number") return p.priceCents;
  if(typeof p.price === "number") return Math.round(p.price*100);
  if(typeof p.price_from === "number") return Math.round(p.price_from*100);
  return 0;
}

function matches(p){
  const q = state.query.trim().toLowerCase();
  const catOk = state.activeCategory==="Tutti" || (p.category||"")===state.activeCategory;
  if(!q) return catOk;
  const hay = `${p.title||""} ${p.description||""} ${p.category||""}`.toLowerCase();
  return catOk && hay.includes(q);
}

function setQty(id, qty){
  qty = Math.max(0, qty|0);
  if(qty<=0) delete state.cart[id];
  else state.cart[id]=qty;
  saveCart(); updateCartBadge(); renderCart(); renderTotals(); renderGrid();
}

function renderGrid(){
  const grid=$("#grid");
  grid.innerHTML="";
  const list=state.products.filter(matches).sort((a,b)=> (b.featured?1:0)-(a.featured?1:0));
  if(!list.length){ grid.innerHTML=`<div style="color:var(--muted); padding:12px;">Nessun prodotto trovato.</div>`; return; }
  list.forEach(p=>{
    const card=document.createElement("article");
    card.className="card";
    card.innerHTML = `
      <img loading="lazy" data-img alt="${escapeHtml(p.title)}" />
      <div class="content">
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml(p.category||"")}</div>
        <div class="price">${euroFromCents(productPriceCents(p))}</div>
        <div class="row">
          <div class="qty">
            <button data-minus>-</button>
            <span>${state.cart[p.id]||0}</span>
            <button data-plus>+</button>
          </div>
          <button class="btn small" data-add>Aggiungi</button>
        </div>
      </div>`;
    attachImageFallback(card.querySelector("[data-img]"), p.image);

    card.querySelector("[data-minus]").onclick=()=>setQty(p.id, (state.cart[p.id]||0)-1);
    card.querySelector("[data-plus]").onclick=()=>setQty(p.id, (state.cart[p.id]||0)+1);
    card.querySelector("[data-add]").onclick=()=>{ setQty(p.id, (state.cart[p.id]||0)+1); openCart(); };
    grid.appendChild(card);
  });
}

function renderCart(){
  const wrap=$("#cartItems");
  wrap.innerHTML="";
  const ids=Object.keys(state.cart);
  if(!ids.length){ wrap.innerHTML=`<div style="color:var(--muted); padding:10px;">Carrello vuoto.</div>`; return; }
  ids.forEach(id=>{
    const p=state.products.find(x=>x.id===id);
    if(!p) return;
    const qty=state.cart[id]||0;
    const div=document.createElement("div");
    div.className="cart-item";
    div.innerHTML = `
      <img data-img alt="${escapeHtml(p.title)}"/>
      <div>
        <div class="ci-title">${escapeHtml(p.title)}</div>
        <div class="ci-meta">${escapeHtml(p.category||"")}</div>
        <div class="ci-price">${euroFromCents(productPriceCents(p))}</div>
      </div>
      <div class="qty" style="justify-content:flex-end; align-self:center;">
        <button data-minus>-</button>
        <span>${qty}</span>
        <button data-plus>+</button>
      </div>`;
    attachImageFallback(div.querySelector("[data-img]"), p.image);

    div.querySelector("[data-minus]").onclick=()=>setQty(id, qty-1);
    div.querySelector("[data-plus]").onclick=()=>setQty(id, qty+1);
    wrap.appendChild(div);
  });
}

function renderTotals(){
  const ids=Object.keys(state.cart);
  let subtotal=0;
  ids.forEach(id=>{
    const p=state.products.find(x=>x.id===id);
    if(!p) return;
    subtotal += productPriceCents(p) * (state.cart[id]||0);
  });

  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
  let shipping=0;
  let hint="";

  if(delivery==="pickup"){
    shipping=0;
    hint="Ritiro/consegna a mano: niente spedizione.";
  }else{
    const cfg=state.config||{};
    const base = typeof cfg.shippingBaseCents==="number" ? cfg.shippingBaseCents : 0;
    const freeOver = typeof cfg.freeShippingOverCents==="number" ? cfg.freeShippingOverCents : null;

    if(freeOver!=null && subtotal>=freeOver){
      shipping=0;
      hint=`Spedizione gratuita sopra ${euroFromCents(freeOver)} ✅`;
    }else{
      shipping=base;
      if(freeOver!=null){
        const missing = Math.max(0, freeOver - subtotal);
        hint = missing>0 ? `Aggiungi ${euroFromCents(missing)} per la spedizione gratuita.` : "";
      }
    }
  }

  $("#subtotal").textContent=euroFromCents(subtotal);
  $("#shipping").textContent=euroFromCents(shipping);
  $("#total").textContent=euroFromCents(subtotal+shipping);
  $("#shippingHint").textContent=hint;
}

function buildWhatsAppMessage(){
  const ids=Object.keys(state.cart);
  const lines=[];
  lines.push(`Ciao! Vorrei ordinare:`);
  lines.push("");

  ids.forEach(id=>{
    const p=state.products.find(x=>x.id===id);
    if(!p) return;
    const qty=state.cart[id]||0;
    lines.push(`• ${qty} x ${p.title} — ${euroFromCents(productPriceCents(p))}`);
  });

  lines.push("");
  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
  lines.push(`Consegna: ${delivery==="pickup" ? "Ritiro / a mano" : "Spedizione"}`);

  const name = $("#name").value.trim();
  const street = $("#street").value.trim();
  const cap = $("#cap").value.trim();
  const city = $("#city").value.trim();
  const notes = $("#notes").value.trim();

  if(name) lines.push(`Nome: ${name}`);

  if(delivery!=="pickup"){
    if(street) lines.push(`Indirizzo: ${street}`);
    if(cap || city) lines.push(`CAP/Città: ${cap} ${city}`.trim());
  }

  if(notes) { lines.push(""); lines.push(`Note: ${notes}`); }

  return lines.join("\n");
}

async function loadData(){
  try{
    const cfg = await fetch("data/config.json").then(r=>r.json());
    state.config = cfg;
    if(cfg.brandName) $("#brandName").textContent = cfg.brandName;
  }catch(e){
    state.config = {};
  }

  const prods = await fetch("data/products.json").then(r=>r.json());
  state.products = Array.isArray(prods) ? prods : (prods.products||[]);

  const cats = new Set(["Tutti"]);
  state.products.forEach(p=>cats.add(p.category||"Altro"));
  state.categories = Array.from(cats);

  renderTabs();
  renderGrid();
  renderCart();
  renderTotals();
  updateCartBadge();
}

function renderTabs(){
  const tabs=$("#tabs");
  tabs.innerHTML="";
  state.categories.forEach(cat=>{
    const b=document.createElement("button");
    b.className="tab" + (cat===state.activeCategory ? " active" : "");
    b.textContent=cat;
    b.onclick=()=>{
      state.activeCategory=cat;
      renderTabs();
      renderGrid();
    };
    tabs.appendChild(b);
  });
}

function hookEvents(){
  $("#btnCart").onclick=()=>openCart();
  $("#btnCloseCart").onclick=()=>closeCart();
  $("#drawerBackdrop").onclick=()=>closeCart();

  $("#search").addEventListener("input", e=>{
    state.query=e.target.value||"";
    renderGrid();
  });

  document.querySelectorAll('input[name="delivery"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      const v = document.querySelector('input[name="delivery"]:checked')?.value || "shipping";
      $("#shippingFields").style.display = (v==="pickup") ? "none" : "";
      renderTotals();
    });
  });

  $("#btnSend").onclick=()=>{
    const msg = buildWhatsAppMessage();
    const phone = (state.config && state.config.whatsappPhone) ? state.config.whatsappPhone : "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  $("#btnClear").onclick=()=>{
    if(confirm("Vuoi svuotare il carrello?")){
      state.cart={};
      saveCart();
      updateCartBadge();
      renderCart();
      renderTotals();
      renderGrid();
    }
  };

  $("#btnCustom").onclick=()=>{
    const phone = (state.config && state.config.whatsappPhone) ? state.config.whatsappPhone : "";
    const msg = "Ciao! Vorrei un prodotto personalizzato. 😊";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };
}

(function init(){
  state.cart = parseCart();
  hookEvents();
  loadData();
})();

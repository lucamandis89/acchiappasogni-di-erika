const state = { config:null, products:[], categories:[], activeCategory:"Tutti", query:"", cart:{} };
const $ = (s)=>document.querySelector(s);

function euroFromCents(c){ return `€ ${(c/100).toFixed(2).replace(".", ",")}`; }
function parseCart(){ try{return JSON.parse(localStorage.getItem("cart")||"{}")||{}}catch{return{}} }
function saveCart(){ localStorage.setItem("cart", JSON.stringify(state.cart)); }
function cartCount(){ return Object.values(state.cart).reduce((a,b)=>a+b,0); }
function updateCartBadge(){ const el=$("#cartCount"); if(el) el.textContent = cartCount(); }

function productPriceCents(p){ return (Number(p.price_from)||0)*100; }

function buildCategories(){
  const set = new Set(["Tutti","Idee regalo","Bomboniere Battesimo","Bomboniere Cresima","Bomboniere Matrimonio","Acchiappasogni Personalizzati","Acchiappasogni Classici"]);
  state.products.forEach(p=> set.add(p.category||"Da classificare"));
  state.categories = Array.from(set).filter(Boolean);
}

function setActiveCategory(cat){ state.activeCategory=cat; renderTabs(); renderGrid(); }

function matches(p){
  const inCat = state.activeCategory==="Tutti" || p.category===state.activeCategory;
  const text = ((p.title||"")+" "+(p.description||"")).toLowerCase();
  const inQ = !state.query || text.includes(state.query);
  return inCat && inQ;
}

function renderTabs(){
  const tabs = $("#tabs");
  if(!tabs) return;
  tabs.innerHTML="";
  state.categories.forEach(cat=>{
    const b=document.createElement("button");
    b.className="tab"+(cat===state.activeCategory?" active":"");
    b.textContent=cat;
    b.onclick=()=>setActiveCategory(cat);
    tabs.appendChild(b);
  });
}

function addToCart(id, qty){
  state.cart[id]=(state.cart[id]||0)+qty;
  if(state.cart[id]<=0) delete state.cart[id];
  saveCart(); updateCartBadge();
}

function setQty(id, qty){
  if(qty<=0) delete state.cart[id]; else state.cart[id]=qty;
  saveCart(); updateCartBadge(); renderCart(); renderTotals();
}

function renderGrid(){
  const grid=$("#grid");
  if(!grid) return;
  grid.innerHTML="";
  const list=state.products.filter(matches).sort((a,b)=> (b.featured?1:0)-(a.featured?1:0));
  if(!list.length){
    grid.innerHTML=`<div style="color:var(--muted); padding:12px;">Nessun prodotto trovato.</div>`;
    return;
  }
  list.forEach(p=>{
    const card=document.createElement("article");
    card.className="card";
    card.innerHTML = `
      <img loading="lazy" src="${p.image}" alt="${escapeHtml(p.title)}"
           onerror="this.style.display='none';" />
      <div class="content">
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml(p.category||"")}</div>
        <div class="price">${euroFromCents(productPriceCents(p))}</div>
        <div class="row">
          <div class="qty">
            <button data-act="minus">-</button>
            <span data-qty>1</span>
            <button data-act="plus">+</button>
          </div>
          <button class="btn primary" data-buy>Aggiungi</button>
        </div>
      </div>`;
    let qty=1;
    const qtyEl=card.querySelector("[data-qty]");
    card.querySelector('[data-act="minus"]').onclick=()=>{ qty=Math.max(1,qty-1); qtyEl.textContent=qty; };
    card.querySelector('[data-act="plus"]').onclick=()=>{ qty=qty+1; qtyEl.textContent=qty; };
    card.querySelector("[data-buy]").onclick=()=>{ addToCart(p.id, qty); openCart(); };
    grid.appendChild(card);
  });
}

function renderCart(){
  const wrap=$("#cartItems");
  if(!wrap) return;
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
      <img src="${p.image}" alt="${escapeHtml(p.title)}" onerror="this.style.display='none';"/>
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
    div.querySelector("[data-minus]").onclick=()=>setQty(id, qty-1);
    div.querySelector("[data-plus]").onclick=()=>setQty(id, qty+1);
    wrap.appendChild(div);
  });
}

function computeSubtotalCents(){
  let sum=0;
  for(const [id,qty] of Object.entries(state.cart)){
    const p=state.products.find(x=>x.id===id);
    if(!p) continue;
    sum += productPriceCents(p)*qty;
  }
  return sum;
}

function isShipping(){ return document.querySelector('input[name="delivery"]:checked')?.value==="shipping"; }

function computeShippingCents(sub){
  if(!isShipping()) return 0;
  const fee=Number(state.config?.shippingFeeCents||0);
  const freeOver=Number(state.config?.freeOverCents||0);
  if(freeOver>0 && sub>=freeOver) return 0;
  return fee;
}

function renderTotals(){
  const sub=computeSubtotalCents();
  const ship=computeShippingCents(sub);
  const tot=sub+ship;
  $("#subtotal").textContent=euroFromCents(sub);
  $("#shipping").textContent=euroFromCents(ship);
  $("#total").textContent=euroFromCents(tot);

  const freeOver=Number(state.config?.freeOverCents||0);
  const hint=$("#shippingHint");
  if(isShipping() && freeOver>0 && sub<freeOver){
    hint.textContent = `Spedizione gratis sopra ${euroFromCents(freeOver)}. Mancano ${euroFromCents(freeOver-sub)}.`;
  } else if(isShipping() && freeOver>0){
    hint.textContent = `Spedizione gratis attiva ✅`;
  } else hint.textContent="";

  const sf=$("#shippingFields");
  if(sf) sf.style.display = isShipping() ? "block" : "none";
}

function buildOrderId(){ const s=Date.now().toString(); return "AE-"+s.slice(-6); }

function buildOrderMessage(){
  const name=($("#name").value||"").trim()||"Cliente";
  const notes=($("#notes").value||"").trim();

  let delivery = isShipping() ? "Spedizione" : "Ritiro / consegna a mano";
  if(isShipping()){
    const street=($("#street").value||"").trim();
    const cap=($("#cap").value||"").trim();
    const city=($("#city").value||"").trim();
    if(!street||!cap||!city){ alert("Per la spedizione inserisci Via, CAP e Città."); return null; }
    delivery = `Spedizione: ${street}, ${cap} ${city}`;
  }

  const orderId=buildOrderId();
  const lines=[];
  lines.push(`🧾 ID ORDINE: #${orderId}`);
  lines.push("");
  lines.push(`👤 Nome: ${name}`);
  lines.push(`📦 Consegna: ${delivery}`);
  lines.push("");
  lines.push("🛒 Articoli:");
  for(const [id,qty] of Object.entries(state.cart)){
    const p=state.products.find(x=>x.id===id);
    if(!p) continue;
    lines.push(`- ${p.title} x${qty} (${euroFromCents(productPriceCents(p))})`);
  }
  const sub=computeSubtotalCents();
  const ship=computeShippingCents(sub);
  const tot=sub+ship;
  lines.push("");
  lines.push(`Subtotale: ${euroFromCents(sub)}`);
  lines.push(`Spedizione: ${euroFromCents(ship)}`);
  lines.push(`Totale: ${euroFromCents(tot)}`);
  if(notes){ lines.push(""); lines.push(`📝 Note: ${notes}`); }
  return {orderId, text: lines.join("\n")};
}

function openWhatsApp(text){
  const encoded=encodeURIComponent(text);
  const num=(state.config?.whatsappNumber||"").replace(/\D/g,"") || "393440260906";
  window.open(`https://wa.me/${num}?text=${encoded}`, "_blank");
}

function openCart(){
  $("#drawer").classList.remove("hidden");
  $("#drawerBackdrop").classList.remove("hidden");
  renderCart(); renderTotals();
}
function closeCart(){
  $("#drawer").classList.add("hidden");
  $("#drawerBackdrop").classList.add("hidden");
}

function escapeHtml(s){ return String(s||"").replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ✅ prova più percorsi, così non devi spostare cartelle
async function fetchJsonFirst(paths){
  let lastErr = null;
  for(const p of paths){
    try{
      const r = await fetch(p, { cache: "no-store" });
      if(!r.ok) throw new Error(`${p} -> HTTP ${r.status}`);
      return await r.json();
    }catch(e){
      lastErr = e;
    }
  }
  throw lastErr || new Error("Impossibile caricare JSON");
}

async function init(){
  try{
    const cfgPaths = [
      "data/config.json",
      "config.json",
      "assets/config.json",
      "assets/data/config.json"
    ];
    const prodPaths = [
      "data/products.json",
      "products.json",
      "assets/products.json",
      "assets/data/products.json"
    ];

    const [cfg, prod] = await Promise.all([
      fetchJsonFirst(cfgPaths),
      fetchJsonFirst(prodPaths),
    ]);

    state.config=cfg;
    state.products=Array.isArray(prod) ? prod : [];
    $("#brandName").textContent = state.config.brandName || "Acchiappasogni di Erika";

    state.cart=parseCart();
    updateCartBadge();
    buildCategories();
    renderTabs();
    renderGrid();

    $("#search").addEventListener("input", (e)=>{ state.query=(e.target.value||"").trim().toLowerCase(); renderGrid(); });
    $("#btnCart").onclick=openCart;
    $("#btnCloseCart").onclick=closeCart;
    $("#drawerBackdrop").onclick=closeCart;

    document.querySelectorAll('input[name="delivery"]').forEach(r=> r.addEventListener("change", ()=>renderTotals()));

    $("#btnClear").onclick=()=>{
      if(!confirm("Vuoi svuotare il carrello?")) return;
      state.cart={}; saveCart(); updateCartBadge(); renderCart(); renderTotals();
    };

    $("#btnSend").onclick=()=>{
      if(!Object.keys(state.cart).length){ alert("Carrello vuoto."); return; }
      const o=buildOrderMessage();
      if(!o) return;
      localStorage.setItem("lastOrderId", o.orderId);
      openWhatsApp(o.text);
    };

    $("#btnCustom").onclick=()=>{
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
  }catch(err){
    console.error(err);
    const grid = $("#grid");
    if(grid){
      grid.innerHTML = `
        <div style="padding:12px; color:var(--muted);">
          Errore caricamento catalogo.<br/>
          Controlla che esistano <b>products.json</b> e <b>config.json</b> (in root o in /data).<br/>
          <span style="opacity:.8; font-size:12px;">${escapeHtml(err?.message || String(err))}</span>
        </div>`;
    }
  }
}
init();

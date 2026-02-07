/* Acchiappasogni di Erika — Catalogo + Carrello + WhatsApp + Admin locale (telefono) */

const $ = (s, el=document)=> el.querySelector(s);
const $$ = (s, el=document)=> [...el.querySelectorAll(s)];

const state = {
  config: null,
  products: [],
  baseProducts: [],
  cart: loadCart(),
  category: "Tutti",
  query: "",
  mode: "catalog", // catalog | custom
};

function loadCart(){
  try{ return JSON.parse(localStorage.getItem("ae_cart")||"{}") || {}; }catch(e){ return {}; }
}
function saveCart(){
  localStorage.setItem("ae_cart", JSON.stringify(state.cart||{}));
}
function cartCount(){
  return Object.values(state.cart||{}).reduce((a,b)=>a+(b||0),0);
}
function updateCartBadge(){ $("#cartCount").textContent = cartCount(); }

/*** Local override (solo su questo telefono) ***/
const LS_PRODUCTS_KEY = "ae_products_override_v1";

function loadProductsOverride(){
  try{
    const raw = localStorage.getItem(LS_PRODUCTS_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  }catch(e){ return null; }
}

function saveProductsOverride(list){
  localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(list));
}

function clearProductsOverride(){
  localStorage.removeItem(LS_PRODUCTS_KEY);
}

async function fetchProductsWithLocalOverride(){
  const override = loadProductsOverride();
  if(override) return override;

  // cache-bust per GitHub Pages (evita vecchi prodotti in cache)
  const url = `data/products.json?v=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("Impossibile caricare data/products.json");
  const base = await res.json();
  return Array.isArray(base) ? base : [];
}

function money(n){
  const x = Number(n||0);
  return x.toFixed(2).replace(".", ",");
}
function escapeHtml(s){
  return String(s||"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}
function escapeAttr(s){
  return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function uniqueCategories(products){
  const set = new Set();
  (products||[]).forEach(p=>{ if(p.category) set.add(p.category); });
  return ["Tutti", ...[...set]];
}

function matches(p, q){
  if(!q) return true;
  const text = ((p.title||"") + " " + (p.description||"")).toLowerCase();
  return text.includes(q.toLowerCase());
}

function applyFilters(){
  const list = (state.products||[])
    .filter(p => state.category==="Tutti" ? true : p.category===state.category)
    .filter(p => matches(p, state.query));
  renderGrid(list);
}

function setMode(mode){
  state.mode = mode;
  $("#btnCustom").classList.toggle("active", mode==="custom");
  $("#btnCatalog").classList.toggle("active", mode==="catalog");
  $("#customPanel").classList.toggle("hidden", mode!=="custom");
  $("#catalogPanel").classList.toggle("hidden", mode!=="catalog");
}

function renderTabs(){
  const tabs = $("#tabs");
  tabs.innerHTML = "";
  uniqueCategories(state.products).forEach(cat=>{
    const b = document.createElement("button");
    b.className = "tab" + (cat===state.category ? " active" : "");
    b.textContent = cat;
    b.onclick = ()=>{ state.category = cat; renderTabs(); applyFilters(); };
    tabs.appendChild(b);
  });
}

function renderGrid(list){
  const grid = $("#grid");
  grid.innerHTML = "";
  if(!list.length){
    grid.innerHTML = `<div class="empty">Nessun progetto trovato.</div>`;
    return;
  }

  list.forEach((p,i)=>{
    const card = document.createElement("article");
    card.className="card";
    const displayTitle = (p.title||"").replace(/Modello\s+\d+/i, `Modello ${i+1}`);

    card.innerHTML = `
      <div class="thumbWrap">
        <img class="thumb" src="${encodeURI(p.image||"")}" alt="${escapeHtml(displayTitle)}"
             onerror="this.style.display='none'; this.closest('article')?.classList.add('noimg');" />
      </div>
      <div class="body">
        <div class="title">${escapeHtml(displayTitle)}</div>
        <div class="sub">${escapeHtml(p.category||"")}</div>
        <div class="price">€ ${money(p.price_from||0)}</div>

        <div class="qtyRow">
          <button class="qtyBtn" data-act="dec">-</button>
          <div class="qty">${state.cart[p.id]||0}</div>
          <button class="qtyBtn" data-act="inc">+</button>
          <button class="btn small" data-act="add">Aggiungi</button>
        </div>
      </div>
    `;

    card.querySelector('[data-act="dec"]').onclick = ()=>changeQty(p.id, -1);
    card.querySelector('[data-act="inc"]').onclick = ()=>changeQty(p.id, +1);
    card.querySelector('[data-act="add"]').onclick = ()=>changeQty(p.id, +1);

    grid.appendChild(card);
  });
}

function changeQty(id, delta){
  const cur = state.cart[id]||0;
  const next = Math.max(0, cur+delta);
  if(next===0) delete state.cart[id];
  else state.cart[id]=next;
  saveCart();
  updateCartBadge();
  applyFilters();
}

function openCart(){
  const modal = $("#cartModal");
  modal.classList.remove("hidden");
  renderCart();
}
function closeCart(){
  $("#cartModal").classList.add("hidden");
}

function renderCart(){
  const box = $("#cartItems");
  box.innerHTML = "";

  const ids = Object.keys(state.cart||{});
  if(!ids.length){
    box.innerHTML = `<div class="empty">Carrello vuoto.</div>`;
    $("#cartTotal").textContent = "€ 0,00";
    return;
  }

  let tot = 0;
  ids.forEach(id=>{
    const qty = state.cart[id];
    const p = state.products.find(x=>x.id===id);
    if(!p) return;

    const line = (p.price_from||0) * qty;
    tot += line;

    const row = document.createElement("div");
    row.className = "cartRow";
    row.innerHTML = `
      <div class="cartMain">
        <div class="cartTitle">${escapeHtml(p.title||id)}</div>
        <div class="cartSub">€ ${money(p.price_from||0)} × ${qty}</div>
      </div>
      <div class="cartActions">
        <button class="qtyBtn" data-act="dec">-</button>
        <button class="qtyBtn" data-act="inc">+</button>
        <button class="btn ghost small" data-act="rm">Rimuovi</button>
      </div>
    `;
    row.querySelector('[data-act="dec"]').onclick = ()=>changeQty(id,-1);
    row.querySelector('[data-act="inc"]').onclick = ()=>changeQty(id,+1);
    row.querySelector('[data-act="rm"]').onclick = ()=>{ delete state.cart[id]; saveCart(); updateCartBadge(); renderCart(); applyFilters(); };

    box.appendChild(row);
  });

  $("#cartTotal").textContent = `€ ${money(tot)}`;
}

function buildWhatsAppMessage(){
  const ids = Object.keys(state.cart||{});
  const lines = [];
  lines.push("Ciao! Vorrei ordinare questi acchiappasogni:");
  let tot=0;

  ids.forEach(id=>{
    const qty = state.cart[id];
    const p = state.products.find(x=>x.id===id);
    if(!p) return;
    const line = (p.price_from||0)*qty;
    tot += line;
    lines.push(`- ${p.title||id} × ${qty} = € ${money(line)}`);
  });

  lines.push(`Totale: € ${money(tot)}`);
  return lines.join("\n");
}

function sendWhatsApp(){
  const phone = (state.config?.whatsapp_phone || "").replace(/\s+/g,"");
  const msg = encodeURIComponent(buildWhatsAppMessage());
  if(!phone){
    alert("Numero WhatsApp non configurato in data/config.json");
    return;
  }
  const url = `https://wa.me/${phone}?text=${msg}`;
  window.open(url, "_blank");
}

/*** Admin (password 1234) — modifiche solo su questo telefono ***/
const ADMIN_PASS = "1234";

function openAdminModal(){
  const modal = document.getElementById("adminModal");
  if(!modal) return;
  modal.classList.remove("hidden");
  // reset view
  const login = document.getElementById("adminLogin");
  const panel = document.getElementById("adminPanel");
  const err = document.getElementById("adminErr");
  const pass = document.getElementById("adminPass");
  if(err) err.classList.add("hidden");
  if(pass) pass.value = "";
  if(login) login.classList.remove("hidden");
  if(panel) panel.classList.add("hidden");
}

function closeAdminModal(){
  document.getElementById("adminModal")?.classList.add("hidden");
}

function bindAdmin(){
  const modal = document.getElementById("adminModal");
  if(!modal) return;

  document.getElementById("adminClose")?.addEventListener("click", closeAdminModal);
  modal.addEventListener("click", (e)=>{ if(e.target === modal) closeAdminModal(); });

  document.getElementById("adminEnter")?.addEventListener("click", ()=> {
    const pass = document.getElementById("adminPass")?.value || "";
    const err = document.getElementById("adminErr");
    if(pass !== ADMIN_PASS){
      err?.classList.remove("hidden");
      return;
    }
    err?.classList.add("hidden");
    document.getElementById("adminLogin")?.classList.add("hidden");
    document.getElementById("adminPanel")?.classList.remove("hidden");
    ensureAdminTools();     // <-- aggiunto
    renderAdminList();
  });

  document.getElementById("adminResetOverride")?.addEventListener("click", ()=>{
    if(!confirm("Ripristinare il catalogo originale su questo telefono?")) return;
    clearProductsOverride();
    state.products = state.baseProducts.slice();
    applyFilters();
    renderAdminList();
    alert("Ripristinato.");
  });

  document.getElementById("adminSetAllPrice5")?.addEventListener("click", ()=>{
    const list = getEditableProducts();
    list.forEach(p=>p.price_from = 5);
    commitAdminProducts(list);
  });

  document.getElementById("adminAddNew")?.addEventListener("click", ()=>{
    openEditor({ mode:"new" });
  });
}

function getEditableProducts(){
  const override = loadProductsOverride();
  return (override || state.products || []).map(p=>({...p}));
}

function commitAdminProducts(list){
  saveProductsOverride(list);
  state.products = list.slice();
  applyFilters();
  renderAdminList();
  alert("Salvato sul telefono (non cambia GitHub).");
}

/* =========================
   EXPORT / IMPORT (GitHub)
   ========================= */

function downloadTextFile(filename, text){
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

function exportProductsJson(){
  const list = getEditableProducts();
  const pretty = JSON.stringify(list, null, 2);
  downloadTextFile("products_export.json", pretty);
  alert("Scaricato: products_export.json\nOra caricalo su GitHub sostituendo data/products.json e fai commit.");
}

function importProductsJsonFromFile(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(String(reader.result || "[]"));
      if(!Array.isArray(parsed)) throw new Error("Il file non contiene un array di prodotti.");
      commitAdminProducts(parsed); // salva override + refresh
      alert("Import completato sul telefono.\nSe vuoi che valga per tutti, fai Export e poi commit su GitHub.");
    }catch(e){
      alert("Errore import JSON: " + (e?.message || e));
    }
  };
  reader.readAsText(file);
}

/* Crea i pulsanti Export/Import dentro al pannello admin, senza richiedere modifiche HTML */
function ensureAdminTools(){
  const panel = document.getElementById("adminPanel");
  const listBox = document.getElementById("adminList");
  if(!panel || !listBox) return;

  // se esiste già, non duplicare
  if(document.getElementById("adminTools")) return;

  const tools = document.createElement("div");
  tools.id = "adminTools";
  tools.className = "admin-tools";
  tools.innerHTML = `
    <div class="admin-tools-row">
      <button class="btn ghost" id="adminExportJson" type="button">Esporta configurazione (JSON)</button>
      <button class="btn ghost" id="adminImportJson" type="button">Importa configurazione (JSON)</button>
      <input id="adminImportFile" type="file" accept="application/json" style="display:none;" />
    </div>
    <div class="small muted" style="margin-top:6px;">
      Export scarica un file da caricare su GitHub (data/products.json). Import ricarica quel file sul telefono.
    </div>
  `;

  // inserisci sopra la lista prodotti
  listBox.parentElement?.insertBefore(tools, listBox);

  document.getElementById("adminExportJson")?.addEventListener("click", exportProductsJson);

  const pick = document.getElementById("adminImportFile");
  document.getElementById("adminImportJson")?.addEventListener("click", ()=>pick?.click());
  pick?.addEventListener("change", ()=>{
    const f = pick.files?.[0];
    if(!f) return;
    importProductsJsonFromFile(f);
    pick.value = "";
  });
}

function renderAdminList(){
  const box = document.getElementById("adminList");
  if(!box) return;
  const list = getEditableProducts();
  box.innerHTML = "";
  list.forEach((p, idx)=>{
    const el = document.createElement("div");
    el.className = "admin-item";
    const t = (p.title||"").replace(/Modello\s+\d+/i, `Modello ${idx+1}`) || `Modello ${idx+1}`;
    el.innerHTML = `
      <div class="meta">
        <div><b>${escapeHtml(t)}</b></div>
        <div class="small">€ ${money(p.price_from ?? 0)} • ${escapeHtml(p.id||"")}</div>
      </div>
      <div class="actions">
        <button class="btn ghost" data-act="edit">Modifica</button>
        <button class="btn ghost" data-act="del">Elimina</button>
      </div>
    `;
    el.querySelector('[data-act="edit"]')?.addEventListener("click", ()=>openEditor({mode:"edit", index: idx, product: p}));
    el.querySelector('[data-act="del"]')?.addEventListener("click", ()=>{
      if(!confirm("Eliminare questo progetto (solo su questo telefono)?")) return;
      const copy = list.slice();
      copy.splice(idx,1);
      commitAdminProducts(copy);
    });
    box.appendChild(el);
  });
}

function openEditor({mode, index, product}){
  const wrap = document.getElementById("adminEditor");
  if(!wrap) return;
  wrap.classList.remove("hidden");

  const p = product ? {...product} : {
    id: `AE-${Date.now()}`,
    title:"Acchiappasogni - Modello 1",
    category:"Acchiappasogni Classici",
    price_from:5,
    image:"",
    featured:false
  };

  wrap.innerHTML = `
    <div class="admin-form">
      <div>
        <label>Titolo</label>
        <input id="ae_title" value="${escapeAttr(p.title||"")}" />
      </div>
      <div>
        <label>Categoria</label>
        <input id="ae_cat" value="${escapeAttr(p.category||"")}" />
      </div>
      <div>
        <label>Prezzo (€)</label>
        <input id="ae_price" type="number" step="0.01" value="${escapeAttr(String(p.price_from ?? 5))}" />
      </div>
      <div>
        <label>In evidenza</label>
        <select id="ae_feat">
          <option value="false"${p.featured ? "" : " selected"}>No</option>
          <option value="true"${p.featured ? " selected" : ""}>Sì</option>
        </select>
      </div>

      <div class="full">
        <label>Immagine (da galleria)</label>
        <div class="row">
          <input id="ae_file" type="file" accept="image/*" />
          <button id="ae_clear_img" class="btn ghost" type="button">Rimuovi immagine</button>
        </div>
        <div class="small muted">L’immagine viene salvata SOLO su questo telefono (non su GitHub).</div>
      </div>

      <div class="full">
        <label>Descrizione (opzionale)</label>
        <textarea id="ae_desc" placeholder="(opzionale)">${escapeHtml(p.description||"")}</textarea>
        <div class="small muted">La descrizione NON viene mostrata nelle card.</div>
      </div>

      <div class="full row" style="justify-content:flex-end;">
        <button id="ae_cancel" class="btn ghost" type="button">Chiudi</button>
        <button id="ae_save" class="btn" type="button">Salva</button>
      </div>
    </div>
  `;

  const fileInput = document.getElementById("ae_file");
  const clearBtn = document.getElementById("ae_clear_img");
  const cancelBtn = document.getElementById("ae_cancel");
  const saveBtn = document.getElementById("ae_save");

  clearBtn?.addEventListener("click", ()=>{ p.image = ""; alert("Immagine rimossa."); });

  fileInput?.addEventListener("change", ()=>{
    const f = fileInput.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{ p.image = String(reader.result || ""); alert("Immagine caricata dalla galleria."); };
    reader.readAsDataURL(f);
  });

  cancelBtn?.addEventListener("click", ()=>{ wrap.classList.add("hidden"); wrap.innerHTML=""; });

  saveBtn?.addEventListener("click", ()=>{
    const title = document.getElementById("ae_title")?.value?.trim() || "";
    const cat = document.getElementById("ae_cat")?.value?.trim() || "";
    const price = parseFloat(document.getElementById("ae_price")?.value || "0");
    const feat = (document.getElementById("ae_feat")?.value || "false") === "true";
    const desc = document.getElementById("ae_desc")?.value || "";

    p.title = title || p.title;
    p.category = cat || p.category;
    p.price_from = Number.isFinite(price) ? price : 0;
    p.featured = feat;
    p.description = desc;

    const list = getEditableProducts();
    if(mode === "edit") list[index] = p;
    else list.unshift(p);

    commitAdminProducts(list);
    wrap.classList.add("hidden");
    wrap.innerHTML="";
  });
}

async function init(){
  const cfg = await fetch("data/config.json", {cache:"no-store"}).then(r=>r.json());
  const prod = await fetchProductsWithLocalOverride();

  state.config = cfg;
  state.products = prod;
  state.baseProducts = Array.isArray(prod) ? prod.slice() : [];

  $("#brandName").textContent = cfg.brand_name || "Catalogo";
  $("#brandTag").textContent = cfg.brand_tagline || "";

  $("#search").oninput = (e)=>{ state.query = e.target.value||""; applyFilters(); };

  $("#btnCatalog").onclick = ()=>setMode("catalog");
  $("#btnCustom").onclick = ()=>setMode("custom");

  $("#btnCart").onclick=openCart;
  const btnSettings = document.getElementById("btnSettings");
  if(btnSettings) btnSettings.onclick = openAdminModal;
  bindAdmin();

  $("#cartClose").onclick=closeCart;
  $("#cartSend").onclick=sendWhatsApp;

  $("#cartModal").addEventListener("click",(e)=>{ if(e.target===$("#cartModal")) closeCart(); });

  updateCartBadge();
  renderTabs();
  applyFilters();
  setMode("catalog");
}

init();

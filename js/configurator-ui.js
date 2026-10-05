(function() {
  'use strict';
  const E=ConfiguratorEngine,S=ConfiguratorStore,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
  let assets=[],state=E.emptyState(),selected='',ready=false;
  const fields={dimensione:'Dimensione e misure',coloriPrincipali:'Colori principali',coloriSecondari:'Colori secondari',formaCerchi:'Forma e numero dei cerchi',coloreCerchio:'Colore del cerchio',coloreIntreccio:'Colore dell’intreccio',colorePiume:'Colore delle piume',fili:'Intreccio e fili',decorazioni:'Piume, perline, cristalli, legno, conchiglie, sonagli',testo:'Nome, frase o dedica',soggetti:'Simboli e soggetti',tema:'Tema',significato:'Significato',extra:'Extra richiesti (es. confetti + bigliettino + bustina)'};
  for(const [key,label] of Object.entries(fields)) {
    const l=document.createElement('label');l.textContent=label;l.htmlFor='detail-'+key;
    const input=document.createElement('input');input.id=l.htmlFor;input.maxLength=500;
    input.addEventListener('input',()=>{state.details[key]=input.value;renderSummary();});
    $('details').append(l,input);
  }
  function message(text){$('messages').textContent=text;}
  function svgNode(tag,attrs={}) {const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
  function renderSummary() {$('summary').textContent=E.summary(state,assets);}
  function render() {
    $('elements').replaceChildren();
    $('bg').setAttribute('fill',state.background||'#ffffff');
    for(const e of state.elements) {
      const a=E.catalog(assets).find(a=>a.id===e.assetId),size=(e.size||60)*(e.scale||1);
      const g=svgNode('g',{'data-id':e.id,transform:`translate(${e.x||500} ${e.y||500}) rotate(${e.rotation||0})`,tabindex:0,role:'button','aria-label':a?.name||'Elemento non disponibile'});
      const image=S.safeImage(a?.image);
      if(image) {
        const img=svgNode('image',{href:image,x:-size/2,y:-size/2,width:size,height:size,preserveAspectRatio:'xMidYMid meet'});
        img.addEventListener('error',()=>{img.remove();const t=svgNode('text',{'text-anchor':'middle','font-size':16});t.textContent='Immagine non disponibile';g.append(t);});
        g.append(img);
      } else {
        const t=svgNode('text',{'text-anchor':'middle','font-size':18});t.textContent=(a?.name||'Elemento non disponibile')+' (senza immagine)';g.append(t);
      }
      if(selected===e.id)g.append(svgNode('rect',{x:-size/2-5,y:-size/2-5,width:size+10,height:size+10,fill:'none',stroke:'#8051b0','stroke-width':4}));
      g.addEventListener('click',()=>select(e.id));
      g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select(e.id);}});
      g.addEventListener('pointerdown',ev=>{
        selected=e.id;g.setPointerCapture(ev.pointerId);
        const convert=event=>{const p=$('composition').createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform($('composition').getScreenCTM().inverse());};
        const start=convert(ev),ox=e.x,oy=e.y;
        const move=event=>{const p=convert(event);e.x=Math.min(950,Math.max(50,ox+p.x-start.x));e.y=Math.min(1150,Math.max(50,oy+p.y-start.y));e.manual=true;g.setAttribute('transform',`translate(${e.x} ${e.y}) rotate(${e.rotation||0})`);};
        const end=()=>{g.removeEventListener('pointermove',move);g.removeEventListener('pointerup',end);g.removeEventListener('pointercancel',end);render();};
        g.addEventListener('pointermove',move);g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);
      });
      $('elements').append(g);
    }
    $('dedication').textContent=state.text||'';
    $('dedication').setAttribute('y',state.textY||({above:130,below:900,center:300}[state.textPosition]||300));
    $('personalText').value=state.text||'';
    for(const key of Object.keys(fields)) $('detail-'+key).value=state.details?.[key]||'';
    renderSummary();
  }
  function select(id){selected=id;const e=state.elements.find(e=>e.id===id);$('size').value=e?.scale||1;$('rotation').value=e?.rotation||0;render();}
  function edit(fn){const e=state.elements.find(e=>e.id===selected);if(e){fn(e);render();}}
  $('apply').onclick=()=>{
    if(!ready)return;
    if(state.details?.tema) state.themes=E.parse(state.details.tema,assets).themes;
    if(state.details?.significato) state.meanings=E.parse(state.details.significato,assets).meanings;
    const result=E.apply($('idea').value,assets,state);state=result.state;render();message(result.warnings.join('\n')||'Composizione aggiornata.');
  };
  $('new').onclick=()=>{if(state.elements.length&&!confirm('Iniziare un nuovo progetto? Salva prima le modifiche che vuoi conservare.'))return;state=E.emptyState();selected='';render();message('Nuovo progetto.');};
  $('add').onclick=()=>{
    const a=E.catalog(assets).find(a=>String(a.id)===$('catalog').value);
    if(!a||!a.active)return;
    if(state.elements.length>=E.TOTAL_LIMIT){message('Limite di elementi raggiunto.');return;}
    state.elements.push({id:crypto.randomUUID(),assetId:a.id,type:a.type,position:a.metadata.recommended_position||''});
    state.lastTarget=a.id;state.elements=E.layout(state.elements,assets);render();
  };
  for(const [id,dx,dy]of [['left',-30,0],['right',30,0],['up',0,-30],['down',0,30]]) $(id).onclick=()=>edit(e=>{e.x=Math.min(950,Math.max(50,e.x+dx));e.y=Math.min(1150,Math.max(50,e.y+dy));e.manual=true;});
  $('delete').onclick=()=>{state.elements=state.elements.filter(e=>e.id!==selected);selected='';render();};
  $('size').oninput=()=>edit(e=>{e.scale=Number($('size').value);});
  $('rotation').oninput=()=>edit(e=>{e.rotation=Number($('rotation').value);});
  $('personalText').oninput=()=>{state.text=$('personalText').value;renderSummary();$('dedication').textContent=state.text;};
  $('background').oninput=()=>{state.background=$('background').value;render();};
  function refreshSaved(){const value=$('saved').value;$('saved').replaceChildren();for(const p of S.projects()){const option=document.createElement('option');option.value=p.id;option.textContent=(p.name||p.id)+' • '+p.updated_at;$('saved').append(option);}if(value)$('saved').value=value;}
  function save(){state=S.saveProject(state);refreshSaved();message('Progetto salvato su questo browser: '+state.id);}
  $('save').onclick=()=>{try{save();}catch(e){message('Salvataggio non riuscito: '+e.message);}};
  $('restore').onclick=()=>{const p=S.projects().find(p=>p.id===$('saved').value);if(p){state={...E.emptyState(),...p};selected='';render();}};
  $('download').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(state.id||'progetto')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('whatsapp').onclick=()=>{
    // Synchronous open preserves the user gesture; save upserts the same project.
    try{save();const number=localStorage.getItem('ae_wa_number')||'393440260906';window.open('https://wa.me/'+number.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(E.summary(state,assets)),'_blank','noopener');}catch(e){message('Invio non riuscito: '+e.message);}
  };
  async function refreshCatalog(){
    try{assets=await S.load();$('catalog').replaceChildren();for(const a of E.catalog(assets).filter(a=>a.active)){const o=document.createElement('option');o.value=a.id;o.textContent=a.name+' • '+a.price_modifier.toLocaleString('it-IT',{style:'currency',currency:'EUR'});$('catalog').append(o);}ready=true;$('apply').disabled=false;$('add').disabled=!$('catalog').options.length;message($('catalog').options.length?'Catalogo caricato.':'Non sono ancora disponibili asset per questo configuratore. Puoi descrivere e salvare la tua idea; gli elementi mancanti saranno segnalati.');render();}catch(e){ready=false;message(e.message);}
  }
  window.addEventListener('storage',event=>{if(event.key==='ae_configurator_assets_v1')refreshCatalog();});
  refreshSaved();refreshCatalog();
})();

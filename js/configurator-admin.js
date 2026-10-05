(function(){
  'use strict';
  const E=ConfiguratorEngine,S=ConfiguratorStore,$=id=>document.getElementById(id);
  const fields={keywords:'Parole chiave',synonyms:'Sinonimi',color:'Colore',secondary_colors:'Colori secondari',material:'Materiale',measure:'Misura',diameter_cm:'Diametro in cm',relative_size:'Dimensione relativa',semantic_role:'Ruolo semantico (es. ring)',recommended_position:'Posizione (center, below, above, sides, left, right, around)',compatibility:'Compatibilità (tipi o ID)',incompatibility:'Incompatibilità (tipi o ID)',themes:'Temi',meanings:'Significati',tags:'Tag',bundle_components:'Componenti dell’extra unico (es. confetti, bigliettino, bustina)'};
  const arrays=new Set(['keywords','synonyms','secondary_colors','compatibility','incompatibility','themes','meanings','tags','bundle_components']);
  let assets=[],editing=null;
  for(const [key,label]of Object.entries(fields)){const wrapper=document.createElement('div'),l=document.createElement('label'),input=document.createElement('input');input.id='m-'+key;l.htmlFor=input.id;l.textContent=label;input.maxLength=1000;wrapper.append(l,input);$('metadataFields').append(wrapper);}
  function status(text){$('status').textContent=text;}
  function fill(asset=null){editing=asset;$('assetForm').reset();$('assetId').value=asset?.id||'';for(const key of ['name','type','image','order'])$(key).value=asset?.[key]??(key==='order'?0:'');$('price').value=E.money(asset?.price_modifier??asset?.price);$('active').checked=asset?.active!==false;const m=E.metadata(asset?.metadata);for(const key of Object.keys(fields))$('m-'+key).value=Array.isArray(m[key])?m[key].join(', '):m[key]??asset?.[key]??'';}
  async function reload(){assets=await S.load();$('assetList').replaceChildren();for(const a of assets){const button=document.createElement('button');button.textContent=a.name+(a.active===false?' (non attivo)':'');button.onclick=()=>fill(a);$('assetList').append(button);}}
  $('loginButton').onclick=async()=>{
    const expected=localStorage.getItem('ae_admin_pass')||'1234';
    if($('password').value!==expected){status('Password non corretta.');return;}
    try{await reload();$('login').hidden=true;$('editor').hidden=false;$('password').value='';status('Catalogo locale caricato.');}catch(e){status(e.message);}
  };
  $('newAsset').onclick=()=>fill();
  $('assetForm').onsubmit=async event=>{
    event.preventDefault();
    const image=$('image').value.trim();
    if(image&&!S.safeImage(image)){status('Usa un percorso relativo o un URL HTTPS per l’immagine.');return;}
    const m={...E.metadata(editing?.metadata)};
    for(const key of Object.keys(fields)){const value=$('m-'+key).value.trim();if(value)m[key]=arrays.has(key)?value.split(',').map(x=>x.trim()).filter(Boolean):value;else delete m[key];}
    for(const key of ['diameter_cm','relative_size'])if(m[key] && (!Number.isFinite(Number(m[key]))||Number(m[key])<=0)){status('Misure e dimensioni relative devono essere numeri positivi.');return;}
    const asset={...editing,id:$('assetId').value||crypto.randomUUID(),name:$('name').value.trim(),type:$('type').value.trim(),image,price_modifier:E.money($('price').value),order:Number($('order').value)||0,active:$('active').checked,metadata:m};
    if(!asset.name||!asset.type){status('Nome e tipo sono necessari.');return;}
    try{S.saveAsset(asset);await reload();fill(asset);status('Elemento salvato.');}catch(e){status('Salvataggio non riuscito: '+e.message);}
  };
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,assets},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='configurator-assets.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('import').onchange=async()=>{
    try{const file=$('import').files[0];if(!file)return;if(file.size>5*1024*1024)throw new Error('Il file supera 5 MB.');const data=JSON.parse(await file.text()),all=Array.isArray(data)?data:data.assets;if(!Array.isArray(all)||all.length>1000||all.some(a=>!a?.id||!a.name||!a.type||a.image&&!S.safeImage(a.image)))throw new Error('Catalogo non valido. Sono richiesti ID, nome, tipo e immagini sicure.');for(const a of all)S.saveAsset(a);await reload();status('Importati '+all.length+' elementi, senza rimuovere quelli esistenti.');}catch(e){status('Importazione non riuscita: '+e.message);}
  };
})();

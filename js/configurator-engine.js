/* Deterministic Italian interpreter. Shared by browser and node:test. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConfiguratorEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const LIMIT = 100, TOTAL_LIMIT = 250;
  const numberWords = {un:1,uno:1,una:1,due:2,tre:3,quattro:4,cinque:5,sei:6,sette:7,otto:8,nove:9,dieci:10,undici:11,dodici:12,tredici:13,quattordici:14,quindici:15,sedici:16,diciassette:17,diciotto:18,diciannove:19,venti:20,trenta:30,quaranta:40,cinquanta:50};
  const colors = {bianco:['bianco','bianca','bianchi','bianche'],rosa:['rosa'],beige:['beige'],nero:['nero','nera','neri','nere'],rosso:['rosso','rossa','rossi','rosse'],blu:['blu'],azzurro:['azzurro','azzurra','azzurri','azzurre'],verde:['verde','verdi'],giallo:['giallo','gialla','gialli','gialle'],viola:['viola'],oro:['oro','dorato','dorata'],argento:['argento','argentato','argentata']};
  const positions = [['ai lati','sides'],['sinistra','left'],['destra','right'],['in basso','below'],['in alto','above'],['sotto','below'],['sopra','above'],['centrale','center'],['centro','center'],['intorno','around']];
  const normalize = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,' ').replace(/\s+/g,' ').trim();
  const escapeRE = v => v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const contains = (s,word) => !!word && new RegExp('(^|[^a-z0-9])'+escapeRE(normalize(word))+'(?=$|[^a-z0-9])').test(s);
  const list = v => Array.isArray(v) ? v.filter(x=>typeof x==='string').map(normalize).filter(Boolean) : typeof v==='string' ? v.split(/[,;]+/).map(normalize).filter(Boolean) : [];
  function metadata(v) {
    if(typeof v==='string') { try {v=JSON.parse(v);} catch {return {};} }
    return v && typeof v==='object' && !Array.isArray(v) ? v : {};
  }
  function money(v) {
    if(v===null || v===undefined || v==='') return 0;
    const n=Number(typeof v==='string'?v.replace(',','.'):v);
    return Number.isFinite(n) && n>=0 ? Math.round(n*100)/100 : 0;
  }
  function catalog(raw) {
    if(!Array.isArray(raw)) return [];
    return raw.filter(a=>a && typeof a==='object' && a.id && a.name).map(a=>{
      const m=metadata(a.metadata);
      const type=normalize(a.type || 'decoration');
      const role=normalize(m.semantic_role || a.semantic_role || (['ring','cerchio'].includes(type)?'ring':'decoration'));
      const diameter=Number(m.diameter_cm ?? a.diameter_cm ?? normalize(a.name).match(/(\d+(?:[.,]\d+)?)\s*cm/)?.[1]?.replace(',','.'));
      const keywords=[...list(a.keywords),...list(m.keywords),...list(a.synonyms),...list(m.synonyms),...list(m.bundle_components),normalize(a.name),type];
      // Legacy domain synonyms enrich old assets; new types use their own metadata.
      const aliases={ring:['cerchio','cerchi'],feather:['piuma','piume'],bead:['perlina','perline'],moon:['luna'],flower:['fiore','fiori','floreali'],star:['stella','stelle'],charm:['ciondolo','ciondoli','pendente','pendenti']};
      keywords.push(...(aliases[type]||[]));
      const material=normalize(m.material || a.material);
      return {...a,type,role,metadata:m,keywords:[...new Set(keywords)],diameter_cm:Number.isFinite(diameter)&&diameter>0?diameter:null,
        color:colorOf(m.color || a.color || a.name),material,price_modifier:money(a.price_modifier ?? a.price),
        active:![false,0,'false'].includes(a.active),order:Number(a.order)||0,
        themes:list(m.themes || m.theme),meanings:list(m.meanings || m.meaning),
        compatible:list(m.compatibility),incompatible:list(m.incompatibility)};
    }).sort((a,b)=>a.order-b.order || String(a.id).localeCompare(String(b.id)));
  }
  function colorOf(s) {
    const text=normalize(s);
    for(const [c,words] of Object.entries(colors)) if(words.some(w=>contains(text,w))) return c;
    return text.startsWith('#')?text:'';
  }
  function allColors(s) {const text=normalize(s);return Object.entries(colors).map(([c,ws])=>({c,index:Math.min(...ws.map(w=>{const m=new RegExp('(^|[^a-z0-9])'+escapeRE(w)+'(?=$|[^a-z0-9])').exec(text);return m?m.index:Infinity;}))})).filter(x=>Number.isFinite(x.index)).sort((a,b)=>a.index-b.index).map(x=>x.c);}
  function position(s) {return positions.find(([w])=>contains(normalize(s),w))?.[1] || '';}
  function quantity(s) {
    const tokens=normalize(s).split(' ');
    for(const t of tokens) {if(/^\d+$/.test(t)) return Math.max(1,Number(t)); if(numberWords[t]) return numberWords[t];}
    return 1;
  }
  function vocabulary(cat) {
    // Unavailable domain concepts are detected but never become assets.
    return [...new Set(['cerchio','cerchi','piuma','piume','perlina','perline','luna','stelle','stella','fiori','fiore','floreali','conchiglia','conchiglie','sonaglio','sonagli','cristallo','cristalli','cuore','cuori','nastro','nastri',...cat.flatMap(a=>a.keywords)])].sort((a,b)=>b.length-a.length);
  }
  function parse(text, rawCatalog) {
    const cat=catalog(rawCatalog), s=normalize(text), requests=[], warnings=[];
    const terms=vocabulary(cat);
    const expression=new RegExp('\\b('+terms.map(escapeRE).join('|')+')\\b','g');
    const materials=new Set(['legno','rattan','cotone','filo','cristallo','conchiglia','metallo',...cat.map(a=>a.material).filter(Boolean)]);
    const matches=[...s.matchAll(expression)].filter(hit=>!(materials.has(hit[0]) && /(?:di|in)\s+$/.test(s.slice(0,hit.index))) && !/(?:scrivi|scritta|dedica:|aggiungi la frase)\s+[^.;]*$/.test(s.slice(0,hit.index)));
    for(let i=0;i<matches.length;i++) {
      const hit=matches[i], start=hit.index, end=matches[i+1]?.index ?? s.length;
      const prefix=s.slice(i?matches[i-1].index+matches[i-1][0].length:0,start).split(/[,.;]|\be\b/).pop().trim();
      const segment=s.slice(start,end).split(/[,.;]/)[0];
      const term=hit[0];
      if(/^cerchi[o]?$/.test(term) && !/\d+\s*cm/.test(segment) && colorOf(segment) && requests.some(r=>r.diameter_cm && /cerchi|cerchio/.test(r.term))) continue;
      // A full asset name may contain 'cerchio'; the regex consumes it once.
      const prevClause=s.slice(0,start).split(/[,.;]/).pop();
      const local=prefix+' '+segment;
      let intent='ADD';
      const command=prevClause.match(/(?:^|\s)(togli(?:ene)?|rimuovi|elimina|sposta|metti|cambia|sostituisci|colora|aggiungi|allinea|porta|imposta)(?:\s|$)/g)?.at(-1)?.trim();
      if(/togli|rimuovi|elimina/.test(command||'')) intent='REMOVE';
      else if(/sposta/.test(command||'')) intent='MOVE';
      else if(/colora/.test(command||'')) intent='RECOLOR';
      else if(/cambia|sostituisci/.test(command||'')) intent='CHANGE';
      else if(/allinea/.test(command||'')) intent='ALIGN';
      else if(/porta|imposta/.test(command||'')) intent='QUANTITY';
      else if(command==='metti' && position(local)) intent='MOVE';
      const measured=segment.match(/(?:da|di)?\s*(\d+(?:[.,]\d+)?)\s*cm\b/);
      let qty=quantity(prefix);
      if(intent==='QUANTITY') qty=quantity(segment.replace(/\d+\s*cm/g,''));
      if(qty>LIMIT) {warnings.push(`Quantità limitata a ${LIMIT} per richiesta.`); qty=LIMIT;}
      const cs=allColors(segment), change=segment.match(/\b(?:in|con)\s+(.+)$/);
      const material=cat.map(a=>a.material).filter(Boolean).find(m=>contains(segment,m)) || (segment.match(/\bdi (legno|rattan|cotone|filo|cristallo|conchiglia|metallo)\b/)?.[1] || '');
      requests.push({term,quantity:qty,scopedQuantity:new RegExp('(?:^|\\s)(?:\\d+|'+Object.keys(numberWords).join('|')+')(?=\\s|$)').test(prefix),diameter_cm:measured?Number(measured[1].replace(',','.')):null,color:intent==='RECOLOR' && cs.length===1?'':cs[0]||'',targetColor:change?colorOf(change[1]):intent==='RECOLOR'?cs.at(-1)||'':'',material,position:position(segment),intent,size:/piccol/.test(segment)?'small':/grand/.test(segment)?'large':''});
      // Ellipsis: "quattro piume rosa e due bianche".
      const tail=segment.match(/\be\s+(\d+|uno|una|un|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+([a-z]+)(?:\s|$)/);
      if(tail && colorOf(tail[2])) requests.push({...requests.at(-1),quantity:Math.min(LIMIT,quantity(tail[1])),color:colorOf(tail[2])});
    }
    const themes=[...new Set(['nascita','matrimonio','laurea','cresima','amore','protezione','ricordo',...cat.flatMap(a=>a.themes)])].filter(t=>contains(s,t));
    const meanings=[...new Set(['protezione','amore','famiglia','ricordo','rinascita','amicizia','fortuna',...cat.flatMap(a=>a.meanings)])].filter(t=>contains(s,t));
    const weave=s.match(/(?:intreccio|tessitura)\s+([^,.;]+)/)?.[1] || '';
    const ringColor=s.match(/cerchio\s+(bianc\w*|rosa|beige|ner\w*|ross\w*|blu)/)?.[1];
    const globalColors=s.match(/colori\s+([^,.;]+)/)?.[1] || '';
    // Preserve user spelling/case. Use text nodes in the renderer.
    const dedication=String(text).match(/(?:scrivi|scritta|metti il nome|nome|aggiungi la frase|frase|dedica:)\s+["“]?(.+?)["”]?(?=\s+(?:al centro|in alto|sopra|sotto|più in alto)|[.;\n]|$)/i)?.[1]?.trim() || '';
    const name=String(text).match(/(?:nascita di|nome)\s+([\p{L}-]+)/iu)?.[1] || '';
    const globalMove=/sposta tutto|sposta l intera/.test(s)?position(s):'';
    const pronoun=s.match(/togliene\s+(\d+|\w+)/);
    return {requests,warnings,themes,meanings,weaveColors:allColors(weave),ringColor:colorOf(ringColor),colors:allColors(globalColors),text:dedication,name,textPosition:position(s.split(/scrivi|scritta|dedica:/).at(-1)),globalMove,pronoun:pronoun?Math.min(LIMIT,quantity(pronoun[1])):0,source:String(text)};
  }
  const emptyState=()=>({version:1,elements:[],text:'',name:'',themes:[],meanings:[],colors:[],weaveColors:[],details:{},lastTarget:''});
  function choose(req, cat, state) {
    let candidates=cat.filter(a=>a.active && a.keywords.some(w=>normalize(w)===req.term || contains(normalize(a.name),req.term)));
    if(req.diameter_cm) candidates=candidates.filter(a=>a.diameter_cm===req.diameter_cm);
    if(req.color) candidates=candidates.filter(a=>a.color===req.color || list(a.metadata.secondary_colors).includes(req.color));
    if(req.material) candidates=candidates.filter(a=>a.material===req.material);
    candidates=candidates.filter(a=>!a.incompatible.some(w=>state.elements.some(e=>e.assetId===w || e.type===w)));
    if(!candidates.length) return {warning:`«${req.term}${req.diameter_cm?' da '+req.diameter_cm+' cm':''}${req.color?' '+req.color:''}${req.material?' di '+req.material:''}» non è attualmente disponibile tra gli elementi attivi.`};
    const diameters=new Set(candidates.filter(a=>a.role==='ring').map(a=>a.diameter_cm));
    if(!req.diameter_cm && diameters.size>1) return {warning:`Quale misura desideri per «${req.term}»? Disponibili: ${[...diameters].filter(Boolean).sort((a,b)=>a-b).join(', ')} cm.`};
    const score=a=>a.themes.filter(t=>state.themes.includes(t)).length*3+a.meanings.filter(t=>state.meanings.includes(t)).length*3+a.compatible.filter(w=>state.elements.some(e=>e.type===w||e.assetId===w)).length;
    candidates.sort((a,b)=>score(b)-score(a)||a.order-b.order);
    if(candidates.length>1 && score(candidates[0])===score(candidates[1]) && candidates[0].color!==candidates[1].color && !req.color) return {warning:`Quale colore desideri per «${req.term}»? ${[...new Set(candidates.map(a=>a.color).filter(Boolean))].join(', ')}.`};
    return {asset:candidates[0]};
  }
  function matching(req, state, cat) {
    let matches=state.elements.filter(e=>{
      const a=cat.find(a=>String(a.id)===String(e.assetId));
      return a && a.keywords.some(w=>w===req.term) && (!req.diameter_cm||a.diameter_cm===req.diameter_cm) && (!req.color||a.color===req.color) && (!req.material||a.material===req.material);
    });
    if(req.size && matches.length) {const values=matches.map(e=>cat.find(a=>a.id===e.assetId)?.diameter_cm||0); const size=req.size==='small'?Math.min(...values):Math.max(...values);matches=matches.filter(e=>(cat.find(a=>a.id===e.assetId)?.diameter_cm||0)===size);}
    return matches;
  }
  function layout(elements, rawCatalog) {
    const cat=catalog(rawCatalog), byId=new Map(cat.map(a=>[a.id,a]));
    const largest=Math.max(1,...elements.filter(e=>byId.get(e.assetId)?.role==='ring').map(e=>byId.get(e.assetId)?.diameter_cm||30));
    const regions={center:[200,100,600,450],below:[100,600,800,550],above:[100,30,800,240],left:[30,200,250,750],right:[720,200,250,750],sides:[30,200,940,750],around:[30,30,940,1120]};
    const groups=new Map(), desired=new Map();
    for(const e of elements) {
      const a=byId.get(e.assetId), relative=Number(a?.metadata.relative_size);
      desired.set(e.id,a?.role==='ring'?300*(a.diameter_cm||30)/largest:60*(Number.isFinite(relative)&&relative>0?Math.min(relative,5):1));
      if(!e.manual) {const key=regions[e.position]?e.position:(a?.role==='ring'?'center':'below');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
    }
    let factor=1;
    const grids=new Map();
    for(const [key,items]of groups) {
      const [, ,w,h]=regions[key],cols=key==='sides'?2:Math.max(1,Math.ceil(Math.sqrt(items.length*w/h))),rows=Math.ceil(items.length/cols);
      const maxSize=Math.max(...items.map(e=>desired.get(e.id)));
      factor=Math.min(factor,w/cols/maxSize*.85,h/rows/maxSize*.85);
      grids.set(key,{cols,rows,index:0});
    }
    return elements.map(e=>{
      const size=e.manual?(e.size||desired.get(e.id)):desired.get(e.id)*factor;
      const half=Math.min(490,size*(e.scale||1)/2);
      if(e.manual)return {...e,x:Math.min(1000-half,Math.max(half,e.x||500)),y:Math.min(1200-half,Math.max(half,e.y||500))};
      const a=byId.get(e.assetId),key=regions[e.position]?e.position:(a?.role==='ring'?'center':'below');
      const [rx,ry,w,h]=regions[key],grid=grids.get(key),n=grid.index++;
      // Lateral pair is symmetric, with free space for the main ring.
      const x=key==='sides'?(n%2?820:180):rx+(n%grid.cols+.5)*w/grid.cols;
      const y=ry+(Math.floor(n/grid.cols)+.5)*h/grid.rows;
      return {...e,x:Math.min(1000-half,Math.max(half,x)),y:Math.min(1200-half,Math.max(half,y)),size,rotation:e.rotation||0};
    });
  }
  function apply(text, rawCatalog, current=emptyState()) {
    const cat=catalog(rawCatalog), p=parse(text,cat), state=JSON.parse(JSON.stringify(current)),warnings=[...p.warnings];
    state.elements=Array.isArray(state.elements)?state.elements:[];
    for(const key of ['themes','meanings','colors','weaveColors']) if(p[key].length) state[key]=p[key];
    if(p.text) {state.text=p.text;state.textPosition=p.textPosition||'center';}
    if(p.name) state.name=p.name;
    state.source=p.source;
    state.initialIdea=state.initialIdea||p.source;
    state.history=[...(state.history||[]),p.source].slice(-50);
    const textMove=state.text && contains(normalize(text),state.text) && /^(metti|sposta) /.test(normalize(text));
    if(textMove) state.textY=/alto|sopra/.test(normalize(text))?130:/basso|sotto/.test(normalize(text))?900:300;
    if(p.globalMove) {const dx={left:-60,right:60}[p.globalMove]||0,dy={above:-60,below:60}[p.globalMove]||0;state.elements=state.elements.map(e=>({...e,x:e.x+dx,y:e.y+dy,manual:true}));}
    if(p.pronoun) {
      if(!state.lastTarget) warnings.push('Quali elementi vuoi rimuovere?');
      else {const ids=state.elements.filter(e=>e.assetId===state.lastTarget).slice(-p.pronoun).map(e=>e.id);state.elements=state.elements.filter(e=>!ids.includes(e.id));}
    }
    const appliedBundles=new Set();
    for(const request of p.requests) {
      const req={...request};
      // Explicit ring color applies to diameter clauses without overwriting feathers.
      if(!req.color && p.ringColor && /cerchi|cerchio/.test(req.term)) req.color=p.ringColor;
      const matches=matching(req,state,cat);
      if(req.intent==='REMOVE') {
        const ids=matches.slice(-req.quantity).map(e=>e.id);
        state.elements=state.elements.filter(e=>!ids.includes(e.id));
        if(matches.length<req.quantity) warnings.push(`Rimossi ${ids.length} elementi «${req.term}» dei ${req.quantity} richiesti.`);
        continue;
      }
      if(req.intent==='MOVE'||req.intent==='ALIGN') {
        if(!matches.length) warnings.push(`Nessun elemento «${req.term}» da spostare.`);
        for(const e of matches) {e.position=req.position||'center';e.manual=false;}
        continue;
      }
      if(req.intent==='CHANGE'||req.intent==='RECOLOR') {
        if(!matches.length) {warnings.push(`Nessun elemento «${req.term}» da cambiare.`);continue;}
        if(!req.targetColor) {warnings.push('Specifica la variante o il colore desiderato.');continue;}
        const source=cat.find(a=>a.id===matches[0].assetId);
        const selected=choose({...req,term:source?.type||req.term,color:req.targetColor},cat,state);
        if(selected.warning) warnings.push(selected.warning);
        else for(const e of req.scopedQuantity?matches.slice(0,req.quantity):matches) {e.assetId=selected.asset.id;e.type=selected.asset.type;}
        continue;
      }
      let count=req.quantity;
      if(req.intent==='QUANTITY') {
        if(matches.length>=count) {const ids=matches.slice(count).map(e=>e.id);state.elements=state.elements.filter(e=>!ids.includes(e.id));continue;}
        count-=matches.length;
      }
      const selected=choose(req,cat,state);
      if(selected.warning) {warnings.push(selected.warning);continue;}
      const a=selected.asset;
      const components=list(a.metadata.bundle_components);
      if(components.includes(req.term)) {
        if(!components.every(c=>contains(normalize(text),c))) {warnings.push(`«${a.name}» è disponibile come extra unico completo: ${components.join(' + ')}.`);continue;}
        if(appliedBundles.has(a.id)) continue;
        appliedBundles.add(a.id);
      }
      for(let i=0;i<count && state.elements.length<TOTAL_LIMIT;i++) state.elements.push({id:'E-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),assetId:a.id,type:a.type,position:req.position||a.metadata.recommended_position||'',rotation:0});
      state.lastTarget=a.id;
      if(state.elements.length>=TOTAL_LIMIT) warnings.push(`La composizione può contenere al massimo ${TOTAL_LIMIT} elementi.`);
    }
    if(!p.requests.length&&!p.text&&!p.pronoun&&!p.globalMove&&!p.themes.length&&!p.meanings.length&&!p.weaveColors.length&&!textMove) warnings.push('Non ho riconosciuto elementi: specifica un nome del catalogo, una quantità e, per i cerchi, la misura.');
    state.elements=layout(state.elements,cat);
    return {state,warnings:[...new Set(warnings)],parsed:p,total:price(state,cat)};
  }
  function price(state, rawCatalog) {const cat=catalog(rawCatalog);return Math.round((state.elements||[]).reduce((sum,e)=>sum+money(cat.find(a=>a.id===e.assetId)?.price_modifier),0)*100)/100;}
  function summary(state, rawCatalog) {
    const cat=catalog(rawCatalog), counts=new Map();
    for(const e of state.elements) counts.set(e.assetId,(counts.get(e.assetId)||0)+1);
    return ['Progetto '+(state.name||state.id||''),...Array.from(counts,([id,n])=>{const a=cat.find(a=>a.id===id);return `${n} × ${a?.name||'Elemento non più disponibile'}${a?.material?' • '+a.material:''}`;}),
      'Riferimento progetto: '+(state.id||'(non ancora salvato)'),'Idea iniziale: '+(state.initialIdea||state.source||''),'Ultima istruzione: '+(state.source||''),'Colori: '+(state.colors||[]).join(', '),'Intreccio: '+(state.weaveColors||[]).join(', '),'Testo/dedica: '+(state.text||''),'Tema: '+(state.themes||[]).join(', '),'Significato: '+(state.meanings||[]).join(', '),
      'Dettagli: '+Object.entries(state.details||{}).filter(([,v])=>v).map(([k,v])=>k+': '+v).join('; '),'Totale componenti: '+price(state,cat).toLocaleString('it-IT',{style:'currency',currency:'EUR'})].join('\n');
  }
  return {LIMIT,TOTAL_LIMIT,normalize,metadata,money,catalog,parse,apply,emptyState,layout,price,summary};
});

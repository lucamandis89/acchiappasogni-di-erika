// Motore locale: il catalogo attivo è l'unica sorgente di accessori e prezzi.
export const LIMIT = 100
export const normalize = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export function meta(a) {
  try { const m = typeof a?.metadata === 'string' ? JSON.parse(a.metadata) : a?.metadata; return m && typeof m === 'object' && !Array.isArray(m) ? m : {} } catch { return {} }
}
export const list = v => (Array.isArray(v) ? v : String(v || '').split(',')).map(normalize).map(s => s.trim()).filter(Boolean)
export function price(v) { const n = Number(String(v ?? 0).replace(',', '.')); return Number.isFinite(n) ? n : 0 }
export const total = elements => Math.round(elements.reduce((sum, e) => sum + price(e.surcharge), 0) * 100) / 100
const words = { un:1, uno:1, una:1, due:2, tre:3, quattro:4, cinque:5, sei:6, sette:7, otto:8, nove:9, dieci:10, undici:11, dodici:12, tredici:13, quattordici:14, quindici:15, sedici:16, diciassette:17, diciotto:18, diciannove:19, venti:20 }
const aliases = { frame:['cerchio','cerchi','forma'], weave:['intreccio','intrecci','ragnatela'], feather:['piuma','piume'], bead:['perlina','perline','perla','perle'], flower:['fiore','fiori','floreali'], charm:['ciondolo','ciondoli','pendente','pendenti'] }
const colors = { bianco:['bianco','bianca','bianchi','bianche'], rosa:['rosa'], beige:['beige'], blu:['blu'], rosso:['rosso','rossa','rossi','rosse'], verde:['verde','verdi'], nero:['nero','nera','neri','nere'], oro:['oro','dorato','dorata'], argento:['argento'], viola:['viola'], azzurro:['azzurro','azzurra','azzurre'], giallo:['giallo','gialla'] }
const stem = s => normalize(s).replace(/[aeio]$/, '')
const has = (text, key) => text.split(/[^a-z0-9]+/).some(w => stem(w) === stem(key)) || (key.includes(' ') && text.includes(key))
export const role = a => meta(a).semantic_role || a.type || 'decoration'
export const diameter = a => price(meta(a).diameter_cm || meta(a).diameter || String(a.name || '').match(/(\d+(?:[.,]\d+)?)\s*cm/i)?.[1])
const keys = a => [...list(a.name), ...list(a.type), ...list(meta(a).keywords), ...list(meta(a).synonyms), ...list(meta(a).tags), ...(aliases[role(a)] || [])]
const canonicalColor = c => Object.entries(colors).find(([,values])=>values.some(v=>stem(v)===stem(c)))?.[0]||c
const assetColors = a => [...list(meta(a).color), ...list(meta(a).secondary_colors), ...Object.entries(colors).filter(([,v]) => v.some(c => has(normalize(a.name), c))).map(([k])=>k)].map(canonicalColor)
const requestedColors = s => Object.entries(colors).filter(([,v])=>v.some(c=>has(s,c))).map(([k])=>k)
const uid = () => globalThis.crypto?.randomUUID?.() || `el-${Date.now()}-${Math.random()}`
export function makeElement(a, x=200, y=190, scale=null) {
  return { id:uid(), assetId:a.id, name:a.name, type:a.type, semanticRole:role(a), diameter:diameter(a), metadata:meta(a), x,y,rotation:0, scale:Math.max(.05,Math.min(3,scale ?? (price(meta(a).default_scale)||1))), photo:meta(a).photo_url||a.image||'', color:null, surcharge:price(a.price_modifier) }
}
const position = s => /ai lati/.test(s) ? 'lati' : /sinistra/.test(s) ? 'sinistra' : /destra/.test(s) ? 'destra' : /sotto|in basso|piu in basso/.test(s) ? 'sotto' : /sopra|in alto|piu in alto/.test(s) ? 'sopra' : /intorno/.test(s) ? 'intorno' : /centr[oa]|centrale/.test(s) ? 'centro' : ''
function locate(p, i=0) {
  return p==='lati' ? {x:i%2?310:90,y:180} : p==='destra'?{x:300,y:200}:p==='sinistra'?{x:100,y:200}:p==='sopra'?{x:150+(i%3)*50,y:80}:p==='sotto'?{x:140+(i%3)*60,y:280+Math.floor(i/3)*30}:p==='intorno'?{x:200+100*Math.cos(i),y:170+100*Math.sin(i)}:{x:200,y:170}
}
export function layout(items) {
  const maxD = Math.max(1,...items.filter(x=>role(x.asset)==='frame').map(x=>diameter(x.asset)||30))
  const out=[]; const counts={}
  const amounts={}
  for(const item of items) amounts[role(item.asset)]=(amounts[role(item.asset)]||0)+item.qty
  for(const item of items) for(let j=0;j<item.qty && out.length<LIMIT;j++) {
    const r=role(item.asset), i=counts[r]||0; counts[r]=i+1
    const p=item.position || meta(item.asset).recommended_position || (r==='frame' ? (i?'sotto':'centro') : r==='weave'?'centro':r==='feather'?'sotto':'intorno')
    const xy=locate(p, p==='lati'?j:i)
    if(r==='frame' && !i && !item.position) {xy.x=200;xy.y=150}
    let scale=price(meta(item.asset).relative_size || meta(item.asset).default_scale)||1
    if(r==='frame') scale=2*(diameter(item.asset)||30)/maxD
    if(amounts[r]>7){const cols=Math.ceil(Math.sqrt(amounts[r]));const cell=320/cols;xy.x=40+cell/2+(i%cols)*cell;xy.y=40+cell/2+Math.floor(i/cols)*cell;scale=Math.min(scale,cell*.85/100);if(r==='frame')scale=cell*.85/100*(diameter(item.asset)||30)/maxD}
    scale=Math.max(.05,Math.min(3,scale))
    xy.x=Math.max(50*scale,Math.min(400-50*scale,xy.x));xy.y=Math.max(50*scale,Math.min(400-50*scale,xy.y))
    out.push({...makeElement(item.asset,xy.x,xy.y,scale),requestedPosition:p})
  }
  return out
}
function qty(s) { const m=s.replace(/\d+(?:[.,]\d+)?\s*cm/g,'').match(new RegExp(`\\b(\\d+|${Object.keys(words).join('|')})\\b`)); return Math.min(LIMIT, Math.max(1,m ? (words[m[1]]||Number(m[1])):1)) }
function select(s, catalog, messages, contextText='') {
  const measure=s.match(/(\d+(?:[.,]\d+)?)\s*cm/), cs=requestedColors(s)
  let candidates=catalog.filter(a=>keys(a).some(k=>has(s,k)))
  // A name/keyword match beats a generic type; variant constraints are strict.
  const explicit=candidates.filter(a=>[...list(a.name),...list(meta(a).keywords),...list(meta(a).synonyms)].some(k=>has(s,k)))
  if(explicit.length) candidates=explicit
  const materials=[...new Set(['legno','rattan','cotone','filo','cristallo','metallo',...catalog.flatMap(a=>list(meta(a).material))])].filter(m=>has(s,m))
  if(measure) candidates=candidates.filter(a=>diameter(a)===price(measure[1]))
  if(cs.length) candidates=candidates.filter(a=>cs.every(c=>assetColors(a).includes(c)))
  if(materials.length) candidates=candidates.filter(a=>materials.every(m=>list(meta(a).material).includes(m)||has(normalize(a.name),m)))
  candidates=candidates.map(a=>({a,score:keys(a).reduce((n,k)=>n+(has(s,k)?k.length:0),0)+list(meta(a).themes||meta(a).theme).filter(t=>has(contextText||s,t)).length*20+list(meta(a).tags).filter(t=>has(contextText,t)).length*10})).sort((a,b)=>b.score-a.score)
  if(!candidates.length) {messages.push(`Elemento o variante non disponibile: “${s.trim()}”.`);return null}
  if(candidates.length>1 && candidates[0].score===candidates[1].score) {messages.push(`Specifica misura o variante per “${s.trim()}”: ${candidates.slice(0,4).map(x=>x.a.name).join(', ')}.`);return null}
  return candidates[0].a
}
function clauses(text, catalog) {
  const known=[...new Set(catalog.flatMap(keys).flatMap(k=>k.split(' ')))].filter(k=>k.length>2 && !Object.values(colors).flat().includes(k))
  const starts=['decorazioni','fiori','piume','perline',...Object.keys(words),'\\d+',...known.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))].join('|')
  return normalize(text).split(new RegExp(`[,.;\\n]+|\\s+e\\s+(?=(?:${starts})\\b)|\\s+con\\s+|\\s+(?=(?:aggiungi|togli|rimuovi|sposta|cambia|porta|allinea)\\b)`)).map(s=>s.trim()).filter(Boolean)
}
export function interpret(text, assets, state={elements:[],context:{}}) {
  const catalog=(assets||[]).filter(a=>a && a.active!==false), messages=[], items=[]
  let elements=[...(state.elements||[])], context={...(state.context||{})}, last=state.lastAssetId
  const src=normalize(text)
  const themes=[...new Set(['nascita','matrimonio','laurea','cresima','amore','protezione','ricordo',...catalog.flatMap(a=>list(meta(a).themes||meta(a).theme))])]
  context.themes=[...new Set([...(context.themes||[]),...themes.filter(t=>has(src,t))])]
  context.name=text.match(/(?:nascita di|per il nome)\s+([\p{L}'-]+)/iu)?.[1]||context.name
  context.meaning= text.match(/significato\s*:?\s*(.+)/i)?.[1] || context.meaning
  context.colors=[...new Set([...(context.colors||[]),...requestedColors(src)])]
  const t=text.match(/(?:scrivi|scritta|metti il nome|aggiungi la frase|dedica:|testo:)\s+(.+?)(?=\s+al centro|\s+in alto|[.;\n]|$)/i)
  if(t) {context.text=t[1].trim();elements.push({id:uid(),name:'Testo',type:'text',text:context.text,...locate(position(src)),scale:1,rotation:0,surcharge:0})}
  const bundle=catalog.find(a=>keys(a).some(k=>k.includes(' + ')&&src.includes(k)))
  const parts=bundle?[...clauses(text,catalog).filter(s=>!keys(bundle).some(k=>k.includes(' + ')&&s.includes(k))),]:clauses(text,catalog)
  if(bundle) {const phrase=src.split(/[,.;\n]/).find(s=>keys(bundle).some(k=>k.includes(' + ')&&s.includes(k)))||src;items.push({asset:bundle,qty:qty(phrase),position:''});last=bundle.id}
  for(const s of parts) {
    if(/scrivi|scritta|metti il nome|aggiungi la frase|dedica:|testo:|^colori|^significato/.test(s)) continue
    const intent=/^(togli|rimuovi|togline|togliene)/.test(s)?'REMOVE':/^sposta tutto/.test(s)?'GLOBAL_MOVE':/^sposta|^metti .+piu/.test(s)?'MOVE':/^allinea/.test(s)?'ALIGN':/^cambia/.test(s)?(requestedColors(s).length?'RECOLOR':'CHANGE'):/^porta/.test(s)?'QUANTITY':'ADD'
    const n=qty(s), p=position(s)
    if(/\b\d{4,}\b/.test(s)) messages.push(`Quantità limitata a ${LIMIT} elementi.`)
    if(intent==='GLOBAL_MOVE') {elements=elements.map(e=>({...e,x:Math.max(55,Math.min(345,e.x+(p==='destra'?30:p==='sinistra'?-30:0))),y:Math.max(55,Math.min(345,e.y+(p==='sotto'?30:-30)))}));continue}
    if(intent!=='ADD') {
      const target=s.split(/\s+in\s+|\s+a\s+/)[0]
      const targetMeasure=target.match(/(\d+(?:[.,]\d+)?)\s*cm/)
      const targetMaterial=[...new Set(catalog.flatMap(a=>list(meta(a).material)))].filter(m=>has(target,m))
      let matches=elements.filter(e=>e.type==='text'?has(target,normalize(e.text)):catalog.some(a=>a.id===e.assetId && keys(a).some(k=>has(target,k)) && requestedColors(target).every(c=>assetColors(a).includes(c)) && (!targetMeasure||diameter(a)===price(targetMeasure[1])) && targetMaterial.every(m=>list(meta(a).material).includes(m)||has(normalize(a.name),m))))
      if(/togliene|togline/.test(s)) matches=elements.filter(e=>e.assetId===last)
      if(/piccol/.test(s) && matches.length) {const d=Math.min(...matches.map(e=>e.diameter||Infinity));matches=matches.filter(e=>e.diameter===d)}
      if(!matches.length){messages.push(`Nessun elemento corrispondente a “${s}”.`);continue}
      const ids=new Set(matches.slice(0,n).map(e=>e.id))
      if(intent==='REMOVE') elements=elements.filter(e=>!ids.has(e.id))
      else if(intent==='MOVE'||intent==='ALIGN') elements=elements.map(e=>(intent==='ALIGN'?matches.some(m=>m.id===e.id):ids.has(e.id))?{...e,...locate(p,intent==='ALIGN'?matches.findIndex(m=>m.id===e.id):0)}:e)
      else if(intent==='CHANGE'||intent==='RECOLOR') {
        const replacement=select(s.replace(/^cambia\s+/,'').replace(/\b(rosa|bianc[oahe]+|blu|beige|ross[oaie]+)\b(?=.*\bin\b)/g,''),catalog,messages,src)
        if(replacement) elements=elements.map(e=>matches.some(m=>m.id===e.id)?{...makeElement(replacement,e.x,e.y,e.scale),id:e.id,rotation:e.rotation}:e)
      } else if(intent==='QUANTITY') {
        elements=elements.filter(e=>!matches.some(m=>m.id===e.id));const a=catalog.find(a=>a.id===matches[0].assetId);if(a) elements.push(...layout([{asset:a,qty:n,position:p}]))
      }
      last=matches[0].assetId;continue
    }
    let phrase=s
    const previous=items.at(-1)?.asset || catalog.find(a=>a.id===last)
    if(!catalog.some(a=>keys(a).some(k=>has(s,k))) && previous && requestedColors(s).length) phrase=`${aliases[role(previous)]?.[0]||previous.type} ${s}`
    if(/^vorrei|^crea|^un acchiappasogni/.test(phrase) && !catalog.some(a=>keys(a).some(k=>has(phrase,k)))) continue
    const multiColors=requestedColors(phrase)
    const byTerm=catalog.filter(a=>keys(a).some(k=>has(phrase,k)))
    if(multiColors.length>1 && byTerm.length && !byTerm.some(a=>multiColors.every(c=>assetColors(a).includes(c))) && !byTerm.some(a=>['frame','weave'].includes(role(a)))){
      if(n>1){messages.push(`Specifica quante unità per ciascun colore in “${phrase}”.`);continue}
      const withoutColors=phrase.split(/\s+/).filter(w=>!Object.values(colors).flat().some(c=>stem(w)===stem(c))).join(' ')
      for(const c of multiColors){const variant=select(`${withoutColors} ${c}`,catalog,messages,src);if(variant){items.push({asset:variant,qty:1,position:p});last=variant.id}}
      continue
    }
    const a=select(phrase,catalog,messages,src)
    if(a) {
      const incompatible=list(meta(a).incompatible)
      const compatible=list(meta(a).compatible)
      const existing=[...elements.map(e=>({id:e.assetId,type:e.type})),...items.map(x=>x.asset)]
      if(compatible.length && existing.length && !existing.some(e=>compatible.includes(normalize(e.id))||compatible.includes(normalize(e.type)))){messages.push(`${a.name}: compatibilità richiesta non soddisfatta.`);continue}
      if([...elements.map(e=>({id:e.assetId,type:e.type})),...items.map(x=>x.asset)].some(e=>incompatible.includes(normalize(e.id))||incompatible.includes(normalize(e.type)))) {messages.push(`${a.name}: incompatibile con la composizione.`);continue}
      items.push({asset:a,qty:n,position:p});last=a.id
    }
  }
  const added=layout(items)
  if(elements.length+added.length>LIMIT)messages.push(`Limite della composizione: ${LIMIT} elementi.`)
  elements=[...elements,...added].slice(0,LIMIT)
  return {elements,context,lastAssetId:last,messages}
}
export function summary(elements,context={}) {
  const grouped=new Map()
  for(const e of elements) { const details=[e.diameter?`${e.diameter} cm`:'',...list(e.metadata?.color),...list(e.metadata?.secondary_colors),e.metadata?.material||'',e.requestedPosition||'',e.color||''].filter(Boolean).join(', ');const key=e.type==='text'?`Testo: ${e.text}`:`${e.name}${details?` [${details}]`:''}`; const row=grouped.get(key)||{qty:0,sum:0};row.qty++;row.sum+=price(e.surcharge);grouped.set(key,row) }
  return [...grouped].map(([name,r])=>`${r.qty} × ${name} (${r.sum.toFixed(2)} €)`).join('\n')+`\nTema: ${(context.themes||[]).join(', ')}\nNome: ${context.name||''}\nSignificato: ${context.meaning||''}\nColori: ${(context.colors||[]).join(', ')}\nTotale indicativo: ${total(elements).toFixed(2)} €`
}

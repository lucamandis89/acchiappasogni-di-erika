import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Copy, Download, Eraser, Loader2, MessageCircle, MousePointer2,
  Pencil, Plus, Redo2, RotateCcw, Send, Sparkles, Trash2, Type, Undo2,
  ZoomIn, ZoomOut, RotateCw, ChevronUp, ChevronDown,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

const VB = 400
const PALETTE = ['#8C4632','#C96F4A','#D4AF37','#E8C7B7','#F1D9A7','#6F8A6A','#7A5C91','#4E6E81','#222222','#F8F3EA']
const TYPE_LABEL = { frame:'Forme', weave:'Intrecci', feather:'Piume', bead:'Perle', flower:'Fiori', decoration:'Decorazioni', charm:'Ciondoli' }

const normalize = (s='') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const money = (n) => Number(n || 0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})
const uid = () => (globalThis.crypto?.randomUUID?.() || `dc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`)
const safeClone = (value) => {
  try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)) }
  catch { return JSON.parse(JSON.stringify(value)) }
}

function meta(asset) { return asset?.metadata && typeof asset.metadata === 'object' ? asset.metadata : {} }
function photo(asset) { return meta(asset).photo_url || asset.image || '' }
function scaleOf(asset) { return Number(meta(asset).default_scale || 1) }
function keywordsOf(asset) { return `${asset.name || ''},${meta(asset).keywords || ''}` }

function parseIdea(text, assets) {
  const src = normalize(text)
  const found = []
  for (const asset of assets) {
    const keys = keywordsOf(asset).split(',').map(k=>normalize(k.trim())).filter(k=>k.length>2)
    if (!keys.some(k=>src.includes(k))) continue
    let qty = 1
    const name = normalize(asset.name)
    const before = src.slice(Math.max(0, src.indexOf(keys.find(k=>src.includes(k))) - 18), src.indexOf(keys.find(k=>src.includes(k))))
    const digit = before.match(/(\d+)\s*$/)
    if (digit) qty = Math.min(8, Math.max(1, Number(digit[1])))
    else if (/\b(due|2)\s*$/.test(before)) qty=2
    else if (/\b(tre|3)\s*$/.test(before)) qty=3
    else if (/\b(quattro|4)\s*$/.test(before)) qty=4
    if ((asset.type==='frame' || asset.type==='weave') && found.some(x=>x.asset.type===asset.type)) continue
    found.push({asset, qty, name})
  }
  if (!found.some(x=>x.asset.type==='frame')) {
    const frame=assets.find(a=>a.type==='frame')
    if(frame) found.unshift({asset:frame,qty:1})
  }
  if (!found.some(x=>x.asset.type==='weave')) {
    const weave=assets.find(a=>a.type==='weave')
    if(weave) found.push({asset:weave,qty:1})
  }
  return found
}

function makeElement(asset, x=200, y=190, scale=null) {
  return { id:uid(), assetId:asset.id, name:asset.name, type:asset.type, x, y, rotation:0,
    scale: scale ?? scaleOf(asset), photo:photo(asset), color:null, surcharge:Number(asset.price_modifier||0) }
}

function compose(found) {
  const out=[]; let feather=0, deco=0, bead=0, charm=0
  for(const item of found) for(let i=0;i<item.qty;i++) {
    const a=item.asset
    if(a.type==='frame') out.push(makeElement(a,200,160,1.45*scaleOf(a)))
    else if(a.type==='weave') out.push(makeElement(a,200,160,1.2*scaleOf(a)))
    else if(a.type==='bead') {
      // Le perle usano gli stessi assi verticali delle piume: in questo modo
      // diventano davvero parte del cordino e non creano raccordi laterali.
      const xs=[150,200,250,125,275,175,225]
      out.push(makeElement(a,xs[bead%xs.length],252,scaleOf(a)))
      bead++
    }
    else if(a.type==='feather') {
      const xs=[150,200,250,125,275,175,225]
      out.push(makeElement(a,xs[feather%xs.length],326,scaleOf(a)))
      feather++
    }
    else if(a.type==='charm') {
      // I ciondoli decorativi restano laterali al telaio e non interferiscono
      // con i tre pendenti principali.
      const pos=[[270,195],[130,195],[265,225],[135,225]]
      const p=pos[charm%pos.length]
      out.push(makeElement(a,p[0],p[1],scaleOf(a)))
      charm++
    }
    else {
      const pos=[[145,135],[255,135],[200,95],[125,185],[275,185],[200,215]]
      const p=pos[deco%pos.length]
      out.push(makeElement(a,p[0],p[1],scaleOf(a)))
      deco++
    }
  }
  return out
}

function stringsFor(elements) {
  const frame=elements.find(e=>e.type==='frame')
  if(!frame) return []

  const out=[]
  const radius=50*(frame.scale||1)
  const beads=elements.filter(e=>e.type==='bead' && e.y>frame.y+radius*.35)
  const feathers=elements.filter(e=>e.type==='feather' && e.y>frame.y+radius*.35)
  const usedBeads=new Set()

  // Punto reale sul bordo inferiore del telaio. Limitiamo gli agganci alla
  // zona bassa del cerchio, così i cordini sembrano fissati alla struttura.
  const frameAnchor=(x)=>{
    const dx=Math.max(-radius*.68,Math.min(radius*.68,x-frame.x))
    const dy=Math.sqrt(Math.max(0,radius*radius-dx*dx))
    return {x:frame.x+dx,y:frame.y+dy+6}
  }

  feathers.forEach((el)=>{
    const topOffset=44*(el.scale||1)
    const end={x:el.x,y:el.y-topOffset}

    // Una perla viene inserita sullo stesso cordino solo se è realmente
    // allineata con la piuma. Niente più curve o diagonali artificiali.
    const bead=beads
      .filter(b=>!usedBeads.has(b.id) && b.y<el.y && Math.abs(b.x-el.x)<=18)
      .sort((a,b)=>Math.abs(a.x-el.x)-Math.abs(b.x-el.x))[0]

    const anchor=frameAnchor(el.x)

    // Se l'utente trascina la piuma troppo lontano dal telaio, il filo non
    // attraversa il canvas: l'elemento resta libero nell'editor.
    if(Math.abs(end.x-anchor.x)>55 || Math.hypot(end.x-anchor.x,end.y-anchor.y)>155) return

    if(bead){
      usedBeads.add(bead.id)
      const beadTop={x:bead.x,y:bead.y-10*(bead.scale||1)}
      const beadBottom={x:bead.x,y:bead.y+10*(bead.scale||1)}
      out.push({id:`s-top-${el.id}`,d:`M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)} L ${beadTop.x.toFixed(1)} ${beadTop.y.toFixed(1)}`})
      out.push({id:`s-bottom-${el.id}`,d:`M ${beadBottom.x.toFixed(1)} ${beadBottom.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`})
    } else {
      out.push({id:`s-${el.id}`,d:`M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`})
    }
  })

  // Eventuali perle non associate a una piuma restano comunque appese al
  // bordo inferiore con un collegamento corto e verticale.
  beads.filter(b=>!usedBeads.has(b.id)).forEach((bead)=>{
    const anchor=frameAnchor(bead.x)
    const end={x:bead.x,y:bead.y-10*(bead.scale||1)}
    if(Math.abs(end.x-anchor.x)>55 || Math.hypot(end.x-anchor.x,end.y-anchor.y)>105) return
    out.push({id:`s-bead-${bead.id}`,d:`M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`})
  })

  return out
}

function DreamCanvas({elements, drawings, selected, tool, svgRef, onDown, onMove, onUp, onElementDown}) {
  const strings=stringsFor(elements)
  return <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} className="dc-canvas" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} style={{cursor:tool==='draw'?'crosshair':tool==='erase'?'cell':'default'}}>
    <rect width="400" height="400" fill="#fdfbf7"/>
    <defs>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6b4a3a" floodOpacity=".18"/></filter>
      {elements.filter(el=>el.type!=='text' && el.color).map(el=><filter key={`tint-${el.id}`} id={`tint-${el.id}`} x="-30%" y="-30%" width="160%" height="160%">
        <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="gray"/>
        <feFlood floodColor={el.color} floodOpacity="0.82" result="tint"/>
        <feComposite in="tint" in2="SourceAlpha" operator="in" result="colored"/>
        <feBlend in="gray" in2="colored" mode="multiply" result="tinted"/>
        <feDropShadow in="tinted" dx="0" dy="2" stdDeviation="3" floodColor="#6b4a3a" floodOpacity=".18"/>
      </filter>)}
    </defs>
    <g fill="none" stroke="#8C4632" strokeWidth="1.2" opacity=".65">{strings.map(s=><path key={s.id} d={s.d}/>)}</g>
    {drawings.map(d=><polyline key={d.id} points={d.points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={d.color} strokeWidth={d.width} strokeLinecap="round" strokeLinejoin="round"/>)}
    {elements.map(el=><g key={el.id} transform={`translate(${el.x} ${el.y}) rotate(${el.rotation||0}) scale(${el.scale||1})`} onPointerDown={(ev)=>onElementDown(ev,el)} style={{cursor:tool==='select'?'grab':'default'}}>
      {el.type==='text' ? <text textAnchor="middle" dominantBaseline="middle" fontSize="22" fill={el.color||'#8C4632'} fontFamily="Georgia,serif" fontWeight="600">{el.text}</text> :
        <image href={el.photo} x="-50" y="-50" width="100" height="100" preserveAspectRatio="xMidYMid meet" filter={el.color ? `url(#tint-${el.id})` : "url(#softShadow)"}/> }
      {selected===el.id && <rect x="-52" y="-52" width="104" height="104" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="5 4"/>}
    </g>)}
  </svg>
}

export default function Configurator(){
  const [assets,setAssets]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const [stage,setStage]=useState('idea'), [idea,setIdea]=useState(''), [elements,setElements]=useState([]), [drawings,setDrawings]=useState([])
  const [selected,setSelected]=useState(null), [tool,setTool]=useState('select'), [color,setColor]=useState('#8C4632')
  const [history,setHistory]=useState([]), [future,setFuture]=useState([]), [category,setCategory]=useState('all')
  const [customer,setCustomer]=useState({name:'',email:'',phone:''}), [sending,setSending]=useState(false), [sent,setSent]=useState(false), [msg,setMsg]=useState('')
  const svgRef=useRef(null), drag=useRef(null), drawing=useRef(null)

  useEffect(()=>{(async()=>{setLoading(true); const {data,error:e}=await supabase.from('configurator_assets').select('*').eq('active',true).order('order',{ascending:true}); if(e){setError(e.message);setAssets([])}else setAssets(data||[]); setLoading(false)})()},[])
  const categories=useMemo(()=>['all',...new Set(assets.map(a=>a.type))],[assets])
  const shownAssets=category==='all'?assets:assets.filter(a=>a.type===category)
  const supplement=useMemo(()=>elements.reduce((s,e)=>s+Number(e.surcharge||0),0),[elements])
  const selectedEl=elements.find(e=>e.id===selected)
  const snap=()=>({elements:safeClone(elements),drawings:safeClone(drawings)})
  const remember=()=>{setHistory(h=>[...h.slice(-29),snap()]);setFuture([])}
  const point=(ev)=>{const r=svgRef.current.getBoundingClientRect();return{x:(ev.clientX-r.left)*VB/r.width,y:(ev.clientY-r.top)*VB/r.height}}

  function generate(ev){ ev?.preventDefault?.(); document.activeElement?.blur?.(); if(!idea.trim()){setMsg('Descrivi come immagini il tuo acchiappasogni.');return} const found=parseIdea(idea,assets); remember(); setElements(compose(found));setDrawings([]);setSelected(null);setStage('editor');setMsg('Bozza creata. Ora puoi spostare e modificare ogni elemento.') }
  function addAsset(a){remember();setElements(v=>[...v,makeElement(a,200,200)]);setStage('editor')}
  function addText(){const text=window.prompt('Scrivi il testo da aggiungere');if(!text)return;remember();const el={id:uid(),name:'Testo',type:'text',text,x:200,y:200,rotation:0,scale:1,color,surcharge:0};setElements(v=>[...v,el]);setSelected(el.id)}
  function mutateSelected(fn){if(!selected)return;remember();setElements(v=>v.map(e=>e.id===selected?fn({...e}):e))}
  function removeSelected(){if(!selected)return;remember();setElements(v=>v.filter(e=>e.id!==selected));setSelected(null)}
  function duplicate(){if(!selectedEl)return;remember();const n={...selectedEl,id:uid(),x:selectedEl.x+18,y:selectedEl.y+18};setElements(v=>[...v,n]);setSelected(n.id)}
  function layer(dir){if(!selected)return;remember();setElements(v=>{const a=[...v],i=a.findIndex(e=>e.id===selected);if(i<0)return a;const j=dir>0?Math.min(a.length-1,i+1):Math.max(0,i-1);[a[i],a[j]]=[a[j],a[i]];return a})}
  function undo(){if(!history.length)return;const prev=history[history.length-1];setFuture(f=>[snap(),...f]);setHistory(h=>h.slice(0,-1));setElements(prev.elements);setDrawings(prev.drawings);setSelected(null)}
  function redo(){if(!future.length)return;const next=future[0];setHistory(h=>[...h,snap()]);setFuture(f=>f.slice(1));setElements(next.elements);setDrawings(next.drawings);setSelected(null)}
  function reset(){remember();setElements([]);setDrawings([]);setSelected(null);setStage('idea');setMsg('')}

  function elementDown(ev,el){ev.stopPropagation();if(tool!=='select')return;setSelected(el.id);const p=point(ev);drag.current={id:el.id,dx:p.x-el.x,dy:p.y-el.y};ev.currentTarget.setPointerCapture?.(ev.pointerId)}
  function canvasDown(ev){const p=point(ev);if(tool==='select'){if(ev.target.tagName==='svg'||ev.target.tagName==='rect')setSelected(null);return} if(tool==='draw'){remember();const d={id:uid(),color,width:3,points:[p]};drawing.current=d;setDrawings(v=>[...v,d])} if(tool==='erase'){const nearest=drawings.find(d=>d.points.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<12));if(nearest){remember();setDrawings(v=>v.filter(d=>d.id!==nearest.id))}}}
  function canvasMove(ev){const p=point(ev);if(drag.current&&tool==='select')setElements(v=>v.map(e=>e.id===drag.current.id?{...e,x:Math.max(0,Math.min(400,p.x-drag.current.dx)),y:Math.max(0,Math.min(400,p.y-drag.current.dy))}:e));if(drawing.current&&tool==='draw'){drawing.current.points.push(p);setDrawings(v=>v.map(d=>d.id===drawing.current.id?{...drawing.current,points:[...drawing.current.points]}:d))}}
  function canvasUp(){drag.current=null;drawing.current=null}

  async function buildProjectPng(){
    const svg=svgRef.current
    if(!svg) throw new Error('Anteprima non disponibile.')

    const clone=svg.cloneNode(true)
    clone.setAttribute('width','1200')
    clone.setAttribute('height','1200')

    // Incorpora le fotografie nel file SVG prima di convertirlo in PNG.
    // Evita che il canvas venga bloccato dalle immagini esterne dello Storage.
    const images=[...clone.querySelectorAll('image')]
    await Promise.all(images.map(async img=>{
      const href=img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink','href')
      if(!href || href.startsWith('data:')) return
      const res=await fetch(href,{mode:'cors'})
      if(!res.ok) throw new Error(`Impossibile caricare un componente (${res.status}).`)
      const blob=await res.blob()
      const dataUrl=await new Promise((resolve,reject)=>{
        const reader=new FileReader()
        reader.onload=()=>resolve(reader.result)
        reader.onerror=()=>reject(new Error('Impossibile leggere una fotografia.'))
        reader.readAsDataURL(blob)
      })
      img.setAttribute('href',dataUrl)
    }))

    const xml=new XMLSerializer().serializeToString(clone)
    const svgBlob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'})
    const objectUrl=URL.createObjectURL(svgBlob)
    try{
      const bitmap=await new Promise((resolve,reject)=>{
        const image=new Image()
        image.onload=()=>resolve(image)
        image.onerror=()=>reject(new Error('Impossibile creare la foto del progetto.'))
        image.src=objectUrl
      })
      const canvas=document.createElement('canvas')
      canvas.width=1200; canvas.height=1200
      const ctx=canvas.getContext('2d')
      ctx.fillStyle='#FDFBF7'; ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height)
      return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Creazione PNG non riuscita.')),'image/png',0.95))
    } finally { URL.revokeObjectURL(objectUrl) }
  }

  async function uploadProjectImage(){
    const png=await buildProjectPng()
    const fileName=`configurator-projects/${Date.now()}-${uid()}.png`
    const {error:e}=await supabase.storage.from('product-images').upload(fileName,png,{contentType:'image/png',upsert:false})
    if(e) throw e
    const {data}=supabase.storage.from('product-images').getPublicUrl(fileName)
    if(!data?.publicUrl) throw new Error('URL pubblico della foto non disponibile.')
    return data.publicUrl
  }

  async function downloadPreview(){
    try{
      const png=await buildProjectPng()
      const url=URL.createObjectURL(png)
      const a=document.createElement('a');a.href=url;a.download='il-mio-acchiappasogni.png';a.click()
      setTimeout(()=>URL.revokeObjectURL(url),1000)
    }catch(e){console.error(e);setMsg(`Download non riuscito: ${e.message}`)}
  }
  function description(){return `Idea cliente: ${idea||'Composizione manuale'}\n\nElementi:\n${elements.filter(e=>e.type!=='text').map(e=>`- ${e.name}${e.surcharge?` (+${money(e.surcharge)})`:''}`).join('\n')}\n\nSupplementi indicativi: ${money(supplement)}\nIl prezzo finale deve essere confermato da Erika.`}
  async function sendProject(){
    setMsg('')
    if(customer.name.trim().length<2){setMsg('Inserisci il tuo nome.');return}
    if(!customer.email.includes('@')){setMsg('Inserisci una email valida.');return}
    if(!elements.length){setMsg('Aggiungi almeno un elemento.');return}
    setSending(true)
    try{
      setMsg('Sto preparando la foto del progetto...')
      const projectImage=await uploadProjectImage()
      const {error:e}=await supabase.from('custom_projects').insert({
        user_id:null,customer_name:customer.name.trim(),customer_email:customer.email.trim(),customer_phone:customer.phone.trim()||null,
        title:'Acchiappasogni creato con il configuratore',description:description(),images:[projectImage],budget:supplement||null,status:'new',admin_notes:null
      })
      if(e) throw e
      setSent(true);setMsg('Richiesta inviata a Erika con la foto del progetto!')
    }catch(e){console.error(e);setMsg(`Invio non riuscito: ${e.message}`)}
    finally{setSending(false)}
  }

  async function sendWhatsApp(){
    if(!elements.length){setMsg('Aggiungi almeno un elemento.');return}
    setSending(true);setMsg('Sto preparando la foto per WhatsApp...')
    try{
      const projectImage=await uploadProjectImage()
      const text=`Ciao Erika! Ho creato una bozza con il configuratore.\n\nFoto del progetto:\n${projectImage}\n\n${description()}`
      window.location.href=`https://wa.me/393440260906?text=${encodeURIComponent(text)}`
    }catch(e){console.error(e);setMsg(`WhatsApp non riuscito: ${e.message}`)}
    finally{setSending(false)}
  }

  if(loading)return <main className="dc-page"><div className="dc-loading"><Loader2 className="dc-spin"/> Caricamento configuratore...</div><Styles/></main>
  return <main className="dc-page"><div className="dc-wrap">
    <Link to="/" className="dc-back"><ArrowLeft size={17}/> Torna alla Home</Link>
    <header className="dc-head"><span>CREATO DA TE, REALIZZATO A MANO</span><h1>Crea il tuo acchiappasogni</h1><p>Descrivi la tua idea oppure componila manualmente. Le fotografie dei componenti sono quelle reali della libreria di Erika.</p></header>
    {error&&<div className="dc-alert">Errore: {error}</div>}
    <div className="dc-tabs"><button className={stage==='idea'?'active':''} onClick={()=>setStage('idea')}><Sparkles size={17}/> Crea dalla tua idea</button><button className={stage==='editor'?'active':''} onClick={()=>setStage('editor')}><Pencil size={17}/> Editor manuale</button></div>

    {stage==='idea'&&<form className="dc-idea" onSubmit={generate}><h2>Raccontami come lo immagini</h2><p>Esempio: “Cerchio classico con ragnatela, 3 piume, due perle, un fiore e un ciondolo goccia”. Non viene usata nessuna API a pagamento.</p><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Descrivi qui il tuo acchiappasogni..."/><button type="submit" className="dc-primary"><Sparkles size={18}/> Crea la bozza</button></form>}

    {stage==='editor'&&<div className="dc-grid">
      <section className="dc-work"><div className="dc-toolbar">
        <button className={tool==='select'?'on':''} onClick={()=>setTool('select')} title="Seleziona"><MousePointer2/></button><button className={tool==='draw'?'on':''} onClick={()=>setTool('draw')} title="Disegna"><Pencil/></button><button className={tool==='erase'?'on':''} onClick={()=>setTool('erase')} title="Gomma"><Eraser/></button><button onClick={addText} title="Testo"><Type/></button><span/><button disabled={!history.length} onClick={undo}><Undo2/></button><button disabled={!future.length} onClick={redo}><Redo2/></button><button onClick={reset}><RotateCcw/></button><button onClick={downloadPreview}><Download/></button>
      </div><DreamCanvas elements={elements} drawings={drawings} selected={selected} tool={tool} svgRef={svgRef} onDown={canvasDown} onMove={canvasMove} onUp={canvasUp} onElementDown={elementDown}/>
      {selectedEl&&<div className="dc-selected"><strong>{selectedEl.name}</strong><button onClick={()=>mutateSelected(e=>({...e,scale:Math.max(.15,e.scale-.1)}))}><ZoomOut/></button><button onClick={()=>mutateSelected(e=>({...e,scale:e.scale+.1}))}><ZoomIn/></button><button onClick={()=>mutateSelected(e=>({...e,rotation:(e.rotation+15)%360}))}><RotateCw/></button><button onClick={duplicate}><Copy/></button><button onClick={()=>layer(-1)}><ChevronDown/></button><button onClick={()=>layer(1)}><ChevronUp/></button><button className="danger" onClick={removeSelected}><Trash2/></button></div>}
      <div className="dc-colors">{PALETTE.map(c=><button key={c} type="button" title={selectedEl ? `Applica colore a ${selectedEl.name}` : 'Colore per testo e disegno'} style={{background:c}} className={(selectedEl?.color||color)===c?'sel':''} onClick={()=>{setColor(c);if(selectedEl)mutateSelected(e=>({...e,color:c}))}}/> )}</div>
      </section>
      <aside className="dc-library"><h3>Libreria componenti</h3><div className="dc-cats">{categories.map(c=><button key={c} className={category===c?'on':''} onClick={()=>setCategory(c)}>{c==='all'?'Tutti':TYPE_LABEL[c]||c}</button>)}</div><div className="dc-assets">{shownAssets.map(a=><button key={a.id} onClick={()=>addAsset(a)}><img src={photo(a)} alt=""/><span><b>{a.name}</b><small>{Number(a.price_modifier)>0?`+ ${money(a.price_modifier)}`:'Incluso'}</small></span><Plus size={16}/></button>)}</div></aside>
    </div>}

    {msg&&<div className="dc-msg">{msg}</div>}
    {stage==='editor'&&<section className="dc-summary"><div><span>Elementi</span><b>{elements.filter(e=>e.type!=='text').length}</b></div><div><span>Supplementi indicativi</span><b>{money(supplement)}</b></div></section>}
    {stage==='editor'&&<section className="dc-send"><h2>Invia il progetto a Erika</h2><p>Il supplemento è indicativo: Erika confermerà disponibilità e prezzo finale prima della realizzazione.</p><div className="dc-fields"><input placeholder="Nome e cognome" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/><input type="email" placeholder="Email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/><input placeholder="Telefono (facoltativo)" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></div><div className="dc-actions"><button className="dc-primary" onClick={sendProject} disabled={sending||sent}>{sending?<Loader2 className="dc-spin"/>:<Send/>}{sent?'Inviato':'Invia richiesta'}</button><button type="button" className="dc-whatsapp" onClick={sendWhatsApp} disabled={sending}><MessageCircle/> WhatsApp con foto</button></div></section>}
  </div><Styles/></main>
}

function Styles(){return <style>{`
.dc-page{min-height:100vh;background:linear-gradient(180deg,#fbf7f0,#f4eee5);color:#34271f;padding:32px 16px 70px}.dc-wrap{max-width:1180px;margin:auto}.dc-back{display:inline-flex;gap:7px;align-items:center;color:#744b38;text-decoration:none;font-weight:700}.dc-head{text-align:center;max-width:760px;margin:25px auto}.dc-head span{font-size:12px;letter-spacing:2px;color:#a06c4e;font-weight:800}.dc-head h1{font-family:Georgia,serif;font-size:clamp(34px,5vw,58px);margin:10px 0}.dc-head p{line-height:1.7;color:#715f54}.dc-tabs{display:flex;justify-content:center;gap:10px;margin:25px 0}.dc-tabs button,.dc-cats button{border:1px solid #d9c7b7;background:#fff;border-radius:999px;padding:10px 15px;display:flex;align-items:center;gap:7px;cursor:pointer}.dc-tabs .active,.dc-cats .on{background:#8c4632;color:#fff;border-color:#8c4632}.dc-idea,.dc-send{max-width:800px;margin:0 auto 24px;background:#fff;border:1px solid #eadfd4;border-radius:22px;padding:24px;box-shadow:0 12px 40px #6f4c3520}.dc-idea textarea{width:100%;min-height:150px;border:1px solid #dac8b8;border-radius:14px;padding:15px;font:inherit;resize:vertical;margin:10px 0 14px;box-sizing:border-box}.dc-primary,.dc-actions a,.dc-whatsapp{border:0;border-radius:12px;background:#8c4632;color:#fff;padding:12px 18px;font-weight:800;display:inline-flex;align-items:center;gap:8px;cursor:pointer;text-decoration:none}.dc-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px}.dc-work,.dc-library{background:#fff;border:1px solid #eadfd4;border-radius:20px;padding:14px;box-shadow:0 10px 30px #6f4c3518}.dc-toolbar{display:grid;grid-template-columns:repeat(4,40px) 1fr repeat(4,40px);gap:6px;margin-bottom:10px}.dc-toolbar button,.dc-selected button{height:40px;border:1px solid #e0d2c6;background:#fff;border-radius:9px;display:grid;place-items:center;cursor:pointer}.dc-toolbar svg,.dc-selected svg{width:18px}.dc-toolbar .on{background:#8c4632;color:#fff}.dc-toolbar button:disabled{opacity:.35}.dc-canvas{display:block;width:100%;max-height:620px;background:#fdfbf7;border-radius:14px;border:1px solid #eee2d8;touch-action:none}.dc-selected{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 0}.dc-selected strong{margin-right:auto}.dc-selected .danger{color:#b3261e}.dc-colors{display:flex;gap:7px;flex-wrap:wrap}.dc-colors button{width:28px;height:28px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #cbb8a7;cursor:pointer}.dc-colors .sel{box-shadow:0 0 0 3px #d4af37}.dc-library h3{margin:4px 0 10px}.dc-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.dc-cats button{padding:6px 10px;font-size:12px}.dc-assets{display:grid;gap:7px;max-height:590px;overflow:auto}.dc-assets>button{display:grid;grid-template-columns:54px 1fr 20px;align-items:center;gap:9px;text-align:left;border:1px solid #eadfd4;background:#fff;border-radius:12px;padding:7px;cursor:pointer}.dc-assets img{width:54px;height:54px;object-fit:contain;background:#faf7f2;border-radius:9px}.dc-assets span{display:flex;flex-direction:column}.dc-assets small{color:#8c6b59;margin-top:3px}.dc-summary{display:flex;justify-content:center;gap:14px;margin:18px auto;max-width:600px}.dc-summary div{background:#fff;border:1px solid #eadfd4;border-radius:14px;padding:12px 18px;display:flex;flex-direction:column;text-align:center;flex:1}.dc-summary span{font-size:12px;color:#826e62}.dc-summary b{font-size:20px;margin-top:3px}.dc-fields{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.dc-fields input{border:1px solid #dac8b8;border-radius:10px;padding:12px;font:inherit}.dc-actions{display:flex;gap:10px;margin-top:14px}.dc-actions a,.dc-whatsapp{background:#278b55}.dc-whatsapp{border:0;color:#fff;padding:12px 18px;font-weight:800;display:inline-flex;align-items:center;gap:8px;cursor:pointer;text-decoration:none;border-radius:12px}.dc-whatsapp:disabled{opacity:.6;cursor:wait}.dc-msg,.dc-alert{max-width:800px;margin:12px auto;padding:12px 16px;border-radius:12px;background:#fff4d8;border:1px solid #ead08d}.dc-loading{display:flex;gap:10px;align-items:center;justify-content:center;padding:100px}.dc-spin{animation:dcspin 1s linear infinite}@keyframes dcspin{to{transform:rotate(360deg)}}
@media(max-width:850px){.dc-grid{grid-template-columns:1fr}.dc-work,.dc-library{padding:10px}.dc-canvas{width:100%;height:auto;max-height:none;aspect-ratio:1/1}.dc-assets{max-height:420px}.dc-assets>button{min-height:62px}.dc-tabs{flex-wrap:wrap}.dc-idea{padding:18px}.dc-idea textarea{min-height:120px}.dc-selected button,.dc-toolbar button{min-width:44px;min-height:44px}.dc-library{order:2}.dc-fields{grid-template-columns:1fr}.dc-toolbar{grid-template-columns:repeat(4,40px);justify-content:center}.dc-toolbar span{display:none}.dc-summary{flex-direction:column}.dc-page{padding:20px 10px 50px}.dc-actions{flex-direction:column}.dc-actions>*{justify-content:center}.dc-head h1{font-size:38px}}
`}</style>}

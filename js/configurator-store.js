(function(root) {
  'use strict';
  const ASSETS='ae_configurator_assets_v1', PROJECTS='ae_intelligent_projects_v1';
  function read(key, fallback) {try {const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch{return fallback;}}
  async function load() {
    const response=await fetch('data/configurator-assets.json',{cache:'no-store'});
    if(!response.ok) throw new Error('Catalogo non disponibile: HTTP '+response.status);
    const data=await response.json();
    const base=Array.isArray(data)?data:data.assets;
    if(!Array.isArray(base)) throw new Error('Formato del catalogo non valido.');
    const merged=new Map(base.filter(a=>a?.id).map(a=>[String(a.id),a]));
    const local=read(ASSETS,[]);
    if(!Array.isArray(local)) throw new Error('Catalogo locale non valido.');
    for(const a of local) if(a?.id) merged.set(String(a.id),a);
    return [...merged.values()];
  }
  function saveAsset(asset) {
    const all=read(ASSETS,[]);
    if(!Array.isArray(all)) throw new Error('Il catalogo locale non è valido: esportalo prima di modificarlo.');
    const i=all.findIndex(a=>String(a.id)===String(asset.id));
    if(i<0) all.push(asset);else all[i]=asset;
    localStorage.setItem(ASSETS,JSON.stringify(all));
  }
  function saveProject(state) {
    const all=read(PROJECTS,[]);
    if(!Array.isArray(all)) throw new Error('Archivio progetti non valido.');
    const project={...state,id:state.id||'AE-'+Date.now().toString(36),updated_at:new Date().toISOString()};
    const i=all.findIndex(p=>p.id===project.id);
    if(i<0) all.push(project);else all[i]=project;
    localStorage.setItem(PROJECTS,JSON.stringify(all));
    return project;
  }
  function projects() {const value=read(PROJECTS,[]);return Array.isArray(value)?value:[];}
  function safeImage(value) {
    const s=String(value||'').trim();
    if(/^https:\/\//i.test(s)||/^data:image\/(?:png|jpeg|webp);base64,/i.test(s)) return s;
    if(s && !/^(?:[a-z]+:|\/\/)/i.test(s) && !s.includes('\\') && !s.includes('..')) return s;
    return '';
  }
  root.ConfiguratorStore={load,saveAsset,saveProject,projects,safeImage};
})(globalThis);

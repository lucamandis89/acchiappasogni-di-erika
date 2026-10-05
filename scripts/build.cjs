const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const files=['index.html','app.js','configuratore.html','configuratore-idea.html','admin-configuratore.html','pwa.html','manifest.webmanifest','assets','icons','data','js'];
// Only generated output is replaced, never checkout data or local user files.
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.cpSync(path.join(root,file),path.join(out,file),{recursive:true});
for(const name of fs.readdirSync(path.join(root,'js')))if(name.endsWith('.js'))new vm.Script(fs.readFileSync(path.join(root,'js',name),'utf8'),{filename:name});
for(const name of files.filter(n=>n.endsWith('.html'))){const html=fs.readFileSync(path.join(root,name),'utf8');for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(match[1],{filename:name});}
for(const name of fs.readdirSync(path.join(root,'data')))if(name.endsWith('.json'))JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
console.log('Static site built in dist/. HTML scripts, JavaScript and JSON validated.');

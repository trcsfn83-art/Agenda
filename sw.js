/* Agenda: copia locale del programma per aprirla subito, anche senza internet. I dati non passano da qui. */
const CACHE='agenda-v3', FONTS='agenda-fonts-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
/* La pagina: si prova la versione nuova da internet, ma se la rete è lenta dopo 3 secondi si apre la copia già salvata. */
function page(e){
  const net=fetch(new URL('./index.html',self.registration.scope).href,{cache:'no-cache',credentials:'same-origin'}).then(r=>{if(r.ok){const cp=r.clone(); return caches.open(CACHE).then(c=>c.put('./index.html',cp)).then(()=>r,()=>r);} return r;});
  e.waitUntil(net.then(()=>{},()=>{}));
  return caches.match('./index.html').then(old=>{
    if(!old) return net.catch(()=>new Response('<p style="font:16px sans-serif;padding:24px">Agenda: serve internet per la prima apertura.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}}));
    const slow=new Promise(res=>setTimeout(()=>res(null),3000));
    return Promise.race([net.catch(()=>null),slow]).then(r=>(r&&r.ok)?r:old);
  });
}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    if(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html')){e.respondWith(page(e)); return;}
    e.respondWith(caches.match(req).then(m=>m||fetch(req).then(r=>{if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp));} return r;})));
    return;}
  if(url.host==='fonts.googleapis.com'||url.host==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(req).then(m=>m||fetch(req).then(r=>{if(r.ok||r.type==='opaque') c.put(req,r.clone()); return r;}))));
  }
});

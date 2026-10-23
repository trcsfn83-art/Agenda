/* Agenda: copia locale del programma per usarlo anche senza internet. I dati non passano da qui. */
const CACHE='agenda-v2', FONTS='agenda-fonts-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    if(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html')){
      e.respondWith(fetch(req).then(r=>{if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put('./index.html',cp));} return r;}).catch(()=>caches.match('./index.html')));
      return;}
    e.respondWith(caches.match(req).then(m=>m||fetch(req).then(r=>{if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp));} return r;})));
    return;}
  if(url.host==='fonts.googleapis.com'||url.host==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(req).then(m=>m||fetch(req).then(r=>{c.put(req,r.clone()); return r;}))));
  }
});

const CACHE='edy-offline-v1.3.0';
const FILES=[
 './','./index.html','./manifest.webmanifest','./icon.svg',
 './styles.css?v=1.3.0','./storage.js?v=1.3.0','./calculator.js?v=1.3.0','./media.js?v=1.3.0','./app.js?v=1.3.0',
 './manuals.json?v=1.3.0','./inventory.json?v=1.3.0','./zones.json','./checklists.json',
 './manuales/Manual_Maestro_EDY_Biblioteca_Offline.pdf','./manuales/Checklist_Botiquin_Familiar_EDY.pdf'
];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));return;
 }
 event.respondWith(caches.match(request).then(cached=>{
  const network=fetch(request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>cached);
  return cached||network;
 }));
});

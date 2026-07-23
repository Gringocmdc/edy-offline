const CACHE='edy-offline-v1.2.1';
const FILES=['./','./index.html','./manifest.webmanifest','./styles.css?v=1.2.1','./storage.js?v=1.2.1','./calculator.js?v=1.2.1','./media.js?v=1.2.1','./app.js?v=1.2.1','./manuals.json','./inventory.json?v=1.2.1','./zones.json','./checklists.json','./icon.svg'];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response;
  }).catch(()=>caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>{
  const network=fetch(request).then(response=>{
   if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}
   return response;
  }).catch(()=>cached);
  return cached||network;
 }));
});

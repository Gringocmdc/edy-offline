const APP_VERSION='1.5.2';
const CACHE=`edy-offline-v${APP_VERSION}`;
const FILES=[
 './','./index.html','./manifest.webmanifest','./icon.svg',
 `./styles.css?v=${APP_VERSION}`,`./storage.js?v=${APP_VERSION}`,`./calculator.js?v=${APP_VERSION}`,`./media.js?v=${APP_VERSION}`,`./app.js?v=${APP_VERSION}`,
 `./manuals.json?v=${APP_VERSION}`,`./inventory.json?v=${APP_VERSION}`,'./zones.json','./checklists.json',
 './manuales/Manual_Maestro_EDY_Biblioteca_Offline.pdf','./manuales/Checklist_Botiquin_Familiar_EDY.pdf','./assets/ductac-tacsa-48mm-9m.webp','./assets/sierra-manual-cadena.webp','./assets/kit-supervivencia-grenade-a073.webp','./assets/pulsera-supervivencia-brujula.webp','./assets/botiquin-lisfar-primeros-auxilios.webp'
];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>key.startsWith('edy-offline-v')&&key!==CACHE).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});

self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);

 if(url.origin===self.location.origin && (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js') || url.pathname.endsWith('/actualizar.html'))){
  event.respondWith(fetch(request,{cache:'no-store'}));
  return;
 }

 if(request.mode==='navigate'){
  event.respondWith(
   fetch(request,{cache:'no-store'}).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
    return response;
   }).catch(()=>caches.match('./index.html'))
  );
  return;
 }

 event.respondWith(
  caches.match(request).then(cached=>{
   const network=fetch(request).then(response=>{
    if(response&&response.ok){
     const copy=response.clone();
     caches.open(CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
   }).catch(()=>cached);
   return cached||network;
  })
 );
});

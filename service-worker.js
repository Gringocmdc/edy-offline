const APP_VERSION='2.5.1';
const CACHE=`edy-offline-v${APP_VERSION}`;
const FILES=[
 './','./index.html','./manifest.webmanifest','./icon.svg',
 `./styles.css?v=${APP_VERSION}`,`./storage.js?v=${APP_VERSION}`,`./calculator.js?v=${APP_VERSION}`,`./media.js?v=${APP_VERSION}`,`./app.js?v=${APP_VERSION}`,
 `./manuals.json?v=${APP_VERSION}`,`./inventory.json?v=${APP_VERSION}`,`./kits.js?v=${APP_VERSION}`,`./v2.js?v=${APP_VERSION}`,`./v21.js?v=${APP_VERSION}`,`./v22.js?v=${APP_VERSION}`,`./autonomy.js?v=${APP_VERSION}`,'./zones.json','./checklists.json',
 './manuales/Manual_Maestro_EDY_Biblioteca_Offline.pdf','./manuales/Checklist_Botiquin_Familiar_EDY.pdf','./manuales/Biblioteca_Familiar_Dell_Era_Indice_2.4.0.pdf','./manuales/Manual_01_Primeros_Auxilios_Familia_Dell_Era.pdf','./manuales/Manual_02_Medicamentos_Basicos_Familia_Dell_Era.pdf','./manuales/Manual_03_Supervivencia_Selva_Paranaense.pdf','./manuales/Manual_04_Supervivencia_para_Principiantes.pdf','./manuales/Manual_05_Limpieza_Segura_de_Armas.pdf','./manuales/Manual_06_Cocina_Basica_y_de_Emergencia.pdf','./manuales/Manual_07_Pesca_Legal_y_Obtencion_de_Alimento.pdf','./manuales/Manual_08_Rutas_y_Evacuacion_Regional.pdf','./manuales/Manual_09_Reparaciones_Basicas_del_Auto.pdf','./manuales/Manual_10_Mascotas_Bella_y_Manchas.pdf','./manuales/Manual_11_Paneles_Solares_Instalacion_Uso_y_Mantenimiento.pdf','./manuales/Manual_12_Supervivencia_Urbana.pdf','./manuales/Manual_13_Apagones_Prolongados.pdf','./manuales/Manual_14_Tormentas_Inundaciones.pdf','./manuales/Manual_15_Incendios_en_Viviendas.pdf','./manuales/Manual_16_Comunicaciones_por_Radio.pdf','./manuales/Manual_17_Potabilizacion_y_Agua_Segura.pdf','./manuales/Manual_18_Conservacion_y_Rotacion_de_Alimentos.pdf','./manuales/Manual_19_Huerta_Familiar_y_Produccion.pdf','./manuales/Manual_20_Electricidad_Domiciliaria_Segura.pdf','./manuales/Manual_21_Plomeria_Basica.pdf','./manuales/Manual_22_Costura_y_Reparacion_de_Ropa.pdf','./manuales/Manual_23_Nudos_y_Cuerdas.pdf','./manuales/Manual_24_Orientacion_Brujula_GPS.pdf','./manuales/Manual_25_Fauna_de_Misiones.pdf','./manuales/Manual_26_Plantas_Utiles_y_Toxicas.pdf','./manuales/Manual_27_Mantenimiento_de_Generadores.pdf','./manuales/Manual_28_Motosierras_y_Herramientas.pdf','./manuales/Manual_29_Seguridad_y_Defensa_Pasiva_del_Hogar.pdf','./manuales/Manual_30_Evacuacion_y_Reunificacion_Familiar.pdf','./manuales/Manual_31_Documentos_y_Respaldos.pdf','./manuales/Manual_32_Ninos_en_Emergencias.pdf','./manuales/Manual_33_Adultos_Mayores_y_Accesibilidad.pdf','./manuales/Manual_34_Contingencia_EcoIguazu.pdf','./manuales/Manual_35_Contingencia_ADAVI.pdf','./assets/ductac-tacsa-48mm-9m.webp','./assets/sierra-manual-cadena.webp','./assets/kit-supervivencia-grenade-a073.webp','./assets/pulsera-supervivencia-brujula.webp','./assets/botiquin-lisfar-primeros-auxilios.webp','./assets/ready-america-70285.webp','./assets/bic-maxi-j6-12.webp','./assets/generador-gamma-7500-ie.webp','./assets/raid-espirales-country-12.webp','./assets/carpa-sumax-6-personas.webp','./assets/actron-pediatrico-4-100ml.webp'
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

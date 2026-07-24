const KIT_SEED_VERSION='1.6.0';
const KIT_STORAGE_KEY='kits_72h';
const KIT_MANUAL_KEY='kit_plan_manual';

const READY_AMERICA_70285_CONTENTS=[
 {id:'food-bars',category:'Alimentos',name:'Barra de alimento de emergencia · 2400 kcal',qty:2,unit:'unidades',notes:'Vida útil declarada de 5 años desde fabricación.'},
 {id:'water-pouches',category:'Agua',name:'Bolsas de agua de emergencia · 4,225 oz',qty:6,unit:'unidades',liters:0.75,notes:'Volumen total aproximado: 0,75 L. Vida útil declarada de 5 años.'},
 {id:'water-treatment',category:'Agua',name:'Tabletas potabilizadoras',qty:1,unit:'frasco',notes:'Capacidad declarada: hasta 25 qt, aproximadamente 23,7 L.'},
 {id:'lightsticks',category:'Iluminación',name:'Barras luminosas de emergencia · 12 h',qty:2,unit:'unidades',notes:''},
 {id:'biohazard-bag',category:'Higiene',name:'Bolsa para residuos biológicos',qty:1,unit:'unidad',notes:''},
 {id:'nitrile-gloves',category:'Protección',name:'Guantes de nitrilo · 10 pulgadas',qty:4,unit:'unidades',notes:''},
 {id:'dust-masks',category:'Protección',name:'Mascarillas para polvo',qty:2,unit:'unidades',notes:'La publicación oficial menciona N95; verificar el marcado del producto recibido.'},
 {id:'first-aid',category:'Botiquín',name:'Botiquín de primeros auxilios · 33 piezas',qty:1,unit:'kit',notes:''},
 {id:'multi-tool',category:'Herramientas',name:'Multiherramienta de bolsillo',qty:1,unit:'unidad',notes:'Incluye funciones como pinza, destornilladores, lima, cortacables, abrebotellas y hoja.'},
 {id:'duct-tape',category:'Herramientas',name:'Cinta multipropósito',qty:1,unit:'rollo',notes:'10 yardas declaradas.'},
 {id:'whistle',category:'Señalización',name:'Silbato multifunción',qty:1,unit:'unidad',notes:'La descripción comercial puede variar entre 3 en 1 y 5 en 1. Verificar físicamente.'},
 {id:'ponchos',category:'Abrigo',name:'Ponchos de emergencia',qty:2,unit:'unidades',notes:''},
 {id:'blankets',category:'Abrigo',name:'Mantas térmicas de supervivencia',qty:2,unit:'unidades',notes:''},
 {id:'matches',category:'Fuego',name:'Fósforos resistentes al agua',qty:1,unit:'caja',notes:''},
 {id:'power-station',category:'Comunicaciones',name:'Estación de emergencia a manivela',qty:1,unit:'unidad',notes:'Linterna, radio AM/FM, sirena y cargador de teléfono según el fabricante.'},
 {id:'water-bottle',category:'Agua',name:'Botella reutilizable sin BPA · 32 oz',qty:1,unit:'unidad',notes:'Capacidad aproximada: 0,95 L.'},
 {id:'hygiene-kits',category:'Higiene',name:'Kits personales de higiene',qty:2,unit:'kits',notes:'El contenido puede variar; verificar al abrir.'},
 {id:'backpack',category:'Transporte',name:'Mochila Ready America',qty:1,unit:'unidad',notes:'Dimensiones oficiales aproximadas: 14 × 10 × 6 pulgadas.'}
];

const KIT_PLAN_3P_ITEMS=[
 {id:'home-water',category:'Agua',name:'Reserva doméstica de agua potable',target:34,unit:'L',source:'inventory-water',critical:true,pack:false,notes:'Meta de referencia para 3 personas durante 72 h. No se transporta completa en una sola mochila.'},
 {id:'portable-water',category:'Agua',name:'Agua potable para salida inmediata',target:6,unit:'L',source:'ready-liters',critical:true,pack:true,notes:'Base práctica de 2 L por persona para iniciar la evacuación; ajustar por calor, trayecto y posibilidad de reabastecimiento.'},
 {id:'water-treatment',category:'Agua',name:'Sistema para tratar agua',target:1,unit:'sistema',source:'water-treatment',critical:true,pack:true,notes:'Tabletas, filtro o método equivalente. Verificar capacidad y fecha.'},
 {id:'food-bars',category:'Alimentos',name:'Raciones de emergencia de 2400 kcal',target:3,unit:'unidades',source:'food-bars',critical:true,pack:true,notes:'Una por persona como base mínima comercial. Complementar según edad, actividad y preferencias.'},
 {id:'first-aid',category:'Botiquín',name:'Botiquín compacto',target:1,unit:'kit',source:'first-aid',critical:true,pack:true,notes:'Revisar contenido, vencimientos y necesidades personales.'},
 {id:'medications',category:'Botiquín',name:'Medicaciones personales para 72 h o más',target:3,unit:'packs personales',critical:true,pack:true,notes:'Uno por integrante, identificado y con indicaciones.'},
 {id:'dust-masks',category:'Protección',name:'Mascarillas para polvo',target:3,unit:'unidades',source:'dust-masks',critical:false,pack:true,notes:'Una por persona; verificar ajuste y certificación.'},
 {id:'nitrile-gloves',category:'Protección',name:'Guantes descartables',target:6,unit:'unidades',source:'nitrile-gloves',critical:false,pack:true,notes:'Tres pares.'},
 {id:'ponchos',category:'Abrigo',name:'Ponchos impermeables',target:3,unit:'unidades',source:'ponchos',critical:true,pack:true,notes:'Uno por persona.'},
 {id:'blankets',category:'Abrigo',name:'Mantas térmicas',target:3,unit:'unidades',source:'blankets',critical:true,pack:true,notes:'Una por persona.'},
 {id:'clothing',category:'Abrigo',name:'Cambio de ropa liviana',target:3,unit:'conjuntos',critical:false,pack:true,notes:'Uno por persona, protegido en bolsa estanca.'},
 {id:'hats',category:'Abrigo',name:'Gorras o sombreros',target:3,unit:'unidades',critical:false,pack:true,notes:'Especialmente útil para el clima de Puerto Iguazú.'},
 {id:'lightsticks',category:'Iluminación',name:'Barras luminosas de 12 h',target:3,unit:'unidades',source:'lightsticks',critical:false,pack:true,notes:'Una por persona.'},
 {id:'personal-lights',category:'Iluminación',name:'Linternas personales o frontales',target:3,unit:'unidades',critical:true,pack:true,notes:'Preferentemente una por persona.'},
 {id:'spare-batteries',category:'Iluminación',name:'Juego de pilas de repuesto',target:1,unit:'juego',critical:false,pack:true,notes:'Compatible con las linternas y la radio.'},
 {id:'power-station',category:'Comunicaciones',name:'Radio/linterna de emergencia a manivela',target:1,unit:'unidad',source:'power-station',critical:true,pack:true,notes:'Probar radio, luz, sirena y carga antes de depender de ella.'},
 {id:'power-banks',category:'Comunicaciones',name:'Powerbanks cargados y cables',target:2,unit:'sets',critical:true,pack:true,notes:'Distribuir entre dos adultos.'},
 {id:'whistle',category:'Señalización',name:'Silbatos personales',target:3,unit:'unidades',source:'whistle',critical:false,pack:true,notes:'Uno por persona.'},
 {id:'contact-cards',category:'Documentación',name:'Tarjetas de contacto y datos médicos básicos',target:3,unit:'unidades',critical:true,pack:true,notes:'Una por persona, sin exponer datos en el repositorio público.'},
 {id:'documents',category:'Documentación',name:'Copias de documentos en bolsa estanca',target:1,unit:'set familiar',critical:true,pack:true,notes:'Guardar solo de forma privada y segura.'},
 {id:'cash',category:'Documentación',name:'Efectivo en billetes chicos',target:1,unit:'reserva',critical:false,pack:true,notes:'Monto definido por la familia; no registrar públicamente.'},
 {id:'map',category:'Orientación',name:'Mapa físico y rutas acordadas',target:1,unit:'set',critical:true,pack:true,notes:'Complementar con mapas offline en el iPad.'},
 {id:'multi-tool',category:'Herramientas',name:'Multiherramienta',target:1,unit:'unidad',source:'multi-tool',critical:false,pack:true,notes:'Verificar funciones y estado.'},
 {id:'duct-tape',category:'Herramientas',name:'Cinta multipropósito',target:1,unit:'rollo',source:'duct-tape',critical:false,pack:true,notes:'Puede usarse un rollo compacto o una cantidad enrollada.'},
 {id:'matches',category:'Fuego',name:'Fósforos resistentes al agua',target:1,unit:'caja',source:'matches',critical:false,pack:true,notes:'Guardar secos y separados.'},
 {id:'lighter',category:'Fuego',name:'Encendedores',target:2,unit:'unidades',critical:false,pack:true,notes:'Dos fuentes de fuego independientes.'},
 {id:'hygiene-kits',category:'Higiene',name:'Kits personales de higiene',target:3,unit:'kits',source:'hygiene-kits',critical:false,pack:true,notes:'Uno por persona.'},
 {id:'waste-bags',category:'Higiene',name:'Bolsas resistentes para residuos',target:6,unit:'unidades',critical:false,pack:true,notes:'Higiene, aislamiento y protección de objetos.'},
 {id:'wet-wipes',category:'Higiene',name:'Toallitas húmedas',target:1,unit:'paquete',critical:false,pack:true,notes:''},
 {id:'toilet-paper',category:'Higiene',name:'Papel higiénico compacto',target:2,unit:'rollos',critical:false,pack:true,notes:''},
 {id:'repellent',category:'Clima local',name:'Repelente de insectos',target:1,unit:'envase',critical:true,pack:true,notes:'Relevante para Puerto Iguazú.'},
 {id:'sunscreen',category:'Clima local',name:'Protector solar',target:1,unit:'envase',critical:false,pack:true,notes:''},
 {id:'notebook',category:'Organización',name:'Cuaderno pequeño y bolígrafo',target:1,unit:'set',critical:false,pack:true,notes:''},
 {id:'backpack',category:'Transporte',name:'Mochila principal',target:1,unit:'unidad',source:'backpack',critical:true,pack:true,notes:'Probar peso y comodidad. Si resulta pesada, repartir el equipo en una mochila auxiliar.'},
 {id:'secondary-bag',category:'Transporte',name:'Mochila auxiliar liviana',target:1,unit:'unidad',critical:false,pack:true,notes:'Para distribuir agua y elementos personales.'}
];

const KIT_DEFAULT={
 id:'ready-america-70285',name:'Ready America 72 Hour Deluxe',model:'70285',people:2,hours:72,status:'incoming',
 inventoryItemId:'starter-ready-america-70285',image:'assets/ready-america-70285.webp',purchaseDate:'2026-07-24',receivedAt:'',
 notes:'Comprado para evaluar el contenido real y usarlo como referencia para armar un kit propio para 3 personas.',
 contents:READY_AMERICA_70285_CONTENTS.map(item=>({...item,verified:false}))
};

function kitClone(value){return JSON.parse(JSON.stringify(value))}
function normalizeKit(raw){
 const kit={...KIT_DEFAULT,...raw};
 const savedById=new Map((raw?.contents||[]).map(x=>[x.id,x]));
 kit.contents=READY_AMERICA_70285_CONTENTS.map(base=>({...base,...savedById.get(base.id),verified:Boolean(savedById.get(base.id)?.verified)}));
 if(!['incoming','available','review'].includes(kit.status))kit.status='incoming';
 return kit;
}
function seedKits(){
 const current=EDYStorage.get(KIT_STORAGE_KEY,null);
 if(!Array.isArray(current))EDYStorage.set(KIT_STORAGE_KEY,[kitClone(KIT_DEFAULT)]);
 else{
  const ready=current.find(x=>x.id===KIT_DEFAULT.id);
  const merged=current.filter(x=>x.id!==KIT_DEFAULT.id);
  merged.unshift(normalizeKit(ready||KIT_DEFAULT));
  EDYStorage.set(KIT_STORAGE_KEY,merged);
 }
 if(EDYStorage.get('kits_seed_version','')!==KIT_SEED_VERSION)EDYStorage.set('kits_seed_version',KIT_SEED_VERSION);
 if(!EDYStorage.get(KIT_MANUAL_KEY,null))EDYStorage.set(KIT_MANUAL_KEY,{});
}
function getKits72(){return (EDYStorage.get(KIT_STORAGE_KEY,[])||[]).map(normalizeKit)}
function getReadyKit(){return getKits72().find(x=>x.id===KIT_DEFAULT.id)||normalizeKit(KIT_DEFAULT)}
function saveReadyKit(kit,message='Kit de 72 horas actualizado'){
 const all=getKits72().filter(x=>x.id!==kit.id);all.unshift(normalizeKit(kit));EDYStorage.set(KIT_STORAGE_KEY,all);
 if(typeof addTimelineEntry==='function')addTimelineEntry('kit','🎒',message);
 renderKits72();renderKitsHome();renderKitsOperation();
}
function getManualHave(){return EDYStorage.get(KIT_MANUAL_KEY,{})||{}}
function setPlanManual(itemId,value){
 const data=getManualHave();data[itemId]=Math.max(0,Number(value)||0);EDYStorage.set(KIT_MANUAL_KEY,data);renderPlanDetail();renderKits72();renderKitsHome();renderKitsOperation();
}
function adjustPlanManual(itemId,delta){const current=Number(getManualHave()[itemId])||0;setPlanManual(itemId,current+delta)}
function commercialDeclared(item){
 const kit=getReadyKit();const content=kit.contents.find(x=>x.id===(item.source==='ready-liters'?'water-pouches':item.source));if(!content)return 0;
 if(item.source==='ready-liters')return Number(content.liters)||0;
 return Number(content.qty)||0;
}
function commercialVerified(item){
 const kit=getReadyKit();const content=kit.contents.find(x=>x.id===(item.source==='ready-liters'?'water-pouches':item.source));if(!content||!content.verified)return 0;
 if(item.source==='ready-liters')return Number(content.liters)||0;
 return Number(content.qty)||0;
}
function sourceAmount(item,verified=false){
 if(item.source==='inventory-water')return typeof inventoryWaterLiters==='function'?inventoryWaterLiters():0;
 return verified?commercialVerified(item):commercialDeclared(item);
}
function itemCoverage(item,verified=false){
 const manual=Number(getManualHave()[item.id])||0;const source=sourceAmount(item,verified);const have=source+manual;const ratio=item.target?Math.min(1,have/item.target):0;
 return {have,source,manual,ratio,status:ratio>=1?'ready':have>0?'partial':'missing'};
}
function planScore(verified=false){
 const rows=KIT_PLAN_3P_ITEMS.map(item=>itemCoverage(item,verified).ratio);return rows.length?Math.round(rows.reduce((a,b)=>a+b,0)/rows.length*100):0;
}
function kitVerifiedCount(){const kit=getReadyKit();return {done:kit.contents.filter(x=>x.verified).length,total:kit.contents.length}}
function kitStatusLabel(status){return {incoming:'En camino',available:'Recibido',review:'Revisar'}[status]||status}
function kitStatusClass(status){return status==='available'?'ready':status==='review'?'partial':'incoming'}
function formatKitQty(value){return Number(value||0).toLocaleString('es-AR',{maximumFractionDigits:2})}
function renderKitsOperation(){const el=document.getElementById('opKits');if(!el)return;const v=kitVerifiedCount();el.textContent=getReadyKit().status==='incoming'?'1 en camino':`${v.done}/${v.total} verificados`}
function renderKitsHome(){
 const box=document.getElementById('kitsHomeSummary');if(!box)return;const kit=getReadyKit(),v=kitVerifiedCount(),declared=planScore(false),verified=planScore(true);
 box.innerHTML=`<div class="kitsHomeCard" onclick="openSection('kits72')"><div><strong>🎒 Kit 72 h para 2 personas</strong><small>${kitStatusLabel(kit.status)} · ${v.done}/${v.total} componentes verificados</small></div><div class="kitsHomeScores"><span>${declared}% declarado</span><span>${verified}% verificado</span></div></div>`;
}
function renderKits72(){
 const box=document.getElementById('kits72Cards');if(!box)return;const kit=getReadyKit(),v=kitVerifiedCount(),declared=planScore(false),verified=planScore(true);
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
 set('kitsPurchasedCount','1');set('kitsVerifiedCount',`${v.done}/${v.total}`);set('kitPlanDeclared',`${declared}%`);set('kitPlanVerified',`${verified}%`);renderKitsOperation();
 box.innerHTML=`<article class="kitModuleCard" onclick="openKitCommercial()"><div class="kitImage"><img src="${kit.image}" alt="Ready America 70285"></div><div><div class="kitCardTop"><span class="kitStatus ${kitStatusClass(kit.status)}">${kitStatusLabel(kit.status)}</span><span>2 personas · 72 h</span></div><h3>${escapeHTML(kit.name)}</h3><p>Modelo ${escapeHTML(kit.model)} · ${v.done}/${v.total} componentes revisados.</p><div class="kitProgress"><span style="width:${v.total?Math.round(v.done/v.total*100):0}%"></span></div></div><b>›</b></article>
 <article class="kitModuleCard plan" onclick="openKitPlan()"><div class="kitPlanIcon">🧭</div><div><div class="kitCardTop"><span class="kitStatus draft">PLAN PROPIO</span><span>3 personas · 72 h</span></div><h3>Mochila familiar para 3 personas</h3><p>Cobertura declarada ${declared}% · verificada ${verified}%.</p><div class="kitProgress"><span style="width:${verified}%"></span></div></div><b>›</b></article>`;
}
function openKitCommercial(){renderCommercialDetail();openSection('kitDetail')}
function openKitPlan(){renderPlanDetail();openSection('kitDetail')}
function renderCommercialDetail(){
 const kit=getReadyKit(),v=kitVerifiedCount(),box=document.getElementById('kitDetailContent');if(!box)return;
 box.innerHTML=`<div class="kitDetailHero"><img src="${kit.image}" alt="Kit Ready America 70285"><div><span class="kitStatus ${kitStatusClass(kit.status)}">${kitStatusLabel(kit.status)}</span><h2>${escapeHTML(kit.name)}</h2><p>Modelo ${escapeHTML(kit.model)} · preparado comercialmente para 2 personas durante 72 horas.</p><div class="kitHeroNumbers"><span><b>${v.done}/${v.total}</b> verificados</span><span><b>${kit.people}</b> personas</span><span><b>${kit.hours}</b> horas</span></div></div></div>
 <div class="panel amber"><strong>Pendiente de auditoría física:</strong> el fabricante advierte que el contenido o el envase puede variar. Al recibirlo, abrilo, fotografiá cada grupo, controlá fechas y marcá solamente lo que esté realmente presente.</div>
 <div class="actions"><button class="action" onclick="markReadyKitReceived()">${kit.status==='incoming'?'Marcar como recibido':'Registrar nueva revisión'}</button><button class="action secondary" onclick="openItem('${kit.inventoryItemId}')">Abrir en inventario</button></div>
 <div class="titleRow"><h3>Contenido declarado por el fabricante</h3><span class="categoryCount">${v.done}/${v.total} verificados</span></div>
 <div class="kitAuditList">${kit.contents.map(item=>`<label class="kitAuditRow ${item.verified?'verified':''}"><input type="checkbox" ${item.verified?'checked':''} onchange="toggleKitVerified('${item.id}',this.checked)"><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.category)}${item.notes?` · ${escapeHTML(item.notes)}`:''}</small></div><span>${formatKitQty(item.qty)} ${escapeHTML(item.unit)}</span></label>`).join('')}</div>
 <div class="kitSources"><strong>Fuentes de referencia</strong><p>Contenido declarado por Ready America para el modelo 70285. La lista propia de tres personas se apoya además en la guía general de suministros de Ready.gov.</p><a href="https://www.readyamerica.com/product/2-person-deluxe-emergency-kit-3-day-backpack/" target="_blank" rel="noopener">Ready America · modelo 70285</a><a href="https://www.ready.gov/kit" target="_blank" rel="noopener">Ready.gov · Build a Kit</a></div>`;
}
function toggleKitVerified(itemId,checked){const kit=getReadyKit(),item=kit.contents.find(x=>x.id===itemId);if(!item)return;item.verified=Boolean(checked);saveReadyKit(kit,`Componente ${checked?'verificado':'pendiente'}: ${item.name}`);renderCommercialDetail()}
function markReadyKitReceived(){
 const kit=getReadyKit();kit.status='available';kit.receivedAt=new Date().toISOString();saveReadyKit(kit,'Kit Ready America 70285 marcado como recibido');
 if(typeof getInventory==='function'&&typeof saveInventory==='function'){
  const list=getInventory(),item=list.find(x=>x.id===kit.inventoryItemId);if(item){item.status='available';item.lastReviewDate=new Date().toISOString().slice(0,10);if(!(item.movements||[]).some(m=>m.id==='ready-america-received')){item.movements=item.movements||[];item.movements.push({id:'ready-america-received',type:'adjustment',qty:0,date:new Date().toISOString(),note:'Kit recibido; contenido pendiente de verificación física.'})}saveInventory(list,'Kit Ready America 70285 recibido')}
 }
 renderCommercialDetail();
}
function planRowHTML(item){
 const declared=itemCoverage(item,false),verified=itemCoverage(item,true),manual=Number(getManualHave()[item.id])||0;
 const status=verified.status;const missing=Math.max(0,item.target-verified.have);
 return `<article class="kitPlanRow ${status}"><div class="kitPlanMain"><div class="kitPlanTitle"><span>${item.critical?'⭐':'•'}</span><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.category)} · objetivo ${formatKitQty(item.target)} ${escapeHTML(item.unit)}${item.pack?' · mochila':' · reserva del hogar'}</small></div></div><p>${escapeHTML(item.notes||'')}</p></div><div class="kitPlanNumbers"><span>Declarado <b>${formatKitQty(declared.have)}</b></span><span>Verificado <b>${formatKitQty(verified.have)}</b></span><span class="${status}">${status==='ready'?'Cubierto':status==='partial'?`Faltan ${formatKitQty(missing)}`:'Falta completo'}</span></div><div class="kitManualAdjust"><button onclick="event.stopPropagation();adjustPlanManual('${item.id}',-1)">−</button><input type="number" min="0" step="any" value="${manual}" onchange="setPlanManual('${item.id}',this.value)" aria-label="Cantidad agregada manualmente"><button onclick="event.stopPropagation();adjustPlanManual('${item.id}',1)">+</button><small>Otros disponibles</small></div></article>`;
}
function renderPlanDetail(){
 const box=document.getElementById('kitDetailContent');if(!box)return;const declared=planScore(false),verified=planScore(true),water=typeof inventoryWaterLiters==='function'?inventoryWaterLiters():0;
 const categories=[...new Set(KIT_PLAN_3P_ITEMS.map(x=>x.category))];
 box.innerHTML=`<div class="kitPlanHero"><div><span class="kitStatus draft">PLAN PROPIO</span><h2>Mochila familiar de 72 horas · 3 personas</h2><p>Plantilla editable para comparar el kit comercial con lo que realmente necesita la familia.</p></div><div class="dualScore"><div><b>${declared}%</b><span>Cobertura declarada</span></div><div><b>${verified}%</b><span>Cobertura verificada</span></div></div></div>
 <div class="waterSplitNotice"><div><strong>💧 Reserva en casa</strong><span>${formatKitQty(water)} L registrados · meta 34 L para 72 h</span></div><div><strong>🎒 Agua portátil</strong><span>Meta inicial 6 L · el kit declara 0,75 L</span></div></div>
 <div class="panel"><strong>Criterio de EDY:</strong> la reserva doméstica y la mochila no son lo mismo. Llevar 34 litros en una sola mochila no es realista; la aplicación separa el agua almacenada en casa de la carga portátil y del sistema de tratamiento.</div>
 <div class="actions"><button class="action" onclick="createKitChecklist()">Crear checklist de armado</button><button class="action secondary" onclick="shareKitMissingList()">Compartir faltantes</button><button class="action secondary" onclick="resetKitManual()">Reiniciar cantidades manuales</button></div>
 ${categories.map(cat=>`<div class="titleRow kitCategory"><h3>${escapeHTML(cat)}</h3><span class="categoryCount">${KIT_PLAN_3P_ITEMS.filter(x=>x.category===cat).length}</span></div><div class="kitPlanList">${KIT_PLAN_3P_ITEMS.filter(x=>x.category===cat).map(planRowHTML).join('')}</div>`).join('')}
 <div class="kitSources"><strong>Cómo interpretar esta lista</strong><p>“Declarado” usa la lista oficial del kit aunque todavía no esté abierto. “Verificado” cuenta solo los componentes confirmados físicamente más lo que cargues en “Otros disponibles”.</p></div>`;
}
function resetKitManual(){if(!confirm('¿Reiniciar las cantidades manuales del plan de 3 personas?'))return;EDYStorage.set(KIT_MANUAL_KEY,{});renderPlanDetail();renderKits72();renderKitsHome();renderKitsOperation()}
function missingPlanItems(){return KIT_PLAN_3P_ITEMS.map(item=>({item,coverage:itemCoverage(item,true)})).filter(x=>x.coverage.have<x.item.target)}
function shareKitMissingList(){
 const rows=missingPlanItems();const text=['EDY · Mochila 72 h para 3 personas','Faltantes según contenido verificado:','',...rows.map(({item,coverage})=>`• ${item.name}: faltan ${formatKitQty(Math.max(0,item.target-coverage.have))} ${item.unit}`)].join('\n');
 if(navigator.share)navigator.share({title:'Mochila 72 h · 3 personas',text}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>alert('Lista copiada.'));else prompt('Copiá la lista:',text);
}
function createKitChecklist(){
 if(typeof getChecklists!=='function'){alert('El módulo de checklists todavía no está disponible.');return}
 const list=getChecklists();const id='checklist-kit-72h-3p';const existing=list.find(x=>x.id===id);const items=KIT_PLAN_3P_ITEMS.map(item=>({text:`${item.name} · ${formatKitQty(item.target)} ${item.unit}`,done:itemCoverage(item,true).ratio>=1}));
 if(existing){if(!confirm('La checklist ya existe. ¿Actualizarla con el estado actual?'))return;existing.items=items;existing.description='Armado y verificación del kit familiar de 72 horas para 3 personas.'}
 else list.push({id,title:'Mochila 72 h · 3 personas',icon:'🎒',description:'Armado y verificación del kit familiar para 3 personas.',items});
 if(typeof saveChecklists==='function')saveChecklists(list,'Checklist de mochila 72 h actualizada');else EDYStorage.set('checklists',list);
 alert('Checklist creada. Podés abrirla desde Listas.');
}
function exportKitsBackup(){return {kits:getKits72(),kitPlanManual:getManualHave()}}
function importKitsBackup(data){
 if(Array.isArray(data?.kits))EDYStorage.set(KIT_STORAGE_KEY,data.kits.map(normalizeKit));
 if(data?.kitPlanManual&&typeof data.kitPlanManual==='object')EDYStorage.set(KIT_MANUAL_KEY,data.kitPlanManual);
 seedKits();renderKits72();renderKitsHome();renderKitsOperation();
}
window.EDYKits={seed:seedKits,render:renderKits72,renderHome:renderKitsHome,renderOperation:renderKitsOperation,exportData:exportKitsBackup,importData:importKitsBackup};
seedKits();renderKits72();renderKitsHome();renderKitsOperation();

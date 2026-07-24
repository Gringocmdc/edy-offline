
const sections=[...document.querySelectorAll('.section')];
function openSection(id){
 sections.forEach(s=>s.classList.remove('active'));
 const target=document.getElementById(id);if(!target)return;
 target.classList.add('active');
 if(id==='asistente'){renderAssistantAlerts();document.getElementById('assistantQuery')?.focus()}
 if(id==='inventario')renderInventory();
 if(id==='agua')renderWaterInventory();
 if(id==='biblioteca'){renderManuals();renderPrivateManuals()}
 if(id==='mapa')renderMap();
 if(id==='nuevoItem')populateZoneSelect('newItemZone');
 if(id==='timeline')renderTimeline();
 if(id==='mantenimiento')renderMaintenance();
 if(id==='respaldo')renderBackupStatus();
 if(id==='crisisCenter')renderCrisisCritical();
 if(id==='checklists')renderChecklists();
 if(id==='diagnostico')renderDiagnostic();
 scrollTo(0,0)
}
function home(){document.getElementById('search').value='';loadStatus();renderHomePendings();renderOperationsHome();renderAssistantHomeAlerts();renderTodayStrip();renderHomeChecklistProgress();renderReadinessInsights();openSection('home')}
document.getElementById('search').addEventListener('input',e=>{
 const raw=e.target.value.trim();const q=normalizeText(raw);if(!q){home();return}
 const sectionsFound=[...document.querySelectorAll('.searchable')].filter(s=>normalizeText(s.innerText).includes(q));
 const inventoryFound=getInventory().filter(i=>itemSearchText(normalizeInventoryItem(i)).includes(q)).slice(0,8);
 const manualFound=findManualMatches(raw).slice(0,6);
 const rows=[
   ...inventoryFound.map(i=>`<button class="result" onclick="openItem('${i.id}')"><strong>📦 ${escapeHTML(i.name)}</strong><br><span class="small">${escapeHTML(i.category)} · ${escapeHTML(i.location||'Sin registrar')}</span></button>`),
   ...manualFound.map(m=>`<button class="result" onclick="openManual('${escapeJS(m.id)}')"><strong>${escapeHTML(m.icon||'📘')} ${escapeHTML(m.title)}</strong><br><span class="small">Manual offline · ${escapeHTML(m.category||'Biblioteca')}</span></button>`),
   ...sectionsFound.map(s=>`<button class="result" onclick="openSection('${s.id}')"><strong>${escapeHTML(s.querySelector('h2').innerText)}</strong><br><span class="small">Abrir sección</span></button>`)
 ];
 document.getElementById('list').innerHTML=rows.length?rows.join(''):`<div class="panel">No se encontraron resultados. <button class="miniAction" onclick="openSection('asistente');assistantAsk('${escapeJS(raw)}')">Consultar a EDY</button></div>`;
 openSection('results');
});
document.querySelectorAll('input[type=checkbox][data-key]').forEach(cb=>{
 cb.checked=localStorage.getItem('edy_'+cb.dataset.key)==='1';
 cb.addEventListener('change',()=>localStorage.setItem('edy_'+cb.dataset.key,cb.checked?'1':'0'));
});
function setDot(id,status){document.getElementById(id).className='dot '+(status==='amber'?'amber':status==='red'?'red':'')}
function saveStatus(){
 const data={name:nameInput.value,level:levelInput.value,waterStatus:waterStatus.value,waterText:waterText.value,energyStatus:energyStatus.value,energyText:energyText.value,commsStatus:commsStatus.value,commsText:commsText.value,healthStatus:healthStatus.value,healthText:healthText.value,notes:notesInput.value,updated:new Date().toLocaleString('es-AR'),updatedISO:new Date().toISOString()};
 EDYStorage.set('status',data);home();
}
function loadStatus(){
 const d=EDYStorage.get('status',{});
 const h=new Date().getHours(), sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';
 greeting.textContent=d.name?`${sal}, ${d.name}.`:'Centro de Operaciones';
 overallMessage.textContent=d.level==='red'?'Emergencia activa. Priorizá la seguridad.':d.level==='amber'?'Hay elementos que requieren atención.':'Todo bajo control.';
 lastReview.textContent=d.updated?`Última revisión: ${d.updated}`:'Última revisión: todavía no registrada.';
 const badge=document.getElementById('overallBadge');
 if(badge){badge.className='overallBadge '+(d.level||'green');badge.textContent=d.level==='red'?'EMERGENCIA':d.level==='amber'?'ATENCIÓN':'NORMAL';}
 const map={green:'OK',amber:'ATENCIÓN',red:'CRÍTICO'};
 [['Water','water'],['Energy','energy'],['Comms','comms'],['Health','health']].forEach(([cap,key])=>{
   const st=d[key+'Status']||'green';
   document.getElementById(key+'Value').textContent=map[st];
   document.getElementById(key+'Detail').textContent=d[key+'Text']||'Sin registrar';
   setDot('dot'+cap,st);
 });
 nameInput.value=d.name||''; levelInput.value=d.level||'green';
 waterStatus.value=d.waterStatus||'green'; waterText.value=d.waterText||'';
 energyStatus.value=d.energyStatus||'green'; energyText.value=d.energyText||'';
 commsStatus.value=d.commsStatus||'green'; commsText.value=d.commsText||'';
 healthStatus.value=d.healthStatus||'green'; healthText.value=d.healthText||'';
 notesInput.value=d.notes||'';
}
function clearStatus(){if(confirm('¿Borrar el estado guardado en este dispositivo?')){EDYStorage.remove('status');home()}}
function renderPendings(){
 const list=EDYStorage.get('pendings',[]);
 pendingList.innerHTML=list.length?list.map((p,i)=>`<div class="pendingItem ${p.done?'done':''}"><input type="checkbox" ${p.done?'checked':''} onchange="togglePending(${i})"><span>${p.text}</span><button class="deleteBtn" onclick="deletePending(${i})">🗑️</button></div>`).join(''):'<div class="panel">No hay pendientes cargados.</div>';
}
function renderHomePendings(){
 const box=document.getElementById('homePendingList'); if(!box)return;
 const active=EDYStorage.get('pendings',[]).filter(p=>!p.done).slice(0,4);
 box.innerHTML=active.length?active.map(p=>`<div class="homeTask"><span>☐</span><span class="homeTaskText">${p.text}</span></div>`).join(''):'<div class="emptyTasks">No hay tareas pendientes. Tocá “Ver todas” para agregar una.</div>';
}
function addPending(){const t=pendingInput.value.trim();if(!t)return;const list=EDYStorage.get('pendings',[]);list.push({text:t,done:false});EDYStorage.set('pendings',list);pendingInput.value='';renderPendings();renderHomePendings()}
function togglePending(i){const list=EDYStorage.get('pendings',[]);list[i].done=!list[i].done;EDYStorage.set('pendings',list);renderPendings();renderHomePendings()}
function deletePending(i){const list=EDYStorage.get('pendings',[]);list.splice(i,1);EDYStorage.set('pendings',list);renderPendings();renderHomePendings()}
let manualsData=[];
const PRIVATE_LIBRARY_DB='edy-private-library';
const PRIVATE_LIBRARY_STORE='manuals';

function manualSearchText(manual){
 return normalizeText([manual.title,manual.category,manual.priority,manual.summary,...(manual.keywords||[]),...(manual.sections||[]).flatMap(section=>[section.title,...(section.items||[])])].join(' '));
}
function findManualMatches(query){
 const q=normalizeText(query||'');if(!q)return manualsData.slice();
 const words=q.split(/\s+/).filter(w=>w.length>=3&&!['como','para','ante','hacer','tengo','necesito','manual','guia'].includes(w));
 return manualsData.map(manual=>{
  const text=manualSearchText(manual);
  const score=(text.includes(q)?5:0)+words.reduce((sum,w)=>sum+(text.includes(w)?1:0),0)+(normalizeText(manual.title).includes(q)?4:0);
  return {manual,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.manual.title.localeCompare(b.manual.title,'es')).map(x=>x.manual);
}
async function loadManuals(){
 const box=document.getElementById('manualList');
 try{
  const r=await fetch('manuals.json?v=1.3.0');if(!r.ok)throw new Error('Biblioteca no disponible');
  manualsData=await r.json();
  const select=document.getElementById('manualCategory');
  if(select){
   const selected=select.value;
   const categories=[...new Set(manualsData.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
   select.innerHTML='<option value="">Todas las categorías</option>'+categories.map(cat=>`<option value="${escapeAttr(cat)}">${escapeHTML(cat)}</option>`).join('');
   select.value=categories.includes(selected)?selected:'';
  }
  renderManuals();renderPrivateManuals();
 }catch(e){if(box)box.innerHTML='<div class="panel">La biblioteca local no pudo cargarse. Recargá EDY una vez con conexión para almacenarla sin Internet.</div>'}
}
function renderManuals(){
 const box=document.getElementById('manualList');if(!box)return;
 const query=document.getElementById('manualSearch')?.value||'';
 const category=document.getElementById('manualCategory')?.value||'';
 const rows=findManualMatches(query).filter(m=>!category||m.category===category);
 const count=document.getElementById('manualCount');if(count)count.textContent=rows.length;
 box.innerHTML=rows.length?rows.map(m=>`<article class="manualCard" onclick="openManual('${escapeJS(m.id)}')">
  <div class="manualCardTop"><span class="manualIcon">${escapeHTML(m.icon||'📘')}</span><span class="manualPriority ${normalizeText(m.priority||'')}">${escapeHTML(m.priority||'Consulta')}</span></div>
  <h3>${escapeHTML(m.title)}</h3><p>${escapeHTML(m.summary||'')}</p>
  <div class="manualCardFoot"><span>${escapeHTML(m.category||'Biblioteca')}</span><strong>Abrir →</strong></div>
 </article>`).join(''):'<div class="panel">No se encontraron manuales con esos filtros.</div>';
}
function openManual(id){
 const m=manualsData.find(x=>x.id===id);if(!m)return;
 const sections=(m.sections||[]).map(section=>`<section class="manualSection"><h3>${escapeHTML(section.title)}</h3><ul>${(section.items||[]).map(item=>`<li>${escapeHTML(item)}</li>`).join('')}</ul></section>`).join('');
 const sources=(m.sources||[]).map(source=>`<a href="${escapeAttr(source.url)}" target="_blank" rel="noopener">${escapeHTML(source.name)} ↗</a>`).join('');
 document.getElementById('manualDetailContent').innerHTML=`<article class="manualDetailCard">
  <header><div class="manualDetailIcon">${escapeHTML(m.icon||'📘')}</div><div><span class="manualKicker">${escapeHTML(m.category||'Biblioteca')} · ${escapeHTML(m.priority||'Consulta')}</span><h2>${escapeHTML(m.title)}</h2><p>${escapeHTML(m.summary||'')}</p></div></header>
  <div class="manualOfflineNotice">✅ Este contenido está incluido en EDY y puede consultarse sin Internet.</div>
  ${sections}
  <div class="manualSources"><h3>Fuentes oficiales</h3><p>Los enlaces requieren conexión y se incluyen para verificar o ampliar la información.</p>${sources||'<span>Sin enlaces registrados.</span>'}</div>
  <div class="panel amber"><strong>Alcance:</strong> guía orientativa de preparación. Ante una emergencia real, seguí las indicaciones de las autoridades y servicios profesionales.</div>
 </article>`;
 openSection('manualDetail');
}
function openPrivateLibraryDB(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(PRIVATE_LIBRARY_DB,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(PRIVATE_LIBRARY_STORE))db.createObjectStore(PRIVATE_LIBRARY_STORE,{keyPath:'id'})};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function getPrivateManuals(){
 try{const db=await openPrivateLibraryDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(PRIVATE_LIBRARY_STORE,'readonly');const req=tx.objectStore(PRIVATE_LIBRARY_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}catch{return []}
}
async function importPrivateManual(event){
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 if(file.type!=='application/pdf'){alert('Seleccioná un archivo PDF.');return}
 if(file.size>40*1024*1024&&!confirm('El PDF supera 40 MB y ocupará bastante espacio local. ¿Guardarlo igualmente?'))return;
 try{
  const db=await openPrivateLibraryDB();
  const record={id:`private-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:file.name,size:file.size,added:new Date().toISOString(),blob:file};
  await new Promise((resolve,reject)=>{const tx=db.transaction(PRIVATE_LIBRARY_STORE,'readwrite');tx.objectStore(PRIVATE_LIBRARY_STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  addTimelineEntry('library','🔒',`PDF privado agregado: ${file.name}`);renderPrivateManuals();
 }catch(e){alert('No se pudo guardar el PDF en este dispositivo. Revisá el espacio disponible.')}
}
async function renderPrivateManuals(){
 const box=document.getElementById('privateManualList');if(!box)return;
 const rows=(await getPrivateManuals()).sort((a,b)=>String(b.added).localeCompare(String(a.added)));
 box.innerHTML=rows.length?`<div class="privateManualGrid">${rows.map(x=>`<div class="privateManualRow"><div><strong>📄 ${escapeHTML(x.name)}</strong><small>${(x.size/1024/1024).toFixed(1)} MB · guardado ${new Date(x.added).toLocaleDateString('es-AR')}</small></div><div><button class="miniAction" onclick="openPrivateManual('${escapeJS(x.id)}')">Abrir</button><button class="miniAction danger" onclick="deletePrivateManual('${escapeJS(x.id)}')">Eliminar</button></div></div>`).join('')}</div>`:'<div class="panel privateEmpty">No hay documentos privados importados.</div>';
}
async function openPrivateManual(id){
 const db=await openPrivateLibraryDB();const record=await new Promise((resolve,reject)=>{const tx=db.transaction(PRIVATE_LIBRARY_STORE,'readonly');const req=tx.objectStore(PRIVATE_LIBRARY_STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});if(!record?.blob)return;
 const url=URL.createObjectURL(record.blob);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function deletePrivateManual(id){
 if(!confirm('¿Eliminar este PDF privado del dispositivo?'))return;
 const db=await openPrivateLibraryDB();await new Promise((resolve,reject)=>{const tx=db.transaction(PRIVATE_LIBRARY_STORE,'readwrite');tx.objectStore(PRIVATE_LIBRARY_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});renderPrivateManuals();
}
const wc=EDYStorage.get('water_calc');if(wc){waterLiters.value=wc.liters;waterPeople.value=wc.people;waterPerPerson.value=wc.per}
['waterPeople','waterPerPerson'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderWaterInventory));
const ec=EDYStorage.get('energy_calc');if(ec){batteryWh.value=ec.wh;batteryPercent.value=ec.percent;loadWatts.value=ec.watts;efficiency.value=ec.eff}

let inventoryBase=[];
let currentItemId=null;
const INVENTORY_SEED_VERSION='1.3.0';

function statusText(status){
 return {available:'Disponible',incoming:'En camino',review:'Revisar',missing:'Falta'}[status]||status;
}
function cloneData(value){return JSON.parse(JSON.stringify(value))}
function numberOrNull(value){
 if(value===null||value===undefined||value==='')return null;
 const n=Number(value);return Number.isFinite(n)?n:null;
}
function roundStock(value){return Math.round((Number(value)||0)*1000)/1000}
function normalizeExpiry(value){
 const raw=String(value||'').trim();
 if(!raw)return '';
 if(/^\d{4}-\d{2}(-\d{2})?$/.test(raw))return raw;
 const slash=raw.match(/^(\d{1,2})\/(\d{4})$/);
 if(slash)return `${slash[2]}-${String(slash[1]).padStart(2,'0')}`;
 return raw;
}
function expiryTimestamp(value){
 const raw=normalizeExpiry(value);if(!raw)return Number.POSITIVE_INFINITY;
 let d;
 if(/^\d{4}-\d{2}$/.test(raw)){
  const [y,m]=raw.split('-').map(Number);d=new Date(y,m,0,23,59,59,999);
 }else if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
  const [y,m,day]=raw.split('-').map(Number);d=new Date(y,m-1,day,23,59,59,999);
 }else return Number.POSITIVE_INFINITY;
 return d.getTime();
}
function formatExpiry(value){
 const raw=normalizeExpiry(value);if(!raw)return 'Sin vencimiento';
 if(/^\d{4}-\d{2}$/.test(raw)){const [y,m]=raw.split('-');return `${m}/${y}`}
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){const [y,m,d]=raw.split('-');return `${d}/${m}/${y}`}
 return raw;
}
function daysUntilExpiry(value){
 const ts=expiryTimestamp(value);if(!Number.isFinite(ts))return null;
 const now=new Date();now.setHours(0,0,0,0);return Math.ceil((ts-now.getTime())/86400000);
}
function normalizeLot(lot,index,item){
 return {
  id:String(lot?.id||`${item.id||'item'}-lot-${index+1}-${Date.now()}`),
  lotNumber:String(lot?.lotNumber||'Sin registrar'),
  qty:Math.max(0,roundStock(lot?.qty)),
  purchaseDate:String(lot?.purchaseDate||item.purchaseDate||''),
  expiryDate:normalizeExpiry(lot?.expiryDate||item.expiryDate||''),
  notes:String(lot?.notes||'')
 };
}
function currentQuantity(item){
 if(Array.isArray(item?.lots))return roundStock(item.lots.reduce((sum,lot)=>sum+Math.max(0,Number(lot.qty)||0),0));
 return Math.max(0,roundStock(item?.qty));
}
function normalizeInventoryItem(item){
 const base={...item};
 base.id=String(base.id||`custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`);
 base.name=String(base.name||'Elemento sin nombre');
 base.brand=String(base.brand||base.model||'');
 base.model=String(base.model||'');
 base.category=String(base.category||'Otros');
 base.unit=String(base.unit||'unidad');
 base.notes=String(base.notes||'');
 base.location=String(base.location||'Sin registrar');
 base.critical=Boolean(base.critical);
 base.minStock=numberOrNull(base.minStock);
 base.targetStock=numberOrNull(base.targetStock);
 base.reviewDate=String(base.reviewDate||'');
 base.lastReviewDate=String(base.lastReviewDate||'');
 base.purchaseDate=String(base.purchaseDate||'');
 base.warrantyUntil=String(base.warrantyUntil||'');
 base.responsible=String(base.responsible||'');
 base.serial=String(base.serial||'');
 base.reviewIntervalDays=Number(base.reviewIntervalDays)||0;
 base.zone=base.zone||inferZoneForItem(base);
 base.movements=Array.isArray(base.movements)?base.movements:[];
 const oldQty=Math.max(0,roundStock(base.qty));
 if(Array.isArray(base.lots)&&base.lots.length){
  base.lots=base.lots.map((lot,index)=>normalizeLot(lot,index,base));
 }else if(oldQty>0){
  base.lots=[normalizeLot({id:`${base.id}-legacy-lot`,qty:oldQty,purchaseDate:base.purchaseDate,expiryDate:base.expiryDate||'',lotNumber:base.lotNumber||'Sin registrar',notes:'Stock existente migrado a lote.'},0,base)];
 }else base.lots=[];
 base.qty=currentQuantity(base);
 if(base.qty<=0&&base.status==='available')base.status='missing';
 if(!base.status)base.status=base.qty>0?'available':'missing';
 return base;
}
function getInventory(){
 const saved=EDYStorage.get('inventory',null);
 return Array.isArray(saved)?saved:inventoryBase;
}
function starterIdentity(item){return normalizeText(`${item.id||''}|${item.brand||''}|${item.name||''}`)}
function mergeStarterItems(saved,{force=false}={}){
 const normalizedSaved=(Array.isArray(saved)?saved:[]).map(normalizeInventoryItem);
 if(!force&&EDYStorage.get('inventory_seed_version','')===INVENTORY_SEED_VERSION)return normalizedSaved;
 const ids=new Set(normalizedSaved.map(x=>x.id));
 const names=new Set(normalizedSaved.map(starterIdentity));
 const merged=[...normalizedSaved];
 inventoryBase.map(normalizeInventoryItem).forEach(baseItem=>{
  if(!ids.has(baseItem.id)&&!names.has(starterIdentity(baseItem)))merged.push(cloneData(baseItem));
 });
 EDYStorage.set('inventory_seed_version',INVENTORY_SEED_VERSION);
 return merged;
}
function saveInventory(list,logMessage='Inventario actualizado'){
 const normalized=(Array.isArray(list)?list:[]).map(normalizeInventoryItem);
 EDYStorage.set('inventory',normalized);
 addTimelineEntry('inventory','📦',logMessage);
 renderInventory();
 renderOperationsHome();
 renderAssistantAlerts();
 renderAssistantHomeAlerts();
 renderMap();
 renderReadinessInsights();
 renderDiagnostic();
 renderTodayStrip();
 renderWaterInventory();
}
async function loadInventory(){
 try{
  const r=await fetch(`inventory.json?v=${INVENTORY_SEED_VERSION}`);
  if(!r.ok)throw new Error('Inventario base no disponible');
  inventoryBase=(await r.json()).map(normalizeInventoryItem);
  const saved=EDYStorage.get('inventory',null);
  const merged=mergeStarterItems(saved);
  EDYStorage.set('inventory',merged);
  renderInventory();renderAssistantAlerts();renderAssistantHomeAlerts();renderWaterInventory();
  return merged;
 }catch(e){
  const saved=EDYStorage.get('inventory',[]);
  if(Array.isArray(saved)&&saved.length){EDYStorage.set('inventory',saved.map(normalizeInventoryItem));renderInventory();renderWaterInventory();return getInventory()}
  const box=document.getElementById('inventoryCategories');
  if(box)box.innerHTML='<div class="panel">No se pudo cargar el inventario base. Revisá la conexión una vez y volvé a abrir EDY.</div>';
  return [];
 }
}
function restoreStarterInventory(){
 if(!inventoryBase.length){alert('El inventario base todavía no está disponible. Recargá EDY e intentá nuevamente.');return}
 if(!confirm('Se agregarán únicamente los productos iniciales que falten. No se borrará ningún dato local.'))return;
 const before=getInventory().length;
 const merged=mergeStarterItems(getInventory(),{force:true});
 EDYStorage.set('inventory',merged);
 const added=merged.length-before;
 addTimelineEntry('inventory','📦',`Inventario inicial restaurado: ${added} productos agregados`);
 renderInventory();renderOperationsHome();renderAssistantAlerts();renderWaterInventory();
 alert(added?`Se agregaron ${added} productos.`:'El inventario inicial ya estaba completo.');
}
function itemSearchText(item){
 const lots=(item.lots||[]).map(l=>`${l.lotNumber} ${l.expiryDate} ${l.notes}`).join(' ');
 return normalizeText([item.name,item.brand,item.model,item.category,item.notes,item.location,item.unit,lots].join(' '));
}
function nextExpiry(item){
 return (item.lots||[]).filter(l=>Number(l.qty)>0&&l.expiryDate).sort((a,b)=>expiryTimestamp(a.expiryDate)-expiryTimestamp(b.expiryDate))[0]?.expiryDate||'';
}
function itemExpiryState(item){
 const expiry=nextExpiry(item),days=daysUntilExpiry(expiry);
 if(days===null)return '';
 if(days<0)return 'expired';
 if(days<=180)return 'soon';
 return '';
}
function isLowStock(item){
 const min=numberOrNull(item.minStock);return min!==null&&currentQuantity(item)<=min;
}
function formatStockNumber(value){return new Intl.NumberFormat('es-AR',{maximumFractionDigits:3}).format(Number(value)||0)}
function unitLabel(unit,qty){
 const raw=String(unit||'unidad'),key=normalizeText(raw);if(Math.abs(Number(qty)||0)===1)return raw;
 return {unidad:'unidades',lata:'latas',barra:'barras',caja:'cajas',paquete:'paquetes',rollo:'rollos',frasco:'frascos',botella:'botellas'}[key]||raw;
}
function formatQuantity(item){const qty=currentQuantity(item);return `${formatStockNumber(qty)} ${escapeHTML(unitLabel(item.unit,qty))}`}
function stockBadges(item){
 const badges=[];const expiryState=itemExpiryState(item);
 if(item.critical)badges.push('<span class="criticalStar" title="Elemento crítico">⭐</span>');
 if(isLowStock(item))badges.push('<span class="stockTag low">Stock bajo</span>');
 if(expiryState==='expired')badges.push('<span class="stockTag expired">Vencido</span>');
 else if(expiryState==='soon')badges.push('<span class="stockTag expiring">Vence pronto</span>');
 if(reviewStatus(item)==='due')badges.push('<span class="reviewTag">Revisión vencida</span>');
 else if(reviewStatus(item)==='soon')badges.push('<span class="reviewTag">Revisar pronto</span>');
 return badges.join('');
}
function renderInventory(){
 const box=document.getElementById('inventoryCategories');if(!box)return;
 const q=normalizeText(document.getElementById('inventorySearch')?.value||'');
 const all=getInventory().map(normalizeInventoryItem);
 const filtered=all.filter(i=>itemSearchText(i).includes(q));
 const counts={available:0,incoming:0,missing:0,critical:0,expiring:0};
 all.forEach(i=>{if(counts[i.status]!==undefined)counts[i.status]++;if(i.critical)counts.critical++;if(['soon','expired'].includes(itemExpiryState(i)))counts.expiring++});
 const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
 put('invTotal',all.length);put('invAvailable',counts.available);put('invIncoming',counts.incoming);put('invMissing',counts.missing);put('invCritical',counts.critical);put('invExpiring',counts.expiring);
 const preferred=['Despensa','Agua','Energía','Higiene','Botiquín','Comunicaciones','Herramientas','Mochilas','Mascotas','Vehículos','Documentación','Alimentos','Otros'];
 const extra=[...new Set(filtered.map(i=>i.category))].filter(cat=>!preferred.includes(cat));
 const categories=[...preferred,...extra];
 box.innerHTML=categories.map(cat=>{
  const items=filtered.filter(i=>i.category===cat).sort((a,b)=>Number(Boolean(b.critical))-Number(Boolean(a.critical))||expiryTimestamp(nextExpiry(a))-expiryTimestamp(nextExpiry(b))||a.name.localeCompare(b.name,'es'));
  if(!items.length)return '';
  return `<div class="categoryBlock"><div class="categoryTitle"><h3>${categoryIcon(cat)} ${escapeHTML(cat)}</h3><span class="categoryCount">${items.length} productos</span></div><div class="inventoryList">${items.map(i=>{
   const expiry=nextExpiry(i);const brand=i.brand||i.model||'';
   return `<div class="inventoryItem withThumb" onclick="openItem('${escapeJS(i.id)}')"><span class="statusMark ${escapeAttr(i.status)}"></span><div class="itemThumbnail" data-photo-item="${escapeAttr(i.id)}"><span>${categoryIcon(i.category)}</span></div><div class="itemMain"><div class="itemFlags">${stockBadges(i)}</div><strong>${escapeHTML(i.name)}</strong><div class="itemMeta">${brand?`${escapeHTML(brand)} · `:''}${formatQuantity(i)}${expiry?` · Vence ${formatExpiry(expiry)}`:''}</div></div><span class="statusLabel ${escapeAttr(i.status)}">${statusText(i.status)}</span></div>`;
  }).join('')}</div></div>`;
 }).join('')||'<div class="panel">No se encontraron productos.</div>';
 refreshInventoryThumbnails();
}
function categoryIcon(cat){
 return {'Despensa':'🍚','Energía':'⚡','Agua':'💧','Higiene':'🧼','Comunicaciones':'📡','Herramientas':'🛠️','Botiquín':'🩺','Alimentos':'🍲','Mochilas':'🎒','Mascotas':'🐶','Vehículos':'🚗','Documentación':'📄','Otros':'📦'}[cat]||'📦';
}
function stockTargetText(item){
 const min=numberOrNull(item.minStock),target=numberOrNull(item.targetStock);
 if(min===null&&target===null)return 'Sin objetivos definidos';
 return `${min===null?'Mínimo sin definir':`Mínimo ${formatStockNumber(min)} ${unitLabel(item.unit,min)}`} · ${target===null?'Objetivo sin definir':`Objetivo ${formatStockNumber(target)} ${unitLabel(item.unit,target)}`}`;
}
function quickConsumeButtons(item){
 const unit=normalizeText(item.unit||'');
 let options;
 if(unit==='kg'||unit==='kilogramo'||unit==='kilogramos')options=[[.25,'−250 g'],[.5,'−500 g'],[1,'−1 kg']];
 else if(unit==='g'||unit==='gramo'||unit==='gramos')options=[[250,'−250 g'],[500,'−500 g'],[1000,'−1 kg']];
 else if(unit==='l'||unit==='litro'||unit==='litros')options=[[.5,'−500 ml'],[1,'−1 litro']];
 else options=[[1,`−1 ${item.unit||'unidad'}`]];
 return options.map(([amount,label])=>`<button class="miniAction consumeQuick" onclick="consumeStock('${escapeJS(item.id)}',${amount})">${label}</button>`).join('');
}
function renderLots(item){
 const lots=(item.lots||[]).slice().sort((a,b)=>expiryTimestamp(a.expiryDate)-expiryTimestamp(b.expiryDate));
 if(!lots.length)return '<div class="panel">No hay lotes cargados.</div>';
 return `<div class="lotList">${lots.map(l=>{const days=daysUntilExpiry(l.expiryDate);const state=days!==null&&days<0?'expired':days!==null&&days<=180?'soon':'';return `<div class="lotRow ${state}"><div><strong>Lote ${escapeHTML(l.lotNumber||'Sin registrar')}</strong><small>${l.purchaseDate?`Compra: ${formatExpiry(l.purchaseDate)} · `:''}${l.expiryDate?`Vence: ${formatExpiry(l.expiryDate)}`:'Sin vencimiento'}${l.notes?` · ${escapeHTML(l.notes)}`:''}</small></div><span>${formatStockNumber(l.qty)} ${escapeHTML(unitLabel(item.unit,l.qty))}</span></div>`}).join('')}</div>`;
}
function movementLabel(type){return {initial:'Inventario inicial',purchase:'Compra / ingreso',consume:'Consumo',adjustment:'Ajuste'}[type]||'Movimiento'}
function renderMovements(item){
 const rows=(item.movements||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,10);
 if(!rows.length)return '<div class="panel">Todavía no hay movimientos.</div>';
 return `<div class="movementList">${rows.map(m=>`<div class="movementRow"><div><strong>${escapeHTML(movementLabel(m.type))}</strong><small>${m.date?new Date(m.date).toLocaleString('es-AR'):'Sin fecha'}${m.note?` · ${escapeHTML(m.note)}`:''}</small></div><span class="${Number(m.qty)<0?'negative':'positive'}">${Number(m.qty)>0?'+':''}${formatStockNumber(m.qty)} ${escapeHTML(unitLabel(item.unit,Math.abs(Number(m.qty)||0)))}</span></div>`).join('')}</div>`;
}
async function openItem(id){
 currentItemId=id;
 const item=getInventory().find(x=>x.id===id);if(!item)return;
 const i=normalizeInventoryItem(item),expiry=nextExpiry(i),qty=currentQuantity(i);
 document.getElementById('itemDetailContent').innerHTML=`<div class="detailCard"><div class="itemHero"><div><div id="itemPhotoPreview" class="itemPhotoBox"><div class="itemPhotoEmpty"><span>📷</span>Sin fotografía</div></div><div class="photoActions"><label>Agregar foto<input type="file" accept="image/*" capture="environment" onchange="handleItemPhoto(event)"></label><button onclick="deleteItemPhoto()">Quitar foto</button></div></div><div class="itemIdentity"><div class="small">${categoryIcon(i.category)} ${escapeHTML(i.category)}</div><h2>${i.critical?'⭐ ':''}${escapeHTML(i.name)}</h2><span class="itemCode">${escapeHTML(itemPublicCode(i))}</span><p class="stockHeroValue">${formatStockNumber(qty)} ${escapeHTML(unitLabel(i.unit,qty))}</p><p class="small">${escapeHTML(i.brand||i.model||'Marca sin registrar')}${expiry?` · Próximo vencimiento ${formatExpiry(expiry)}`:' · Sin vencimiento'}</p><p class="small">${escapeHTML(stockTargetText(i))}</p><span class="statusLabel ${escapeAttr(i.status)}">${statusText(i.status)}</span><div class="reviewNowBox"><div><strong>Revisión rápida</strong><p>Marca el control de hoy y calcula la próxima fecha.</p></div><button class="miniAction" onclick="markReviewedToday()">Revisado hoy</button></div></div></div>
 <div class="stockActionGrid"><div class="stockActionCard"><h3>➕ Agregar compra o lote</h3><div class="stockForm"><label>Cantidad<input id="addStockAmount" type="number" min="0" step="any" placeholder="Ej.: 5"></label><label>Número de lote<input id="addStockLot" placeholder="Opcional"></label><label>Fecha de compra<input id="addStockPurchase" type="date"></label><label>Vencimiento<input id="addStockExpiry" inputmode="numeric" placeholder="AAAA-MM-DD o AAAA-MM"></label><label class="wide">Nota<input id="addStockNote" placeholder="Ej.: 2 paquetes de 500 g"></label></div><button class="action" onclick="addStockFromForm()">Agregar al stock</button></div>
 <div class="stockActionCard consumeCard"><h3>➖ Consumir stock</h3><p class="small">EDY descuenta primero el lote que vence antes (FIFO).</p><div class="quickConsume">${quickConsumeButtons(i)}</div><div class="inline"><input id="consumeStockAmount" type="number" min="0" step="any" placeholder="Cantidad personalizada"><button class="action secondary" onclick="consumeCustomFromForm()">Consumir</button></div></div></div>
 <div class="titleRow"><h3>Lotes y vencimientos</h3><span class="categoryCount">${(i.lots||[]).length} lotes</span></div>${renderLots(i)}
 <div class="titleRow"><h3>Datos del producto</h3></div><div class="detailGrid"><div class="detailField"><span>Estado</span><select id="editStatus" class="editSelect"><option value="available" ${i.status==='available'?'selected':''}>Disponible</option><option value="incoming" ${i.status==='incoming'?'selected':''}>En camino</option><option value="review" ${i.status==='review'?'selected':''}>Revisar</option><option value="missing" ${i.status==='missing'?'selected':''}>Falta</option></select></div><div class="detailField"><span>Unidad</span><input id="editUnit" class="editInput" value="${escapeAttr(i.unit)}"></div><div class="detailField"><span>Stock mínimo</span><input id="editMinStock" class="editInput" type="number" min="0" step="any" value="${i.minStock??''}" placeholder="Sin definir"></div><div class="detailField"><span>Stock objetivo</span><input id="editTargetStock" class="editInput" type="number" min="0" step="any" value="${i.targetStock??''}" placeholder="Sin definir"></div><div class="detailField"><span>Zona</span><select id="editZone" class="editSelect">${zoneOptions(i.zone)}</select></div><div class="detailField"><span>Ubicación exacta</span><input id="editLocation" class="editInput" value="${escapeAttr(i.location||'')}" placeholder="Se guarda solo en este dispositivo"></div><div class="detailField"><span>Marca</span><input id="editBrand" class="editInput" value="${escapeAttr(i.brand||'')}"></div><div class="detailField"><span>Modelo / presentación</span><input id="editModel" class="editInput" value="${escapeAttr(i.model||'')}"></div><div class="detailField"><span>Número de serie</span><input id="editSerial" class="editInput" value="${escapeAttr(i.serial||'')}" placeholder="Solo local"></div><div class="detailField"><span>Última revisión</span><input id="editLastReviewDate" class="editInput" type="date" value="${escapeAttr(i.lastReviewDate||'')}"></div><div class="detailField"><span>Próxima revisión</span><input id="editReviewDate" class="editInput" type="date" value="${escapeAttr(i.reviewDate||'')}"></div><div class="detailField"><span>Frecuencia de revisión</span><select id="editReviewInterval" class="editSelect">${reviewIntervalOptions(i.reviewIntervalDays)}</select></div><div class="detailField"><span>Garantía hasta</span><input id="editWarrantyUntil" class="editInput" type="date" value="${escapeAttr(i.warrantyUntil||'')}"></div><div class="detailField"><span>Responsable</span><input id="editResponsible" class="editInput" value="${escapeAttr(i.responsible||'')}" placeholder="Responsable familiar"></div><div class="detailField checkField"><label><input id="editCritical" type="checkbox" ${i.critical?'checked':''}> Elemento crítico</label></div></div><div class="detailNotes"><strong>Observaciones</strong><textarea id="editNotes" class="editInput">${escapeHTML(i.notes||'')}</textarea></div><div class="actions"><button class="action" onclick="saveCurrentItem()">Guardar cambios</button><button class="action secondary" onclick="deleteCurrentItem()">Eliminar</button></div>
 <div class="titleRow"><h3>Historial de movimientos</h3></div>${renderMovements(i)}</div>`;
 openSection('itemDetail');await renderItemPhoto(id);
}
function addMovement(item,type,qty,note=''){
 item.movements=Array.isArray(item.movements)?item.movements:[];
 item.movements.push({id:`move-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,type,qty:roundStock(qty),date:new Date().toISOString(),note});
}
function addStockFromForm(){
 const amount=Number(document.getElementById('addStockAmount')?.value);if(!Number.isFinite(amount)||amount<=0){alert('Ingresá una cantidad mayor que cero.');return}
 const expiry=normalizeExpiry(document.getElementById('addStockExpiry')?.value||'');
 if(expiry&&!/^\d{4}-\d{2}(-\d{2})?$/.test(expiry)){alert('Usá el formato AAAA-MM-DD o AAAA-MM para el vencimiento.');return}
 const list=getInventory().map(normalizeInventoryItem),item=list.find(x=>x.id===currentItemId);if(!item)return;
 const lot={id:`${item.id}-lot-${Date.now()}`,lotNumber:document.getElementById('addStockLot')?.value.trim()||'Sin registrar',qty:roundStock(amount),purchaseDate:document.getElementById('addStockPurchase')?.value||todayISO(),expiryDate:expiry,notes:document.getElementById('addStockNote')?.value.trim()||''};
 item.lots.push(lot);item.qty=currentQuantity(item);item.status='available';addMovement(item,'purchase',amount,lot.notes||`Lote ${lot.lotNumber}`);
 saveInventory(list,`Stock agregado: ${item.name} (+${formatStockNumber(amount)} ${item.unit})`);openItem(item.id);
}
function consumeCustomFromForm(){
 const amount=Number(document.getElementById('consumeStockAmount')?.value);if(!Number.isFinite(amount)||amount<=0){alert('Ingresá una cantidad mayor que cero.');return}consumeStock(currentItemId,amount);
}
function consumeStock(itemId,amount){
 const list=getInventory().map(normalizeInventoryItem),item=list.find(x=>x.id===itemId);if(!item)return;
 const available=currentQuantity(item);amount=roundStock(amount);
 if(amount<=0)return;if(amount>available){alert(`No alcanza el stock. Disponible: ${formatStockNumber(available)} ${unitLabel(item.unit,available)}.`);return}
 if(!confirm(`¿Consumir ${formatStockNumber(amount)} ${unitLabel(item.unit,amount)} de ${item.name}?`))return;
 let remaining=amount;
 const lots=item.lots.slice().sort((a,b)=>expiryTimestamp(a.expiryDate)-expiryTimestamp(b.expiryDate)||String(a.purchaseDate).localeCompare(String(b.purchaseDate)));
 for(const lot of lots){if(remaining<=0)break;const take=Math.min(Number(lot.qty)||0,remaining);lot.qty=roundStock((Number(lot.qty)||0)-take);remaining=roundStock(remaining-take)}
 item.qty=currentQuantity(item);item.status=item.qty>0?'available':'missing';addMovement(item,'consume',-amount,'Consumo FIFO');
 saveInventory(list,`Consumo: ${item.name} (−${formatStockNumber(amount)} ${item.unit})`);openItem(item.id);
}
function saveCurrentItem(){
 const list=getInventory().map(normalizeInventoryItem),i=list.find(x=>x.id===currentItemId);if(!i)return;
 i.status=document.getElementById('editStatus').value;i.unit=document.getElementById('editUnit').value.trim()||'unidad';i.minStock=numberOrNull(document.getElementById('editMinStock').value);i.targetStock=numberOrNull(document.getElementById('editTargetStock').value);i.zone=document.getElementById('editZone').value||'';i.location=document.getElementById('editLocation').value.trim()||'Sin registrar';i.brand=document.getElementById('editBrand').value.trim();i.model=document.getElementById('editModel').value.trim();i.serial=document.getElementById('editSerial').value.trim();i.lastReviewDate=document.getElementById('editLastReviewDate').value||'';i.reviewDate=document.getElementById('editReviewDate').value||'';i.warrantyUntil=document.getElementById('editWarrantyUntil').value||'';i.responsible=document.getElementById('editResponsible').value.trim();i.reviewIntervalDays=Number(document.getElementById('editReviewInterval').value)||0;i.critical=document.getElementById('editCritical').checked;i.notes=document.getElementById('editNotes').value.trim();i.qty=currentQuantity(i);
 saveInventory(list,`Actualizado: ${i.name}`);openSection('inventario');
}
async function deleteCurrentItem(){
 if(!confirm('¿Eliminar este producto del inventario local?'))return;await EDYMedia.deletePhoto(currentItemId);saveInventory(getInventory().filter(x=>x.id!==currentItemId),'Producto eliminado del inventario');openSection('inventario');
}
function addInventoryItem(){
 const name=document.getElementById('newItemName').value.trim();if(!name){alert('Ingresá un nombre.');return}
 const qty=Math.max(0,Number(document.getElementById('newItemQty').value)||0),expiry=normalizeExpiry(document.getElementById('newItemExpiryDate')?.value||'');
 if(expiry&&!/^\d{4}-\d{2}(-\d{2})?$/.test(expiry)){alert('Usá el formato AAAA-MM-DD o AAAA-MM para el vencimiento.');return}
 const id=`custom-${Date.now()}`;
 const item=normalizeInventoryItem({id,name,brand:document.getElementById('newItemBrand')?.value.trim()||'',model:document.getElementById('newItemModel').value.trim(),category:document.getElementById('newItemCategory').value,status:document.getElementById('newItemStatus').value,qty,unit:document.getElementById('newItemUnit').value.trim()||'unidad',zone:document.getElementById('newItemZone').value||'',location:document.getElementById('newItemLocation').value.trim()||'Sin registrar',serial:document.getElementById('newItemSerial').value.trim(),purchaseDate:document.getElementById('newItemPurchaseDate').value||'',lastReviewDate:document.getElementById('newItemLastReviewDate').value||'',reviewDate:document.getElementById('newItemReviewDate').value||'',warrantyUntil:document.getElementById('newItemWarrantyUntil').value||'',responsible:document.getElementById('newItemResponsible').value.trim(),reviewIntervalDays:Number(document.getElementById('newItemReviewInterval').value)||0,critical:document.getElementById('newItemCritical').checked,minStock:numberOrNull(document.getElementById('newItemMinStock')?.value),targetStock:numberOrNull(document.getElementById('newItemTargetStock')?.value),notes:document.getElementById('newItemNotes').value.trim(),lots:qty>0?[{id:`${id}-lot-1`,lotNumber:document.getElementById('newItemLotNumber')?.value.trim()||'Sin registrar',qty,purchaseDate:document.getElementById('newItemPurchaseDate').value||'',expiryDate:expiry,notes:'Stock inicial'}]:[],movements:qty>0?[{id:`${id}-initial`,type:'initial',qty,date:new Date().toISOString(),note:'Stock inicial'}]:[]});
 const list=getInventory();list.push(item);saveInventory(list,`Agregado: ${item.name}`);
 ['newItemName','newItemBrand','newItemModel','newItemSerial','newItemLocation','newItemNotes','newItemPurchaseDate','newItemExpiryDate','newItemLotNumber','newItemMinStock','newItemTargetStock','newItemLastReviewDate','newItemReviewDate','newItemWarrantyUntil','newItemResponsible'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
 document.getElementById('newItemCritical').checked=false;document.getElementById('newItemQty').value=1;openSection('inventario');
}

function itemPublicCode(item){
 const raw=String(item.id||'ITEM').replace(/[^a-zA-Z0-9]/g,'').slice(-8).toUpperCase();
 return `EDY-${raw||'ITEM'}`;
}
function reviewIntervalOptions(value=0){
 const options=[[0,'Sin frecuencia'],[30,'Cada 30 días'],[90,'Cada 90 días'],[180,'Cada 6 meses'],[365,'Cada año']];
 return options.map(([v,t])=>`<option value="${v}" ${Number(value)===v?'selected':''}>${t}</option>`).join('');
}
async function compressImage(file,maxSize=900,quality=.76){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onerror=()=>reject(reader.error);reader.onload=()=>{
   const img=new Image();img.onerror=()=>reject(new Error('Imagen inválida'));img.onload=()=>{
    let w=img.width,h=img.height;const scale=Math.min(1,maxSize/Math.max(w,h));w=Math.round(w*scale);h=Math.round(h*scale);
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);
    resolve(canvas.toDataURL('image/jpeg',quality));
   };img.src=reader.result;
  };reader.readAsDataURL(file);
 });
}
async function handleItemPhoto(event){
 const file=event.target.files?.[0];if(!file||!currentItemId)return;
 if(!file.type.startsWith('image/')){alert('Seleccioná una imagen.');return}
 try{const data=await compressImage(file);await EDYMedia.putPhoto(currentItemId,data);await renderItemPhoto(currentItemId);refreshInventoryThumbnails();addTimelineEntry('inventory','📷','Fotografía actualizada');}catch{alert('No se pudo guardar la fotografía.')}event.target.value='';
}
async function renderItemPhoto(id){const box=document.getElementById('itemPhotoPreview');if(!box)return;const data=await EDYMedia.getPhoto(id);box.innerHTML=data?`<img src="${data}" alt="Fotografía local del elemento">`:'<div class="itemPhotoEmpty"><span>📷</span>Sin fotografía</div>'}
async function deleteItemPhoto(){if(!currentItemId)return;if(!confirm('¿Quitar la fotografía local?'))return;await EDYMedia.deletePhoto(currentItemId);await renderItemPhoto(currentItemId);refreshInventoryThumbnails();addTimelineEntry('inventory','📷','Fotografía eliminada')}
async function refreshInventoryThumbnails(){for(const el of document.querySelectorAll('[data-photo-item]')){const id=el.dataset.photoItem,data=await EDYMedia.getPhoto(id);if(data)el.innerHTML=`<img src="${data}" alt="">`}}
function dateISOFromNow(days){const d=new Date();d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}
function todayISO(){return new Date().toISOString().slice(0,10)}
function markReviewedToday(){
 const list=getInventory(),i=list.find(x=>x.id===currentItemId);if(!i)return;
 const interval=Number(document.getElementById('editReviewInterval')?.value||i.reviewIntervalDays||0);
 i.lastReviewDate=todayISO();i.reviewIntervalDays=interval;i.reviewDate=interval?dateISOFromNow(interval):'';i.status='available';
 saveInventory(list,`Revisión completada: ${i.name}`);openItem(i.id);
}

let checklistBase=[];
let currentChecklistId=null;
function getChecklists(){return EDYStorage.get('checklists',checklistBase)}
function saveChecklists(list,log=''){EDYStorage.set('checklists',list);if(log)addTimelineEntry('checklist','✅',log);renderChecklists();renderHomeChecklistProgress();renderReadinessInsights();renderDiagnostic()}
async function loadChecklists(){
 try{const r=await fetch('checklists.json');checklistBase=await r.json();const saved=EDYStorage.get('checklists',null);if(!saved){EDYStorage.set('checklists',checklistBase)}else{const ids=new Set(saved.map(c=>c.id));const merged=[...saved,...checklistBase.filter(c=>!ids.has(c.id))];EDYStorage.set('checklists',merged)}return getChecklists()}catch{checklistBase=[];return []}
}
function checklistProgress(c){const total=c.items?.length||0,done=(c.items||[]).filter(x=>x.done).length;return {total,done,pct:total?Math.round(done/total*100):0}}
function renderChecklists(){
 const box=document.getElementById('checklistCards');if(!box)return;const list=getChecklists();const progress=list.map(c=>checklistProgress(c));
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('checklistTotal',list.length);set('checklistActive',progress.filter(p=>p.done>0&&p.pct<100).length);set('checklistCompleted',progress.filter(p=>p.pct===100&&p.total).length);set('checklistAvg',list.length?Math.round(progress.reduce((s,p)=>s+p.pct,0)/list.length)+'%':'0%');
 box.innerHTML=list.length?list.map(c=>{const p=checklistProgress(c);return `<div class="checklistCard" onclick="openChecklist('${escapeJS(c.id)}')"><div class="checklistCardTop"><div class="checklistCardIcon">${escapeHTML(c.icon||'✅')}</div><span class="categoryCount">${p.pct}%</span></div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.description||'')}</p><div class="progressTrack"><div class="progressFill" style="width:${p.pct}%"></div></div><div class="checklistMeta"><span>${p.done}/${p.total} pasos</span><span>${p.pct===100?'Completada':p.done?'En progreso':'Sin iniciar'}</span></div></div>`}).join(''):'<div class="panel">No hay checklists.</div>';
}
function openChecklist(id){
 currentChecklistId=id;const c=getChecklists().find(x=>x.id===id);if(!c)return;const p=checklistProgress(c);
 const actions=`<div class="zoneActions"><button class="action secondary" onclick="resetChecklist('${escapeJS(id)}')">Reiniciar</button>${c.custom?`<button class="action secondary" onclick="deleteChecklist('${escapeJS(id)}')">Eliminar</button>`:''}</div>`;
 document.getElementById('checklistDetailContent').innerHTML=`<div class="checklistDetailHeader"><div class="checklistDetailTitle"><span>${escapeHTML(c.icon||'✅')}</span><div><h2>${escapeHTML(c.title)}</h2><p>${escapeHTML(c.description||'')}</p></div></div>${actions}</div><div class="checklistProgressHero"><div class="miniScoreRing" style="--score:${p.pct}"><span>${p.pct}%</span></div><div><strong>${p.done} de ${p.total}</strong><p class="small">${p.pct===100?'Lista completada.':'Marcá cada paso a medida que avanzás.'}</p></div></div><div class="checklistItems">${(c.items||[]).map((x,index)=>`<label class="checklistItem ${x.done?'done':''}"><input type="checkbox" ${x.done?'checked':''} onchange="toggleChecklistItem('${escapeJS(id)}',${index},this.checked)"><span class="checklistText">${escapeHTML(x.text)}</span>${c.custom?`<button type="button" onclick="event.preventDefault();event.stopPropagation();removeChecklistItem('${escapeJS(id)}',${index})">✕</button>`:'<span></span>'}</label>`).join('')}</div><div class="addChecklistItem"><input id="addChecklistItemText" placeholder="Agregar otro paso"><button class="action" onclick="addChecklistItem('${escapeJS(id)}')">Agregar</button></div>`;
 openSection('checklistDetail');
}
function toggleChecklistItem(id,index,value){const list=getChecklists(),c=list.find(x=>x.id===id);if(!c||!c.items[index])return;c.items[index].done=value;const p=checklistProgress(c);if(p.pct===100)addTimelineEntry('checklist','🏁',`Checklist completada: ${c.title}`);EDYStorage.set('checklists',list);openChecklist(id);renderHomeChecklistProgress();renderReadinessInsights()}
function resetChecklist(id){if(!confirm('¿Reiniciar todos los pasos de esta lista?'))return;const list=getChecklists(),c=list.find(x=>x.id===id);if(!c)return;c.items.forEach(x=>x.done=false);saveChecklists(list,`Checklist reiniciada: ${c.title}`);openChecklist(id)}
function createChecklist(){const title=document.getElementById('newChecklistTitle').value.trim();if(!title){alert('Ingresá un nombre.');return}const lines=document.getElementById('newChecklistItems').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!lines.length){alert('Agregá al menos un paso.');return}const c={id:'check-'+Date.now(),title,icon:document.getElementById('newChecklistIcon').value.trim()||'✅',description:document.getElementById('newChecklistDescription').value.trim(),custom:true,crisisType:'',items:lines.map((text,i)=>({id:'item-'+Date.now()+'-'+i,text,done:false}))};const list=getChecklists();list.push(c);saveChecklists(list,`Checklist creada: ${title}`);['newChecklistTitle','newChecklistDescription','newChecklistItems'].forEach(id=>document.getElementById(id).value='');document.getElementById('newChecklistIcon').value='✅';openChecklist(c.id)}
function deleteChecklist(id){const c=getChecklists().find(x=>x.id===id);if(!c?.custom||!confirm(`¿Eliminar la checklist "${c.title}"?`))return;saveChecklists(getChecklists().filter(x=>x.id!==id),`Checklist eliminada: ${c.title}`);openSection('checklists')}
function addChecklistItem(id){const input=document.getElementById('addChecklistItemText'),text=input?.value.trim();if(!text)return;const list=getChecklists(),c=list.find(x=>x.id===id);if(!c)return;c.items.push({id:'item-'+Date.now(),text,done:false});EDYStorage.set('checklists',list);openChecklist(id)}
function removeChecklistItem(id,index){const list=getChecklists(),c=list.find(x=>x.id===id);if(!c?.custom)return;c.items.splice(index,1);EDYStorage.set('checklists',list);openChecklist(id)}
function renderHomeChecklistProgress(){const box=document.getElementById('homeChecklistProgress');if(!box)return;const list=getChecklists().map(c=>({c,p:checklistProgress(c)})).sort((a,b)=>b.p.done-a.p.done||a.p.pct-b.p.pct).slice(0,3);box.innerHTML=list.length?list.map(({c,p})=>`<div class="homeChecklistRow" onclick="openChecklist('${escapeJS(c.id)}')"><div><strong>${escapeHTML(c.icon)} ${escapeHTML(c.title)}</strong><small>${p.done}/${p.total} pasos</small></div><span>${p.pct}%</span></div>`).join(''):'<div class="small">No hay listas configuradas.</div>'}
function computeIntegratedReadiness(){
 const inv=getInventory(),o=EDYStorage.get('operations',{}),lists=getChecklists();let parts=[];
 if(o.updated)parts.push(scoreOperations(o));
 if(inv.length){const good=inv.filter(i=>i.status==='available').length;parts.push(Math.round(good/inv.length*100));const located=inv.filter(i=>i.zone&&zoneById(i.zone)).length;parts.push(Math.round(located/inv.length*100));const critical=inv.filter(i=>i.critical);if(critical.length)parts.push(Math.round(critical.filter(i=>i.status==='available').length/critical.length*100))}
 const dated=inv.filter(i=>i.reviewDate);if(dated.length)parts.push(Math.round(dated.filter(i=>daysUntil(i.reviewDate)>=0).length/dated.length*100));
 if(lists.length)parts.push(Math.round(lists.reduce((s,c)=>s+checklistProgress(c).pct,0)/lists.length));
 return parts.length?Math.round(parts.reduce((a,b)=>a+b,0)/parts.length):0;
}
function buildReadinessInsights(){
 const inv=getInventory(),o=EDYStorage.get('operations',{}),out=[];const critical=inv.filter(i=>i.critical&&i.status!=='available');const overdue=inv.filter(i=>daysUntil(i.reviewDate)!==null&&daysUntil(i.reviewDate)<0);const unlocated=inv.filter(i=>!i.zone||!zoneById(i.zone));
 if(critical.length)out.push({level:'critical',icon:'⭐',title:`${critical.length} elemento${critical.length===1?'':'s'} crítico${critical.length===1?'':'s'} requiere${critical.length===1?'':'n'} atención`,detail:'Revisá faltantes, equipos en camino o marcados para control.',action:"openCriticalInventory()"});
 if(overdue.length)out.push({level:'attention',icon:'🔧',title:`${overdue.length} revisión${overdue.length===1?' vencida':'es vencidas'}`,detail:'Actualizá el mantenimiento para mantener la preparación real.',action:"openSection('mantenimiento')"});
 if(unlocated.length)out.push({level:'attention',icon:'🗺️',title:`${unlocated.length} elemento${unlocated.length===1?' sin zona':'s sin zona'}`,detail:'Asignar ubicaciones reduce el tiempo de búsqueda en una emergencia.',action:"openZone('__unlocated__')"});
 if(!o.updated)out.push({level:'attention',icon:'🧭',title:'Centro de Operaciones sin configurar',detail:'Cargá agua, personas, alimentos y energía para calcular autonomía.',action:"openSection('operaciones')"});
 const last=EDYStorage.get('last_backup','Nunca');if(last==='Nunca')out.push({level:'attention',icon:'💾',title:'Todavía no hay un respaldo',detail:'Exportá una copia antes de cargar más información privada.',action:"openSection('respaldo')"});
 if(!out.length)out.push({level:'good',icon:'✅',title:'No se detectaron puntos críticos',detail:'Mantené las revisiones y actualizá el inventario cuando haya cambios.',action:"openSection('mantenimiento')"});
 return out;
}
function renderReadinessInsights(){const box=document.getElementById('readinessInsights');if(!box)return;const insights=buildReadinessInsights().slice(0,4);box.innerHTML=insights.map(x=>`<div class="insightCard ${x.level}" onclick="${x.action}"><div class="insightIcon">${x.icon}</div><div><strong>${escapeHTML(x.title)}</strong><small>${escapeHTML(x.detail)}</small></div><span>›</span></div>`).join('');const score=computeIntegratedReadiness(),ring=document.getElementById('integratedScoreRing');if(ring)ring.style.setProperty('--score',score);const el=document.getElementById('integratedScore');if(el)el.textContent=score+'%';const text=document.getElementById('integratedScoreText');if(text)text.textContent=score>=80?'Preparación sólida. Mantené revisiones y respaldos.':score>=50?'Base intermedia. EDY detectó aspectos por completar.':'Faltan datos o elementos esenciales por organizar.'}
function renderDiagnostic(){const score=computeIntegratedReadiness(),ring=document.getElementById('diagnosticRing'),el=document.getElementById('diagnosticScore'),title=document.getElementById('diagnosticTitle'),text=document.getElementById('diagnosticText'),box=document.getElementById('diagnosticList');if(!ring||!box)return;ring.style.setProperty('--score',score);el.textContent=score+'%';title.textContent=score>=80?'Preparación sólida':score>=50?'Preparación intermedia':'Preparación inicial';text.textContent='El puntaje combina autonomía, inventario, ubicaciones, mantenimiento y checklists.';box.innerHTML=buildReadinessInsights().map(x=>`<div class="insightCard ${x.level}" onclick="${x.action}"><div class="insightIcon">${x.icon}</div><div><strong>${escapeHTML(x.title)}</strong><small>${escapeHTML(x.detail)}</small></div><span>›</span></div>`).join('')}

function addTimelineEntry(type,icon,title,detail=''){
 const list=EDYStorage.get('timeline',[]);
 list.unshift({id:Date.now(),type,icon,title,detail,date:new Date().toLocaleString('es-AR'),iso:new Date().toISOString()});
 EDYStorage.set('timeline',list.slice(0,300));
 renderTodayStrip();
}
function renderTimeline(){
 const box=document.getElementById('timelineList');if(!box)return;
 const q=normalizeText(document.getElementById('timelineSearch')?.value||'');
 const list=EDYStorage.get('timeline',[]).filter(e=>!q||normalizeText([e.title,e.detail,e.type,e.date].join(' ')).includes(q));
 box.innerHTML=list.length?list.map(e=>`<div class="timelineEntry"><div class="timelineIcon">${escapeHTML(e.icon||'•')}</div><div><strong>${escapeHTML(e.title)}</strong><small>${escapeHTML(e.date)}</small>${e.detail?`<p>${escapeHTML(e.detail)}</p>`:''}</div></div>`).join(''):'<div class="panel">Todavía no hay actividad registrada.</div>';
}
function clearTimeline(){
 if(!confirm('¿Limpiar todo el historial de actividad?'))return;
 EDYStorage.set('timeline',[]);
 renderTimeline();renderTodayStrip();
}
function daysUntil(dateStr){
 if(!dateStr)return null;
 const today=new Date();today.setHours(0,0,0,0);
 const date=new Date(dateStr+'T00:00:00');
 return Math.ceil((date-today)/86400000);
}
function renderMaintenance(){
 const box=document.getElementById('maintenanceList');if(!box)return;
 const inv=getInventory();
 const items=inv.filter(i=>i.reviewDate||i.warrantyUntil).map(i=>{
  const review=daysUntil(i.reviewDate),warranty=daysUntil(i.warrantyUntil);
  let state='ok',label='Al día',sort=99999;
  if(review!==null){sort=review;if(review<0){state='overdue';label=`Revisión vencida hace ${Math.abs(review)} días`}else if(review<=30){state='soon';label=`Revisar en ${review} días`}else label=`Revisión en ${review} días`}
  if(review===null&&warranty!==null){sort=warranty;label=warranty<0?'Garantía vencida':`Garantía: ${warranty} días`}
  return {i,state,label,sort,warranty};
 }).sort((a,b)=>a.sort-b.sort);
 const overdue=items.filter(x=>x.state==='overdue').length;
 const soon=items.filter(x=>x.state==='soon').length;
 const noDate=inv.filter(i=>!i.reviewDate).length;
 const warranty=inv.filter(i=>{const d=daysUntil(i.warrantyUntil);return d!==null&&d>=0&&d<=60}).length;
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('maintOverdue',overdue);set('maintSoon',soon);set('maintNoDate',noDate);set('maintWarranty',warranty);
 box.innerHTML=items.length?items.map(x=>`<div class="maintenanceCard ${x.state}"><div><strong>${x.i.critical?'⭐ ':''}${escapeHTML(x.i.name)}</strong><small>${escapeHTML(x.label)}${x.i.responsible?` · Responsable: ${escapeHTML(x.i.responsible)}`:''}</small></div><button class="miniAction" onclick="openItem('${escapeJS(x.i.id)}')">Abrir</button></div>`).join(''):'<div class="panel">Todavía no hay fechas de revisión o garantía registradas.</div>';
}
async function getAllBackupData(){
 return {
  version:'1.3.0',
  exportedAt:new Date().toISOString(),
  inventory:getInventory(),
  zones:getZones(),
  operations:EDYStorage.get('operations',{}),
  status:EDYStorage.get('status',{}),
  pendings:EDYStorage.get('pendings',[]),
  timeline:EDYStorage.get('timeline',[]),
  activeEmergency:EDYStorage.get('active_emergency',null),
  checklists:getChecklists(),
  photos:await EDYMedia.getAllPhotos()
 };
}
async function exportEDYBackup(){
 const data=await getAllBackupData();
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;a.download=`EDY-respaldo-${new Date().toISOString().slice(0,10)}.json`;
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 const now=new Date().toLocaleString('es-AR');
 EDYStorage.set('last_backup',now);
 addTimelineEntry('backup','💾','Respaldo exportado');
 renderBackupStatus();renderTodayStrip();
}
function importEDYBackup(event){
 const file=event.target.files?.[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=async()=>{
  try{
   const data=JSON.parse(reader.result);
   if(!data.inventory||!Array.isArray(data.inventory))throw new Error('Formato inválido');
   if(!confirm('Esto reemplazará los datos locales actuales. ¿Continuar?'))return;
   EDYStorage.set('inventory',data.inventory);
   EDYStorage.set('zones',Array.isArray(data.zones)?data.zones:getZones());
   EDYStorage.set('operations',data.operations||{});
   EDYStorage.set('status',data.status||{});
   EDYStorage.set('pendings',Array.isArray(data.pendings)?data.pendings:[]);
   EDYStorage.set('timeline',Array.isArray(data.timeline)?data.timeline:[]);
   EDYStorage.set('checklists',Array.isArray(data.checklists)?data.checklists:getChecklists());
   await EDYMedia.replaceAll(Array.isArray(data.photos)?data.photos:[]);
   if(data.activeEmergency)EDYStorage.set('active_emergency',data.activeEmergency);else EDYStorage.remove('active_emergency');
   EDYStorage.set('last_backup',new Date().toLocaleString('es-AR'));
   addTimelineEntry('backup','⬆️','Respaldo importado');
   renderAllBetaViews();alert('Respaldo importado correctamente.');
  }catch(e){alert('No se pudo importar el archivo. Verificá que sea un respaldo válido de EDY.')}
  event.target.value='';
 };
 reader.readAsText(file);
}
function renderBackupStatus(){
 const value=EDYStorage.get('last_backup','Nunca');
 const el=document.getElementById('lastBackupText');if(el)el.textContent=value;
}
function renderTodayStrip(){
 const timeline=EDYStorage.get('timeline',[]);
 const inv=getInventory();
 const reviews=inv.filter(i=>{const d=daysUntil(i.reviewDate);return d!==null&&d<=30}).length;
 const critical=inv.filter(i=>i.critical).length;
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('todayLastChange',timeline[0]?.date||'Sin actividad');
 set('todayReviews',reviews);
 set('todayCritical',critical);
 set('todayBackup',EDYStorage.get('last_backup','Nunca'));
}
function renderAllBetaViews(){
 renderInventory();renderMap();renderOperationsHome();renderAssistantAlerts();renderAssistantHomeAlerts();
 renderPendings();renderHomePendings();renderTimeline();renderMaintenance();renderBackupStatus();renderTodayStrip();renderChecklists();renderHomeChecklistProgress();renderReadinessInsights();renderDiagnostic();
}
function enterCrisisMode(){
 EDYStorage.set('crisis_mode',true);
 addTimelineEntry('crisis','🚨','Modo Crisis activado');
 document.body.classList.add('crisisMode');
 openSection('crisisCenter');
}
function exitCrisisMode(){
 EDYStorage.set('crisis_mode',false);
 addTimelineEntry('crisis','✅','Modo Crisis finalizado');
 document.body.classList.remove('crisisMode');
 home();
}
function renderCrisisCritical(){
 const box=document.getElementById('crisisCriticalList');if(!box)return;
 const items=getInventory().filter(i=>i.critical&&i.status==='available').slice(0,12);
 box.innerHTML=items.length?`<div class="crisisCriticalGrid">${items.map(i=>`<div class="crisisCriticalItem"><strong>${escapeHTML(i.name)}</strong><small>${escapeHTML(zoneName(i.zone))} · ${escapeHTML(i.location||'Sin detalle')}</small></div>`).join('')}</div>`:'<p>No hay elementos críticos marcados como disponibles.</p>';
}
function openCriticalInventory(){
 openSection('inventario');
 const search=document.getElementById('inventorySearch');if(search){search.value='';}
 const box=document.getElementById('inventoryCategories');
 const all=getInventory().filter(i=>i.critical);
 if(box)box.innerHTML=all.length?`<div class="categoryBlock"><div class="categoryTitle"><h3>⭐ Elementos críticos</h3><span class="categoryCount">${all.length} elementos</span></div><div class="inventoryList">${all.map(i=>`<div class="inventoryItem" onclick="openItem('${escapeJS(i.id)}')"><span class="statusMark ${i.status}"></span><div class="itemMain"><strong>${escapeHTML(i.name)}</strong><div class="itemMeta">${escapeHTML(zoneName(i.zone))} · ${escapeHTML(i.location||'Sin registrar')}</div></div><span class="statusLabel ${i.status}">${statusText(i.status)}</span></div>`).join('')}</div></div>`:'<div class="panel">No hay elementos críticos.</div>';
}

let zonesBase=[];
let currentZoneId=null;

function inferZoneForItem(item){
 const cat=item.category||'',loc=normalizeText(item.location||'');
 if(cat==='Energía')return 'energy';
 if(cat==='Agua')return 'water';
 if(cat==='Vehículos')return 'vehicles';
 if(['Mochilas','Documentación','Botiquín'].includes(cat))return 'home';
 if(loc.includes('deposito'))return 'storage';
 return 'home';
}
function getZones(){
 const saved=EDYStorage.get('zones',null);
 return saved||zonesBase;
}
function saveZones(zones){
 EDYStorage.set('zones',zones);
 renderMap();
 renderOperationsHome();
}
async function loadZones(){
 try{
  const r=await fetch('zones.json');
  zonesBase=await r.json();
  if(!EDYStorage.get('zones',null))EDYStorage.set('zones',zonesBase);
  renderMap();
  return getZones();
 }catch(e){
  zonesBase=[
   {id:'home',name:'Casa',icon:'🏠',description:'Elementos dentro de la vivienda',builtin:true},
   {id:'storage',name:'Depósito',icon:'📦',description:'Equipos y reservas almacenadas',builtin:true}
  ];
  if(!EDYStorage.get('zones',null))EDYStorage.set('zones',zonesBase);
  return getZones();
 }
}
function zoneById(id){return getZones().find(z=>z.id===id)}
function zoneName(id){return zoneById(id)?.name||'Sin zona'}
function zoneOptions(selected=''){
 const opts=['<option value="">Sin zona</option>',...getZones().map(z=>`<option value="${escapeAttr(z.id)}" ${z.id===selected?'selected':''}>${escapeHTML(z.icon)} ${escapeHTML(z.name)}</option>`)];
 return opts.join('');
}
function populateZoneSelect(id,selected=''){
 const el=document.getElementById(id);if(el)el.innerHTML=zoneOptions(selected);
}
function renderMap(){
 const box=document.getElementById('mapCanvas');if(!box)return;
 const q=normalizeText(document.getElementById('mapSearch')?.value||'');
 const zones=getZones(),inv=getInventory();
 const located=inv.filter(i=>i.zone && zoneById(i.zone));
 const unlocated=inv.filter(i=>!i.zone || !zoneById(i.zone));
 const criticalLocated=located.filter(i=>i.critical).length;
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('mapZoneCount',zones.length);set('mapLocatedCount',located.length);set('mapUnlocatedCount',unlocated.length);set('mapCriticalCount',criticalLocated);

 const cards=zones.map(z=>{
  const items=inv.filter(i=>i.zone===z.id);
  const critical=items.filter(i=>i.critical).length;
  const searchable=normalizeText([z.name,z.description,...items.map(i=>[i.name,i.location,i.category].join(' '))].join(' '));
  if(q && !searchable.includes(q))return '';
  return `<div class="zoneCard ${items.length?'':'zoneEmpty'} ${q?'mapSearchHighlight':''}" onclick="openZone('${escapeJS(z.id)}')">
   <div class="zoneCardIcon">${escapeHTML(z.icon||'📍')}</div>
   <h3>${escapeHTML(z.name)}</h3>
   <p>${escapeHTML(z.description||'Sin descripción')}</p>
   <div class="zoneCardFooter"><span class="zoneCount">${items.length} elementos</span>${critical?`<span class="zoneCritical">⭐ ${critical} críticos</span>`:''}</div>
  </div>`;
 }).join('');
 const unlocatedCard=(!q || unlocated.some(i=>normalizeText([i.name,i.location,i.category].join(' ')).includes(q))) && unlocated.length
 ? `<div class="zoneCard" onclick="openZone('__unlocated__')"><div class="zoneCardIcon">❓</div><h3>Sin zona</h3><p>Elementos que todavía no tienen una ubicación asignada.</p><div class="zoneCardFooter"><span class="zoneCount">${unlocated.length} elementos</span></div></div>`:'';
 box.innerHTML=cards+unlocatedCard || '<div class="panel">No se encontraron zonas o elementos.</div>';
}
function openZone(id){
 currentZoneId=id;
 const inv=getInventory();
 const unlocated=id==='__unlocated__';
 const zone=unlocated?{id,name:'Sin zona',icon:'❓',description:'Elementos pendientes de ubicar',builtin:true}:zoneById(id);
 if(!zone)return;
 const items=inv.filter(i=>unlocated?(!i.zone||!zoneById(i.zone)):i.zone===id)
   .sort((a,b)=>Number(Boolean(b.critical))-Number(Boolean(a.critical))||a.name.localeCompare(b.name));
 const actions=!unlocated?`<div class="zoneActions">
   <button class="action secondary" onclick="editZonePrompt('${escapeJS(zone.id)}')">Editar zona</button>
   ${zone.builtin?'':`<button class="action secondary" onclick="deleteZone('${escapeJS(zone.id)}')">Eliminar zona</button>`}
 </div>`:'';
 document.getElementById('zoneDetailContent').innerHTML=`
  <div class="zoneDetailHeader">
   <div class="zoneDetailTitle"><div class="zoneDetailIcon">${escapeHTML(zone.icon||'📍')}</div><div><h2>${escapeHTML(zone.name)}</h2><p>${escapeHTML(zone.description||'')}</p></div></div>
   ${actions}
  </div>
  <div class="inventoryList">${items.length?items.map(i=>`
   <div class="inventoryItem" onclick="openItem('${escapeJS(i.id)}')">
    <span class="statusMark ${i.status}"></span>
    <div class="itemMain"><div class="itemFlags">${i.critical?'<span class="criticalStar">⭐</span>':''}</div><strong>${escapeHTML(i.name)}</strong>
     <div class="locationBreadcrumb">📍 ${escapeHTML(i.location||'Sin detalle')}</div>
    </div>
    <span class="statusLabel ${i.status}">${statusText(i.status)}</span>
   </div>`).join(''):'<div class="panel">Esta zona todavía no tiene elementos.</div>'}</div>`;
 openSection('zoneDetail');
}
function addZone(){
 const name=document.getElementById('newZoneName').value.trim();
 if(!name){alert('Ingresá un nombre para la zona.');return}
 const zones=getZones();
 const zone={
  id:'zone-'+Date.now(),
  name,
  icon:document.getElementById('newZoneIcon').value.trim()||'📍',
  description:document.getElementById('newZoneDescription').value.trim()||'Zona personalizada',
  builtin:false
 };
 zones.push(zone);saveZones(zones);
 document.getElementById('newZoneName').value='';
 document.getElementById('newZoneIcon').value='📍';
 document.getElementById('newZoneDescription').value='';
 openZone(zone.id);
}
function editZonePrompt(id){
 const zones=getZones(),z=zones.find(x=>x.id===id);if(!z)return;
 const name=prompt('Nombre de la zona:',z.name);if(name===null)return;
 const description=prompt('Descripción:',z.description||'');if(description===null)return;
 const icon=prompt('Ícono:',z.icon||'📍');if(icon===null)return;
 z.name=name.trim()||z.name;z.description=description.trim();z.icon=icon.trim()||'📍';
 saveZones(zones);openZone(id);
}
function deleteZone(id){
 const z=zoneById(id);if(!z||z.builtin)return;
 if(!confirm(`¿Eliminar la zona "${z.name}"? Los elementos quedarán sin zona.`))return;
 const inv=getInventory();inv.forEach(i=>{if(i.zone===id)i.zone=''});
 EDYStorage.set('inventory',inv);
 saveZones(getZones().filter(x=>x.id!==id));
 openSection('mapa');
}

function normalizeText(value){
 return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
function escapeHTML(value){
 return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function escapeAttr(value){return escapeHTML(value)}
function escapeJS(value){return String(value??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ')}
function reviewStatus(item){
 if(!item.reviewDate)return 'none';
 const today=new Date();today.setHours(0,0,0,0);
 const due=new Date(item.reviewDate+'T00:00:00');
 const diff=Math.ceil((due-today)/86400000);
 if(diff<0)return 'due';
 if(diff<=30)return 'soon';
 return 'ok';
}
function formatDateISO(value){
 if(!value)return 'Sin fecha';
 const d=new Date(value+'T00:00:00');
 return Number.isNaN(d.getTime())?value:d.toLocaleDateString('es-AR');
}
function getSmartAlerts(){
 const inv=getInventory();
 const alerts=[];
 inv.filter(i=>i.critical && i.status==='missing').forEach(i=>alerts.push({
   level:'urgent',icon:'🚨',title:`Falta un elemento crítico: ${i.name}`,
   detail:i.location&&i.location!=='Pendiente'?i.location:'Pendiente de compra',itemId:i.id
 }));
 inv.filter(i=>i.critical && i.status==='review').forEach(i=>alerts.push({
   level:'warning',icon:'⚠️',title:`Revisar elemento crítico: ${i.name}`,
   detail:i.notes||'Requiere verificación',itemId:i.id
 }));
 inv.filter(i=>reviewStatus(i)==='due').forEach(i=>alerts.push({
   level:'urgent',icon:'📅',title:`Revisión vencida: ${i.name}`,
   detail:`Fecha prevista: ${formatDateISO(i.reviewDate)}`,itemId:i.id
 }));
 inv.filter(i=>reviewStatus(i)==='soon').forEach(i=>alerts.push({
   level:'warning',icon:'📅',title:`Próxima revisión: ${i.name}`,
   detail:`Fecha prevista: ${formatDateISO(i.reviewDate)}`,itemId:i.id
 }));
 const o=getOperations();
 if(o.updatedISO){
   const age=Math.floor((Date.now()-new Date(o.updatedISO).getTime())/86400000);
   if(age>=30)alerts.push({level:'info',icon:'🧭',title:'Actualizar el Centro de Operaciones',detail:`La última carga fue hace ${age} días.`,section:'operaciones'});
 }
 const pending=EDYStorage.get('pendings',[]).filter(p=>!p.done);
 if(pending.length)alerts.push({level:'info',icon:'☑️',title:`${pending.length} tarea${pending.length===1?'':'s'} pendiente${pending.length===1?'':'s'}`,detail:pending[0].text,section:'pendientes'});
 return alerts;
}
function alertMarkup(a,compact=false){
 const action=a.itemId?`openItem('${escapeJS(a.itemId)}')`:a.section?`openSection('${escapeJS(a.section)}')`:`openSection('asistente')`;
 return `<div class="smartAlert ${a.level}">
   <div class="smartAlertIcon">${a.icon}</div>
   <div><strong>${escapeHTML(a.title)}</strong><small>${escapeHTML(a.detail||'')}</small></div>
   ${compact?'':`<button class="miniAction" onclick="${action}">Abrir</button>`}
 </div>`;
}
function renderAssistantAlerts(){
 const box=document.getElementById('assistantAlerts');if(!box)return;
 const alerts=getSmartAlerts();
 box.innerHTML=alerts.length?alerts.map(a=>alertMarkup(a)).join(''):'<div class="noSmartAlerts">✅ No hay alertas críticas ni revisiones próximas.</div>';
}
function renderAssistantHomeAlerts(){
 const box=document.getElementById('assistantHomeAlerts');if(!box)return;
 const alerts=getSmartAlerts().slice(0,4);
 box.innerHTML=alerts.length?alerts.map(a=>alertMarkup(a,true)).join(''):'<div class="noSmartAlerts">✅ Sin alertas importantes.</div>';
}
function findInventoryMatches(query){
 const q=normalizeText(query);
 const words=q.split(/\s+/).filter(w=>w.length>=3 && !['donde','esta','estan','tengo','necesito','para','como','cuanto','cuanta','cual','hacer','ante','quiero'].includes(w));
 return getInventory().map(i=>{
   const text=normalizeText([i.name,i.category,i.notes,i.location].join(' '));
   const score=words.reduce((n,w)=>n+(text.includes(w)?1:0),0)+(text.includes(q)?3:0);
   return {item:i,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.item);
}
function assistantInventoryRows(items){
 return `<div class="assistantList">${items.map(i=>`
   <div class="assistantResultItem">
    <div><strong>${i.critical?'⭐ ':''}${escapeHTML(i.name)}</strong><small>${escapeHTML(i.category)} · ${escapeHTML(zoneName(i.zone))} · ${escapeHTML(i.location||'Sin registrar')} · ${statusText(i.status)}</small></div>
    <button class="miniAction" onclick="openItem('${escapeJS(i.id)}')">Ver</button>
   </div>`).join('')}</div>`;
}
function assistantManualRows(items){
 return `<div class="assistantList">${items.map(m=>`<div class="assistantResultItem"><div><strong>${escapeHTML(m.icon||'📘')} ${escapeHTML(m.title)}</strong><small>${escapeHTML(m.category||'Biblioteca')} · disponible offline</small></div><button class="miniAction" onclick="openManual('${escapeJS(m.id)}')">Leer</button></div>`).join('')}</div>`;
}
function assistantReply(title,body,extra=''){
 const box=document.getElementById('assistantAnswer');if(!box)return;
 box.innerHTML=`<div class="assistantResponse">
  <div class="assistantAvatar">EDY</div>
  <div class="assistantContent"><h3>${escapeHTML(title)}</h3>${body}${extra}</div>
 </div>`;
}
function assistantAsk(prefill){
 const input=document.getElementById('assistantQuery');
 if(prefill!==undefined)input.value=prefill;
 const raw=input.value.trim();
 if(!raw){assistantReply('Escribí una consulta','<p>Por ejemplo: “¿Dónde está la estación de energía?” o “¿Qué me falta comprar?”.</p>');return}
 const q=normalizeText(raw);
 const inv=getInventory(),o=getOperations(),pending=EDYStorage.get('pendings',[]).filter(p=>!p.done);

 const zoneMatches=getZones().filter(z=>q.includes(normalizeText(z.name)));
 if(zoneMatches.length && /\b(que hay|contenido|elementos|inventario|guardado|guardados|tengo)\b/.test(q)){
   const z=zoneMatches[0],items=inv.filter(i=>i.zone===z.id);
   assistantReply(`Contenido de ${z.name}`,items.length?`<p>Hay <strong>${items.length} elementos</strong> registrados en esta zona.</p>`:'<p>Esta zona todavía está vacía.</p>',
    items.length?assistantInventoryRows(items):`<div class="assistantCallout"><button class="action" onclick="openZone('${escapeJS(z.id)}')">Abrir zona</button></div>`);
   return;
 }
 if(/\b(mapa|zonas|ubicaciones)\b/.test(q)){
   assistantReply('Mapa de ubicaciones',`<p>Tenés <strong>${getZones().length} zonas</strong> configuradas.</p>`,
    `<div class="assistantCallout"><button class="action" onclick="openSection('mapa')">Abrir mapa</button></div>`);
   return;
 }
 if(/\b(donde|ubicacion|guardar|guardado|esta|estan)\b/.test(q)){
   const matches=findInventoryMatches(q);
   if(matches.length){
     assistantReply('Ubicación encontrada',`<p>Encontré ${matches.length} coincidencia${matches.length===1?'':'s'} en el inventario.</p>`,assistantInventoryRows(matches));
   }else assistantReply('No encontré la ubicación','<p>Ese elemento no figura en el inventario o todavía no tiene una ubicación registrada.</p><div class="assistantCallout">Probá escribiendo solamente el nombre del objeto.</div>');
   return;
 }
 if(/\b(falta|faltan|comprar|pendiente|pendientes|en camino)\b/.test(q)){
   const missing=inv.filter(i=>['missing','incoming','review'].includes(i.status)).sort((a,b)=>Number(Boolean(b.critical))-Number(Boolean(a.critical)));
   const html=missing.length?assistantInventoryRows(missing):'<p>No hay faltantes, elementos en camino ni equipos marcados para revisar.</p>';
   const tasks=pending.length?`<div class="assistantCallout"><strong>Tareas activas:</strong><br>${pending.slice(0,5).map(p=>'• '+escapeHTML(p.text)).join('<br>')}</div>`:'';
   assistantReply('Pendientes y faltantes',`<p>${missing.length} elemento${missing.length===1?'':'s'} requieren atención.</p>`,html+tasks);
   return;
 }
 if(/\b(agua|litros|hidrata|filtro)\b/.test(q)){
   const totalWater=effectiveWaterLiters(o),days=waterDays(o);
   const waterItems=inv.filter(i=>normalizeText(i.category)==='agua');
   assistantReply('Situación del agua',
     totalWater>0?`<p>Tenés registrados <strong>${formatStockNumber(totalWater)} litros</strong> para ${Number(o.people)||5} personas: aproximadamente <strong>${days.toFixed(1)} días</strong> al consumo configurado.</p>`:'<p>Todavía no cargaste agua potable en el inventario.</p>',
     (waterItems.length?assistantInventoryRows(waterItems):'')+`<div class="assistantCallout"><button class="action" onclick="openSection('agua')">Abrir módulo de agua</button></div>`
   );return;
 }
 if(/\b(energia|luz|apag|bateria|solar|electric)\b/.test(q)){
   const energyItems=inv.filter(i=>normalizeText(i.category)==='energia');
   const body=o.updated?`<p>La autonomía eléctrica configurada es de <strong>${o.energyHours} horas</strong>.</p>`:'<p>Todavía no cargaste la autonomía eléctrica en el Centro de Operaciones.</p>';
   const action=/apag|corte|sin luz/.test(q)?`<div class="assistantCallout"><button class="action" onclick="activateEmergency('power')">Abrir protocolo de corte de energía</button></div>`:'';
   assistantReply('Energía',body,assistantInventoryRows(energyItems)+action);return;
 }
 if(/\b(alimento|comida|comer|provisiones)\b/.test(q)){
   assistantReply('Alimentos',o.updated?`<p>La autonomía registrada es de <strong>${o.foodDays} días</strong>.</p>`:'<p>Todavía no cargaste los días de alimentos disponibles.</p>',
     assistantInventoryRows(inv.filter(i=>normalizeText(i.category)==='alimentos')));return;
 }
 if(/\b(botiquin|medic|salud|curacion)\b/.test(q)){
   const items=inv.filter(i=>normalizeText(i.category)==='botiquin');
   assistantReply('Botiquín',o.updated?`<p>El nivel de completitud registrado es de <strong>${o.healthPercent}%</strong>.</p>`:'<p>Todavía no cargaste el porcentaje del botiquín.</p>',
     items.length?assistantInventoryRows(items):'<div class="assistantCallout">Podés cargar cada insumo del botiquín como elemento del inventario.</div>');return;
 }
 if(/\b(evacua|salir|abandona)\b/.test(q)){
   assistantReply('Evacuación','<p>La prioridad es reunir a la familia, tomar los elementos esenciales y salir sin demoras innecesarias.</p>',
     `<div class="assistantCallout"><button class="action" onclick="activateEmergency('evacuation')">Abrir protocolo de evacuación</button></div>`);return;
 }
 if(/\b(tormenta|temporal|granizo)\b/.test(q)){
   assistantReply('Tormenta fuerte','<p>Permanecé bajo techo, alejado de vidrios y seguí avisos oficiales.</p>',
     `<div class="assistantCallout"><button class="action" onclick="activateEmergency('storm')">Abrir protocolo de tormenta</button></div>`);return;
 }
 if(/\b(herido|accidente|sangra|lesion)\b/.test(q)){
   assistantReply('Persona herida','<p>Primero verificá que el lugar sea seguro y pedí ayuda profesional cuando sea necesario.</p>',
     `<div class="assistantCallout"><button class="action" onclick="activateEmergency('injury')">Abrir protocolo para persona herida</button></div>`);return;
 }
 if(/\b(inventario|cuantos|cantidad|equipos)\b/.test(q)){
   const available=inv.filter(i=>i.status==='available').length;
   const critical=inv.filter(i=>i.critical).length;
   assistantReply('Resumen del inventario',`<p>Hay <strong>${inv.length} elementos</strong>: ${available} disponibles y ${critical} marcados como críticos.</p>`,
     assistantInventoryRows(inv.filter(i=>i.critical).slice(0,8)));return;
 }

 const manualMatches=findManualMatches(raw).slice(0,5);
 if(manualMatches.length){
   assistantReply('Encontré estos manuales offline','<p>La Biblioteca EDY contiene información relacionada con tu consulta.</p>',assistantManualRows(manualMatches));return;
 }
 const matches=findInventoryMatches(q);
 if(matches.length){
   assistantReply('Encontré estas coincidencias','<p>Resultados obtenidos del inventario local.</p>',assistantInventoryRows(matches));return;
 }
 assistantReply('No encontré una respuesta directa',
   '<p>Probá consultar por el nombre de un equipo, una categoría o una situación concreta.</p>',
   '<div class="assistantCallout">Ejemplos: “dengue”, “monóxido”, “filtros”, “qué falta comprar”, “autonomía de agua” o “evacuación”.</div>');
}


const emergencyProtocols={
 power:{
  title:'Corte de energía',emoji:'🔌',
  intro:'Priorizá iluminación, frío de alimentos, comunicaciones y consumo mínimo.',
  steps:['Confirmar si el corte afecta solo a la vivienda o a la zona.','Desconectar equipos sensibles antes de energizar la reserva.','Encender la estación de energía y verificar el porcentaje disponible.','Conectar únicamente los consumos esenciales.','Mantener una linterna accesible para cada sector.','Verificar el medio principal o alternativo de comunicación.','Registrar la hora de inicio del corte.'],
  note:'No uses generadores a combustión dentro de la vivienda, garaje cerrado ni espacios sin ventilación.'
 },
 water:{
  title:'Falta de agua',emoji:'🚱',
  intro:'Protegé la reserva y evitá consumir agua dudosa sin tratar.',
  steps:['Confirmar si el problema es interno o de la red.','Cerrar pérdidas y suspender usos no esenciales.','Calcular la reserva disponible por persona.','Separar agua para beber y cocinar.','Usar filtros únicamente según sus instrucciones.','Hervir o desinfectar el agua cuando corresponda.','Registrar el consumo diario.'],
  note:'El agua transparente también puede estar contaminada. Ante dudas, tratala antes de beber.'
 },
 evacuation:{
  title:'Evacuación',emoji:'🚗',
  intro:'La seguridad de las personas está primero. No demores la salida por objetos reemplazables.',
  steps:['Confirmar la ruta de salida y un punto de reunión.','Reunir a toda la familia.','Tomar botiquín, agua y documentación esencial.','Llevar las mochilas de 72 horas.','Asegurar a las mascotas con correas o transportadoras.','Cortar energía o gas solo si hacerlo es seguro.','Avisar a un contacto externo y salir.'],
  note:'No regreses hasta que una autoridad competente indique que el lugar es seguro.'
 },
 injury:{
  title:'Persona herida',emoji:'🩹',
  intro:'Evaluá primero que el lugar sea seguro y pedí ayuda profesional cuando sea necesario.',
  steps:['Verificar que no exista peligro para quien ayuda.','Comprobar respuesta y respiración.','Solicitar asistencia de emergencias.','Controlar hemorragias con presión directa.','No mover a la persona si sospechás lesión de columna, salvo peligro inmediato.','Mantenerla abrigada y acompañada.','Registrar hora, síntomas y acciones realizadas.'],
  note:'Esta guía no reemplaza capacitación en primeros auxilios ni atención médica.'
 },
 storm:{
  title:'Tormenta fuerte',emoji:'⛈️',
  intro:'Permanecé bajo techo, lejos de aberturas y elementos que puedan caer.',
  steps:['Ingresar objetos sueltos del exterior si todavía es seguro.','Cerrar puertas y ventanas.','Desconectar equipos sensibles.','Preparar linternas y energía de reserva.','Mantener a la familia y mascotas alejadas de vidrios.','Evitar circular por calles anegadas.','Escuchar avisos oficiales por los medios disponibles.'],
  note:'No atravieses agua en movimiento a pie ni en vehículo.'
 }
};

function activateEmergency(type){
 const p=emergencyProtocols[type]; if(!p)return;
 EDYStorage.set('active_emergency',{type,started:new Date().toLocaleString('es-AR')});
 addTimelineEntry('emergency','🚨',`Emergencia declarada: ${p.title}`);
 const checks=p.steps.map((s,i)=>`<div class="protocolStep"><input type="checkbox" id="ep_${type}_${i}" onchange="saveEmergencyCheck('${type}',${i},this.checked)"><label for="ep_${type}_${i}">${i+1}. ${s}</label></div>`).join('');
 document.getElementById('activeEmergencyContent').innerHTML=`
  <div class="activeEmergencyCard">
   <div class="activeEmergencyTitle"><div class="emoji">${p.emoji}</div><h2>${p.title}</h2><p>${p.intro}</p></div>
   <div class="protocolChecklist">${checks}</div>
   <div class="emergencyInfo"><strong>Importante:</strong> ${p.note}</div>
   <div class="actions"><button class="action" onclick="finishEmergency()">Finalizar emergencia</button><button class="action secondary" onclick="home()">Ir al inicio</button></div>
  </div>`;
 p.steps.forEach((_,i)=>{const el=document.getElementById(`ep_${type}_${i}`);el.checked=EDYStorage.get(`emergency_${type}_${i}`,false)});
 openSection('activeEmergency');
}
function saveEmergencyCheck(type,index,value){EDYStorage.set(`emergency_${type}_${index}`,value)}
function finishEmergency(){
 if(!confirm('¿Finalizar la emergencia activa?'))return;
 const active=EDYStorage.get('active_emergency',null);
 if(active && emergencyProtocols[active.type]) emergencyProtocols[active.type].steps.forEach((_,i)=>EDYStorage.remove(`emergency_${active.type}_${i}`));
 EDYStorage.remove('active_emergency');
 addTimelineEntry('emergency','✅','Emergencia finalizada');
 const d=EDYStorage.get('status',{});d.level='green';d.updated=new Date().toLocaleString('es-AR');EDYStorage.set('status',d);
 home();
}

function waterUnitToLiters(item){
 const qty=currentQuantity(item),unit=normalizeText(item.unit||'');
 if(['l','lt','lts','litro','litros'].includes(unit))return qty;
 if(['ml','mililitro','mililitros'].includes(unit))return qty/1000;
 if(Number(item.packageSize)>0&&normalizeText(item.packageUnit||'')==='l')return qty*Number(item.packageSize);
 return 0;
}
function inventoryWaterItems(){return getInventory().map(normalizeInventoryItem).filter(i=>normalizeText(i.category)==='agua'&&waterUnitToLiters(i)>0)}
function inventoryWaterLiters(){return roundStock(inventoryWaterItems().reduce((sum,item)=>sum+waterUnitToLiters(item),0))}
function effectiveWaterLiters(o={}){const inventoryLiters=inventoryWaterLiters();return inventoryLiters>0?inventoryLiters:(Number(o.waterLiters)||0)}
function waterDisplaySummary(){
 const items=inventoryWaterItems();if(!items.length)return 'Sin bidones registrados';
 if(items.length===1){const i=items[0],total=waterUnitToLiters(i),size=Number(i.packageSize)||0;if(size>0){const full=Math.floor(total/size),open=roundStock(total-full*size);return open>0?`${full} ${full===1?'bidón':'bidones'} completo${full===1?'':'s'} + ${formatStockNumber(open)} L en uso`:`${full} ${full===1?'bidón':'bidones'} de ${formatStockNumber(size)} L`}}
 return `${items.length} productos de agua potable`;
}
function renderWaterInventory(){
 const total=inventoryWaterLiters();
 const liters=document.getElementById('waterInventoryLiters'),packages=document.getElementById('waterInventoryPackages'),daysEl=document.getElementById('waterInventoryDays');
 if(liters)liters.textContent=`${formatStockNumber(total)} L`;if(packages)packages.textContent=waterDisplaySummary();
 const people=Math.max(1,Number(document.getElementById('waterPeople')?.value)||Number(getOperations().people)||5);
 const per=Math.max(.5,Number(document.getElementById('waterPerPerson')?.value)||Number(getOperations().waterPerPerson)||3);
 if(daysEl)daysEl.textContent=total>0?`${(total/(people*per)).toFixed(1)} días`:'—';
 const source=document.getElementById('waterInventorySource');
 if(total>0){const input=document.getElementById('waterLiters');if(input)input.value=total;if(source)source.textContent='Valor sincronizado automáticamente desde el inventario.'}
 else if(source)source.textContent='Sin agua potable registrada en el inventario.';
}
function syncWaterCalculatorFromInventory(){
 const total=inventoryWaterLiters();if(total<=0){alert('No hay agua potable cargada en el inventario.');return}
 document.getElementById('waterLiters').value=total;calculateWater();renderWaterInventory();
}
function adjustWaterInventory(delta){
 const amount=Number(delta);if(!Number.isFinite(amount)||amount===0)return;
 const list=getInventory().map(normalizeInventoryItem);
 let item=list.find(i=>i.id==='starter-agua-manantial-de-oro-20l')||list.find(i=>normalizeText(i.category)==='agua'&&['l','litro','litros'].includes(normalizeText(i.unit)));
 if(!item){const base=inventoryBase.find(i=>i.id==='starter-agua-manantial-de-oro-20l');item=base?cloneData(base):normalizeInventoryItem({id:'starter-agua-manantial-de-oro-20l',name:'Agua potable en bidón',brand:'Manantial de Oro',model:'Bidón retornable de 20 L',category:'Agua',status:'missing',qty:0,unit:'L',critical:true,packageSize:20,packageUnit:'L',containerType:'Bidón retornable',lots:[],movements:[]});list.push(item)}
 const before=currentQuantity(item);
 if(amount>0){
  item.lots.push({id:`${item.id}-lot-${Date.now()}`,lotNumber:'Sin registrar',qty:roundStock(amount),purchaseDate:todayISO(),expiryDate:'',notes:amount===20?'1 bidón de 20 L':'Ingreso de agua potable'});
  addMovement(item,'purchase',amount,amount===20?'Se agregó 1 bidón de 20 L':'Ingreso rápido desde módulo Agua');
 }else{
  let remaining=Math.min(before,Math.abs(amount));const consumed=remaining;
  item.lots.sort((a,b)=>expiryTimestamp(a.expiryDate)-expiryTimestamp(b.expiryDate));
  for(const lot of item.lots){if(remaining<=0)break;const take=Math.min(Number(lot.qty)||0,remaining);lot.qty=roundStock((Number(lot.qty)||0)-take);remaining=roundStock(remaining-take)}
  addMovement(item,'consume',-consumed,Math.abs(amount)===20?'Se descontó 1 bidón de 20 L':'Consumo rápido desde módulo Agua');
  if(Math.abs(amount)>before)alert(`Solo había ${formatStockNumber(before)} L disponibles. Se descontó el stock existente.`);
 }
 item.qty=currentQuantity(item);item.packageCount=Number(item.packageSize)>0?roundStock(item.qty/Number(item.packageSize)):item.packageCount;item.status=item.qty>0?'available':'missing';
 const changed=amount>0?amount:Math.min(before,Math.abs(amount));
 saveInventory(list,`${amount>0?'Agua agregada':'Agua consumida'}: ${formatStockNumber(changed)} L`);
 renderWaterInventory();calculateWater();
}
function consumeWaterCustom(){
 const raw=prompt('¿Cuántos litros querés descontar?','5');if(raw===null)return;const amount=Number(String(raw).replace(',','.'));if(!Number.isFinite(amount)||amount<=0){alert('Ingresá una cantidad válida mayor que cero.');return}adjustWaterInventory(-amount);
}

function getOperations(){return EDYStorage.get('operations',{})}
function saveOperations(){
 const data={
  waterLiters:Number(document.getElementById('opsWaterLiters').value)||0,
  people:Math.max(1,Number(document.getElementById('opsPeople').value)||5),
  waterPerPerson:Math.max(.5,Number(document.getElementById('opsWaterPerPerson').value)||3),
  foodDays:Number(document.getElementById('opsFoodDays').value)||0,
  energyHours:Number(document.getElementById('opsEnergyHours').value)||0,
  comms:Number(document.getElementById('opsComms').value),
  healthPercent:Math.min(100,Math.max(0,Number(document.getElementById('opsHealthPercent').value)||0)),
  pets:Number(document.getElementById('opsPets').value),
  updated:new Date().toLocaleString('es-AR')
 };
 EDYStorage.set('operations',data);
 addTimelineEntry('operations','🧭','Centro de Operaciones actualizado');
 loadOperationsForm();renderOperationsResult();renderOperationsHome();
}
function clearOperations(){
 if(!confirm('¿Borrar los valores del Centro de Operaciones?'))return;
 EDYStorage.remove('operations');loadOperationsForm();renderOperationsResult();renderOperationsHome();
}
function waterDays(o={}){const people=Math.max(1,Number(o.people)||5),per=Math.max(.5,Number(o.waterPerPerson)||3);return effectiveWaterLiters(o)/(people*per)}
function scoreOperations(o){
 o=o||{};
 const wd=waterDays(o);
 const water=Math.min(100,wd/14*100);
 const food=Math.min(100,(o.foodDays||0)/14*100);
 const energy=Math.min(100,(o.energyHours||0)/72*100);
 const inv=getInventory();
 const inventory=inv.length?inv.filter(i=>i.status==='available').length/inv.length*100:0;
 return Math.round((water+food+energy+(o.comms||0)+(o.healthPercent||0)+(o.pets||0)+inventory)/7);
}
function loadOperationsForm(){
 const o=getOperations();
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v};
 set('opsWaterLiters',effectiveWaterLiters(o)||'');set('opsPeople',o.people??5);set('opsWaterPerPerson',o.waterPerPerson??3);
 set('opsFoodDays',o.foodDays??'');set('opsEnergyHours',o.energyHours??'');set('opsComms',o.comms??100);
 set('opsHealthPercent',o.healthPercent??'');set('opsPets',o.pets??100);
}
function renderOperationsResult(){
 const box=document.getElementById('operationsResult');if(!box)return;
 const o=getOperations();
 const totalWater=effectiveWaterLiters(o);
 if(!o.updated&&!totalWater){box.innerHTML='<div class="panel">Todavía no hay datos calculados.</div>';return}
 const wd=waterDays(o),score=scoreOperations(o);
 box.innerHTML=`<div class="opsResultCard"><h3>Resultado actual: ${score}%</h3>
  <div class="opsBar"><span style="width:${score}%"></span></div>
  <p><strong>Agua:</strong> ${formatStockNumber(totalWater)} L · ${wd.toFixed(1)} días para ${Number(o.people)||5} personas.</p>
  <p><strong>Alimentos:</strong> ${o.foodDays} días.</p>
  <p><strong>Energía:</strong> ${o.energyHours} horas estimadas.</p>
  <p class="small">Última actualización: ${o.updated}</p></div>`;
}
function renderOperationsHome(){
 const o=getOperations(),inv=getInventory();
 const total=inv.length,available=inv.filter(i=>i.status==='available').length;
 const score=scoreOperations(o),ring=document.getElementById('readinessRing');
 if(ring)ring.style.background=`conic-gradient(#2f9a58 ${score*3.6}deg, rgba(120,135,126,.22) 0deg)`;
 const put=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text};
 put('readinessScore',score+'%');
 put('readinessMessage',!o.updated&&!effectiveWaterLiters(o)?'Completá los datos para calcularlo.':score>=80?'Preparación alta. Mantené las revisiones.':score>=50?'Preparación intermedia. Hay aspectos por mejorar.':'Preparación baja. Priorizá agua, alimentos y energía.');
 put('opWater',effectiveWaterLiters(o)>0?`${waterDays(o).toFixed(1)} días · ${formatStockNumber(effectiveWaterLiters(o))} L`:'Sin registrar');
 put('opFood',o.updated?o.foodDays+' días':'Sin registrar');
 put('opEnergy',o.updated?o.energyHours+' horas':'Sin registrar');
 put('opComms',o.updated?(o.comms>=100?'Operativas':o.comms>0?'Limitadas':'No disponibles'):'Sin registrar');
 put('opHealth',o.updated?o.healthPercent+'%':'Sin registrar');
 put('opInventory',`${available}/${total} disponibles`);
 put('opZones',`${getZones().length} zonas`);
 renderReadinessInsights();
}

loadStatus();renderPendings();renderHomePendings();loadManuals();Promise.all([loadZones(),loadChecklists()]).then(()=>loadInventory()).then(()=>{renderAllBetaViews();if(EDYStorage.get('crisis_mode',false)){document.body.classList.add('crisisMode')}});loadOperationsForm();renderOperationsResult();renderOperationsHome();renderAssistantAlerts();renderAssistantHomeAlerts();renderTodayStrip();renderBackupStatus();
if('serviceWorker' in navigator){
 let reloadingForUpdate=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(reloadingForUpdate)return;reloadingForUpdate=true;window.location.reload();
 });
 window.addEventListener('load',async()=>{
  try{const registration=await navigator.serviceWorker.register('./service-worker.js?v=1.3.0');registration.update()}catch(e){console.warn('No se pudo registrar el modo offline',e)}
 });
}

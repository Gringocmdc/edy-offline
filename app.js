
const sections=[...document.querySelectorAll('.section')];
function openSection(id){sections.forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');scrollTo(0,0)}
function home(){document.getElementById('search').value='';loadStatus();renderHomePendings();renderOperationsHome();openSection('home')}
document.getElementById('search').addEventListener('input',e=>{
 const q=e.target.value.trim().toLowerCase();if(!q){home();return}
 const found=[...document.querySelectorAll('.searchable')].filter(s=>s.innerText.toLowerCase().includes(q));
 document.getElementById('list').innerHTML=found.length?found.map(s=>`<button class="result" onclick="openSection('${s.id}')"><strong>${s.querySelector('h2').innerText}</strong><br><span class="small">Abrir sección</span></button>`).join(''):'<div class="panel">No se encontraron resultados.</div>';
 openSection('results');
});
document.querySelectorAll('input[type=checkbox][data-key]').forEach(cb=>{
 cb.checked=localStorage.getItem('edy_'+cb.dataset.key)==='1';
 cb.addEventListener('change',()=>localStorage.setItem('edy_'+cb.dataset.key,cb.checked?'1':'0'));
});
function setDot(id,status){document.getElementById(id).className='dot '+(status==='amber'?'amber':status==='red'?'red':'')}
function saveStatus(){
 const data={name:nameInput.value,level:levelInput.value,waterStatus:waterStatus.value,waterText:waterText.value,energyStatus:energyStatus.value,energyText:energyText.value,commsStatus:commsStatus.value,commsText:commsText.value,healthStatus:healthStatus.value,healthText:healthText.value,notes:notesInput.value,updated:new Date().toLocaleString('es-AR')};
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
async function loadManuals(){
 try{const r=await fetch('manuals.json');const data=await r.json();manualList.innerHTML=data.map(x=>`<div class="panel"><strong>${x.title}</strong><p>${x.summary}</p></div>`).join('')}catch{manualList.innerHTML='<div class="panel">Biblioteca no disponible.</div>'}
}
const wc=EDYStorage.get('water_calc');if(wc){waterLiters.value=wc.liters;waterPeople.value=wc.people;waterPerPerson.value=wc.per}
const ec=EDYStorage.get('energy_calc');if(ec){batteryWh.value=ec.wh;batteryPercent.value=ec.percent;loadWatts.value=ec.watts;efficiency.value=ec.eff}

let inventoryBase=[];
let currentItemId=null;

function statusText(status){
 return {available:'Disponible',incoming:'En camino',review:'Revisar',missing:'Falta'}[status]||status;
}
function getInventory(){
 const saved=EDYStorage.get('inventory',null);
 return saved || inventoryBase;
}
function saveInventory(list){
 EDYStorage.set('inventory',list);
 renderInventory();
}
async function loadInventory(){
 try{
   const r=await fetch('inventory.json');
   inventoryBase=await r.json();
   if(!EDYStorage.get('inventory',null)) EDYStorage.set('inventory',inventoryBase);
   renderInventory();
 }catch(e){
   const box=document.getElementById('inventoryCategories');
   if(box) box.innerHTML='<div class="panel">No se pudo cargar el inventario.</div>';
 }
}
function renderInventory(){
 const box=document.getElementById('inventoryCategories');
 if(!box)return;
 const q=(document.getElementById('inventorySearch')?.value||'').trim().toLowerCase();
 const all=getInventory();
 const filtered=all.filter(i=>[i.name,i.category,i.notes,i.location].join(' ').toLowerCase().includes(q));
 const counts={available:0,incoming:0,missing:0};
 all.forEach(i=>{if(counts[i.status]!==undefined)counts[i.status]++});
 document.getElementById('invTotal').textContent=all.length;
 document.getElementById('invAvailable').textContent=counts.available;
 document.getElementById('invIncoming').textContent=counts.incoming;
 document.getElementById('invMissing').textContent=counts.missing;
 const order=['Energía','Agua','Comunicaciones','Herramientas','Botiquín','Alimentos','Mochilas','Mascotas','Vehículos','Documentación'];
 box.innerHTML=order.map(cat=>{
   const items=filtered.filter(i=>i.category===cat);
   if(!items.length)return '';
   return `<div class="categoryBlock">
     <div class="categoryTitle"><h3>${categoryIcon(cat)} ${cat}</h3><span class="categoryCount">${items.length} elementos</span></div>
     <div class="inventoryList">${items.map(i=>`
       <div class="inventoryItem" onclick="openItem('${i.id}')">
         <span class="statusMark ${i.status}"></span>
         <div class="itemMain"><strong>${i.name}</strong><div class="itemMeta">${i.qty} ${i.unit} · ${i.location||'Sin registrar'}</div></div>
         <span class="statusLabel ${i.status}">${statusText(i.status)}</span>
       </div>`).join('')}</div>
   </div>`;
 }).join('') || '<div class="panel">No se encontraron elementos.</div>';
}
function categoryIcon(cat){
 return {'Energía':'⚡','Agua':'💧','Comunicaciones':'📡','Herramientas':'🛠️','Botiquín':'🩺','Alimentos':'🍲','Mochilas':'🎒','Mascotas':'🐶','Vehículos':'🚗','Documentación':'📄'}[cat]||'📦';
}
function openItem(id){
 currentItemId=id;
 const i=getInventory().find(x=>x.id===id); if(!i)return;
 document.getElementById('itemDetailContent').innerHTML=`
  <div class="detailCard">
    <div class="detailTop"><div><div class="small">${categoryIcon(i.category)} ${i.category}</div><h2>${i.name}</h2></div><span class="statusLabel ${i.status}">${statusText(i.status)}</span></div>
    <div class="detailGrid">
      <div class="detailField"><span>Estado</span><select id="editStatus" class="editSelect">
        <option value="available" ${i.status==='available'?'selected':''}>Disponible</option>
        <option value="incoming" ${i.status==='incoming'?'selected':''}>En camino</option>
        <option value="review" ${i.status==='review'?'selected':''}>Revisar</option>
        <option value="missing" ${i.status==='missing'?'selected':''}>Falta</option>
      </select></div>
      <div class="detailField"><span>Cantidad</span><input id="editQty" class="editInput" type="number" min="0" value="${i.qty}"></div>
      <div class="detailField"><span>Unidad</span><input id="editUnit" class="editInput" value="${i.unit}"></div>
      <div class="detailField"><span>Ubicación</span><input id="editLocation" class="editInput" value="${i.location||''}"></div>
    </div>
    <div class="detailNotes"><strong>Observaciones</strong><textarea id="editNotes" class="editInput">${i.notes||''}</textarea></div>
    <div class="actions"><button class="action" onclick="saveCurrentItem()">Guardar cambios</button><button class="action secondary" onclick="deleteCurrentItem()">Eliminar</button></div>
  </div>`;
 openSection('itemDetail');
}
function saveCurrentItem(){
 const list=getInventory(); const i=list.find(x=>x.id===currentItemId); if(!i)return;
 i.status=document.getElementById('editStatus').value;
 i.qty=Number(document.getElementById('editQty').value)||0;
 i.unit=document.getElementById('editUnit').value.trim()||'unidad';
 i.location=document.getElementById('editLocation').value.trim()||'Sin registrar';
 i.notes=document.getElementById('editNotes').value.trim();
 saveInventory(list); openSection('inventario');
}
function deleteCurrentItem(){
 if(!confirm('¿Eliminar este elemento del inventario local?'))return;
 saveInventory(getInventory().filter(x=>x.id!==currentItemId)); openSection('inventario');
}
function addInventoryItem(){
 const name=document.getElementById('newItemName').value.trim(); if(!name){alert('Ingresá un nombre.');return}
 const item={
   id:'custom-'+Date.now(),name,
   category:document.getElementById('newItemCategory').value,
   status:document.getElementById('newItemStatus').value,
   qty:Number(document.getElementById('newItemQty').value)||0,
   unit:document.getElementById('newItemUnit').value.trim()||'unidad',
   location:document.getElementById('newItemLocation').value.trim()||'Sin registrar',
   notes:document.getElementById('newItemNotes').value.trim()
 };
 const list=getInventory();list.push(item);saveInventory(list);
 ['newItemName','newItemLocation','newItemNotes'].forEach(id=>document.getElementById(id).value='');
 document.getElementById('newItemQty').value=1;
 openSection('inventario');
}


const emergencyProtocols={
 power:{
  title:'Corte de energía',emoji:'🔌',
  intro:'Priorizá iluminación, frío de alimentos, comunicaciones y consumo mínimo.',
  steps:['Confirmar si el corte afecta solo a la vivienda o a la zona.','Desconectar equipos sensibles antes de energizar la reserva.','Encender la Forza y verificar el porcentaje disponible.','Conectar únicamente los consumos esenciales.','Mantener una linterna accesible para cada sector.','Verificar Starlink o el medio alternativo de comunicación.','Registrar la hora de inicio del corte.'],
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
  steps:['Confirmar la ruta de salida y un punto de reunión.','Reunir a toda la familia.','Tomar botiquín, agua y documentación esencial.','Llevar las mochilas de 72 horas.','Colocar correas y transportar a Manchas y Bella.','Cortar energía o gas solo si hacerlo es seguro.','Avisar a un contacto externo y salir.'],
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
 const d=EDYStorage.get('status',{});d.level='green';d.updated=new Date().toLocaleString('es-AR');EDYStorage.set('status',d);
 home();
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
 loadOperationsForm();renderOperationsResult();renderOperationsHome();
}
function clearOperations(){
 if(!confirm('¿Borrar los valores del Centro de Operaciones?'))return;
 EDYStorage.remove('operations');loadOperationsForm();renderOperationsResult();renderOperationsHome();
}
function waterDays(o){return o.people&&o.waterPerPerson?o.waterLiters/(o.people*o.waterPerPerson):0}
function scoreOperations(o){
 if(!o || !o.updated)return 0;
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
 set('opsWaterLiters',o.waterLiters??'');set('opsPeople',o.people??5);set('opsWaterPerPerson',o.waterPerPerson??3);
 set('opsFoodDays',o.foodDays??'');set('opsEnergyHours',o.energyHours??'');set('opsComms',o.comms??100);
 set('opsHealthPercent',o.healthPercent??'');set('opsPets',o.pets??100);
}
function renderOperationsResult(){
 const box=document.getElementById('operationsResult');if(!box)return;
 const o=getOperations();
 if(!o.updated){box.innerHTML='<div class="panel">Todavía no hay datos calculados.</div>';return}
 const wd=waterDays(o),score=scoreOperations(o);
 box.innerHTML=`<div class="opsResultCard"><h3>Resultado actual: ${score}%</h3>
  <div class="opsBar"><span style="width:${score}%"></span></div>
  <p><strong>Agua:</strong> ${wd.toFixed(1)} días para ${o.people} personas.</p>
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
 put('readinessMessage',!o.updated?'Completá los datos para calcularlo.':score>=80?'Preparación alta. Mantené las revisiones.':score>=50?'Preparación intermedia. Hay aspectos por mejorar.':'Preparación baja. Priorizá agua, alimentos y energía.');
 put('opWater',o.updated?waterDays(o).toFixed(1)+' días':'Sin registrar');
 put('opFood',o.updated?o.foodDays+' días':'Sin registrar');
 put('opEnergy',o.updated?o.energyHours+' horas':'Sin registrar');
 put('opComms',o.updated?(o.comms>=100?'Operativas':o.comms>0?'Limitadas':'No disponibles'):'Sin registrar');
 put('opHealth',o.updated?o.healthPercent+'%':'Sin registrar');
 put('opInventory',`${available}/${total} disponibles`);
}

loadStatus();renderPendings();renderHomePendings();loadManuals();loadInventory().then(()=>renderOperationsHome());loadOperationsForm();renderOperationsResult();renderOperationsHome();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'))}

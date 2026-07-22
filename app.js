
const sections=[...document.querySelectorAll('.section')];
function openSection(id){sections.forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');scrollTo(0,0)}
function home(){document.getElementById('search').value='';loadStatus();openSection('home')}
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
function addPending(){const t=pendingInput.value.trim();if(!t)return;const list=EDYStorage.get('pendings',[]);list.push({text:t,done:false});EDYStorage.set('pendings',list);pendingInput.value='';renderPendings()}
function togglePending(i){const list=EDYStorage.get('pendings',[]);list[i].done=!list[i].done;EDYStorage.set('pendings',list);renderPendings()}
function deletePending(i){const list=EDYStorage.get('pendings',[]);list.splice(i,1);EDYStorage.set('pendings',list);renderPendings()}
async function loadManuals(){
 try{const r=await fetch('manuals.json');const data=await r.json();manualList.innerHTML=data.map(x=>`<div class="panel"><strong>${x.title}</strong><p>${x.summary}</p></div>`).join('')}catch{manualList.innerHTML='<div class="panel">Biblioteca no disponible.</div>'}
}
const wc=EDYStorage.get('water_calc');if(wc){waterLiters.value=wc.liters;waterPeople.value=wc.people;waterPerPerson.value=wc.per}
const ec=EDYStorage.get('energy_calc');if(ec){batteryWh.value=ec.wh;batteryPercent.value=ec.percent;loadWatts.value=ec.watts;efficiency.value=ec.eff}
loadStatus();renderPendings();loadManuals();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'))}

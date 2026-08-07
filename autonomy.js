(()=>{
'use strict';
const AUTONOMY_KEY='autonomy_v250';
const VERSION='2.5.2';
const DEFAULT_TARGET_DAYS=14;

const FOOD_RULES=[
 {match:['arroz'],kcal:360,label:'Arroz seco'},
 {match:['azucar'],kcal:400,label:'Azúcar'},
 {match:['espagueti','pasta '],kcal:350,label:'Pasta seca'},
 {match:['harina'],kcal:360,label:'Harina'},
 {match:['leche en polvo','ninho'],kcal:500,label:'Leche en polvo'},
 {match:['chocolate'],kcal:535,label:'Chocolate'},
 {match:['arvejas'],kcal:75,label:'Arvejas en conserva'},
 {match:['choclo'],kcal:90,label:'Choclo en conserva'},
 {match:['extracto de tomate'],kcal:80,label:'Extracto de tomate'},
 {match:['sardinas'],kcal:180,label:'Sardinas'},
 {match:['miel'],kcal:304,label:'Miel'},
 {match:['mermelada'],kcal:250,label:'Mermelada'},
 {match:['frutillas'],kcal:80,label:'Frutillas en conserva'},
 {match:['arandanos'],kcal:80,label:'Arándanos en conserva'},
 {match:['frutos del bosque'],kcal:80,label:'Frutos del bosque en conserva'},
 {match:['duraznos'],kcal:70,label:'Duraznos en conserva'},
 {match:['mix energetico','mani, pasas','zyma'],kcal:500,label:'Mix de frutos secos'}
];
const EXCLUDED_FOOD=[
 {match:['cafe'],reason:'Bebida sin aporte energético relevante para esta estimación.'},
 {match:['sal fina'],reason:'No aporta calorías.'}
];

const n=(v,f=0)=>{const x=Number(v);return Number.isFinite(x)?x:f};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,n(v)));
const fmt=(v,d=1)=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n(v));
const fmt0=v=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(n(v));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const storage=()=>window.EDYStorage;
const inventory=()=>typeof window.getInventory==='function'?window.getInventory():storage()?.get('inventory',[])||[];
const humans=()=>typeof window.familyHumans==='function'?window.familyHumans():[];
const pets=()=>typeof window.familyPets==='function'?window.familyPets():[];
const todayStart=()=>{const d=new Date();d.setHours(0,0,0,0);return d};

function packageWeightGrams(item){
 const count=n(item.packageCount);
 const size=n(item.packageSize);
 const unit=norm(item.packageUnit);
 if(count>0&&size>0){
  if(unit==='kg'||unit.includes('kilogram'))return count*size*1000;
  if(unit==='g'||unit.includes('gram'))return count*size;
 }
 const qty=n(item.qty);
 const stockUnit=norm(item.unit);
 if(qty>0&&stockUnit==='kg')return qty*1000;
 if(qty>0&&stockUnit==='g')return qty;
 return 0;
}
function availableItem(item){return item&&item.status==='available'&&n(item.qty)>0}
function foodRule(item){
 const text=norm([item.id,item.name,item.brand,item.model,item.notes].join(' '));
 const excluded=EXCLUDED_FOOD.find(rule=>rule.match.some(word=>text.includes(norm(word))));
 if(excluded)return {excluded:true,reason:excluded.reason};
 const rule=FOOD_RULES.find(rule=>rule.match.some(word=>text.includes(norm(word))));
 return rule||null;
}
function foodEstimate(config){
 const included=[],excluded=[],unclassified=[];
 inventory().filter(item=>item.category==='Despensa'&&availableItem(item)).forEach(item=>{
  const grams=packageWeightGrams(item),rule=foodRule(item);
  if(rule?.excluded){excluded.push({item,reason:rule.reason});return}
  if(!rule||grams<=0){unclassified.push({item,reason:grams<=0?'Falta registrar el peso neto.':'Sin equivalencia energética configurada.'});return}
  const kcal=grams/100*rule.kcal;
  included.push({item,grams,kcal,kcal100:rule.kcal,label:rule.label});
 });
 const rawKcal=included.reduce((sum,row)=>sum+row.kcal,0);
 const usableKcal=rawKcal*clamp(config.foodUsablePct,1,100)/100;
 const days=config.foodDailyKcal>0?usableKcal/config.foodDailyKcal:0;
 return {included,excluded,unclassified,rawKcal,usableKcal,days};
}
function waterEstimate(config){
 const liters=typeof window.inventoryWaterLiters==='function'?n(window.inventoryWaterLiters()):inventory().filter(i=>i.category==='Agua'&&availableItem(i)).reduce((sum,i)=>sum+n(i.qty),0);
 const daily=Math.max(.1,n(config.waterDailyLiters));
 return {liters,daily,days:liters/daily};
}
function energyData(){return storage()?.get('energy_center_v22',{})||{}}
function energyEstimate(config){
 const wh=551;
 const batteryPercent=clamp(config.batteryPercent,0,100);
 const efficiency=clamp(config.energyEfficiency,1,100);
 const load=Math.max(1,n(config.criticalLoadW,30));
 const batteryHours=wh*(batteryPercent/100)*(efficiency/100)/load;
 const e=energyData(),liters=n(e?.generator?.storedLiters),rate=n(e?.generator?.consumptionLph);
 const generatorHours=liters>0&&rate>0?liters/rate:0;
 return {wh,batteryPercent,efficiency,load,batteryHours,generatorHours,totalHours:batteryHours+generatorHours,liters,rate};
}
function itemExpiryDate(item){
 const dates=(item.lots||[]).filter(l=>n(l.qty)>0&&l.expiryDate).map(l=>String(l.expiryDate));
 if(!dates.length)return null;
 const ts=dates.map(raw=>{
  if(/^\d{4}-\d{2}$/.test(raw)){const [y,m]=raw.split('-').map(Number);return new Date(y,m,0,23,59,59,999)}
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){const [y,m,d]=raw.split('-').map(Number);return new Date(y,m-1,d,23,59,59,999)}
  return null;
 }).filter(Boolean).sort((a,b)=>a-b);
 return ts[0]||null;
}
function medicalEstimate(){
 const items=inventory().filter(i=>i.category==='Botiquín');
 const critical=items.filter(i=>i.critical);
 const now=todayStart();
 const valid=i=>availableItem(i)&&(!itemExpiryDate(i)||itemExpiryDate(i)>=now);
 const available=items.filter(valid);
 const criticalValid=critical.filter(valid);
 const expired=items.filter(i=>itemExpiryDate(i)&&itemExpiryDate(i)<now);
 const soon=items.filter(i=>{const d=itemExpiryDate(i);return d&&d>=now&&(d-now)/86400000<=180});
 const denominator=critical.length||items.length||1;
 const numerator=critical.length?criticalValid.length:available.length;
 return {items,critical,available,criticalValid,expired,soon,coverage:Math.round(numerator/denominator*100)};
}
function detectedPetFoodKg(){
 return inventory().filter(i=>availableItem(i)&&/(balanceado|alimento.*perro|comida.*perro|dog food)/i.test(`${i.name} ${i.notes}`)).reduce((sum,i)=>sum+packageWeightGrams(i)/1000,0);
}
function petEstimate(config){
 const detected=detectedPetFoodKg();
 const stock=detected>0?detected:Math.max(0,n(config.petFoodKg));
 const daily=Math.max(0,n(config.petDailyKg));
 return {detected,stock,daily,days:daily>0?stock/daily:0,configured:stock>0&&daily>0};
}
function statusFor(value,target){
 const ratio=target>0?value/target:0;
 if(ratio>=1)return {className:'ready',icon:'🟢',label:'Objetivo cubierto'};
 if(ratio>=.5)return {className:'attention',icon:'🟡',label:'Cobertura parcial'};
 return {className:'danger',icon:'🔴',label:'Prioridad'};
}
function scorePart(value,target){return Math.round(Math.min(100,Math.max(0,target>0?value/target*100:0)))}
function calculate(config=getConfig()){
 const water=waterEstimate(config),food=foodEstimate(config),energy=energyEstimate(config),medical=medicalEstimate(),pet=petEstimate(config);
 const parts=[
  {id:'water',score:scorePart(water.days,config.targetDays)},
  {id:'food',score:scorePart(food.days,config.targetDays)},
  {id:'energy',score:scorePart(energy.totalHours,config.energyTargetHours)},
  {id:'medical',score:medical.coverage}
 ];
 if(pets().length>0)parts.push({id:'pets',score:pet.configured?scorePart(pet.days,config.targetDays):0});
 const overall=Math.round(parts.reduce((s,p)=>s+p.score,0)/Math.max(1,parts.length));
 return {config,water,food,energy,medical,pet,parts,overall};
}
function defaultConfig(){
 const savedWater=typeof window.familyDailyWater==='function'?n(window.familyDailyWater()):0;
 const humanCount=Math.max(1,humans().length||5);
 const e=energyData();
 return {
  targetDays:DEFAULT_TARGET_DAYS,
  waterDailyLiters:savedWater>0?savedWater:humanCount*3,
  foodDailyKcal:humanCount*2000,
  foodUsablePct:85,
  criticalLoadW:30,
  batteryPercent:clamp(e?.forzaBatteryPercent??100,0,100),
  energyEfficiency:85,
  energyTargetHours:24,
  petFoodKg:0,
  petDailyKg:0,
  updated:''
 };
}
function getConfig(){return {...defaultConfig(),...(storage()?.get(AUTONOMY_KEY,{})||{})}}
function readConfigFromForm(){
 const get=id=>document.getElementById(id)?.value;
 return {
  ...getConfig(),
  targetDays:Math.max(1,n(get('autTargetDays'),DEFAULT_TARGET_DAYS)),
  waterDailyLiters:Math.max(.1,n(get('autWaterDaily'),defaultConfig().waterDailyLiters)),
  foodDailyKcal:Math.max(100,n(get('autFoodDailyKcal'),defaultConfig().foodDailyKcal)),
  foodUsablePct:clamp(get('autFoodUsablePct'),1,100),
  criticalLoadW:Math.max(1,n(get('autCriticalLoadW'),30)),
  batteryPercent:clamp(get('autBatteryPercent'),0,100),
  energyEfficiency:clamp(get('autEnergyEfficiency'),1,100),
  energyTargetHours:Math.max(1,n(get('autEnergyTargetHours'),24)),
  petFoodKg:Math.max(0,n(get('autPetFoodKg'))),
  petDailyKg:Math.max(0,n(get('autPetDailyKg'))),
  updated:new Date().toISOString()
 };
}
function fillForm(config=getConfig()){
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??''};
 set('autTargetDays',config.targetDays);set('autWaterDaily',config.waterDailyLiters);set('autFoodDailyKcal',config.foodDailyKcal);
 set('autFoodUsablePct',config.foodUsablePct);set('autCriticalLoadW',config.criticalLoadW);set('autBatteryPercent',config.batteryPercent);
 set('autEnergyEfficiency',config.energyEfficiency);set('autEnergyTargetHours',config.energyTargetHours);set('autPetFoodKg',config.petFoodKg||'');set('autPetDailyKg',config.petDailyKg||'');
 const detected=detectedPetFoodKg(),hint=document.getElementById('autPetDetected');
 if(hint)hint.textContent=detected>0?`EDY detectó ${fmt(detected,2)} kg en el inventario.`:'No se detectó alimento para mascotas en el inventario.';
}
function metricCard(icon,title,value,detail,status,action=''){
 return `<article class="autMetric ${status.className}" ${action?`onclick="${action}"`:''}><div class="autMetricTop"><span>${icon}</span><b>${esc(title)}</b><i>${status.icon}</i></div><strong>${esc(value)}</strong><small>${esc(detail)}</small><em>${esc(status.label)}</em></article>`
}
function priorityList(result){
 const c=result.config,rows=[];
 if(result.water.days<c.targetDays){const need=Math.max(0,c.targetDays*result.water.daily-result.water.liters);rows.push({level:'danger',icon:'💧',title:`Agregar ${fmt(need,0)} L de agua potable`,detail:`Para llegar a ${c.targetDays} días con el consumo configurado.`})}
 if(result.food.days<c.targetDays){const need=Math.max(0,c.targetDays*c.foodDailyKcal-result.food.usableKcal);rows.push({level:'danger',icon:'🍲',title:`Faltan aproximadamente ${fmt0(need)} kcal de reserva`,detail:'Completá con alimentos variados, no solamente azúcar o harinas.'})}
 if(result.energy.totalHours<c.energyTargetHours){rows.push({level:'attention',icon:'🔋',title:`Energía crítica por debajo de ${c.energyTargetHours} h`,detail:'Reducí la carga, registrá combustible real o sumá generación solar compatible.'})}
 if(result.medical.expired.length)rows.push({level:'danger',icon:'💊',title:`${result.medical.expired.length} producto(s) vencido(s) en botiquín`,detail:'Separalos del stock operativo y gestioná su reemplazo seguro.'});
 else if(result.medical.soon.length)rows.push({level:'attention',icon:'💊',title:`${result.medical.soon.length} producto(s) vencen dentro de 180 días`,detail:'Planificá rotación y reposición.'});
 if(pets().length>0&&!result.pet.configured)rows.push({level:'danger',icon:'🐶',title:'Completar alimento de Bella y Manchas',detail:'Registrá kilos disponibles y consumo diario conjunto.'});
 else if(pets().length>0&&result.pet.days<c.targetDays){const need=Math.max(0,c.targetDays*result.pet.daily-result.pet.stock);rows.push({level:'attention',icon:'🐶',title:`Agregar ${fmt(need,2)} kg de alimento para mascotas`,detail:`Para llegar a ${c.targetDays} días.`})}
 if(result.food.unclassified.length)rows.push({level:'attention',icon:'⚖️',title:`${result.food.unclassified.length} alimento(s) no computados`,detail:'Registrá peso neto o revisá el detalle para incorporarlos al cálculo.'});
 if(!rows.length)rows.push({level:'ready',icon:'✅',title:'Objetivos configurados cubiertos',detail:'Mantené rotación, pruebas y respaldo del inventario.'});
 return rows;
}
function renderOverview(result){
 const box=document.getElementById('autonomyOverview');if(!box)return;
 const c=result.config;
 const waterStatus=statusFor(result.water.days,c.targetDays),foodStatus=statusFor(result.food.days,c.targetDays),energyStatus=statusFor(result.energy.totalHours,c.energyTargetHours);
 const medStatus=result.medical.coverage>=90?{className:'ready',icon:'🟢',label:'Cobertura alta'}:result.medical.coverage>=60?{className:'attention',icon:'🟡',label:'Revisar faltantes'}:{className:'danger',icon:'🔴',label:'Cobertura baja'};
 const petStatus=result.pet.configured?statusFor(result.pet.days,c.targetDays):{className:'danger',icon:'🔴',label:'Sin calcular'};
 box.innerHTML=`
  <div class="autScoreCard"><div class="autScoreRing" style="--aut-score:${result.overall}"><span>${result.overall}%</span></div><div><strong>Preparación calculada</strong><p>${result.overall>=80?'Cobertura sólida para los objetivos definidos.':result.overall>=50?'Cobertura intermedia: hay áreas por reforzar.':'La calculadora detecta prioridades importantes.'}</p><small>Objetivo general: ${c.targetDays} días · energía crítica: ${c.energyTargetHours} h.</small></div></div>
  <div class="autMetrics">
   ${metricCard('💧','Agua',`${fmt(result.water.days)} días`,`${fmt(result.water.liters,0)} L · ${fmt(result.water.daily)} L/día`,waterStatus,"openSection('agua')")}
   ${metricCard('🍲','Alimentos',`${fmt(result.food.days)} días`,`${fmt0(result.food.usableKcal)} kcal útiles estimadas`,foodStatus,"openSection('inventario')")}
   ${metricCard('🔋','Energía',`${fmt(result.energy.totalHours)} h`,`${fmt(result.energy.batteryHours)} h batería${result.energy.generatorHours>0?` + ${fmt(result.energy.generatorHours)} h generador`:''}`,energyStatus,"openSection('centroEnergia')")}
   ${metricCard('💊','Botiquín',`${result.medical.coverage}%`,`${result.medical.available.length}/${result.medical.items.length} productos vigentes`,medStatus,"openSection('inventario')")}
   ${pets().length?metricCard('🐶','Mascotas',result.pet.configured?`${fmt(result.pet.days)} días`:'Pendiente',result.pet.configured?`${fmt(result.pet.stock,2)} kg · ${fmt(result.pet.daily,2)} kg/día`:'Completá stock y consumo conjunto',petStatus,"openSection('mascotas')"):''}
  </div>`;
}
function renderPriorities(result){
 const box=document.getElementById('autonomyPriorities');if(!box)return;
 box.innerHTML=priorityList(result).map(row=>`<div class="autPriority ${row.level}"><span>${row.icon}</span><div><strong>${esc(row.title)}</strong><small>${esc(row.detail)}</small></div></div>`).join('');
}
function renderFoodBreakdown(result){
 const box=document.getElementById('autonomyFoodBreakdown');if(!box)return;
 const rows=result.food.included.sort((a,b)=>b.kcal-a.kcal).map(row=>`<tr><td>${esc(row.item.name)}${row.item.brand?` <small>${esc(row.item.brand)}</small>`:''}</td><td>${fmt(row.grams/1000,2)} kg</td><td>${fmt0(row.kcal)}</td><td>${fmt0(row.kcal100)} kcal/100 g</td></tr>`).join('');
 const skipped=[...result.food.excluded,...result.food.unclassified];
 box.innerHTML=`<div class="autFoodTotals"><div><span>Peso computado</span><strong>${fmt(result.food.included.reduce((s,r)=>s+r.grams,0)/1000,2)} kg</strong></div><div><span>Energía bruta</span><strong>${fmt0(result.food.rawKcal)} kcal</strong></div><div><span>Reserva utilizable</span><strong>${fmt0(result.food.usableKcal)} kcal</strong></div></div>
  <div class="autTableWrap"><table class="autTable"><thead><tr><th>Producto</th><th>Peso</th><th>Aporte estimado</th><th>Referencia</th></tr></thead><tbody>${rows||'<tr><td colspan="4">No hay alimentos computables.</td></tr>'}</tbody></table></div>
  ${skipped.length?`<details class="autDetails"><summary>${skipped.length} producto(s) no computados</summary>${skipped.map(r=>`<div><strong>${esc(r.item.name)}</strong><small>${esc(r.reason)}</small></div>`).join('')}</details>`:''}`;
}
function renderHome(result=calculate()){
 const box=document.getElementById('autonomyHomeSummary');if(!box)return;
 const c=result.config;
 const tiles=[
  ['💧','Agua',`${fmt(result.water.days)} días`,statusFor(result.water.days,c.targetDays)],
  ['🍲','Alimentos',`${fmt(result.food.days)} días`,statusFor(result.food.days,c.targetDays)],
  ['🔋','Energía',`${fmt(result.energy.totalHours)} h`,statusFor(result.energy.totalHours,c.energyTargetHours)],
  ['💊','Botiquín',`${result.medical.coverage}%`,result.medical.coverage>=90?{className:'ready',icon:'🟢'}:result.medical.coverage>=60?{className:'attention',icon:'🟡'}:{className:'danger',icon:'🔴'}]
 ];
 box.innerHTML=`<button class="autHomeScore" onclick="openSection('autonomia')"><span class="autHomeRing" style="--aut-score:${result.overall}"><b>${result.overall}%</b></span><span><strong>Calculadora de autonomía</strong><small>Objetivo ${c.targetDays} días · tocar para ver prioridades</small></span><i>›</i></button><div class="autHomeTiles">${tiles.map(t=>`<button class="${t[3].className}" onclick="openSection('autonomia')"><span>${t[0]} ${t[1]}</span><strong>${t[2]}</strong><i>${t[3].icon}</i></button>`).join('')}</div>`;
}
function render(){
 const config=getConfig();fillForm(config);const result=calculate(config);renderOverview(result);renderPriorities(result);renderFoodBreakdown(result);renderHome(result);
 const stamp=document.getElementById('autonomyUpdated');if(stamp)stamp.textContent=config.updated?`Ajustes guardados: ${new Date(config.updated).toLocaleString('es-AR')}`:'Los valores iniciales son editables y se guardan solamente en este dispositivo.';
 return result;
}
function save(){const config=readConfigFromForm();storage()?.set(AUTONOMY_KEY,config);if(typeof window.addTimelineEntry==='function')window.addTimelineEntry('autonomy','📊','Calculadora de autonomía actualizada');render();}
function reset(){if(!confirm('¿Restablecer los supuestos de la calculadora? No se borrará el inventario.'))return;storage()?.remove(AUTONOMY_KEY);fillForm(defaultConfig());render();}
function sync(){const c=getConfig(),d=defaultConfig();c.waterDailyLiters=d.waterDailyLiters;c.foodDailyKcal=d.foodDailyKcal;c.batteryPercent=d.batteryPercent;storage()?.set(AUTONOMY_KEY,{...c,updated:new Date().toISOString()});render();}
function applyToOperations(){
 const result=calculate(readConfigFromForm());
 const old=typeof window.getOperations==='function'?window.getOperations():(storage()?.get('operations',{})||{});
 const data={...old,waterLiters:result.water.liters,people:Math.max(1,humans().length||old.people||5),waterPerPerson:result.water.daily/Math.max(1,humans().length||old.people||5),foodDays:Number(result.food.days.toFixed(1)),energyHours:Number(result.energy.totalHours.toFixed(1)),updated:new Date().toLocaleString('es-AR'),updatedISO:new Date().toISOString()};
 storage()?.set('operations',data);
 if(typeof window.addTimelineEntry==='function')window.addTimelineEntry('operations','📊','Centro de Operaciones sincronizado con la calculadora 2.5');
 if(typeof window.loadOperationsForm==='function')window.loadOperationsForm();if(typeof window.renderOperationsResult==='function')window.renderOperationsResult();if(typeof window.renderOperationsHome==='function')window.renderOperationsHome();
 alert('Agua, alimentos y energía fueron enviados al Centro de Operaciones.');
 render();
}
function printReport(){
 const result=calculate(readConfigFromForm()),priorities=priorityList(result),w=window.open('','_blank');if(!w){alert('Permití las ventanas emergentes para imprimir el informe.');return}
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>EDY 2.5.2 - Informe de autonomía</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:32px auto;color:#17251f}h1{color:#174a37}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.card{border:1px solid #ccd8d1;border-radius:12px;padding:14px}.card strong{display:block;font-size:24px;margin:6px 0}li{margin:8px 0}.note{background:#fff5d9;padding:12px;border-radius:10px}@media print{button{display:none}}</style></head><body><h1>EDY Offline 2.5.2 · Familia Dell’Era · Informe de autonomía</h1><p>Generado: ${new Date().toLocaleString('es-AR')}</p><div class="grid"><div class="card">Agua<strong>${fmt(result.water.days)} días</strong>${fmt(result.water.liters,0)} L disponibles</div><div class="card">Alimentos<strong>${fmt(result.food.days)} días</strong>${fmt0(result.food.usableKcal)} kcal útiles estimadas</div><div class="card">Energía<strong>${fmt(result.energy.totalHours)} horas</strong>Carga crítica ${fmt(result.energy.load,0)} W</div><div class="card">Botiquín<strong>${result.medical.coverage}%</strong>${result.medical.available.length}/${result.medical.items.length} productos vigentes</div></div><h2>Prioridades</h2><ul>${priorities.map(p=>`<li><b>${esc(p.title)}</b>: ${esc(p.detail)}</li>`).join('')}</ul><p class="note"><b>Importante:</b> son estimaciones de planificación. La autonomía alimentaria se basa en calorías aproximadas y no garantiza una dieta completa; la energía depende del consumo real y el generador debe usarse solamente al aire libre.</p><button onclick="print()">Imprimir</button></body></html>`);w.document.close();
}

window.renderAutonomy=render;
window.saveAutonomy=save;
window.resetAutonomy=reset;
window.syncAutonomyDefaults=sync;
window.applyAutonomyToOperations=applyToOperations;
window.printAutonomyReport=printReport;

const oldOpen=window.openSection;
if(typeof oldOpen==='function')window.openSection=function(id){oldOpen(id);if(id==='autonomia')setTimeout(render,0)};
const oldHome=window.home;
if(typeof oldHome==='function')window.home=function(){oldHome();setTimeout(()=>renderHome(calculate()),0)};
const oldSaveInventory=window.saveInventory;
if(typeof oldSaveInventory==='function')window.saveInventory=function(...args){const out=oldSaveInventory.apply(this,args);setTimeout(()=>{renderHome(calculate());if(document.getElementById('autonomia')?.classList.contains('active'))render()},0);return out};

setTimeout(()=>{render();},1200);
setTimeout(()=>{render();},3500);
})();

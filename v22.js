/* EDY Offline 2.2 · Centro de Energía y Modo Apagón */
(() => {
  'use strict';

  const VERSION='2.4.1';
  const ENERGY_KEY='energy_center_v22';
  const BLACKOUT_KEY='blackout_mode_v22';
  const DAY=86400000;

  const n=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const round=value=>Math.round(n(value)*10)/10;
  const fmt=value=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(n(value));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const dateToday=()=>new Date().toISOString().slice(0,10);
  const addDays=(date,days)=>{if(!date)return '';const parsed=new Date(`${date}T12:00:00`);if(Number.isNaN(parsed.getTime()))return '';parsed.setDate(parsed.getDate()+days);return parsed.toISOString().slice(0,10)};
  const formatDate=date=>{if(!date)return 'Sin registrar';const parsed=new Date(`${date}T12:00:00`);return Number.isNaN(parsed.getTime())?date:parsed.toLocaleDateString('es-AR')};
  const storage=()=>typeof EDYStorage!=='undefined'?EDYStorage:window.EDYStorage;
  const inventory=()=>typeof window.getInventory==='function'?window.getInventory():(storage()?.get('inventory',[])||[]);
  const itemText=item=>`${item?.name||''} ${item?.brand||''} ${item?.model||''} ${item?.category||''} ${item?.notes||''}`.toLowerCase();
  const findItem=(...terms)=>inventory().find(item=>terms.some(term=>itemText(item).includes(term.toLowerCase())));
  const availableQty=item=>item&&item.status!=='missing'&&item.status!=='unavailable'?Math.max(0,n(item.qty)):0;

  const SOURCE_SPECS={
    gamma:{label:'Generador Gamma 7500 IE',continuousW:6000,peakW:7000,kind:'generator'},
    forza:{label:'Forza FPP-T702',continuousW:700,peakW:null,energyWh:551,kind:'battery'}
  };

  const DEFAULT_LOADS=[
    {id:'lights',name:'Iluminación LED esencial',watts:60,startupWatts:60,enabled:true,estimate:true,locked:true},
    {id:'router',name:'Router / módem',watts:25,startupWatts:25,enabled:true,estimate:true,locked:true},
    {id:'phones',name:'Carga de celulares',watts:30,startupWatts:30,enabled:true,estimate:true,locked:true},
    {id:'ipad',name:'Carga de iPad',watts:45,startupWatts:45,enabled:true,estimate:true,locked:true},
    {id:'fridge',name:'Heladera',watts:200,startupWatts:1200,enabled:false,estimate:true,locked:true},
    {id:'freezer',name:'Freezer',watts:200,startupWatts:1200,enabled:false,estimate:true,locked:true},
    {id:'pump',name:'Bomba de agua',watts:0,startupWatts:0,enabled:false,estimate:false,locked:true}
  ];

  const ENERGY_DEFAULT={
    source:'gamma',
    generator:{
      fuelType:'unknown',storedLiters:'',consumptionLph:'',fuelStoredDate:'',nextFuelRotation:'',
      lastTest:'',lastOilChange:'',engineHours:'',nextServiceHours:'',batteryStatus:'unknown',oilStatus:'unknown',
      location:'',notes:''
    },
    forzaBatteryPercent:100,
    loads:DEFAULT_LOADS,
    updated:'',updatedISO:''
  };

  const BLACKOUT_STEPS=[
    {id:'safe-area',phase:'Primeros 15 minutos',text:'Confirmar que no haya humo, chispas, cables caídos, olor a quemado ni personas heridas.'},
    {id:'scope',phase:'Primeros 15 minutos',text:'Comprobar si el corte afecta solo a la vivienda o a toda la zona.'},
    {id:'unplug',phase:'Primeros 15 minutos',text:'Desconectar equipos innecesarios y proteger los aparatos sensibles.'},
    {id:'cold',phase:'Primeros 15 minutos',text:'Mantener cerradas la heladera y el freezer.'},
    {id:'devices',phase:'Primeros 15 minutos',text:'Activar bajo consumo en celulares y iPad.'},
    {id:'quiet-power',phase:'De 15 a 60 minutos',text:'Usar primero la Forza para iluminación, comunicaciones y cargas pequeñas silenciosas.'},
    {id:'generator-outdoor',phase:'De 15 a 60 minutos',text:'Si hace falta el generador, trasladarlo al exterior, lejos de puertas, ventanas y entradas de aire.'},
    {id:'oil-check',phase:'De 15 a 60 minutos',text:'Controlar el nivel de aceite antes de arrancar el generador.'},
    {id:'safe-connection',phase:'De 15 a 60 minutos',text:'Conectar cargas directamente o mediante una transferencia instalada por un electricista. Nunca retroalimentar la casa desde un tomacorriente.'},
    {id:'fuel-log',phase:'De 15 a 60 minutos',text:'Registrar litros de combustible disponibles y consumo observado.'},
    {id:'water-pump',phase:'Primeras 24 horas',text:'Definir ventanas breves para la bomba de agua y otros equipos de alto consumo.'},
    {id:'load-plan',phase:'Primeras 24 horas',text:'Revisar el plan de cargas y no superar la potencia continua ni los picos de arranque.'},
    {id:'comms-window',phase:'Primeras 24 horas',text:'Establecer horarios de comunicación y carga para ahorrar energía.'},
    {id:'mosquito',phase:'Primeras 24 horas',text:'Preparar protección contra mosquitos para la noche y usar los espirales según el rótulo.'},
    {id:'fuel-rotate',phase:'De 24 a 48 horas',text:'Racionar combustible y recalcular la autonomía con el consumo real.'},
    {id:'food',phase:'De 24 a 48 horas',text:'Priorizar alimentos refrigerados y vigilar la cadena de frío.'},
    {id:'official',phase:'De 24 a 48 horas',text:'Revisar avisos oficiales y evaluar si el corte requiere cambiar el plan familiar.'},
    {id:'reassess',phase:'De 48 a 72 horas',text:'Reevaluar agua, alimentos, combustible, salud, seguridad y posibilidad de evacuación.'}
  ];

  function clone(value){return JSON.parse(JSON.stringify(value))}

  function mergeLoads(saved){
    const existing=Array.isArray(saved)?saved:[];
    const byId=new Map(existing.map(load=>[load.id,load]));
    const defaults=DEFAULT_LOADS.map(load=>({...load,...byId.get(load.id)}));
    const custom=existing.filter(load=>!DEFAULT_LOADS.some(base=>base.id===load.id));
    return [...defaults,...custom].map(load=>({
      id:String(load.id||`custom-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name:String(load.name||'Equipo'),watts:Math.max(0,n(load.watts)),startupWatts:Math.max(0,n(load.startupWatts,n(load.watts))),
      enabled:Boolean(load.enabled),estimate:Boolean(load.estimate),locked:Boolean(load.locked)
    }));
  }

  function getEnergy(){
    const saved=storage()?.get(ENERGY_KEY,null);
    const merged={...clone(ENERGY_DEFAULT),...(saved||{})};
    merged.generator={...clone(ENERGY_DEFAULT.generator),...(saved?.generator||{})};
    merged.loads=mergeLoads(saved?.loads);
    if(!SOURCE_SPECS[merged.source])merged.source='gamma';
    return merged;
  }

  function setEnergy(data,message){
    data.updated=new Date().toLocaleString('es-AR');
    data.updatedISO=new Date().toISOString();
    storage()?.set(ENERGY_KEY,data);
    if(message&&typeof window.addTimelineEntry==='function')window.addTimelineEntry('energy','⚡',message);
    renderEnergyCenter();renderV22Home();renderBlackoutMode();
  }

  function getBlackout(){
    const saved=storage()?.get(BLACKOUT_KEY,{})||{};
    const savedSteps=Array.isArray(saved.steps)?saved.steps:[];
    const doneMap=new Map(savedSteps.map(step=>[step.id,Boolean(step.done)]));
    return {
      active:Boolean(saved.active),startedAt:saved.startedAt||'',endedAt:saved.endedAt||'',
      steps:BLACKOUT_STEPS.map(step=>({...step,done:doneMap.get(step.id)||false}))
    };
  }

  function setBlackout(data,message){
    storage()?.set(BLACKOUT_KEY,data);
    if(message&&typeof window.addTimelineEntry==='function')window.addTimelineEntry('emergency','🔌',message);
    renderBlackoutMode();renderV22Home();
  }

  function sourceCards(){
    const gamma=findItem('gamma 7500','generador eléctrico portátil');
    const forza=findItem('forza fpp-t702','estación de energía portátil');
    const spica=findItem('spica sur-60','panel solar portátil');
    const card=(item,icon,title,details,id,photo)=>{
      const qty=availableQty(item);
      const state=!item?'No registrado':item.status==='available'?'Disponible':item.status==='review'?'Revisar':item.status==='incoming'?'En camino':'No disponible';
      return `<article class="energySourceCard ${qty?'ready':'attention'}">
        ${photo?`<img src="${photo}" alt="${esc(title)}">`:''}
        <div class="energySourceHead"><span>${icon}</span><div><strong>${esc(title)}</strong><small>${esc(details)}</small></div></div>
        <div class="energySourceState"><b>${esc(state)}</b><span>${qty?`${fmt(qty)} ${esc(item.unit||'unidad')}`:'Sin disponibilidad confirmada'}</span></div>
        ${id?`<button class="miniAction" onclick="openItem('${id}')">Abrir ficha</button>`:''}
      </article>`;
    };
    return [
      card(gamma,'⚡','Gamma 7500 IE','6.000 W continuos · 7.000 W máximos','starter-generador-gamma-7500-ie','assets/generador-gamma-7500-ie.webp'),
      card(forza,'🔋','Forza FPP-T702','700 W · 551 Wh','starter-forza-fpp-t702',''),
      card(spica,'☀️','SPICA SUR-60','Carga solar portátil · compatibilidad pendiente de prueba','starter-spica-sur-60','')
    ].join('');
  }

  function loadTotals(data=getEnergy()){
    const enabled=data.loads.filter(load=>load.enabled);
    const running=enabled.reduce((sum,load)=>sum+n(load.watts),0);
    const largestExtra=enabled.reduce((max,load)=>Math.max(max,Math.max(0,n(load.startupWatts)-n(load.watts))),0);
    return {running,projectedPeak:running+largestExtra,count:enabled.length};
  }

  function generatorAutonomy(data=getEnergy()){
    const liters=n(data.generator.storedLiters);
    const rate=n(data.generator.consumptionLph);
    return liters>0&&rate>0?liters/rate:null;
  }

  function batteryAutonomy(data=getEnergy()){
    const totals=loadTotals(data);
    const percent=Math.min(100,Math.max(0,n(data.forzaBatteryPercent,100)));
    if(totals.running<=0)return null;
    return 551*(percent/100)*0.85/totals.running;
  }

  function testStatus(data=getEnergy()){
    const last=data.generator.lastTest;
    if(!last)return {className:'attention',label:'Prueba pendiente',detail:'No se registró una prueba de arranque.'};
    const due=addDays(last,30),today=dateToday();
    if(due<today)return {className:'danger',label:'Prueba vencida',detail:`Debía realizarse el ${formatDate(due)}.`};
    const days=Math.ceil((new Date(`${due}T12:00:00`)-new Date(`${today}T12:00:00`))/DAY);
    return {className:days<=7?'attention':'ready',label:days<=7?'Prueba próxima':'Prueba al día',detail:`Próxima revisión: ${formatDate(due)}.`};
  }

  function serviceStatus(data=getEnergy()){
    const current=n(data.generator.engineHours);
    const next=n(data.generator.nextServiceHours);
    if(next>0&&current>=next)return {className:'danger',label:'Service por horas vencido',detail:`${fmt(current)} h registradas · objetivo ${fmt(next)} h.`};
    if(next>0)return {className:next-current<=5?'attention':'ready',label:'Service por horas',detail:`Faltan ${fmt(next-current)} h para el control.`};
    if(data.generator.lastOilChange)return {className:'ready',label:'Aceite registrado',detail:`Último cambio: ${formatDate(data.generator.lastOilChange)}. Intervalo según manual pendiente.`};
    return {className:'attention',label:'Aceite sin historial',detail:'Registrá el último cambio y el intervalo indicado por el manual.'};
  }

  function fuelRotationStatus(data=getEnergy()){
    const due=data.generator.nextFuelRotation;
    if(!due)return {className:'attention',label:'Rotación sin fecha',detail:'Definí la próxima fecha según el combustible y su almacenamiento.'};
    if(due<dateToday())return {className:'danger',label:'Rotación vencida',detail:`Fecha prevista: ${formatDate(due)}.`};
    const days=Math.ceil((new Date(`${due}T12:00:00`)-new Date(`${dateToday()}T12:00:00`))/DAY);
    return {className:days<=14?'attention':'ready',label:days<=14?'Rotación próxima':'Combustible controlado',detail:`Próxima rotación: ${formatDate(due)}.`};
  }

  function powerAssessment(data=getEnergy()){
    const source=SOURCE_SPECS[data.source]||SOURCE_SPECS.gamma;
    const totals=loadTotals(data);
    const peakLimit=source.peakW||source.continuousW;
    let className='ready',title='Carga compatible con los valores registrados';
    if(totals.running>source.continuousW||totals.projectedPeak>peakLimit){className='danger';title='La selección supera la fuente elegida';}
    else if(totals.running>source.continuousW*.8||totals.projectedPeak>peakLimit*.9){className='attention';title='Carga cercana al límite; dejá más margen';}
    if(!totals.count){className='attention';title='Seleccioná al menos una carga';}
    return {source,totals,peakLimit,className,title};
  }

  function renderPowerSummary(){
    const box=document.getElementById('energyLoadResult');if(!box)return;
    const data=getEnergy(),assessment=powerAssessment(data),{source,totals}=assessment;
    const autonomy=source.kind==='battery'?batteryAutonomy(data):generatorAutonomy(data);
    const autonomyText=autonomy===null?(source.kind==='battery'?'Seleccioná cargas para estimar horas.':'Cargá litros disponibles y consumo real en L/h.'):`${fmt(autonomy)} horas estimadas`;
    const peakNote=source.peakW?`Pico registrado: ${fmt(source.peakW)} W.`:'La potencia de pico de la Forza no fue confirmada; EDY usa 700 W como límite conservador.';
    box.className=`energyLoadResult ${assessment.className}`;
    box.innerHTML=`<div><strong>${esc(assessment.title)}</strong><small>${esc(source.label)}</small></div>
      <div class="energyLoadNumbers"><span><b>${fmt(totals.running)} W</b> continuos</span><span><b>${fmt(totals.projectedPeak)} W</b> pico estimado</span><span><b>${fmt(source.continuousW)} W</b> límite continuo</span></div>
      <p>${esc(autonomyText)} ${esc(peakNote)}</p>
      <small>Los valores precargados son orientativos. Reemplazalos por la potencia de la placa de cada equipo. El pico supone que arranca un motor a la vez.</small>`;
  }

  function renderLoads(){
    const box=document.getElementById('energyLoads');if(!box)return;
    const data=getEnergy();
    box.innerHTML=data.loads.map(load=>`<div class="energyLoadRow ${load.enabled?'enabled':''}">
      <label class="energyLoadToggle"><input type="checkbox" ${load.enabled?'checked':''} onchange="updateEnergyLoad('${esc(load.id)}','enabled',this.checked)"><span></span></label>
      <div class="energyLoadName"><input value="${esc(load.name)}" ${load.locked?'readonly':''} onchange="updateEnergyLoad('${esc(load.id)}','name',this.value)"><small>${load.estimate?'Valor orientativo: verificar placa':'Dato pendiente de completar'}</small></div>
      <label><span>Consumo</span><input type="number" min="0" step="1" value="${n(load.watts)}" onchange="updateEnergyLoad('${esc(load.id)}','watts',this.value)"><b>W</b></label>
      <label><span>Arranque</span><input type="number" min="0" step="1" value="${n(load.startupWatts)}" onchange="updateEnergyLoad('${esc(load.id)}','startupWatts',this.value)"><b>W</b></label>
      ${load.locked?'<span class="energyLoadLock">Base</span>':`<button class="deleteBtn" onclick="deleteEnergyLoad('${esc(load.id)}')">🗑️</button>`}
    </div>`).join('');
    renderPowerSummary();
  }

  function renderMaintenance(){
    const box=document.getElementById('generatorMaintenanceStatus');if(!box)return;
    const rows=[testStatus(),serviceStatus(),fuelRotationStatus()];
    const data=getEnergy();
    const battery={good:['ready','Batería de arranque OK'],weak:['attention','Batería débil'],replace:['danger','Reemplazar batería'],unknown:['attention','Batería sin revisar']}[data.generator.batteryStatus]||['attention','Batería sin revisar'];
    rows.push({className:battery[0],label:battery[1],detail:'Estado registrado manualmente.'});
    const oil={good:['ready','Nivel de aceite OK'],low:['danger','Aceite bajo'],change:['attention','Aceite por cambiar'],unknown:['attention','Nivel de aceite sin revisar']}[data.generator.oilStatus]||['attention','Nivel de aceite sin revisar'];
    rows.push({className:oil[0],label:oil[1],detail:'Revisar siempre antes de arrancar.'});
    box.innerHTML=rows.map(row=>`<div class="energyStatusRow ${row.className}"><span></span><div><strong>${esc(row.label)}</strong><small>${esc(row.detail)}</small></div></div>`).join('');
  }

  function fillEnergyForm(){
    const data=getEnergy(),g=data.generator;
    const set=(id,value)=>{const element=document.getElementById(id);if(element)element.value=value??''};
    set('energySource',data.source);set('forzaBatteryPercent',data.forzaBatteryPercent);
    set('genFuelType',g.fuelType);set('genStoredLiters',g.storedLiters);set('genConsumptionLph',g.consumptionLph);
    set('genFuelStoredDate',g.fuelStoredDate);set('genNextFuelRotation',g.nextFuelRotation);set('genLastTest',g.lastTest);
    set('genLastOilChange',g.lastOilChange);set('genEngineHours',g.engineHours);set('genNextServiceHours',g.nextServiceHours);
    set('genBatteryStatus',g.batteryStatus);set('genOilStatus',g.oilStatus);set('genLocation',g.location);set('genNotes',g.notes);
  }

  function renderEnergyOverview(){
    const box=document.getElementById('energyOverview');if(!box)return;
    const data=getEnergy(),autonomy=generatorAutonomy(data),test=testStatus(data),fuel=n(data.generator.storedLiters);
    const raid=findItem('raid espirales country','espirales repelentes contra mosquitos');
    const nights=availableQty(raid);
    box.innerHTML=`
      <div><span>Generador principal</span><strong>6.000 W</strong><small>Gamma 7500 IE · potencia continua</small></div>
      <div><span>Combustible registrado</span><strong>${fuel>0?`${fmt(fuel)} L`:'Pendiente'}</strong><small>${autonomy===null?'Falta consumo real en L/h':`${fmt(autonomy)} h estimadas`}</small></div>
      <div class="${test.className}"><span>Prueba mensual</span><strong>${esc(test.label)}</strong><small>${esc(test.detail)}</small></div>
      <div><span>Protección nocturna</span><strong>${fmt(nights)} espirales</strong><small>${nights?`Hasta ${fmt(nights)} noches según envase`:'Sin disponibilidad'}</small></div>`;
  }

  function renderEnergyCenter(){
    if(!document.getElementById('centroEnergia'))return;
    fillEnergyForm();
    renderEnergyOverview();
    const cards=document.getElementById('energySourceCards');if(cards)cards.innerHTML=sourceCards();
    renderLoads();renderMaintenance();
    const data=getEnergy(),auto=generatorAutonomy(data);
    const fuel=document.getElementById('generatorFuelSummary');if(fuel){
      const fuelLabel={gasoline:'Nafta',diesel:'Diésel',gas:'Gas',unknown:'Sin confirmar'}[data.generator.fuelType]||'Sin confirmar';
      fuel.innerHTML=`<strong>${n(data.generator.storedLiters)>0?`${fmt(data.generator.storedLiters)} L`:'Sin litros registrados'}</strong><span>${esc(fuelLabel)} · ${auto===null?'autonomía pendiente':`${fmt(auto)} h estimadas`}</span>`;
    }
  }

  function raidExpiry(){
    const raid=findItem('raid espirales country','espirales repelentes contra mosquitos');
    const expiry=(raid?.lots||[]).filter(lot=>lot.expiryDate&&n(lot.qty)>0).sort((a,b)=>String(a.expiryDate).localeCompare(String(b.expiryDate)))[0]?.expiryDate||'';
    if(!expiry)return 'Vencimiento sin registrar';
    const days=Math.ceil((new Date(`${expiry}T12:00:00`)-new Date(`${dateToday()}T12:00:00`))/DAY);
    if(days<0)return `Vencido el ${formatDate(expiry)}`;
    if(days<=90)return `Vence en ${days} días`;
    return `Vence ${formatDate(expiry)}`;
  }

  function renderV22Home(){
    const box=document.getElementById('v22HomeStrip');if(!box)return;
    const data=getEnergy(),test=testStatus(data),auto=generatorAutonomy(data);
    const gamma=findItem('gamma 7500','generador eléctrico portátil'),forza=findItem('forza fpp-t702','estación de energía portátil'),raid=findItem('raid espirales country','espirales repelentes contra mosquitos');
    const blackout=getBlackout();
    box.innerHTML=`
      <button onclick="openSection('centroEnergia')"><span>⚡ Generador</span><strong>${availableQty(gamma)?'Gamma listo':'Revisar inventario'}</strong><small>${esc(test.label)}</small></button>
      <button onclick="openSection('centroEnergia')"><span>🔋 Respaldo silencioso</span><strong>${availableQty(forza)?'Forza registrada':'Sin confirmar'}</strong><small>700 W · 551 Wh</small></button>
      <button onclick="openSection('centroEnergia')"><span>⛽ Autonomía combustible</span><strong>${auto===null?'Pendiente':`${fmt(auto)} h`}</strong><small>${n(data.generator.storedLiters)>0?`${fmt(data.generator.storedLiters)} L registrados`:'Cargar litros y consumo'}</small></button>
      <button onclick="openSection('modoApagon')"><span>🔌 Modo apagón</span><strong>${blackout.active?'ACTIVO':'Preparado'}</strong><small>${blackout.active?'Plan operativo en curso':`${BLACKOUT_STEPS.length} acciones por etapas`}</small></button>
      <button onclick="openItem('starter-raid-espirales-country-12')"><span>🦟 Mosquitos</span><strong>${fmt(availableQty(raid))} espirales</strong><small>${esc(raidExpiry())}</small></button>`;
  }

  function blackoutElapsed(startedAt){
    if(!startedAt)return 'Sin iniciar';
    const ms=Math.max(0,Date.now()-new Date(startedAt).getTime());
    const hours=Math.floor(ms/3600000),minutes=Math.floor(ms%3600000/60000);
    return `${hours} h ${minutes} min`;
  }

  function renderBlackoutMode(){
    const section=document.getElementById('modoApagon');if(!section)return;
    const data=getBlackout(),energy=getEnergy(),generatorHours=generatorAutonomy(energy);
    const raid=findItem('raid espirales country','espirales repelentes contra mosquitos');
    const water=inventory().filter(item=>item.category==='Agua'&&String(item.unit).toLowerCase()==='l').reduce((sum,item)=>sum+availableQty(item),0);
    const status=document.getElementById('blackoutStatus');if(status){
      status.className=`blackoutStatus ${data.active?'active':''}`;
      status.innerHTML=data.active?`<div><span>APAGÓN ACTIVO</span><strong>${blackoutElapsed(data.startedAt)}</strong><small>Iniciado ${new Date(data.startedAt).toLocaleString('es-AR')}</small></div><button class="action secondary" onclick="endBlackoutMode()">Finalizar</button>`:`<div><span>MODO PREPARADO</span><strong>Sin emergencia activa</strong><small>Iniciá el modo cuando comience un corte real.</small></div><button class="action" onclick="startBlackoutMode()">Iniciar apagón</button>`;
    }
    const summary=document.getElementById('blackoutSummary');if(summary)summary.innerHTML=`
      <div><span>Agua potable</span><strong>${fmt(water)} L</strong></div>
      <div><span>Generador</span><strong>6.000 W</strong><small>${generatorHours===null?'Autonomía pendiente':`${fmt(generatorHours)} h estimadas`}</small></div>
      <div><span>Forza</span><strong>${fmt(energy.forzaBatteryPercent)}%</strong><small>551 Wh nominales</small></div>
      <div><span>Mosquitos</span><strong>${fmt(availableQty(raid))} noches</strong><small>Según envase, una espiral por noche</small></div>`;
    const list=document.getElementById('blackoutChecklist');if(list){
      const groups=[...new Set(data.steps.map(step=>step.phase))];
      list.innerHTML=groups.map(phase=>{
        const rows=data.steps.filter(step=>step.phase===phase),done=rows.filter(step=>step.done).length;
        return `<div class="blackoutPhase"><div class="blackoutPhaseHead"><strong>${esc(phase)}</strong><span>${done}/${rows.length}</span></div>${rows.map(step=>`<label class="blackoutStep ${step.done?'done':''}"><input type="checkbox" ${step.done?'checked':''} onchange="toggleBlackoutStep('${esc(step.id)}',this.checked)"><span>${esc(step.text)}</span></label>`).join('')}</div>`;
      }).join('');
    }
    const progress=document.getElementById('blackoutProgress');if(progress){const done=data.steps.filter(step=>step.done).length;progress.textContent=`${done}/${data.steps.length} · ${Math.round(done/data.steps.length*100)}%`;}
  }

  window.saveEnergyCenter=function(){
    const data=getEnergy(),g=data.generator;
    const value=id=>document.getElementById(id)?.value??'';
    data.source=value('energySource')||'gamma';data.forzaBatteryPercent=Math.min(100,Math.max(0,n(value('forzaBatteryPercent'),100)));
    g.fuelType=value('genFuelType')||'unknown';g.storedLiters=value('genStoredLiters');g.consumptionLph=value('genConsumptionLph');g.fuelStoredDate=value('genFuelStoredDate');g.nextFuelRotation=value('genNextFuelRotation');
    g.lastTest=value('genLastTest');g.lastOilChange=value('genLastOilChange');g.engineHours=value('genEngineHours');g.nextServiceHours=value('genNextServiceHours');
    g.batteryStatus=value('genBatteryStatus')||'unknown';g.oilStatus=value('genOilStatus')||'unknown';g.location=value('genLocation').trim();g.notes=value('genNotes').trim();
    setEnergy(data,'Registro del generador y energía actualizado');
  };

  window.markGeneratorTestToday=function(){const data=getEnergy();data.generator.lastTest=dateToday();setEnergy(data,'Prueba del generador registrada');};
  window.markFuelRotationToday=function(){const data=getEnergy();data.generator.fuelStoredDate=dateToday();data.generator.nextFuelRotation='';setEnergy(data,'Rotación de combustible registrada; próxima fecha pendiente');};
  window.changeEnergySource=function(value){const data=getEnergy();data.source=value;setEnergy(data,'Fuente de energía seleccionada');};
  window.changeForzaBattery=function(value){const data=getEnergy();data.forzaBatteryPercent=Math.min(100,Math.max(0,n(value,100)));setEnergy(data);};

  window.updateEnergyLoad=function(id,field,value){
    const data=getEnergy(),load=data.loads.find(item=>item.id===id);if(!load)return;
    if(field==='enabled')load.enabled=Boolean(value);
    else if(field==='name')load.name=String(value||'Equipo');
    else load[field]=Math.max(0,n(value));
    setEnergy(data);
  };
  window.addEnergyLoad=function(){
    const data=getEnergy();data.loads.push({id:`custom-${Date.now()}`,name:'Nuevo equipo',watts:0,startupWatts:0,enabled:true,estimate:false,locked:false});setEnergy(data,'Carga crítica agregada');
  };
  window.deleteEnergyLoad=function(id){const data=getEnergy();data.loads=data.loads.filter(load=>load.id!==id);setEnergy(data,'Carga crítica eliminada');};
  window.resetEnergyLoads=function(){if(!confirm('¿Restaurar la lista de cargas orientativas? Se borrarán las cargas personalizadas.'))return;const data=getEnergy();data.loads=clone(DEFAULT_LOADS);setEnergy(data,'Plan de cargas restaurado');};
  window.resetEnergyCenter=function(){if(!confirm('¿Borrar el registro local de combustible, mantenimiento y cargas de EDY 2.2?'))return;storage()?.remove(ENERGY_KEY);renderEnergyCenter();renderV22Home();};

  window.startBlackoutMode=function(){const data=getBlackout();if(!data.active){data.active=true;data.startedAt=new Date().toISOString();data.endedAt='';setBlackout(data,'Modo apagón iniciado');}window.openSection('modoApagon');};
  window.endBlackoutMode=function(){const data=getBlackout();data.active=false;data.endedAt=new Date().toISOString();setBlackout(data,'Modo apagón finalizado');};
  window.toggleBlackoutStep=function(id,done){const data=getBlackout(),step=data.steps.find(item=>item.id===id);if(step)step.done=Boolean(done);setBlackout(data);};
  window.resetBlackoutPlan=function(){if(!confirm('¿Desmarcar todas las acciones del modo apagón?'))return;const data=getBlackout();data.steps=data.steps.map(step=>({...step,done:false}));setBlackout(data,'Checklist de apagón reiniciada');};

  function install(){
    const oldOpen=window.openSection;
    if(typeof oldOpen==='function')window.openSection=function(id){oldOpen(id);if(id==='centroEnergia')renderEnergyCenter();if(id==='modoApagon')renderBlackoutMode();};
    const oldHome=window.home;
    if(typeof oldHome==='function')window.home=function(){oldHome();renderV22Home();};
    const oldBackup=window.getAllBackupData;
    if(typeof oldBackup==='function')window.getAllBackupData=async function(){const data=await oldBackup();return {...data,version:VERSION,energyCenterV22:getEnergy(),blackoutV22:getBlackout()};};
    renderEnergyCenter();renderBlackoutMode();renderV22Home();
    setTimeout(()=>{renderEnergyCenter();renderBlackoutMode();renderV22Home();},900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.EDY22={version:VERSION,getEnergy,renderEnergyCenter,renderBlackoutMode,renderV22Home};
})();

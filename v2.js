/* EDY Offline 2.0 · Centro Inteligente del Hogar */
(() => {
  const V2_VERSION='2.2.2';
  const HOUSEHOLD_KEY='household_profile_v2';
  const WATER_KEY='water_system_v2';
  const RISK_KEY='risk_profile_v2';

  const clone=value=>JSON.parse(JSON.stringify(value));
  const numberOrBlank=value=>value===''||value===null||value===undefined?null:Math.max(0,Number(value)||0);
  const valueOf=id=>document.getElementById(id)?.value??'';
  const checked=id=>Boolean(document.getElementById(id)?.checked);
  const setValue=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value??''};
  const setChecked=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=Boolean(value)};
  const esc=value=>typeof escapeHTML==='function'?escapeHTML(String(value??'')):String(value??'');
  const fmt=value=>typeof formatStockNumber==='function'?formatStockNumber(Number(value)||0):new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(Number(value)||0);

  const HOUSEHOLD_DEFAULT={
    address:'',city:'',region:'',dwellingType:'',sharedWater:'unknown',familyReservedWater:null,
    includeAddressOnWallet:false,notes:'',updated:'',updatedISO:''
  };
  const WATER_DEFAULT={
    cisternCapacity:0,cisternCurrent:null,tankCount:0,tankCapacity:0,tanksCurrent:null,
    wellAvailable:'unknown',pumpType:'unknown',pumpBackup:'unknown',technicalDailyUse:null,
    notes:'',updated:'',updatedISO:''
  };

  const RISK_DEFAULTS=[
    {
      id:'storm',icon:'⛈️',name:'Tormenta severa y caída de árboles',likelihood:5,impact:4,enabled:true,
      summary:'Lluvia intensa, descargas eléctricas, ráfagas, granizo, caída de ramas y daños en servicios.',
      actions:[
        {id:'safe-room',text:'Definir una zona interior segura, alejada de vidrios.',hint:'Registrar el lugar y practicar cómo llegar.'},
        {id:'branches',text:'Revisar ramas, árboles, canaletas y objetos sueltos.',hint:'Programar inspección antes de temporadas de tormentas.'},
        {id:'lighting',text:'Tener iluminación de emergencia accesible.',hint:'Se cubre automáticamente si EDY encuentra linternas o luces.',keywords:['linterna','luz de emergencia','barra luminosa']},
        {id:'communications',text:'Contar con radio o medio alternativo de información.',hint:'Se cubre automáticamente si hay radio registrada.',keywords:['radio','walkie','comunicador']},
        {id:'electronics',text:'Proteger electrónica y documentos del agua.',hint:'Usar cajas o bolsas estancas y mantenerlos elevados.',keywords:['ziploc','bolsa estanca','caja estanca']}
      ]
    },
    {
      id:'blackout',icon:'🔌',name:'Apagón prolongado',likelihood:4,impact:4,enabled:true,
      summary:'Corte de electricidad con impacto en iluminación, comunicaciones, alimentos y bombeo del pozo.',
      actions:[
        {id:'power-station',text:'Registrar y probar una fuente de energía de respaldo.',hint:'Se cubre con una estación de energía disponible.',keywords:['forza','estacion de energia','estación de energía','power station']},
        {id:'lights',text:'Distribuir linternas y luces por sectores.',hint:'Se cubre automáticamente con iluminación registrada.',keywords:['linterna','luz de emergencia','barra luminosa']},
        {id:'phones',text:'Definir un plan de carga para teléfonos y radios.',hint:'Registrar powerbanks, cables y equipos esenciales.',keywords:['powerbank','bateria externa','batería externa','cargador']},
        {id:'pump-backup',text:'Verificar potencia de la bomba del pozo y método de respaldo.',hint:'EDY no debe asumir que una estación portátil puede alimentar la bomba.',system:'pump-backup'},
        {id:'cash',text:'Mantener efectivo de emergencia en un lugar seguro.',hint:'Registrar monto y ubicación solo en notas privadas.'}
      ]
    },
    {
      id:'urban-flood',icon:'🌊',name:'Anegamiento urbano y escurrimiento',likelihood:4,impact:4,enabled:true,
      summary:'Acumulación rápida de agua en calles, patios, desagües o accesos durante lluvias intensas.',
      actions:[
        {id:'water-history',text:'Registrar hasta dónde llegó el agua en eventos anteriores.',hint:'Fotografiar puntos de referencia y niveles.'},
        {id:'drainage',text:'Revisar desagües, canaletas y pendientes del terreno.',hint:'Anotar fechas de limpieza y obstrucciones.'},
        {id:'elevate',text:'Elevar documentos, electrónica y productos sensibles.',hint:'Priorizar lo irremplazable.'},
        {id:'barriers',text:'Evaluar barreras para puertas o una bomba de achique.',hint:'Solo si existe un punto de ingreso o acumulación conocido.',keywords:['barrera inundacion','bomba de achique']},
        {id:'route',text:'Definir una ruta que evite calles bajas o anegables.',hint:'No atravesar agua en movimiento.'}
      ]
    },
    {
      id:'house-fire',icon:'🔥',name:'Incendio doméstico o eléctrico',likelihood:3,impact:5,enabled:true,
      summary:'Fuego en cocina, instalación eléctrica, combustibles, alcoholes o una propiedad vecina.',
      actions:[
        {id:'extinguisher',text:'Tener matafuegos ABC vigentes y accesibles.',hint:'Se cubre automáticamente si EDY encuentra matafuegos o extintores.',keywords:['matafuego','extintor']},
        {id:'smoke-detector',text:'Instalar y probar detectores de humo.',hint:'Registrar fecha de prueba y batería.',keywords:['detector de humo']},
        {id:'fire-blanket',text:'Tener manta ignífuga en la cocina.',hint:'No reemplaza al matafuego.',keywords:['manta ignifuga','manta ignífuga']},
        {id:'exit',text:'Definir dos vías de salida y punto de reunión.',hint:'Practicar con todos los integrantes.'},
        {id:'flammables',text:'Guardar alcoholes y encendedores lejos de calor y niños.',hint:'Revisar ubicación de los 12 BIC y del alcohol.',keywords:['encendedores bic maxi','alcohol etilico bactericida','alcohol etílico bactericida']}
      ]
    },
    {
      id:'heat-dengue',icon:'🌡️',name:'Calor extremo y enfermedades transmitidas por mosquitos',likelihood:5,impact:3,enabled:true,
      summary:'Altas temperaturas, deshidratación, interrupciones eléctricas y presencia de mosquitos.',
      actions:[
        {id:'potable-water',text:'Mantener reserva de agua potable y control de consumo.',hint:'Se cubre automáticamente con al menos 72 horas de agua potable.',system:'potable-72h'},
        {id:'mosquito-control',text:'Tener repelente, mosquiteros y control de recipientes.',hint:'Revisar vencimientos y eliminar agua estancada.',keywords:['repelente','mosquitero']},
        {id:'rehydration',text:'Tener sales de rehidratación oral.',hint:'Guardar según indicación y controlar vencimiento.',keywords:['sales de rehidratacion','sales de rehidratación']},
        {id:'cooling',text:'Planificar ventilación o enfriamiento de bajo consumo.',hint:'Vincularlo con autonomía energética.'},
        {id:'symptoms',text:'Tener protocolo familiar ante fiebre o signos de alarma.',hint:'Consultar la Biblioteca EDY y servicios de salud.'}
      ]
    },
    {
      id:'wildfire-smoke',icon:'🌫️',name:'Incendio forestal, humo y cortes de ruta',likelihood:3,impact:3,enabled:true,
      summary:'Afectación indirecta por humo, cenizas, evacuaciones preventivas o interrupción de accesos.',
      actions:[
        {id:'masks',text:'Tener mascarillas adecuadas para humo y partículas.',hint:'Verificar físicamente el tipo de mascarilla.',keywords:['n95','mascarilla','mascara para polvo','máscara para polvo']},
        {id:'seal',text:'Identificar cómo cerrar aberturas y reducir ingreso de humo.',hint:'Revisar burletes y ventanas.'},
        {id:'evac-route',text:'Definir rutas alternativas de salida.',hint:'Mantener combustible y documentos listos.'},
        {id:'vegetation',text:'Reducir vegetación seca y combustibles cercanos.',hint:'Revisar perímetro y depósitos.'}
      ]
    },
    {
      id:'water-outage',icon:'🚱',name:'Falla de red o interrupción del abastecimiento de agua',likelihood:3,impact:3,enabled:true,
      summary:'Interrupción de agua potable o imposibilidad de bombear desde el pozo durante un apagón.',
      actions:[
        {id:'potable-stock',text:'Mantener reserva potable separada.',hint:'Se cubre automáticamente con el inventario de agua.',system:'potable-any'},
        {id:'fixed-storage',text:'Registrar capacidad y nivel actual de cisterna y tanques.',hint:'La capacidad instalada no equivale al volumen disponible.',system:'fixed-storage'},
        {id:'well',text:'Confirmar funcionamiento y mantenimiento del pozo.',hint:'Registrar fecha de prueba.',system:'well'},
        {id:'pump',text:'Resolver la dependencia eléctrica de la bomba.',hint:'Medir consumo real y verificar alternativa.',system:'pump-backup'},
        {id:'quality',text:'Definir tratamiento o control de calidad para agua no envasada.',hint:'El agua del pozo no se considera potable automáticamente.',keywords:['filtro','pastillas potabilizadoras','cloro']}
      ]
    },
    {
      id:'earthquake',icon:'🫨',name:'Sismo significativo',likelihood:1,impact:2,enabled:true,
      summary:'Escenario de baja prioridad local. Mantener medidas generales de seguridad sin desviar recursos principales.',
      actions:[
        {id:'furniture',text:'Asegurar muebles altos y objetos pesados.',hint:'Medida doméstica útil aunque el riesgo sísmico sea bajo.'},
        {id:'safe-points',text:'Identificar lugares seguros y cortar servicios si hay daño.',hint:'No requiere un kit específico.'}
      ]
    },
    {
      id:'volcano',icon:'🌋',name:'Erupción volcánica',likelihood:1,impact:1,enabled:false,
      summary:'No es un escenario prioritario para este perfil. Se conserva únicamente como referencia.',actions:[]
    },
    {
      id:'tsunami',icon:'🌊',name:'Tsunami oceánico',likelihood:1,impact:1,enabled:false,
      summary:'No aplica como amenaza directa para una vivienda del interior, lejos de la costa oceánica.',actions:[]
    }
  ];

  function getHousehold(){return {...HOUSEHOLD_DEFAULT,...(EDYStorage.get(HOUSEHOLD_KEY,{})||{})}}
  function getWaterSystem(){return {...WATER_DEFAULT,...(EDYStorage.get(WATER_KEY,{})||{})}}
  function normalizeRisk(risk){
    const base=RISK_DEFAULTS.find(x=>x.id===risk?.id)||{};
    const actions=(base.actions||[]).map(action=>{
      const old=(risk?.actions||[]).find(x=>x.id===action.id)||{};
      return {...action,done:Boolean(old.done)};
    });
    return {...base,...risk,likelihood:Math.min(5,Math.max(1,Number(risk?.likelihood??base.likelihood)||1)),impact:Math.min(5,Math.max(1,Number(risk?.impact??base.impact)||1)),enabled:risk?.enabled??base.enabled,actions};
  }
  function getRiskProfile(){
    const saved=EDYStorage.get(RISK_KEY,null);
    if(!Array.isArray(saved))return RISK_DEFAULTS.map(normalizeRisk);
    const byId=new Map(saved.map(x=>[x.id,x]));
    return RISK_DEFAULTS.map(base=>normalizeRisk(byId.get(base.id)||base));
  }
  function saveRiskProfile(list,message='Perfil de riesgos actualizado'){
    EDYStorage.set(RISK_KEY,list.map(normalizeRisk));
    if(typeof addTimelineEntry==='function')addTimelineEntry('risk','⚠️',message);
    renderRiskProfile();renderV2Home();renderOperationsHome();
  }

  function waterCapacity(system=getWaterSystem()){
    return Math.max(0,Number(system.cisternCapacity)||0)+Math.max(0,Number(system.tankCount)||0)*Math.max(0,Number(system.tankCapacity)||0);
  }
  function waterCurrent(system=getWaterSystem()){
    const cistern=numberOrBlank(system.cisternCurrent),tanks=numberOrBlank(system.tanksCurrent);
    if(cistern===null&&tanks===null)return null;
    return Math.max(0,cistern||0)+Math.max(0,tanks||0);
  }
  function familyTechnicalWater(system=getWaterSystem(),house=getHousehold()){
    const current=waterCurrent(system),reserved=numberOrBlank(house.familyReservedWater);
    if(reserved!==null&&reserved>0)return current===null?reserved:Math.min(reserved,current);
    if(house.sharedWater==='yes')return null;
    return current;
  }
  function technicalWaterDays(){
    const system=getWaterSystem(),available=familyTechnicalWater(system,getHousehold()),daily=numberOrBlank(system.technicalDailyUse);
    return available!==null&&daily&&daily>0?available/daily:null;
  }
  function waterResilience(){
    const system=getWaterSystem();let score=0;
    if(waterCapacity(system)>0)score+=35;
    if(waterCurrent(system)!==null)score+=15;
    if(system.wellAvailable==='yes')score+=25;
    if(system.pumpType==='manual'||system.pumpType==='mixed')score+=15;
    else if(system.pumpType==='electric')score+=5;
    if(system.pumpBackup==='yes')score+=10;
    return Math.min(100,score);
  }

  function saveHouseholdProfile(){
    const data={
      address:valueOf('householdAddress').trim(),city:valueOf('householdCity').trim(),region:valueOf('householdRegion').trim(),
      dwellingType:valueOf('householdType').trim(),sharedWater:valueOf('householdSharedWater'),
      familyReservedWater:numberOrBlank(valueOf('householdFamilyReservedWater')),includeAddressOnWallet:checked('householdWalletAddress'),
      notes:valueOf('householdNotes').trim(),updated:new Date().toLocaleString('es-AR'),updatedISO:new Date().toISOString()
    };
    EDYStorage.set(HOUSEHOLD_KEY,data);if(typeof addTimelineEntry==='function')addTimelineEntry('household','🏡','Perfil privado del hogar actualizado');renderHousehold();renderV2Home();renderWaterV2();
  }
  function saveWaterSystem(){
    const data={
      cisternCapacity:numberOrBlank(valueOf('waterCisternCapacity'))||0,cisternCurrent:numberOrBlank(valueOf('waterCisternCurrent')),
      tankCount:numberOrBlank(valueOf('waterTankCount'))||0,tankCapacity:numberOrBlank(valueOf('waterTankCapacity'))||0,tanksCurrent:numberOrBlank(valueOf('waterTanksCurrent')),
      wellAvailable:valueOf('waterWellAvailable'),pumpType:valueOf('waterPumpType'),pumpBackup:valueOf('waterPumpBackup'),
      technicalDailyUse:numberOrBlank(valueOf('waterTechnicalDailyUse')),notes:valueOf('waterSystemNotes').trim(),
      updated:new Date().toLocaleString('es-AR'),updatedISO:new Date().toISOString()
    };
    EDYStorage.set(WATER_KEY,data);if(typeof addTimelineEntry==='function')addTimelineEntry('water','🚿','Sistema fijo de agua actualizado');renderHousehold();renderWaterV2();renderV2Home();renderOperationsHome();renderRiskProfile();
  }
  function loadHouseholdForm(){
    const h=getHousehold(),w=getWaterSystem();
    setValue('householdAddress',h.address);setValue('householdCity',h.city);setValue('householdRegion',h.region);setValue('householdType',h.dwellingType);setValue('householdSharedWater',h.sharedWater);setValue('householdFamilyReservedWater',h.familyReservedWater);setChecked('householdWalletAddress',h.includeAddressOnWallet);setValue('householdNotes',h.notes);
    setValue('waterCisternCapacity',w.cisternCapacity);setValue('waterCisternCurrent',w.cisternCurrent);setValue('waterTankCount',w.tankCount);setValue('waterTankCapacity',w.tankCapacity);setValue('waterTanksCurrent',w.tanksCurrent);setValue('waterWellAvailable',w.wellAvailable);setValue('waterPumpType',w.pumpType);setValue('waterPumpBackup',w.pumpBackup);setValue('waterTechnicalDailyUse',w.technicalDailyUse);setValue('waterSystemNotes',w.notes);
  }
  function renderHousehold(){
    loadHouseholdForm();const h=getHousehold(),w=getWaterSystem(),cap=waterCapacity(w),current=waterCurrent(w);
    put('householdLocationSummary',h.city||h.address?'Perfil local cargado':'Sin importar');
    put('householdTypeSummary',[h.city,h.region,h.dwellingType].filter(Boolean).join(' · ')||'Perfil privado pendiente');
    put('householdWaterCapacity',`${fmt(cap)} L`);put('householdWaterCurrent',current===null?'Volumen actual sin registrar':`${fmt(current)} L registrados actualmente`);
    put('householdWellSummary',w.wellAvailable==='yes'?'Pozo disponible':w.wellAvailable==='no'?'Sin pozo':'Sin configurar');
    const pump={electric:'Bomba eléctrica',manual:'Bombeo manual',mixed:'Bomba eléctrica + alternativa',unknown:'Dependencia energética pendiente'}[w.pumpType]||'Dependencia energética pendiente';
    put('householdPumpSummary',w.pumpBackup==='yes'?`${pump} · respaldo confirmado`:w.pumpBackup==='no'?`${pump} · sin respaldo`:`${pump} · respaldo pendiente`);
  }

  function inventoryText(){return normalizeText(getInventory().filter(i=>i.status==='available').map(i=>[i.name,i.brand,i.model,i.category,i.notes].join(' ')).join(' | '))}
  function actionAutoCovered(action){
    const w=getWaterSystem(),h=getHousehold();
    if(action.system==='potable-any')return inventoryWaterLiters()>0;
    if(action.system==='potable-72h')return waterDays(getOperations())>=3;
    if(action.system==='fixed-storage')return waterCapacity(w)>0&&waterCurrent(w)!==null;
    if(action.system==='well')return w.wellAvailable==='yes';
    if(action.system==='pump-backup')return w.pumpBackup==='yes'||w.pumpType==='manual'||w.pumpType==='mixed';
    if(Array.isArray(action.keywords)&&action.keywords.length){const text=inventoryText();return action.keywords.some(k=>text.includes(normalizeText(k)));}
    return false;
  }
  function actionCovered(action){return Boolean(action.done)||actionAutoCovered(action)}
  function riskCoverage(risk){
    if(!risk.actions.length)return risk.enabled?0:100;
    const covered=risk.actions.filter(actionCovered).length;
    return Math.round(covered/risk.actions.length*100);
  }
  function riskBaseScore(risk){return risk.enabled?(Number(risk.likelihood)||1)*(Number(risk.impact)||1):0}
  function riskResidualScore(risk){return riskBaseScore(risk)*(1-riskCoverage(risk)/100*0.7)}
  function riskPriority(risk){
    const score=riskBaseScore(risk);if(!risk.enabled)return {label:'No prioritaria',className:'riskLow'};
    if(score>=20)return {label:'Muy alta',className:'riskVeryHigh'};
    if(score>=12)return {label:'Alta',className:'riskHigh'};
    if(score>=6)return {label:'Media',className:'riskMedium'};
    return {label:'Baja',className:'riskLow'};
  }
  function sortedRisks(){return getRiskProfile().filter(r=>r.enabled).sort((a,b)=>riskResidualScore(b)-riskResidualScore(a)||riskBaseScore(b)-riskBaseScore(a))}
  function topRisk(){return sortedRisks()[0]||null}
  function overallRiskCoverage(){
    const risks=getRiskProfile().filter(r=>r.enabled&&r.actions.length);if(!risks.length)return 0;
    const weight=risks.reduce((s,r)=>s+riskBaseScore(r),0)||1;
    return Math.round(risks.reduce((s,r)=>s+riskCoverage(r)*riskBaseScore(r),0)/weight);
  }
  function renderRiskProfile(){
    const box=document.getElementById('riskCards');if(!box)return;const risks=getRiskProfile(),top=topRisk();
    put('riskTopName',top?.name||'Sin evaluar');put('riskTopReason',top?`${riskPriority(top).label} · cobertura ${riskCoverage(top)}%`:'Importá o configurá el perfil local.');put('riskCoverageScore',overallRiskCoverage()+'%');
    const open=risks.filter(r=>r.enabled).reduce((s,r)=>s+r.actions.filter(a=>!actionCovered(a)).length,0);put('riskOpenActions',open);
    box.innerHTML=risks.map(r=>{const p=riskPriority(r),coverage=riskCoverage(r),openActions=r.actions.filter(a=>!actionCovered(a)).length;return `<button class="riskCard" onclick="openRisk('${esc(r.id)}')"><span class="riskIcon">${r.icon}</span><span><strong>${esc(r.name)}</strong><small>${esc(r.summary)}</small><span class="riskTag ${p.className}">${p.label}</span></span><span class="riskCardScore"><b>${coverage}%</b><span>${openActions} pendientes</span><div class="riskProgress"><span style="width:${coverage}%"></span></div></span></button>`}).join('');
  }
  function openRisk(id){EDYStorage.set('current_risk_v2',id);renderRiskDetail(id);openSection('riskDetail')}
  function renderRiskDetail(id=EDYStorage.get('current_risk_v2','')){
    const box=document.getElementById('riskDetailContent');if(!box)return;const risk=getRiskProfile().find(r=>r.id===id)||topRisk();if(!risk){box.innerHTML='<div class="panel">No hay riesgo seleccionado.</div>';return}
    const p=riskPriority(risk),coverage=riskCoverage(risk);
    box.innerHTML=`<div class="riskDetailHero"><div class="riskBigIcon">${risk.icon}</div><div><span class="riskTag ${p.className}">${p.label}</span><h2>${esc(risk.name)}</h2><p>${esc(risk.summary)}</p></div><div class="riskDetailScore"><strong>${coverage}%</strong><span>Cobertura</span></div></div>
      <div class="riskSettings"><div class="field"><label>Probabilidad relativa (1–5)</label><input id="riskLikelihood" type="number" min="1" max="5" value="${risk.likelihood}"></div><div class="field"><label>Impacto familiar (1–5)</label><input id="riskImpact" type="number" min="1" max="5" value="${risk.impact}"></div></div>
      <div class="actions"><button class="action" onclick="saveRiskSettings('${esc(risk.id)}')">Guardar prioridad</button><button class="action secondary" onclick="toggleRiskEnabled('${esc(risk.id)}')">${risk.enabled?'Marcar no prioritario':'Activar riesgo'}</button></div>
      <div class="titleRow"><h3>Acciones preventivas</h3><span>${risk.actions.filter(actionCovered).length}/${risk.actions.length} cubiertas</span></div>
      <div class="riskActionList">${risk.actions.length?risk.actions.map(action=>{const auto=actionAutoCovered(action),done=actionCovered(action);return `<div class="riskAction ${done?'done':''}"><input id="ra_${esc(risk.id)}_${esc(action.id)}" type="checkbox" ${done?'checked':''} ${auto?'disabled':''} onchange="toggleRiskAction('${esc(risk.id)}','${esc(action.id)}',this.checked)"><label for="ra_${esc(risk.id)}_${esc(action.id)}"><strong>${esc(action.text)}</strong><small>${esc(auto?'Cubierto automáticamente por datos de EDY.':action.hint||'')}</small></label></div>`}).join(''):'<div class="panel">Este escenario se conserva solo como referencia.</div>'}</div>`;
  }
  function toggleRiskAction(riskId,actionId,value){const list=getRiskProfile(),risk=list.find(r=>r.id===riskId),action=risk?.actions.find(a=>a.id===actionId);if(action){action.done=Boolean(value);saveRiskProfile(list,`Acción de riesgo ${value?'completada':'reabierta'}: ${action.text}`);renderRiskDetail(riskId)}}
  function saveRiskSettings(id){const list=getRiskProfile(),risk=list.find(r=>r.id===id);if(!risk)return;risk.likelihood=Math.min(5,Math.max(1,Number(valueOf('riskLikelihood'))||1));risk.impact=Math.min(5,Math.max(1,Number(valueOf('riskImpact'))||1));saveRiskProfile(list,`Prioridad actualizada: ${risk.name}`);renderRiskDetail(id)}
  function toggleRiskEnabled(id){const list=getRiskProfile(),risk=list.find(r=>r.id===id);if(!risk)return;risk.enabled=!risk.enabled;saveRiskProfile(list,`${risk.name}: ${risk.enabled?'activado':'marcado no prioritario'}`);renderRiskDetail(id)}
  function resetRiskProfile(){if(!confirm('¿Restaurar el perfil inicial de riesgos? Se reiniciarán prioridades y casillas manuales.'))return;EDYStorage.set(RISK_KEY,RISK_DEFAULTS.map(normalizeRisk));renderRiskProfile();renderV2Home();renderOperationsHome()}

  function importPrivateProfile(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;const reader=new FileReader();
    reader.onload=()=>{try{
      const data=JSON.parse(reader.result);
      if(data.type==='edy-private-contacts'||Array.isArray(data.contacts)&&!data.household&&!data.waterSystem){
        const rows=Array.isArray(data)?data:data.contacts;if(!Array.isArray(rows))throw new Error('Formato inválido');saveContacts(mergeContacts(rows.map(x=>({...x,private:true}))),`${rows.length} contactos privados importados`);alert('Contactos privados importados.');return;
      }
      if(data.type!=='edy-private-profile'&&!data.household&&!data.waterSystem)throw new Error('Formato inválido');
      if(data.household)EDYStorage.set(HOUSEHOLD_KEY,{...HOUSEHOLD_DEFAULT,...data.household});
      if(data.waterSystem)EDYStorage.set(WATER_KEY,{...WATER_DEFAULT,...data.waterSystem});
      if(Array.isArray(data.risks))EDYStorage.set(RISK_KEY,data.risks.map(normalizeRisk));
      if(Array.isArray(data.contacts))saveContacts(mergeContacts(data.contacts.map(x=>({...x,private:true}))),`${data.contacts.length} contactos privados importados`);
      if(Array.isArray(data.family))EDYStorage.set('family_profile',data.family.map(normalizeFamilyMember));
      if(typeof addTimelineEntry==='function')addTimelineEntry('household','🔒','Perfil privado del hogar importado');
      renderV2All();alert('Perfil privado importado. La dirección, los teléfonos y la infraestructura quedaron guardados solamente en este dispositivo.');
    }catch(e){alert('No se pudo importar el perfil privado. Verificá que sea un archivo JSON de EDY.')}};reader.readAsText(file);
  }
  function exportPrivateProfile(){
    const data={type:'edy-private-profile',version:V2_VERSION,exportedAt:new Date().toISOString(),notice:'ARCHIVO PRIVADO. NO SUBIR A GITHUB NI COMPARTIR PUBLICAMENTE.',household:getHousehold(),waterSystem:getWaterSystem(),risks:getRiskProfile(),contacts:getContacts().filter(c=>c.private),family:getFamilyProfile()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`EDY-perfil-privado-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }

  function renderWaterV2(){
    const w=getWaterSystem(),h=getHousehold(),cap=waterCapacity(w),current=waterCurrent(w),familyCurrent=familyTechnicalWater(w,h),days=technicalWaterDays(),res=waterResilience();
    put('waterTechnicalCapacity',`${fmt(cap)} L`);put('waterTechnicalCurrent',current===null?'Volumen actual sin medir':`${fmt(current)} L registrados`);put('waterTechnicalDays',days===null?'—':`${days.toFixed(1)} días`);
    put('waterWellStatus',w.wellAvailable==='yes'?'Pozo disponible':w.wellAvailable==='no'?'Sin pozo':'Sin configurar');
    const pump={electric:'Bomba eléctrica',manual:'Bombeo manual',mixed:'Eléctrico + alternativa',unknown:'Bomba sin registrar'}[w.pumpType]||'Bomba sin registrar';
    put('waterPumpStatus',w.pumpBackup==='yes'?`${pump} · respaldo confirmado`:w.pumpBackup==='no'?`${pump} · sin respaldo`:`${pump} · respaldo pendiente`);
    put('waterResilienceStatus',res>=80?'ALTA':res>=50?'MEDIA':'PENDIENTE');
    const summary=document.getElementById('waterSystemSummary');if(summary){const rows=[];
      rows.push(`<div class="waterSystemRow"><div><strong>Cisterna</strong><small>Capacidad instalada</small></div><b>${fmt(w.cisternCapacity)} L${w.cisternCurrent===null?' · nivel pendiente':` · ${fmt(w.cisternCurrent)} L actuales`}</b></div>`);
      rows.push(`<div class="waterSystemRow"><div><strong>Tanques elevados</strong><small>${fmt(w.tankCount)} tanque${Number(w.tankCount)===1?'':'s'} de ${fmt(w.tankCapacity)} L</small></div><b>${fmt((Number(w.tankCount)||0)*(Number(w.tankCapacity)||0))} L${w.tanksCurrent===null?' · nivel pendiente':` · ${fmt(w.tanksCurrent)} L actuales`}</b></div>`);
      rows.push(`<div class="waterSystemRow"><div><strong>Disponibilidad para la familia</strong><small>${h.sharedWater==='yes'?'El sistema abastece otras unidades. Definí la reserva familiar.':h.sharedWater==='no'?'Sistema declarado de uso familiar.':'No se confirmó si abastece otras unidades.'}</small></div><b>${familyCurrent===null?'Pendiente':fmt(familyCurrent)+' L'}</b></div>`);
      if(w.wellAvailable==='yes'&&w.pumpType==='electric'&&w.pumpBackup!=='yes')rows.push('<div class="waterSystemRow waterSystemAlert"><div><strong>Prioridad: bomba del pozo</strong><small>Medí su potencia y comprobá cómo funcionará durante un apagón.</small></div><b>REVISAR</b></div>');
      summary.innerHTML=rows.join('');
    }
  }

  function v2ReadinessScore(){
    const o=getOperations(),inv=getInventory(),waterPotable=Math.min(15,waterDays(o)/14*15),waterFixed=Math.min(10,waterResilience()/10),food=Math.min(15,(Number(o.foodDays)||0)/14*15),energy=Math.min(15,(Number(o.energyHours)||0)/72*15),comms=(Number(o.comms)||0)/100*10,health=(Number(o.healthPercent)||0)/100*10;
    const family=typeof familyReadinessScore==='function'?familyReadinessScore()/100*7:0,contacts=Math.min(3,getContacts().filter(c=>c.wallet).length/5*3),critical=inv.filter(i=>i.critical),inventory=critical.length?critical.filter(i=>i.status==='available').length/critical.length*10:0;
    const risks=overallRiskCoverage()/100*5;
    return Math.round(waterPotable+waterFixed+food+energy+comms+health+family+contacts+inventory+risks);
  }
  function v2Priorities(){
    const list=[],h=getHousehold(),w=getWaterSystem(),top=topRisk(),current=waterCurrent(w);
    if(!h.city&&!h.address)list.push({icon:'🔒',title:'Importar el perfil privado',detail:'Carga domicilio, contactos e infraestructura sin publicarlos en GitHub.'});
    if(waterCapacity(w)>0&&current===null)list.push({icon:'🚿',title:'Medir el nivel actual de cisterna y tanques',detail:'La capacidad instalada no indica cuánta agua hay hoy.'});
    if(h.sharedWater==='yes'&&!numberOrBlank(h.familyReservedWater))list.push({icon:'🏘️',title:'Definir la reserva disponible para la familia',detail:'El sistema puede abastecer también los alquileres.'});
    if(w.wellAvailable==='yes'&&w.pumpType==='electric'&&w.pumpBackup!=='yes')list.push({icon:'⚡',title:'Comprobar respaldo de la bomba del pozo',detail:'Medí potencia, pico de arranque y método alternativo.'});
    if(top){const pending=top.actions.find(a=>!actionCovered(a));if(pending)list.push({icon:top.icon,title:pending.text,detail:`Riesgo principal: ${top.name}.`});}
    if(EDYStorage.get('last_backup','Nunca')==='Nunca')list.push({icon:'💾',title:'Exportar el primer respaldo',detail:'Guardalo en Archivos o iCloud.'});
    return list.slice(0,5);
  }
  function renderV2Home(){
    let strip=document.getElementById('v2DashboardStrip');if(!strip){strip=document.createElement('div');strip.id='v2DashboardStrip';strip.className='v2DashboardStrip';document.querySelector('.operationsPanel')?.after(strip)}
    const w=getWaterSystem(),cap=waterCapacity(w),current=waterCurrent(w),top=topRisk();
    strip.innerHTML=`<div><span>Potable</span><strong>${fmt(inventoryWaterLiters())} L · ${waterDays(getOperations()).toFixed(1)} días</strong></div><div><span>Agua fija</span><strong>${fmt(cap)} L capacidad${current===null?'':' · '+fmt(current)+' L actuales'}</strong></div><div><span>Pozo</span><strong>${w.wellAvailable==='yes'?'Disponible':'Sin confirmar'}</strong></div><div><span>Riesgo principal</span><strong>${esc(top?.name||'Sin evaluar')}</strong></div>`;
    let priorities=document.getElementById('v2PriorityPanel');if(!priorities){priorities=document.createElement('div');priorities.id='v2PriorityPanel';priorities.innerHTML='<div class="titleRow"><h2>Prioridades inteligentes</h2><button class="back" onclick="openSection(\'riesgos\')">Abrir riesgos</button></div><div id="v2PriorityList" class="v2PriorityList"></div>';document.getElementById('readinessInsights')?.parentElement?.insertBefore(priorities,document.getElementById('readinessInsights'))}
    const box=document.getElementById('v2PriorityList'),items=v2Priorities();if(box)box.innerHTML=items.length?items.map(i=>`<div class="v2PriorityItem"><span>${i.icon}</span><div><strong>${esc(i.title)}</strong><small>${esc(i.detail)}</small></div></div>`).join(''):'<div class="panel good">✅ No hay prioridades críticas abiertas.</div>';
  }

  // Protocolos adicionales de EDY 2.0.
  if(window.emergencyProtocols&&typeof window.emergencyProtocols==='object'){
    window.emergencyProtocols.flood={title:'Anegamiento urbano',emoji:'🌊',intro:'Protegé a las personas, evitá el contacto con agua en movimiento y elevá lo irremplazable.',steps:['Verificar si el agua está ingresando o solo afecta la calle.','Alejar a niños y mascotas de desagües y corrientes.','Elevar documentos, medicamentos y electrónica.','Cortar electricidad únicamente si se puede hacer sin tocar agua.','No cruzar calles anegadas a pie ni en vehículo.','Preparar una salida por la ruta más alta.','Registrar nivel y evolución del agua.'],note:'El agua puede ocultar pozos, cables energizados, objetos cortantes y contaminación.'};
    window.emergencyProtocols.fire={title:'Incendio doméstico',emoji:'🔥',intro:'La prioridad es evacuar y alertar. No arriesgues la vida por apagar un fuego fuera de control.',steps:['Gritar la alarma y reunir a la familia.','Llamar a Bomberos.','Cortar energía o gas solo si está al alcance y es seguro.','Usar matafuego únicamente si el fuego es pequeño, existe una salida detrás y sabés utilizarlo.','Cerrar puertas al salir para limitar humo y fuego.','Ir al punto de reunión y contar personas y mascotas.','No volver a ingresar.'],note:'El humo puede incapacitar en segundos. Desplazate bajo y salí inmediatamente.'};
    window.emergencyProtocols.heat={title:'Calor extremo',emoji:'🌡️',intro:'Reducí actividad, asegurá hidratación y vigilá especialmente a niños, mayores y mascotas.',steps:['Llevar a todos al ambiente más fresco disponible.','Distribuir agua potable en tomas frecuentes.','Reducir actividad física y exposición solar.','Usar ventilación de bajo consumo si hay energía.','Controlar signos de agotamiento o golpe de calor.','Mantener agua fresca para mascotas.','Solicitar ayuda ante confusión, desmayo, convulsión o temperatura corporal muy elevada.'],note:'Un golpe de calor es una emergencia médica. No demores la consulta.'};
  }

  // Ampliación de búsqueda del asistente.
  const oldAssistantAsk=window.assistantAsk;
  window.assistantAsk=function(prefill){
    const input=document.getElementById('assistantQuery');if(prefill!==undefined&&input)input.value=prefill;const raw=input?.value?.trim()||'';const q=normalizeText(raw);
    if(/\b(riesgo|riesgos|catastrofe|catástrofe|preparar|amenaza)\b/.test(q)){
      const top=topRisk(),rows=sortedRisks().slice(0,5);assistantReply('Perfil de riesgos',top?`<p>La prioridad residual actual es <strong>${esc(top.name)}</strong>. Su cobertura registrada es de <strong>${riskCoverage(top)}%</strong>.</p>`:'<p>Todavía no hay un perfil de riesgos.</p>',`<ul>${rows.map(r=>`<li>${esc(r.icon)} ${esc(r.name)}: ${riskPriority(r).label}, cobertura ${riskCoverage(r)}%</li>`).join('')}</ul><div class="assistantCallout"><button class="action" onclick="openSection('riesgos')">Abrir perfil de riesgos</button></div>`);return;
    }
    if(/\b(cisterna|tanques|pozo|agua sanitaria|agua de uso general|sistema de agua)\b/.test(q)){
      const w=getWaterSystem(),h=getHousehold(),cap=waterCapacity(w),current=waterCurrent(w),family=familyTechnicalWater(w,h);assistantReply('Sistema fijo de agua',`<p>Capacidad instalada: <strong>${fmt(cap)} L</strong>. ${current===null?'El volumen actual todavía no fue medido.':`Volumen actual registrado: <strong>${fmt(current)} L</strong>.`} ${family===null?'La parte disponible para la familia está pendiente de definir.':`Disponibilidad familiar: <strong>${fmt(family)} L</strong>.`}</p><p>Pozo: <strong>${w.wellAvailable==='yes'?'disponible':w.wellAvailable==='no'?'no disponible':'sin confirmar'}</strong>. Bomba: <strong>${{electric:'eléctrica',manual:'manual',mixed:'eléctrica con alternativa',unknown:'sin registrar'}[w.pumpType]}</strong>.</p>`,`<div class="assistantCallout"><button class="action" onclick="openSection('agua')">Abrir sistema de agua</button></div>`);return;
    }
    return oldAssistantAsk?.(prefill);
  };

  // Integración con navegación y vistas existentes.
  const oldOpenSection=window.openSection;
  window.openSection=function(id){oldOpenSection(id);if(id==='hogar')renderHousehold();if(id==='agua'){renderWaterV2();}if(id==='riesgos')renderRiskProfile();if(id==='riskDetail')renderRiskDetail();};
  const oldHome=window.home;
  window.home=function(){oldHome();renderV2All();};
  const oldRenderWaterInventory=window.renderWaterInventory;
  window.renderWaterInventory=function(){oldRenderWaterInventory();renderWaterV2();renderHousehold();};
  window.scoreOperations=function(){return v2ReadinessScore()};
  window.renderOperationsHome=function(){
    const o=getOperations(),inv=getInventory(),total=inv.length,available=inv.filter(i=>i.status==='available').length,score=v2ReadinessScore(),ring=document.getElementById('readinessRing'),top=topRisk(),w=getWaterSystem(),cap=waterCapacity(w),current=waterCurrent(w);
    if(ring)ring.style.background=`conic-gradient(#2f9a58 ${score*3.6}deg, rgba(120,135,126,.22) 0deg)`;
    put('readinessScore',score+'%');put('readinessMessage',score>=80?'Preparación alta. Mantené pruebas y respaldos.':score>=55?'Preparación intermedia. EDY detectó mejoras pendientes.':'Preparación inicial. Priorizá recursos esenciales y planes.');
    put('opWater',inventoryWaterLiters()>0?`${waterDays(o).toFixed(1)} días · ${fmt(inventoryWaterLiters())} L`:'Sin registrar');
    put('opWaterGeneral',cap>0?`${fmt(cap)} L capacidad${current===null?' · nivel pendiente':' · '+fmt(current)+' L actuales'}`:'Sin configurar');
    put('opFood',o.updated?o.foodDays+' días':'Sin registrar');put('opEnergy',o.updated?o.energyHours+' horas':'Sin registrar');put('opComms',o.updated?(o.comms>=100?'Operativas':o.comms>0?'Limitadas':'No disponibles'):'Sin registrar');put('opHealth',o.updated?o.healthPercent+'%':'Sin registrar');put('opInventory',`${available}/${total} disponibles`);put('opZones',`${getZones().length} zonas`);put('opFamily',`${familyHumans().length} personas · ${familyPets().length} mascotas`);put('opContacts',`${getContacts().filter(c=>c.category==='family').length} familiares · ${getContacts().filter(c=>c.wallet).length} prioritarios`);put('opRisk',top?`${riskPriority(top).label} · ${top.name}`:'Sin evaluar');
    if(typeof renderReadinessInsights==='function')renderReadinessInsights();renderV2Home();
  };
  window.renderOperationsResult=function(){
    const box=document.getElementById('operationsResult');if(!box)return;const o=getOperations(),score=v2ReadinessScore(),w=getWaterSystem(),cap=waterCapacity(w),current=waterCurrent(w);
    box.innerHTML=`<div class="opsResultCard"><h3>Preparación integral: ${score}%</h3><div class="opsBar"><span style="width:${score}%"></span></div><p><strong>Agua potable:</strong> ${fmt(inventoryWaterLiters())} L · ${waterDays(o).toFixed(1)} días.</p><p><strong>Agua de uso general:</strong> ${fmt(cap)} L de capacidad${current===null?' · volumen actual pendiente':` · ${fmt(current)} L actuales`}.</p><p><strong>Alimentos:</strong> ${o.updated?`${o.foodDays} días`:'Sin registrar'}.</p><p><strong>Energía:</strong> ${o.updated?`${o.energyHours} horas estimadas`:'Sin registrar'}.</p><p><strong>Riesgos:</strong> ${overallRiskCoverage()}% de acciones cubiertas.</p><p class="small">El porcentaje muestra cobertura de categorías; no garantiza seguridad absoluta.</p></div>`;
  };
  window.crisisSummary=function(){const o=getOperations(),shopping=getAutomaticShoppingList(),criticalMissing=getInventory().filter(i=>i.critical&&i.status!=='available').length,w=getWaterSystem(),h=getHousehold();return {water:inventoryWaterLiters(),days:waterDays(o),general:familyTechnicalWater(w,h),generalCapacity:waterCapacity(w),well:w.wellAvailable,pump:w.pumpType,pumpBackup:w.pumpBackup,shopping:shopping.length,criticalMissing,family:`${familyHumans().length} personas · ${familyPets().length} mascotas`}};
  window.renderCrisisDashboard=function(){
    const x=window.crisisSummary();put('crisisWater',`${fmt(x.water)} L`);put('crisisWaterDays',`${x.days.toFixed(1)} días`);put('crisisGeneralWater',x.general===null?`${fmt(x.generalCapacity)} L capacidad`:`${fmt(x.general)} L`);put('crisisWaterSource',x.well==='yes'?`Pozo · ${x.pump==='electric'?'bomba eléctrica':x.pump==='mixed'?'alternativa disponible':x.pump==='manual'?'bombeo manual':'bomba sin registrar'}`:'Fuente sin confirmar');put('crisisFamily',x.family);put('crisisShopping',x.shopping);put('crisisMissing',x.criticalMissing);
    const box=document.getElementById('crisisPriorities');if(!box)return;const priorities=[];
    if(x.days<3)priorities.push('Asegurar agua potable adicional. El agua de cisterna o pozo no se considera potable sin control o tratamiento.');
    if(x.well==='yes'&&x.pump==='electric'&&x.pumpBackup!=='yes')priorities.push('Racionar agua fija: la reposición del pozo depende de electricidad y el respaldo de la bomba no está confirmado.');
    const risk=topRisk(),pending=risk?.actions.find(a=>!actionCovered(a));if(pending)priorities.push(`${risk.icon} ${pending.text}`);
    if(x.criticalMissing)priorities.push(`Resolver ${x.criticalMissing} elemento${x.criticalMissing===1?'':'s'} crítico${x.criticalMissing===1?'':'s'} no disponible${x.criticalMissing===1?'':'s'}.`);
    if(!priorities.length)priorities.push('Mantener comunicaciones, conservar recursos y seguir avisos oficiales.');box.innerHTML=priorities.map((p,i)=>`<div><span>${i+1}</span><p>${esc(p)}</p></div>`).join('');
  };

  // Respaldo acumulativo 2.0.
  const oldGetAllBackupData=window.getAllBackupData;
  window.getAllBackupData=async function(){const data=await oldGetAllBackupData();return {...data,version:V2_VERSION,household:getHousehold(),waterSystem:getWaterSystem(),risks:getRiskProfile()}};
  const oldImportBackup=window.importEDYBackup;
  window.importEDYBackup=function(event){
    const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=async()=>{try{const data=JSON.parse(reader.result);if(!data.inventory||!Array.isArray(data.inventory))throw new Error('Formato inválido');if(!confirm('Esto reemplazará los datos locales actuales. ¿Continuar?'))return;EDYStorage.set('inventory',applyInventoryMigrations(mergeStarterItems(data.inventory,{force:true})));EDYStorage.set('zones',Array.isArray(data.zones)?data.zones:getZones());EDYStorage.set('operations',data.operations||{});EDYStorage.set('status',data.status||{});EDYStorage.set('pendings',Array.isArray(data.pendings)?data.pendings:[]);EDYStorage.set('timeline',Array.isArray(data.timeline)?data.timeline:[]);EDYStorage.set('checklists',Array.isArray(data.checklists)?data.checklists:getChecklists());if(Array.isArray(data.family))EDYStorage.set('family_profile',data.family.map(normalizeFamilyMember));if(Array.isArray(data.contacts))EDYStorage.set('contacts',data.contacts.map(normalizeContact));if(data.household)EDYStorage.set(HOUSEHOLD_KEY,{...HOUSEHOLD_DEFAULT,...data.household});if(data.waterSystem)EDYStorage.set(WATER_KEY,{...WATER_DEFAULT,...data.waterSystem});if(Array.isArray(data.risks))EDYStorage.set(RISK_KEY,data.risks.map(normalizeRisk));if(data.energyCenterV22)EDYStorage.set('energy_center_v22',data.energyCenterV22);if(data.blackoutV22)EDYStorage.set('blackout_mode_v22',data.blackoutV22);window.EDYKits?.importData?.(data);await EDYMedia.replaceAll(Array.isArray(data.photos)?data.photos:[]);if(data.activeEmergency)EDYStorage.set('active_emergency',data.activeEmergency);else EDYStorage.remove('active_emergency');EDYStorage.set('last_backup',new Date().toLocaleString('es-AR'));addTimelineEntry('backup','⬆️','Respaldo 2.2 importado');renderAllBetaViews();renderV2All();alert('Respaldo importado correctamente.');}catch(e){console.error(e);alert('No se pudo importar el archivo. Verificá que sea un respaldo válido de EDY.')}event.target.value='';};reader.readAsText(file);
  };

  // Tarjeta de billetera: la dirección completa solo aparece cuando el usuario lo habilita.
  const oldPrintWallet=window.printWalletCard;
  window.printWalletCard=function(){
    const h=getHousehold();if(!h.includeAddressOnWallet||!h.address)return oldPrintWallet();
    const contacts=getContacts().filter(c=>c.wallet).sort((a,b)=>a.priority-b.priority),family=contacts.filter(c=>c.category==='family').slice(0,6),official=contacts.filter(c=>c.category!=='family').slice(0,6);if(!family.length){alert('Primero importá o cargá los contactos familiares.');return}
    const rows=list=>list.map(c=>`<div class="row"><span>${esc(c.alias||c.name)}</span><b>${esc(contactPhoneLabel(c))}</b></div>`).join('');const win=window.open('','_blank');if(!win){alert('Safari bloqueó la tarjeta. Habilitá las ventanas emergentes e intentá nuevamente.');return}
    win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tarjeta de emergencia</title><style>@page{size:A4;margin:10mm}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111}.sheet{display:flex;gap:8mm;flex-wrap:wrap}.card{box-sizing:border-box;width:85.6mm;height:54mm;border:1px solid #111;border-radius:3mm;padding:4mm;overflow:hidden}.head{display:flex;justify-content:space-between;border-bottom:1px solid #bbb;padding-bottom:2mm;margin-bottom:2mm}.head strong{font-size:13pt}.head span{font-size:8pt}.row{display:flex;justify-content:space-between;gap:3mm;font-size:9pt;padding:1.1mm 0;border-bottom:.2mm solid #ddd}.row span{font-weight:650}.row b{white-space:nowrap}.note{font-size:7.2pt;margin-top:2mm;line-height:1.25}.address{font-size:7.3pt;font-weight:700;margin:1.5mm 0}.screen{margin:0 0 8mm}.screen button{padding:10px 16px;font-size:16px}@media print{.screen{display:none}}</style></head><body><div class="screen"><button onclick="window.print()">Imprimir / Guardar PDF</button></div><div class="sheet"><section class="card"><div class="head"><strong>Familia</strong><span>CONTACTOS</span></div>${rows(family)}<div class="address">Hogar: ${esc(h.address)}${h.city?', '+esc(h.city):''}</div><div class="note">En una emergencia, comunicarse por llamada o WhatsApp según disponibilidad.</div></section><section class="card"><div class="head"><strong>Emergencias</strong><span>${esc(h.city||'LOCAL')}</span></div>${rows(official)}<div class="note">Indicá ubicación exacta, qué ocurrió, cuántas personas están afectadas y un teléfono de contacto.</div></section></div></body></html>`);win.document.close();setTimeout(()=>win.focus(),200);
  };

  function renderV2All(){renderHousehold();renderWaterV2();renderRiskProfile();renderV2Home();window.renderOperationsHome?.();if(document.getElementById('crisisCenter')?.classList.contains('active'))window.renderCrisisDashboard?.();}

  // Exponer funciones de HTML.
  Object.assign(window,{saveHouseholdProfile,saveWaterSystem,renderHousehold,renderWaterV2,renderRiskProfile,openRisk,renderRiskDetail,toggleRiskAction,saveRiskSettings,toggleRiskEnabled,resetRiskProfile,importPrivateProfile,exportPrivateProfile,renderV2All});

  // Si el usuario llega desde 1.5.x o 1.6.x, no necesita instalar versiones intermedias.
  if(!EDYStorage.get(RISK_KEY,null))EDYStorage.set(RISK_KEY,RISK_DEFAULTS.map(normalizeRisk));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(renderV2All,0));
  setTimeout(renderV2All,250);
})();

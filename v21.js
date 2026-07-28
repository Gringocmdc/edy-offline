/* EDY Offline 2.1 · Simulador y Plan de Acción */
(() => {
  const VERSION='2.1.0';
  const SIM_KEY='simulator_v21';
  const PLAN_KEY='evacuation_plan_v21';

  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const fmt=v=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(n(v));
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const store=()=>typeof EDYStorage!=='undefined'?EDYStorage:window.EDYStorage;
  const inv=()=>typeof getInventory==='function'?getInventory():(store()?.get('inventory',[])||[]);
  const available=()=>inv().filter(x=>x.status!=='unavailable'&&n(x.qty)>0);
  const text=x=>`${x.name||''} ${x.brand||''} ${x.model||''} ${x.category||''} ${x.notes||''}`.toLowerCase();
  const has=(...terms)=>available().some(x=>terms.some(t=>text(x).includes(t)));
  const qtyBy=(predicate,unit)=>available().filter(predicate).reduce((s,x)=>s+(String(x.unit||'').toLowerCase()===unit.toLowerCase()?n(x.qty):0),0);
  const potableLiters=()=>qtyBy(x=>text(x).includes('agua')&&(text(x).includes('potable')||text(x).includes('bidón')||text(x).includes('bidon')),'l');
  const operations=()=>store()?.get('operations',{})||{};
  const household=()=>store()?.get('household_profile_v2',{})||{};
  const water=()=>store()?.get('water_system_v2',{})||{};
  const family=()=>store()?.get('family_profile',[])||[];

  function readInputs(){
    return {
      scenario:document.getElementById('simScenario')?.value||'blackout',
      days:Math.max(1,n(document.getElementById('simDays')?.value,3)),
      people:Math.max(1,n(document.getElementById('simPeople')?.value,family().filter(x=>x.type!=='pet').length||5)),
      litersPerPerson:Math.max(1,n(document.getElementById('simLiters')?.value,3)),
      energyHours:Math.max(0,n(document.getElementById('simEnergy')?.value,n(operations().energyHours,0))),
      foodDays:Math.max(0,n(document.getElementById('simFood')?.value,n(operations().foodDays,0)))
    };
  }

  function assess(data){
    const waterNeed=data.people*data.litersPerPerson*data.days;
    const potable=potableLiters();
    const checks=[];
    const add=(label,ok,detail,priority='normal')=>checks.push({label,ok,detail,priority});

    add('Agua potable',potable>=waterNeed,`${fmt(potable)} L disponibles · ${fmt(waterNeed)} L necesarios`,potable<waterNeed?'critical':'normal');
    add('Alimentos',data.foodDays>=data.days,data.foodDays?`${fmt(data.foodDays)} días declarados`:'Autonomía de alimentos sin completar',data.foodDays<data.days?'critical':'normal');
    add('Iluminación',has('linterna','luz de emergencia','barra luminosa'),'EDY busca linternas o luces en el inventario');
    add('Energía de respaldo',has('estación de energía','estacion de energia','power station','generador'),has('estación de energía','estacion de energia')?'Estación portátil registrada':'No se detectó una fuente de respaldo');
    add('Comunicaciones',has('radio','walkie','comunicador','powerbank','batería externa','bateria externa'),'Radio, comunicadores o carga alternativa');
    add('Botiquín',has('botiquín','botiquin','primeros auxilios'),'Botiquín disponible en inventario');
    add('Fuego seguro',has('encendedor','fósforo','fosforo'),'Medio de encendido registrado');

    if(data.scenario==='blackout'){
      add('Bomba del pozo',water().pumpBackup==='yes'||['manual','mixed'].includes(water().pumpType),'Respaldo de bomba: '+({yes:'confirmado',no:'no disponible',unknown:'sin confirmar'}[water().pumpBackup]||'sin confirmar'),water().pumpBackup!=='yes'?'critical':'normal');
      add('Autonomía eléctrica declarada',data.energyHours>=Math.min(24,data.days*4),data.energyHours?`${fmt(data.energyHours)} horas`:'Sin estimar',data.energyHours===0?'critical':'normal');
    }
    if(data.scenario==='storm'){
      add('Protección contra agua',has('bolsa estanca','caja estanca','ziploc','lona','cinta ductac'),'Protección de documentos, electrónica y filtraciones');
      add('Zona interior segura',Boolean(store()?.get('risk_profile_v2',[])?.find(r=>r.id==='storm')?.actions?.find(a=>a.id==='safe-room')?.done),'Debe definirse una zona alejada de vidrios');
    }
    if(data.scenario==='water'){
      const w=water(); const capacity=n(w.cisternCapacity)+n(w.tankCount)*n(w.tankCapacity);
      add('Capacidad sanitaria',capacity>0,`${fmt(capacity)} L de capacidad instalada`);
      add('Nivel real registrado',w.cisternCurrent!==null&&w.cisternCurrent!==undefined||w.tanksCurrent!==null&&w.tanksCurrent!==undefined,'La capacidad no equivale al volumen actual', 'critical');
      add('Tratamiento de agua',has('filtro','pastilla potabilizadora','cloro'),'El agua de pozo no se considera potable automáticamente');
    }
    if(data.scenario==='evacuation'){
      add('Mochila 72 h',has('ready america','mochila 72','kit 72'),'Kit o mochila registrada');
      add('Documentos protegidos',has('bolsa estanca','caja estanca','portadocumento'),'Documentos accesibles y protegidos');
      add('Mascotas',has('correa','transportadora','alimento mascota'),'Correas, transportadoras y alimento');
      add('Contactos familiares',(store()?.get('contacts',[])||[]).length>0,'Contactos guardados localmente');
    }

    const total=checks.length;
    const ok=checks.filter(x=>x.ok).length;
    const score=Math.round(ok/Math.max(1,total)*100);
    return {score,checks,waterNeed,potable};
  }

  function renderResult(data,result){
    const box=document.getElementById('simResult'); if(!box)return;
    const labels={blackout:'Apagón prolongado',storm:'Tormenta severa',water:'Interrupción de agua',evacuation:'Evacuación rápida'};
    const className=result.score>=75?'simGood':result.score>=50?'simMedium':'simLow';
    box.innerHTML=`
      <div class="simScoreCard ${className}">
        <div class="simScoreRing"><strong>${result.score}%</strong><span>cobertura</span></div>
        <div><h3>${labels[data.scenario]}</h3><p>Escenario de ${fmt(data.days)} día${data.days===1?'':'s'} para ${fmt(data.people)} personas.</p></div>
      </div>
      <div class="simChecks">${result.checks.map(c=>`<div class="simCheck ${c.ok?'ok':'missing'}"><span>${c.ok?'✓':'!'}</span><div><strong>${esc(c.label)}</strong><small>${esc(c.detail)}</small></div></div>`).join('')}</div>
      <div class="panel ${result.score<50?'red':'amber'}"><strong>Lectura de EDY:</strong> ${result.score>=75?'La base es sólida, pero revisá los puntos pendientes antes de depender de ella.':result.score>=50?'La preparación es parcial. Resolvé primero los faltantes marcados.':'El escenario supera la preparación registrada. Priorizá agua, alimentos, energía y comunicaciones.'}</div>`;
  }

  window.runEmergencySimulation=function(){
    const data=readInputs(); const result=assess(data);
    store()?.set(SIM_KEY,{...data,lastRun:new Date().toISOString(),score:result.score});
    renderResult(data,result);
    if(typeof addTimelineEntry==='function')addTimelineEntry('simulation','🧪',`Simulación: ${data.scenario} · ${result.score}%`);
  };

  function loadSimulator(){
    const saved=store()?.get(SIM_KEY,{})||{};
    const people=family().filter(x=>x.type!=='pet').length||n(operations().people,5)||5;
    const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined&&v!==null)e.value=v};
    set('simScenario',saved.scenario||'blackout');set('simDays',saved.days||3);set('simPeople',saved.people||people);set('simLiters',saved.litersPerPerson||3);set('simEnergy',saved.energyHours||operations().energyHours||'');set('simFood',saved.foodDays||operations().foodDays||'');
  }

  const defaultPlan=[
    ['Reunir a toda la familia y confirmar que nadie esté herido','family'],
    ['Tomar teléfonos, cargadores y powerbank','comms'],
    ['Llevar documentos, llaves, efectivo y medicamentos','docs'],
    ['Tomar agua potable y alimentos listos para consumir','water'],
    ['Retirar botiquín y mochilas de 72 horas','kits'],
    ['Asegurar mascotas con correas o transportadoras','pets'],
    ['Cerrar gas y electricidad solo si es seguro','utilities'],
    ['Salir por la ruta acordada y dirigirse al punto de reunión','route']
  ];
  function getPlan(){return store()?.get(PLAN_KEY,defaultPlan.map(([text,id])=>({id,text,done:false})))||[]}
  function savePlan(p){store()?.set(PLAN_KEY,p)}
  window.toggleEvacuationPlan=function(id,done){const p=getPlan();const x=p.find(i=>i.id===id);if(x)x.done=done;savePlan(p);renderEvacuationPlan()};
  window.resetEvacuationPlan=function(){savePlan(defaultPlan.map(([text,id])=>({id,text,done:false})));renderEvacuationPlan()};
  function renderEvacuationPlan(){
    const p=getPlan(),box=document.getElementById('evac15List');if(!box)return;
    const done=p.filter(x=>x.done).length;
    const pct=Math.round(done/Math.max(1,p.length)*100);
    document.getElementById('evac15Progress').textContent=`${done}/${p.length} · ${pct}%`;
    box.innerHTML=p.map(x=>`<label class="evac15Item ${x.done?'done':''}"><input type="checkbox" ${x.done?'checked':''} onchange="toggleEvacuationPlan('${x.id}',this.checked)"><span><strong>${esc(x.text)}</strong></span></label>`).join('');
  }

  function install(){loadSimulator();renderEvacuationPlan();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.EDY21={version:VERSION,runEmergencySimulation,renderEvacuationPlan};
})();

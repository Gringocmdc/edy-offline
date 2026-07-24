
function calculateWater(){
 const liters=Number(document.getElementById('waterLiters').value);
 const people=Number(document.getElementById('waterPeople').value);
 const per=Number(document.getElementById('waterPerPerson').value);
 const box=document.getElementById('waterResult');
 if(!liters){box.textContent='Ingresá los litros disponibles.';return}
 const profileDaily=typeof familyDailyWater==='function'?familyDailyWater():0;
 const humans=typeof familyHumans==='function'?familyHumans().length:people;
 const pets=typeof familyPets==='function'?familyPets().length:0;
 const daily=profileDaily>0?profileDaily:people*per;
 if(!daily){box.textContent='Completá el consumo diario.';return}
 const days=liters/daily;
 box.innerHTML=profileDaily>0
  ?`Autonomía familiar estimada: <strong>${days.toFixed(1)} días</strong><br><span class="small">${liters} litros para ${humans} personas y ${pets} mascotas, usando ${daily.toFixed(2)} L diarios configurados en el perfil familiar.</span>`
  :`Autonomía estimada: <strong>${days.toFixed(1)} días</strong><br><span class="small">${liters} litros para ${people} personas usando ${per} L por persona por día.</span>`;
 EDYStorage.set('water_calc',{liters,people,per,profileDaily});
}
function calculateEnergy(){
 const wh=Number(document.getElementById('batteryWh').value);
 const percent=Number(document.getElementById('batteryPercent').value);
 const watts=Number(document.getElementById('loadWatts').value);
 const eff=Number(document.getElementById('efficiency').value);
 const box=document.getElementById('energyResult');
 if(!wh||!percent||!watts||!eff){box.textContent='Completá todos los valores.';return}
 const usable=wh*(percent/100)*(eff/100);
 const hours=usable/watts;
 box.innerHTML=`Autonomía estimada: <strong>${hours.toFixed(1)} horas</strong><br><span class="small">Energía útil aproximada: ${usable.toFixed(0)} Wh.</span>`;
 EDYStorage.set('energy_calc',{wh,percent,watts,eff});
}

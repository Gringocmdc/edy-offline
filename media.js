const EDYMedia={
 dbName:'edy_media_v1',storeName:'photos',db:null,
 open(){
  if(this.db)return Promise.resolve(this.db);
  return new Promise((resolve,reject)=>{
   const request=indexedDB.open(this.dbName,1);
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(this.storeName))db.createObjectStore(this.storeName)};
   request.onsuccess=()=>{this.db=request.result;resolve(this.db)};
   request.onerror=()=>reject(request.error);
  });
 },
 async putPhoto(id,data){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction(this.storeName,'readwrite');tx.objectStore(this.storeName).put(data,id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})},
 async getPhoto(id){try{const db=await this.open();return await new Promise((resolve,reject)=>{const r=db.transaction(this.storeName,'readonly').objectStore(this.storeName).get(id);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error)})}catch{return ''}},
 async deletePhoto(id){try{const db=await this.open();return await new Promise((resolve,reject)=>{const tx=db.transaction(this.storeName,'readwrite');tx.objectStore(this.storeName).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}catch{return false}},
 async getAllPhotos(){try{const db=await this.open();return await new Promise((resolve,reject)=>{const store=db.transaction(this.storeName,'readonly').objectStore(this.storeName);const keys=store.getAllKeys(),values=store.getAll();let k=null,v=null;const done=()=>{if(k&&v)resolve(k.map((id,i)=>({id,data:v[i]})))};keys.onsuccess=()=>{k=keys.result;done()};values.onsuccess=()=>{v=values.result;done()};keys.onerror=values.onerror=()=>reject(keys.error||values.error)})}catch{return []}},
 async replaceAll(photos=[]){try{const db=await this.open();await new Promise((resolve,reject)=>{const tx=db.transaction(this.storeName,'readwrite');tx.objectStore(this.storeName).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});for(const p of photos){if(p&&p.id&&p.data)await this.putPhoto(p.id,p.data)}return true}catch{return false}}
};


const EDYStorage={
 get(key,fallback=null){try{const v=localStorage.getItem('edy_'+key);return v?JSON.parse(v):fallback}catch{return fallback}},
 set(key,value){localStorage.setItem('edy_'+key,JSON.stringify(value))},
 remove(key){localStorage.removeItem('edy_'+key)}
};

// Platform-only optimistic concurrency. Domain validation remains in Rust.
export const DATABASE='cam-gui-session-recovery';
function open(name) {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('records');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Recovery database upgrade is blocked by another tab'));
  });
}
export async function loadRecord(name=DATABASE) {
  const db=await open(name);
  try {return await new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readonly');let value=null;
    const request=tx.objectStore('records').get('current');request.onsuccess=()=>{value=request.result??null;};
    tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error??new Error('Recovery read aborted'));
  });} finally {db.close();}
}
export async function deleteRecord(name=DATABASE) {
  const db=await open(name);
  try {return await new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readwrite');
    tx.objectStore('records').delete('current');
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('Recovery delete aborted'));
  });}finally{db.close();}
}
export async function writeRecord(expected,snapshot,name=DATABASE) {
  const db=await open(name);
  try {return await new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readwrite');const store=tx.objectStore('records');let failure,revision;
    const request=store.get('current');
    request.onsuccess=()=>{
      try {
        const current=request.result===undefined?null:JSON.parse(request.result);
        if((current?.revision??null)!==expected)throw new Error(name==='cam-gui-resources'?'Library revision conflict; compare the stored revision before choosing which edits to save':'Revision conflict; reload recovery before choosing which draft to keep');
        revision=(expected??0)+1;
        if(!Number.isSafeInteger(revision)||revision<1)throw new Error('Recovery revision limit');
        const text=JSON.stringify({revision,snapshot});
        if(new TextEncoder().encode(text).byteLength>9_000_000)throw new Error('Recovery exceeds 9 MB');
        store.put(text,'current');
      }catch(error){failure=error;tx.abort();}
    };
    tx.oncomplete=()=>resolve(revision);
    tx.onabort=()=>reject(failure??tx.error??new Error('Recovery write aborted'));
  });}finally{db.close();}
}

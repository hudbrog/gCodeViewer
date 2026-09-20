// Generated assets are rebuildable. Recovery records live separately in IDB.
importScripts('./offline-manifest.js');
const cacheName=`cam-gui-assets-${self.CAM_GUI_OFFLINE.version}`;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(cacheName);await cache.addAll(self.CAM_GUI_OFFLINE.assets);await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const previous=(await caches.keys()).filter(n=>n.startsWith('cam-gui-assets-')&&n!==cacheName);
  // Retain one previous cache for inspection/rollback; this does not pin open
  // clients to their original build. Never touch recovery DBs.
  await Promise.all(previous.slice(0,-1).map(n=>caches.delete(n)));await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{const cache=await caches.open(cacheName);return (await cache.match(event.request))??fetch(event.request);})());
});

import init, {compute, protocol, payload_view} from './pkg/cam_gui.js';
const ready=init();
self.onmessage=async ({data})=>{
  await ready;
  if(data.protocol!==protocol()) throw new Error('Worker protocol mismatch');
  // Metadata stays JSON; the scene payload crosses as one transferable binary
  // buffer instead of a JSON array of vertices and stock cells.
  const meta=compute(data.request);
  const payload=payload_view(); // Owned copy out of WASM memory.
  self.postMessage({protocol:protocol(),gui2Protocol:"gui2-retained-5",meta,payload:payload.buffer},[payload.buffer]);
};

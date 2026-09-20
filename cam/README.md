# V-carve CAM browser snapshot

One-off static deployment at https://gcode.ws/cam/.

Built from hudbrog/vcarve_cam commit 16dea3acf04dedab3bd1dd028bb6f51555f40c0d
with scripts/build-gui.ps1 -Target web (optimized release build).
The application runs locally in a WebGPU-capable browser over HTTPS.

Packaging moves the web entry files to this directory, changes their pkg imports
to ./pkg/, and regenerates offline-manifest.js for these paths, including the
directory entry URL. Keep pkg/snippets, the license notices, and all runtime
assets together. The service worker is scoped to /cam/.

The page shell loads Google Analytics G-VSG4H1X1HC on gcode.ws only for basic
visit reporting. There are no custom analytics events in the CAM application.
The analytics script loads asynchronously and is not part of the offline cache.

Rebuild and replace this directory as one snapshot when updating.

import { contextBridge, webUtils } from 'electron';

// Renderer process (index.html/renderer.js) runs sandboxed and has no Node/Electron
// access by default. This bridge exposes exactly one function it needs: resolving
// the real filesystem path of a dropped File object. Everything else in the
// renderer stays plain browser JS.
contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});

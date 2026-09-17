"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Renderer process (index.html/renderer.js) runs sandboxed and has no Node/Electron
// access by default. This bridge exposes exactly one function it needs: resolving
// the real filesystem path of a dropped File object. Everything else in the
// renderer stays plain browser JS.
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getPathForFile: (file) => electron_1.webUtils.getPathForFile(file),
});

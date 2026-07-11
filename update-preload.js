const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('updateWindow', {
  onInit: (callback) => ipcRenderer.on('update-window:init', (_event, payload) => callback(payload)),
  onProgress: (callback) => ipcRenderer.on('update-window:progress', (_event, payload) => callback(payload)),
  respond: (buttonIndex) => ipcRenderer.send('update-window:response', buttonIndex),
});

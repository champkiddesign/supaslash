const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('screenOverlay', {
  onExpiredShow: (callback) => {
    ipcRenderer.on('overlay-expired-show', () => callback());
  },
  onExpiredHide: (callback) => {
    ipcRenderer.on('overlay-expired-hide', () => callback());
  },
  onCelebrationStart: (callback) => {
    ipcRenderer.on('celebration-start', () => callback());
  },
  onCelebrationStop: (callback) => {
    ipcRenderer.on('celebration-stop', () => callback());
  },
});

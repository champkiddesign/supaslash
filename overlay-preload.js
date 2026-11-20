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
  onApproachShow: (callback) => {
    ipcRenderer.on('overlay-approach-show', (_event, payload) => callback(payload));
  },
  onApproachHide: (callback) => {
    ipcRenderer.on('overlay-approach-hide', () => callback());
  },
});

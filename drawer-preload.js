const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('drawerOverlay', {
  onData: (callback) => {
    ipcRenderer.on('drawer-data', (_event, data) => callback(data));
  },
  onOpen: (callback) => {
    ipcRenderer.on('drawer-open', () => callback());
  },
  onClose: (callback) => {
    ipcRenderer.on('drawer-close', () => callback());
  },
  notifyPointerEnter: () => ipcRenderer.send('drawer-pointer-enter'),
  notifyPointerLeave: () => ipcRenderer.send('drawer-pointer-leave'),
  selectTask: (index) => ipcRenderer.send('drawer-select-task', index),
});

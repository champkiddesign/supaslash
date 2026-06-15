const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('slashIt', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  setWindowMode: (mode) => ipcRenderer.invoke('set-window-mode', mode),
  setFocusWidth: (contentWidth) => ipcRenderer.invoke('set-focus-width', contentWidth),
  setFocusDimensions: (dimensions) => ipcRenderer.invoke('set-focus-dimensions', dimensions),
  showSessionDrawer: (payload) => ipcRenderer.invoke('show-session-drawer', payload),
  hideSessionDrawer: () => ipcRenderer.invoke('hide-session-drawer'),
  updateSessionDrawer: (payload) => ipcRenderer.invoke('update-session-drawer', payload),
  onDrawerPointerEnter: (callback) => ipcRenderer.on('drawer-pointer-enter', callback),
  onDrawerPointerLeave: (callback) => ipcRenderer.on('drawer-pointer-leave', callback),
  onDrawerSelectTask: (callback) => ipcRenderer.on('drawer-select-task', (_event, index) => callback(index)),
  setScreenOverlay: (visible) => ipcRenderer.invoke('set-screen-overlay', visible),
  triggerCelebration: () => ipcRenderer.invoke('trigger-celebration'),
  stopCelebration: () => ipcRenderer.invoke('stop-celebration'),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mindboard', {
  hideWindow: () => ipcRenderer.send('hide-window'),
  onModeChange: (cb) => {
    const listener = (_event, mode) => cb(mode);
    ipcRenderer.on('mode-change', listener);
    return () => ipcRenderer.removeListener('mode-change', listener);
  },
  loadBoards: () => ipcRenderer.invoke('load-boards'),
  saveBoards: (data) => ipcRenderer.invoke('save-boards', data),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (data) => ipcRenderer.invoke('save-settings', data),
  onSettingsChange: (cb) => {
    const listener = (_event, settings) => cb(settings);
    ipcRenderer.on('settings-change', listener);
    return () => ipcRenderer.removeListener('settings-change', listener);
  },
  onOpenSettings: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('open-settings', listener);
    return () => ipcRenderer.removeListener('open-settings', listener);
  },
  captureShortcut: (binding) => ipcRenderer.invoke('capture-shortcut', binding),
  cancelShortcutCapture: () => ipcRenderer.send('cancel-shortcut-capture'),
});

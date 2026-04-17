import { app, BrowserWindow, globalShortcut, ipcMain, Menu, screen } from 'electron';
import { createRequire } from 'node:module';
import nodePath from 'node:path';
const _require = createRequire(import.meta.url);

const { uIOhook, UiohookKey } = _require(
  app.isPackaged
    ? nodePath.join(process.resourcesPath, 'uiohook-napi', 'dist', 'index.js')
    : 'uiohook-napi'
);
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import started from 'electron-squirrel-startup';

if (started) app.quit();
app.setName('MindBoard');

const log = (...args) => {
  if (app.isPackaged) return;
  console.log('[main]', ...args);
};

let mainWindow = null;
let isOverlay = true;
let overlayHeld = false;
let shortcutCaptureBinding = null;
let shortcutCaptureResolve = null;
const boardsDir = path.join(os.homedir(), '.mindboard');
const boardsFile = path.join(boardsDir, 'boards.json');
const settingsFile = path.join(boardsDir, 'settings.json');
const defaultSettings = {
  keybindings: {
    overlayHold: 'Control+F1',
    toggleWindow: 'Control+F2',
  },
};
let appSettings = defaultSettings;

const UIOHOOK_KEY_BY_ACCELERATOR = new Map([
  ['0', UiohookKey[0]],
  ['1', UiohookKey[1]],
  ['2', UiohookKey[2]],
  ['3', UiohookKey[3]],
  ['4', UiohookKey[4]],
  ['5', UiohookKey[5]],
  ['6', UiohookKey[6]],
  ['7', UiohookKey[7]],
  ['8', UiohookKey[8]],
  ['9', UiohookKey[9]],
  ['A', UiohookKey.A],
  ['B', UiohookKey.B],
  ['C', UiohookKey.C],
  ['D', UiohookKey.D],
  ['E', UiohookKey.E],
  ['F', UiohookKey.F],
  ['G', UiohookKey.G],
  ['H', UiohookKey.H],
  ['I', UiohookKey.I],
  ['J', UiohookKey.J],
  ['K', UiohookKey.K],
  ['L', UiohookKey.L],
  ['M', UiohookKey.M],
  ['N', UiohookKey.N],
  ['O', UiohookKey.O],
  ['P', UiohookKey.P],
  ['Q', UiohookKey.Q],
  ['R', UiohookKey.R],
  ['S', UiohookKey.S],
  ['T', UiohookKey.T],
  ['U', UiohookKey.U],
  ['V', UiohookKey.V],
  ['W', UiohookKey.W],
  ['X', UiohookKey.X],
  ['Y', UiohookKey.Y],
  ['Z', UiohookKey.Z],
  ['F1', UiohookKey.F1],
  ['F2', UiohookKey.F2],
  ['F3', UiohookKey.F3],
  ['F4', UiohookKey.F4],
  ['F5', UiohookKey.F5],
  ['F6', UiohookKey.F6],
  ['F7', UiohookKey.F7],
  ['F8', UiohookKey.F8],
  ['F9', UiohookKey.F9],
  ['F10', UiohookKey.F10],
  ['F11', UiohookKey.F11],
  ['F12', UiohookKey.F12],
]);

const CODE_TO_ACCELERATOR_KEY = {
  Backquote: 'Backquote',
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Minus: 'Minus',
  Equal: 'Equal',
  KeyA: 'A',
  KeyB: 'B',
  KeyC: 'C',
  KeyD: 'D',
  KeyE: 'E',
  KeyF: 'F',
  KeyG: 'G',
  KeyH: 'H',
  KeyI: 'I',
  KeyJ: 'J',
  KeyK: 'K',
  KeyL: 'L',
  KeyM: 'M',
  KeyN: 'N',
  KeyO: 'O',
  KeyP: 'P',
  KeyQ: 'Q',
  KeyR: 'R',
  KeyS: 'S',
  KeyT: 'T',
  KeyU: 'U',
  KeyV: 'V',
  KeyW: 'W',
  KeyX: 'X',
  KeyY: 'Y',
  KeyZ: 'Z',
  BracketLeft: 'BracketLeft',
  BracketRight: 'BracketRight',
  Backslash: 'Backslash',
  Semicolon: 'Semicolon',
  Quote: 'Quote',
  Comma: 'Comma',
  Period: 'Period',
  Slash: 'Slash',
  Space: 'Space',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
};

const MODIFIER_ALIASES = {
  control: 'Control',
  ctrl: 'Control',
  command: 'Meta',
  cmd: 'Meta',
  meta: 'Meta',
  super: 'Meta',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
};

const normalizeAccelerator = (value) => {
  if (typeof value !== 'string') return '';

  const rawParts = value
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  if (rawParts.length === 0) return '';

  const modifiers = [];
  let key = '';

  for (const rawPart of rawParts) {
    const lower = rawPart.toLowerCase();
    const modifier = MODIFIER_ALIASES[lower];
    if (modifier) {
      if (!modifiers.includes(modifier)) modifiers.push(modifier);
      continue;
    }

    const normalizedKey = rawPart.length === 1 ? rawPart.toUpperCase() : rawPart.toUpperCase();
    key = normalizedKey;
  }

  if (!key) return '';

  const orderedModifiers = ['Control', 'Alt', 'Shift', 'Meta'].filter((modifier) => modifiers.includes(modifier));
  return [...orderedModifiers, key].join('+');
};

const normalizeSettings = (value) => {
  const overlayHold = normalizeAccelerator(value?.keybindings?.overlayHold) || defaultSettings.keybindings.overlayHold;
  const toggleWindow = normalizeAccelerator(value?.keybindings?.toggleWindow) || defaultSettings.keybindings.toggleWindow;

  return {
    keybindings: {
      overlayHold,
      toggleWindow,
    },
  };
};

const parseHoldShortcut = (accelerator) => {
  const normalized = normalizeAccelerator(accelerator);
  const parts = normalized.split('+').filter(Boolean);
  const key = parts.at(-1);
  const keycode = UIOHOOK_KEY_BY_ACCELERATOR.get(key);

  if (!keycode) return null;

  return {
    accelerator: normalized,
    keycode,
    modifiers: new Set(parts.slice(0, -1)),
  };
};

const getHeldModifiers = (heldKeys) => {
  const modifiers = new Set();
  if (heldKeys.has(UiohookKey.Ctrl) || heldKeys.has(UiohookKey.CtrlRight)) modifiers.add('Control');
  if (heldKeys.has(UiohookKey.Alt) || heldKeys.has(UiohookKey.AltRight)) modifiers.add('Alt');
  if (heldKeys.has(UiohookKey.Shift) || heldKeys.has(UiohookKey.ShiftRight)) modifiers.add('Shift');
  if (heldKeys.has(UiohookKey.Meta) || heldKeys.has(UiohookKey.MetaRight)) modifiers.add('Meta');
  return modifiers;
};

const currentHoldKeys = new Set();

const inputToAccelerator = (input) => {
  const modifiers = [];
  if (input.control) modifiers.push('Control');
  if (input.alt) modifiers.push('Alt');
  if (input.shift) modifiers.push('Shift');
  if (input.meta) modifiers.push('Meta');

  const ignoredKeys = new Set(['Control', 'Shift', 'Alt', 'Meta']);
  if (ignoredKeys.has(input.key)) return modifiers.join('+');

  let key = CODE_TO_ACCELERATOR_KEY[input.code];
  if (!key) {
    if (/^F\d{1,2}$/i.test(input.key)) key = input.key.toUpperCase();
    else if (input.key?.length === 1) key = input.key.toUpperCase();
    else key = input.key?.[0]?.toUpperCase() + input.key?.slice(1);
  }

  return [...modifiers, key].filter(Boolean).join('+');
};

const emitSettingsChange = () => {
  if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('settings-change', appSettings);
  }
};

const emitModeChange = (mode) => {
  if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('mode-change', mode);
  }
};

const syncWindowToCursorDisplay = () => {
  if (!mainWindow) return;

  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = targetDisplay.bounds;

  mainWindow.setBounds({ x, y, width, height });
};

const setOverlayMode = (enabled) => {
  if (!mainWindow) return;

  log('setOverlayMode', enabled ? 'overlay' : 'normal');
  isOverlay = enabled;
  if (enabled) {
    syncWindowToCursorDisplay();
    mainWindow.setFullScreenable(false);
    mainWindow.setSkipTaskbar(false);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    emitModeChange('overlay');
    mainWindow.moveTop();
    mainWindow.showInactive();
    return;
  }

  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);
  emitModeChange('normal');
  mainWindow.moveTop();
  mainWindow.show();
  mainWindow.focus();
};

const ensureBoardsDir = () => fs.mkdir(boardsDir, { recursive: true });

const loadSettings = async () => {
  try {
    const raw = await fs.readFile(settingsFile, 'utf8');
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT') return defaultSettings;
    log('loadSettings failed', error.message);
    return defaultSettings;
  }
};

const saveSettings = async (settings) => {
  const normalized = normalizeSettings(settings);
  await ensureBoardsDir();
  await fs.writeFile(settingsFile, JSON.stringify(normalized, null, 2), 'utf8');
  appSettings = normalized;
  return normalized;
};

const openSettings = () => {
  if (!mainWindow?.webContents || mainWindow.webContents.isDestroyed()) return;
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('open-settings');
};

const applyWindowToggle = () => {
  if (!mainWindow) return;

  if (isOverlay) {
    setOverlayMode(false);
    return;
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
    emitModeChange('normal');
  }
};

const registerGlobalShortcuts = () => {
  globalShortcut.unregisterAll();
  const accelerator = normalizeAccelerator(appSettings.keybindings.toggleWindow);

  if (!accelerator) return false;

  const registered = globalShortcut.register(accelerator, applyWindowToggle);
  if (!registered) {
    log('globalShortcut registration failed', accelerator);
  }
  return registered;
};

const buildAppMenu = () => {
  const template = [
    ...(process.platform === 'darwin'
      ? [{
          label: app.name,
          submenu: [
            { label: 'Settings...', accelerator: 'Command+,', click: openSettings },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  const isDev = Boolean(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  isOverlay = !isDev;
  log('createWindow', { width, height, isDev, isOverlay });

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    show: isDev,
    frame: isDev,
    transparent: !isDev,
    backgroundColor: '#0d0d0f',
    type: isDev ? 'normal' : 'panel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const loadApp = () => {
    log('loadApp', MAIN_WINDOW_VITE_DEV_SERVER_URL || 'file');
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      const url = MAIN_WINDOW_VITE_DEV_SERVER_URL.replace('localhost', '127.0.0.1');
      void mainWindow.loadURL(url);
    } else {
      void mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
  };

  mainWindow.once('ready-to-show', () => {
    log('ready-to-show');
    if (process.platform === 'darwin' && !isDev) {
      app.dock?.show();
    }

    if (isDev) {
      mainWindow.show();
      mainWindow.focus();
      return;
    }

    if (isOverlay) {
      setOverlayMode(true);
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mainWindow.webContents.on('did-fail-load', (_e, code) => {
    log('did-fail-load', code);
    if (code === -102 || code === -6) setTimeout(loadApp, 500);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    log('did-finish-load');
    emitModeChange(isOverlay ? 'overlay' : 'normal');
    if (isDev) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log('render-process-gone', details);
  });
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) log(`[renderer ${level === 2 ? 'warn' : 'error'}]`, message, `(${sourceId}:${line})`);
  });
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!shortcutCaptureBinding || input.type !== 'keyDown') return;
    const accelerator = inputToAccelerator(input);

    event.preventDefault();

    if (input.key === 'Escape') {
      shortcutCaptureResolve?.(null);
      shortcutCaptureResolve = null;
      shortcutCaptureBinding = null;
      return;
    }

    if (input.key === 'Backspace' || input.key === 'Delete') {
      shortcutCaptureResolve?.({ binding: shortcutCaptureBinding, accelerator: '' });
      shortcutCaptureResolve = null;
      shortcutCaptureBinding = null;
      return;
    }

    if (!accelerator || !accelerator.includes('+')) return;

    shortcutCaptureResolve?.({ binding: shortcutCaptureBinding, accelerator });
    shortcutCaptureResolve = null;
    shortcutCaptureBinding = null;
  });
  mainWindow.on('show', () => log('window show'));
  mainWindow.on('hide', () => log('window hide'));
  mainWindow.on('focus', () => log('window focus'));
  mainWindow.on('blur', () => log('window blur'));

  loadApp();

  mainWindow.on('closed', () => {
    log('window closed');
    mainWindow = null;
    isOverlay = false;
  });
};

app.whenReady().then(async () => {
  log('app ready');
  appSettings = await loadSettings();
  if (process.platform === 'darwin') {
    app.setActivationPolicy('regular');
    app.dock?.show();
  }
  buildAppMenu();
  createWindow();
  registerGlobalShortcuts();

  const checkHold = () => {
    const holdShortcut = parseHoldShortcut(appSettings.keybindings.overlayHold);
    if (!holdShortcut) return;

    const heldModifiers = getHeldModifiers(currentHoldKeys);
    const hasAllModifiers = [...holdShortcut.modifiers].every((modifier) => heldModifiers.has(modifier));
    const isHeld = currentHoldKeys.has(holdShortcut.keycode) && hasAllModifiers;

    if (isHeld) {
      if (!isOverlay) {
        overlayHeld = true;
        setOverlayMode(true);
      }
    } else {
      if (isOverlay) {
        setOverlayMode(false);
        if (overlayHeld) {
          overlayHeld = false;
          mainWindow.hide();
        }
      }
    }
  };

  uIOhook.on('keydown', (e) => {
    currentHoldKeys.add(e.keycode);
    checkHold();
  });
  uIOhook.on('keyup', (e) => {
    currentHoldKeys.delete(e.keycode);
    checkHold();
  });
  try {
    uIOhook.start();
    log('uiohook started');
  } catch (e) {
    log('uiohook start failed (Accessibility permission needed):', e.message);
  }

  ipcMain.on('hide-window', () => {
    if (mainWindow) mainWindow.hide();
  });
  ipcMain.handle('load-boards', async () => {
    try {
      const raw = await fs.readFile(boardsFile, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  });
  ipcMain.handle('save-boards', async (_event, data) => {
    await ensureBoardsDir();
    await fs.writeFile(boardsFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  });
  ipcMain.handle('load-settings', async () => appSettings);
  ipcMain.handle('save-settings', async (_event, nextSettings) => {
    const previousSettings = appSettings;
    const normalized = await saveSettings(nextSettings);
    const registered = registerGlobalShortcuts();

    if (!registered) {
      appSettings = previousSettings;
      await saveSettings(previousSettings);
      registerGlobalShortcuts();
      throw new Error(`Failed to register shortcut: ${normalized.keybindings.toggleWindow}`);
    }

    emitSettingsChange();
    return appSettings;
  });
  ipcMain.handle('capture-shortcut', async (_event, binding) => {
    shortcutCaptureBinding = null;
    shortcutCaptureResolve?.(null);

    return await new Promise((resolve) => {
      shortcutCaptureBinding = binding;
      shortcutCaptureResolve = resolve;
    });
  });
  ipcMain.on('cancel-shortcut-capture', () => {
    shortcutCaptureResolve?.(null);
    shortcutCaptureResolve = null;
    shortcutCaptureBinding = null;
  });

  app.on('activate', () => {
    log('app activate');
    if (!mainWindow) {
      createWindow();
      return;
    }

    applyWindowToggle();
  });
});

app.on('window-all-closed', () => {
  log('window-all-closed');
  // macOS: keep app alive
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  log('will-quit');
  globalShortcut.unregisterAll();
  uIOhook.stop();
});

process.on('uncaughtException', (error) => {
  console.error('[main] uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection', reason);
});

export const defaultSettings = {
  keybindings: {
    overlayHold: 'Control+F1',
    toggleWindow: 'Control+F2',
  },
};

const MODIFIER_DISPLAY = {
  Control: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Meta: 'Cmd',
};

export const normalizeAccelerator = (value) => {
  if (typeof value !== 'string') return '';

  const rawParts = value
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  if (rawParts.length === 0) return '';

  const modifiers = new Set();
  let key = '';

  rawParts.forEach((part) => {
    const lower = part.toLowerCase();
    if (lower === 'control' || lower === 'ctrl') modifiers.add('Control');
    else if (lower === 'alt' || lower === 'option') modifiers.add('Alt');
    else if (lower === 'shift') modifiers.add('Shift');
    else if (lower === 'meta' || lower === 'command' || lower === 'cmd') modifiers.add('Meta');
    else key = part.length === 1 ? part.toUpperCase() : part.toUpperCase();
  });

  if (!key) return '';

  return ['Control', 'Alt', 'Shift', 'Meta']
    .filter((modifier) => modifiers.has(modifier))
    .concat(key)
    .join('+');
};

export const formatShortcut = (accelerator) =>
  normalizeAccelerator(accelerator)
    .split('+')
    .filter(Boolean)
    .map((part) => MODIFIER_DISPLAY[part] || part)
    .join('+');

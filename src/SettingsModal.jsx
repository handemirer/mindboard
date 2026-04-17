import { useEffect, useRef, useState } from 'react';
import { defaultSettings, formatShortcut } from './keybindings.js';

function ShortcutField({ label, help, value, isCapturing, onStartCapture, onCancelCapture }) {
  return (
    <label className="settings-field">
      <span className="settings-label">{label}</span>
      <span className="settings-help">{help}</span>
      <div className="shortcut-row">
        <div className={`shortcut-display${isCapturing ? ' is-capturing' : ''}`}>
          {isCapturing ? 'Press a shortcut…' : (value ? formatShortcut(value) : 'Not set')}
        </div>
        <button
          type="button"
          className={`settings-button ${isCapturing ? 'is-secondary' : 'is-primary'} shortcut-change-button`}
          onClick={() => (isCapturing ? onCancelCapture() : onStartCapture())}
        >
          {isCapturing ? 'Cancel' : 'Change'}
        </button>
      </div>
    </label>
  );
}

export default function SettingsModal({ initialSettings, onClose, onSave }) {
  const [overlayHold, setOverlayHold] = useState(initialSettings?.keybindings?.overlayHold ?? defaultSettings.keybindings.overlayHold);
  const [toggleWindow, setToggleWindow] = useState(initialSettings?.keybindings?.toggleWindow ?? defaultSettings.keybindings.toggleWindow);
  const [capturingBinding, setCapturingBinding] = useState(null);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setOverlayHold(initialSettings?.keybindings?.overlayHold ?? defaultSettings.keybindings.overlayHold);
    setToggleWindow(initialSettings?.keybindings?.toggleWindow ?? defaultSettings.keybindings.toggleWindow);
    setCapturingBinding(null);
    setError('');
  }, [initialSettings]);

  const stopCapture = () => {
    setCapturingBinding(null);
    window.mindboard?.cancelShortcutCapture?.();
  };

  const startCapture = async (bindingName) => {
    setError('');
    setCapturingBinding(bindingName);
    const result = await window.mindboard?.captureShortcut?.(bindingName);

    if (!mountedRef.current) return;

    if (!result) {
      setCapturingBinding(null);
      return;
    }

    if (result.binding === 'overlayHold') setOverlayHold(result.accelerator);
    if (result.binding === 'toggleWindow') setToggleWindow(result.accelerator);
    setCapturingBinding(null);
  };

  const saveKeybindings = async () => {
    setError('');
    try {
      await onSave({
        keybindings: {
          overlayHold,
          toggleWindow,
        },
      });
    } catch (saveError) {
      setError(saveError?.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="settings-header">
          <div>
            <p className="settings-eyebrow">Preferences</p>
            <h2 className="settings-title">Settings</h2>
          </div>
          <button type="button" className="settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-tabs">
          <button type="button" className="settings-tab is-active">Keybindings</button>
        </div>

        <div className="settings-panel">
          <ShortcutField
            label="Overlay Hold"
            help="Hold this shortcut to bring the board to the front. Release to hide it again."
            value={overlayHold}
            isCapturing={capturingBinding === 'overlayHold'}
            onStartCapture={() => void startCapture('overlayHold')}
            onCancelCapture={stopCapture}
          />

          <ShortcutField
            label="Toggle Window"
            help="Shows or hides the app window globally."
            value={toggleWindow}
            isCapturing={capturingBinding === 'toggleWindow'}
            onStartCapture={() => void startCapture('toggleWindow')}
            onCancelCapture={stopCapture}
          />

          {error && <p className="settings-error">{error}</p>}
        </div>

        <div className="settings-actions">
          <button type="button" className="settings-button is-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="settings-button is-primary" onClick={saveKeybindings}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

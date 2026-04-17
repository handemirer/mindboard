import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { createBoard, loadBoards, saveBoards } from './boards.js';
import SettingsModal from './SettingsModal.jsx';
import { defaultSettings, formatShortcut } from './keybindings.js';

const UI_OPTIONS = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
  },
};

const getNextBoardName = (boards) => {
  const maxBoardNumber = boards.reduce((max, board) => {
    const match = /^Board (\d+)$/.exec(board.name);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `Board ${maxBoardNumber + 1}`;
};

const captureScene = (api) => {
  if (!api) {
    return { elements: [], appState: { theme: 'dark' } };
  }

  return {
    elements: api.getSceneElementsIncludingDeleted?.() ?? api.getSceneElements(),
    appState: { theme: 'dark' },
  };
};

export default function App() {
  const [boardsState, setBoardsState] = useState(null);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [overlayMode, setOverlayMode] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const excalidrawApiRef = useRef(null);

  const setExcalidrawApi = useCallback((api) => {
    excalidrawApiRef.current = api;
  }, []);

  useEffect(() => {
    let disposed = false;

    loadBoards().then((loadedBoards) => {
      if (disposed) return;
      setBoardsState(loadedBoards);
      setActiveBoardId(loadedBoards.lastBoardId);
    });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    window.mindboard?.loadSettings?.().then((loadedSettings) => {
      if (disposed || !loadedSettings) return;
      setSettings(loadedSettings);
    });

    const unsubscribeSettings = window.mindboard?.onSettingsChange?.((nextSettings) => {
      setSettings(nextSettings);
    });

    const unsubscribeOpen = window.mindboard?.onOpenSettings?.(() => {
      setSettingsOpen(true);
    });

    return () => {
      disposed = true;
      unsubscribeSettings?.();
      unsubscribeOpen?.();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.mindboard?.onModeChange?.((mode) => {
      setOverlayMode(mode === 'overlay');
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const activeBoardIdRef = useRef(activeBoardId);
  activeBoardIdRef.current = activeBoardId;
  const boardsStateRef = useRef(boardsState);
  boardsStateRef.current = boardsState;

  useEffect(() => {
    const id = setInterval(() => {
      const api = excalidrawApiRef.current;
      const boardId = activeBoardIdRef.current;
      const state = boardsStateRef.current;
      if (!api || !boardId || !state) return;
      const elements = api.getSceneElements();
      const next = {
        ...state,
        boards: state.boards.map((b) =>
          b.id === boardId ? { ...b, elements: [...elements] } : b,
        ),
      };
      boardsStateRef.current = next;
      void saveBoards(next);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  if (!boardsState || !activeBoardId) {
    return <div className="app-shell" />;
  }

  const activeBoard = boardsState.boards.find((board) => board.id === activeBoardId) ?? boardsState.boards[0];

  const updateBoardsState = (updater) => {
    setBoardsState((previousState) => {
      const nextState = updater(previousState);
      void saveBoards(nextState);
      return nextState;
    });
  };

  const switchBoard = (nextBoardId) => {
    if (nextBoardId === activeBoardId) return;

    const scene = captureScene(excalidrawApiRef.current);
    updateBoardsState((previousState) => ({
      ...previousState,
      lastBoardId: nextBoardId,
      boards: previousState.boards.map((board) =>
        board.id === activeBoardId ? { ...board, ...scene } : board,
      ),
    }));
    setActiveBoardId(nextBoardId);
  };

  const addBoard = () => {
    const nextBoard = createBoard(getNextBoardName(boardsState.boards));
    const scene = captureScene(excalidrawApiRef.current);

    updateBoardsState((previousState) => ({
      ...previousState,
      lastBoardId: nextBoard.id,
      boards: [
        ...previousState.boards.map((board) =>
          board.id === activeBoardId ? { ...board, ...scene } : board,
        ),
        nextBoard,
      ],
    }));
    setActiveBoardId(nextBoard.id);
  };

  const closeBoard = (event, boardId) => {
    event.stopPropagation();
    if (boardsState.boards.length === 1) return;

    const remainingBoards = boardsState.boards.filter((board) => board.id !== boardId);
    const nextActiveBoardId = boardId === activeBoardId ? remainingBoards[0].id : activeBoardId;

    updateBoardsState((previousState) => ({
      ...previousState,
      lastBoardId: nextActiveBoardId,
      boards: previousState.boards.filter((board) => board.id !== boardId),
    }));
    setActiveBoardId(nextActiveBoardId);
  };

  const beginRename = (event, board) => {
    event.stopPropagation();
    setEditingBoardId(board.id);
    setEditingName(board.name);
  };

  const commitRename = () => {
    const trimmedName = editingName.trim();
    if (!editingBoardId) return;

    if (!trimmedName) {
      setEditingBoardId(null);
      setEditingName('');
      return;
    }

    updateBoardsState((previousState) => ({
      ...previousState,
      boards: previousState.boards.map((board) =>
        board.id === editingBoardId ? { ...board, name: trimmedName } : board,
      ),
    }));
    setEditingBoardId(null);
    setEditingName('');
  };

  return (
    <div className="app-shell">
      {overlayMode && (
        <>
          <div className="overlay-pill">OVERLAY — {formatShortcut(settings.keybindings.toggleWindow)} to exit</div>
          <button className="overlay-close" type="button" onClick={() => window.mindboard?.hideWindow?.()}>
            X
          </button>
        </>
      )}

      <div className="tab-bar">
        {boardsState.boards.map((board) => (
          <button
            key={board.id}
            type="button"
            className={`tab-button${board.id === activeBoardId ? ' is-active' : ''}`}
            onClick={() => switchBoard(board.id)}
            onDoubleClick={(event) => beginRename(event, board)}
          >
            {editingBoardId === board.id ? (
              <input
                autoFocus
                className="tab-rename-input"
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                onBlur={commitRename}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitRename();
                  if (event.key === 'Escape') {
                    setEditingBoardId(null);
                    setEditingName('');
                  }
                }}
              />
            ) : (
              <span className="tab-label">{board.name}</span>
            )}
            {boardsState.boards.length > 1 && (
              <span
                className="tab-close"
                onClick={(event) => closeBoard(event, board.id)}
              >
                ×
              </span>
            )}
          </button>
        ))}

        <button type="button" className="tab-add-button" onClick={addBoard}>
          +
        </button>
      </div>

      <div className="canvas-shell">
        <Excalidraw
          key={activeBoard.id}
          excalidrawAPI={setExcalidrawApi}
          theme="dark"
          initialData={{
            elements: activeBoard.elements,
            appState: { theme: 'dark' },
          }}
          UIOptions={UI_OPTIONS}
        />
      </div>

      {settingsOpen && (
        <SettingsModal
          initialSettings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={async (nextSettings) => {
            const savedSettings = await window.mindboard?.saveSettings?.(nextSettings);
            if (savedSettings) setSettings(savedSettings);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

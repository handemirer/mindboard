const createDefaultData = () => {
  const board = createBoard('Board 1');
  return { lastBoardId: board.id, boards: [board] };
};

export const createBoard = (name) => ({
  id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  name,
  elements: [],
  appState: { theme: 'dark' },
});

const normalizeBoard = (board, index) => ({
  id: board?.id || `board-${Date.now()}-${index}`,
  name: board?.name || `Board ${index + 1}`,
  elements: Array.isArray(board?.elements) ? board.elements : [],
  appState: { theme: 'dark' },
});

export const loadBoards = async () => {
  try {
    const raw = await window.mindboard?.loadBoards?.();
    if (!raw || !Array.isArray(raw.boards) || raw.boards.length === 0) {
      const defaultData = createDefaultData();
      await saveBoards(defaultData);
      return defaultData;
    }

    const boards = raw.boards.map(normalizeBoard);
    const lastBoardId = boards.some((board) => board.id === raw.lastBoardId)
      ? raw.lastBoardId
      : boards[0].id;

    return { lastBoardId, boards };
  } catch {
    const defaultData = createDefaultData();
    await saveBoards(defaultData);
    return defaultData;
  }
};

export const saveBoards = async (data) => {
  try {
    await window.mindboard?.saveBoards?.(data);
  } catch (e) {
    console.error('Save failed:', e);
  }
};

let saveTimer = null;
export const debouncedSave = (data) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveBoards(data), 500);
};

const STORAGE_KEY = 'tsuzuku_list';

export function normalizeEntry(entry) {
  return {
    ...entry,
    title: entry.title?.replace(/\s*saison\s*\d*/gi, '').replace(/\s+/g, ' ').trim() || entry.title,
    animeId: entry.animeId?.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
  };
}

export async function normalizeAll() {
  const list = await getList();
  const normalized = list.map(normalizeEntry);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  return normalized;
}

export async function getList() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

export async function saveProgress(entry) {
  const normalized = normalizeEntry(entry);
  const list = await getList();
  const index = list.findIndex(item => item.animeId === normalized.animeId);

  if (index >= 0) {
    list[index] = { ...list[index], ...normalized, lastWatched: new Date().toISOString() };
  } else {
    list.push({ ...normalized, status: 'watching', lastWatched: new Date().toISOString() });
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: list });
}

export async function updateStatus(animeId, status) {
  const list = await getList();
  const item = list.find(i => i.animeId === animeId);
  if (item) {
    item.status = status;
    await chrome.storage.local.set({ [STORAGE_KEY]: list });
  }
}

export async function setList(list) {
  await chrome.storage.local.set({ [STORAGE_KEY]: list });
}

export async function importList(entries) {
  const list = await getList();
  for (const entry of entries) {
    const index = list.findIndex(i => i.animeId === entry.animeId);
    if (index >= 0) {
      list[index] = { ...list[index], ...entry };
    } else {
      list.push(entry);
    }
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: list });
}

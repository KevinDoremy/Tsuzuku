import { getList, setList, updateStatus, importList, normalizeAll, normalizeEntry } from '../../utils/storage.js';
import { getDirHandle, pickDir, writeList, readList, requestAccess, getFileLastModified } from '../../utils/fsync.js';
import { getEpisodeCache, refreshCache } from '../../utils/anilist.js';

const STATUSES = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
const STATUS_LABELS = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to Watch',
};

let dirHandle = null;

async function syncWithFile() {
  if (!dirHandle) return;

  const fileList = await readList(dirHandle);
  const storageList = await getList();

  if (fileList === null) {
    await writeList(dirHandle, storageList);
    return;
  }

  // Normalize both sides before merging — dirty titles never win regardless of timestamps.
  const fileLastModified = await getFileLastModified(dirHandle);
  const merged = new Map(fileList.map(i => [i.animeId, normalizeEntry(i)]));
  for (const item of storageList) {
    if (new Date(item.lastWatched).getTime() > fileLastModified) {
      merged.set(item.animeId, normalizeEntry(item));
    }
  }

  const result = [...merged.values()];
  await setList(result);
  await writeList(dirHandle, result);
}

let fileWatcherStarted = false;

function startFileWatcher() {
  if (!dirHandle || fileWatcherStarted) return;
  fileWatcherStarted = true;
  let knownModified = 0;

  setInterval(async () => {
    if (!dirHandle) return;
    try {
      const modified = await getFileLastModified(dirHandle);
      if (modified === 0) return;
      if (knownModified === 0) { knownModified = modified; return; } // init
      if (modified > knownModified) {
        knownModified = modified;
        await syncWithFile();
        await load();
      }
    } catch {
      // ignore polling errors
    }
  }, 3000);
}

async function writeToFile() {
  if (!dirHandle) return;
  const list = await getList();
  await writeList(dirHandle, list);
}

function nextEpUrl(item) {
  if (item.source === 'franime' && item.url) {
    try {
      const url = new URL(item.url);
      url.searchParams.set('ep', String(item.episode + 1));
      return url.toString();
    } catch {}
  }
  return item.url || '#';
}

async function load() {
  const [list, episodeCache] = await Promise.all([
    getList(),
    getEpisodeCache(),
  ]);

  list.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

  const listEl = document.getElementById('anime-list');
  const emptyEl = document.getElementById('empty');

  listEl.innerHTML = '';

  if (list.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  list.forEach(item => {
    const cached = episodeCache[item.animeId];
    const nextEp = item.status !== 'dropped' && cached?.aired > item.episode
      ? item.episode + 1
      : null;
    const newEpHtml = nextEp
      ? `<a class="new-ep" href="${nextEpUrl(item)}" target="_blank">Ep ${nextEp} →</a>`
      : '';

    const li = document.createElement('li');
    li.className = 'anime-item';
    li.innerHTML = `
      <div class="info">
        <a class="title" href="${item.url || '#'}" target="_blank">${item.title}</a>
        <span class="meta">
          S${item.season} · E${item.episode}
          <span class="badge ${item.source}">${item.source}</span>
          ${newEpHtml}
        </span>
      </div>
      <select class="status-select" data-id="${item.animeId}">
        ${STATUSES.map(s => `
          <option value="${s}" ${s === item.status ? 'selected' : ''}>${STATUS_LABELS[s]}</option>
        `).join('')}
      </select>
    `;
    listEl.appendChild(li);
  });

  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async e => {
      await updateStatus(e.target.dataset.id, e.target.value);
      await writeToFile();
    });
  });
}

async function checkForUpdates() {
  const list = (await getList()).filter(i => i.status !== 'dropped');
  if (!list.length) return;
  const changed = await refreshCache(list);
  if (changed) await load();
}

function activateFolder(handle) {
  dirHandle = handle;
  document.getElementById('folder-btn').classList.add('active');
  document.getElementById('folder-name').textContent = handle.name;
  startFileWatcher();
}

async function init() {
  await normalizeAll();
  dirHandle = await getDirHandle();
  const { syncSetupDismissed } = await chrome.storage.local.get('syncSetupDismissed');

  if (dirHandle) {
    await syncWithFile();
    activateFolder(dirHandle);
  } else if (!syncSetupDismissed) {
    document.getElementById('setup-banner').classList.remove('hidden');
  }

  await load();
  checkForUpdates(); // background refresh, re-renders if new episodes found
}

// Setup banner
document.getElementById('setup-dismiss').addEventListener('click', async () => {
  await chrome.storage.local.set({ syncSetupDismissed: true });
  document.getElementById('setup-banner').classList.add('hidden');
});

document.getElementById('setup-choose').addEventListener('click', async () => {
  try {
    const handle = await pickDir();
    document.getElementById('setup-banner').classList.add('hidden');
    activateFolder(handle);
    await syncWithFile();
    await load();
  } catch {
    // user cancelled picker
  }
});

// Folder button
document.getElementById('folder-btn').addEventListener('click', async () => {
  if (dirHandle) {
    const panel = document.getElementById('folder-panel');
    if (panel.classList.contains('hidden')) {
      // Re-request permission if needed (e.g. after browser restart)
      const granted = await requestAccess(dirHandle);
      if (granted) {
        await syncWithFile();
        await load();
        panel.classList.remove('hidden');
      }
    } else {
      panel.classList.add('hidden');
    }
  } else {
    try {
      const handle = await pickDir();
      await chrome.storage.local.set({ syncSetupDismissed: true });
      document.getElementById('setup-banner').classList.add('hidden');
      activateFolder(handle);
      await syncWithFile();
      await load();
    } catch {
      // user cancelled
    }
  }
});

document.getElementById('folder-change').addEventListener('click', async () => {
  try {
    const handle = await pickDir();
    document.getElementById('folder-panel').classList.add('hidden');
    activateFolder(handle);
    await writeToFile();
  } catch {
    // user cancelled
  }
});

// Import from file
document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  try {
    const entries = JSON.parse(text);
    if (!Array.isArray(entries)) throw new Error('Expected an array');
    await importList(entries);
    await writeToFile();
    await load();
  } catch {
    alert('Invalid file. Expected a JSON array.');
  }

  e.target.value = '';
});

// Export to file
document.getElementById('export-btn').addEventListener('click', async () => {
  const list = await getList();
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tsuzuku-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

init();

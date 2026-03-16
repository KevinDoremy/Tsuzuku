import { getList, updateStatus, importList } from '../../utils/storage.js';

const STATUSES = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
const STATUS_LABELS = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to Watch',
};

async function load() {
  const list = (await getList()).sort(
    (a, b) => new Date(b.lastWatched) - new Date(a.lastWatched)
  );

  const listEl = document.getElementById('anime-list');
  const emptyEl = document.getElementById('empty');

  listEl.innerHTML = '';

  if (list.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  list.forEach(item => {
    const li = document.createElement('li');
    li.className = 'anime-item';
    li.innerHTML = `
      <div class="info">
        <a class="title" href="${item.url || '#'}" target="_blank">${item.title}</a>
        <span class="meta">
          S${item.season} · E${item.episode}
          <span class="badge ${item.source}">${item.source}</span>
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
    select.addEventListener('change', e => {
      updateStatus(e.target.dataset.id, e.target.value);
    });
  });
}

// Import panel
document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-panel').classList.toggle('hidden');
});

document.getElementById('import-cancel').addEventListener('click', () => {
  document.getElementById('import-panel').classList.add('hidden');
  document.getElementById('import-input').value = '';
});

document.getElementById('import-confirm').addEventListener('click', async () => {
  const raw = document.getElementById('import-input').value.trim();
  try {
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) throw new Error('Expected an array');
    await importList(entries);
    document.getElementById('import-panel').classList.add('hidden');
    document.getElementById('import-input').value = '';
    await load();
  } catch (e) {
    alert('Invalid JSON. Please paste a valid array.');
  }
});

load();

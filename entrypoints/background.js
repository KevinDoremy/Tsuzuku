import { saveProgress, getList, normalizeEntry } from '../utils/storage.js';
import { getDirHandle, writeList } from '../utils/fsync.js';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_PROGRESS') {
      saveProgress(message.payload).then(async () => {
        sendResponse({ ok: true });
        try {
          const handle = await getDirHandle();
          if (handle) {
            const list = (await getList()).map(normalizeEntry);
            await writeList(handle, list);
          }
        } catch {
          // no sync dir configured or permission not yet granted
        }
      });
      return true;
    }
  });
});

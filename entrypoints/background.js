import { saveProgress } from '../utils/storage.js';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_PROGRESS') {
      saveProgress(message.payload).then(() => sendResponse({ ok: true }));
      return true;
    }
  });
});

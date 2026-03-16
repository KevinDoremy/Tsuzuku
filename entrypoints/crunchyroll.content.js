export default defineContentScript({
  matches: ['*://*.crunchyroll.com/*'],
  main() {
    reportProgress();

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(reportProgress, 2000);
      }
    }).observe(document.body, { subtree: true, childList: true });
  },
});

function extractInfo() {
  // Primary: parse __NEXT_DATA__ (Crunchyroll uses Next.js)
  const nextDataEl = document.getElementById('__NEXT_DATA__');
  if (nextDataEl) {
    try {
      const data = JSON.parse(nextDataEl.textContent);
      const props = data?.props?.pageProps;
      const title = props?.seasonTitle || props?.seriesTitle;
      const episode = props?.episodeNumber ?? props?.episode?.episodeNumber;
      const season = props?.seasonNumber ?? props?.season?.seasonNumber ?? 1;

      if (title && episode != null) {
        return {
          animeId: slugify(title),
          title,
          season: parseInt(season) || 1,
          episode: parseInt(episode),
          source: 'crunchyroll',
          url: window.location.href,
        };
      }
    } catch (_) {}
  }

  // Fallback: parse page title — "Episode Title | Series Name | Crunchyroll"
  const parts = document.title.split('|');
  if (parts.length >= 2) {
    const title = parts[parts.length - 2].trim();
    const episodeMatch = parts[0].match(/Episode\s+(\d+)/i);
    if (title && episodeMatch) {
      return {
        animeId: slugify(title),
        title,
        season: 1,
        episode: parseInt(episodeMatch[1]),
        source: 'crunchyroll',
        url: window.location.href,
      };
    }
  }

  return null;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function reportProgress() {
  const info = extractInfo();
  if (!info) return;
  chrome.runtime.sendMessage({ type: 'SAVE_PROGRESS', payload: info });
}

export default defineContentScript({
  matches: ['*://franime.fr/*'],
  main() {
    reportProgress();

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(reportProgress, 1500);
      }
    }).observe(document.body, { subtree: true, childList: true });
  },
});

function extractInfo() {
  const path = window.location.pathname;

  const patterns = [
    /\/anime\/([^/]+)\/(?:saison|season)-?(\d+)\/(?:episode|ep)-?(\d+)/i,
    /\/anime\/([^/]+)\/(?:episode|ep)-?(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match) {
      const slug = match[1];
      const hasSeason = match.length === 4;
      const title = document.querySelector('h1')?.textContent?.trim() || unslugify(slug);

      return {
        animeId: slug,
        title,
        season: hasSeason ? parseInt(match[2]) : 1,
        episode: parseInt(hasSeason ? match[3] : match[2]),
        source: 'franime',
        url: window.location.href,
      };
    }
  }

  // Fallback: scrape DOM
  const titleEl = document.querySelector('h1, .anime-title, [class*="title"]');
  if (!titleEl) return null;

  const title = titleEl.textContent.trim();
  const pageText = document.title + ' ' + (document.querySelector('[class*="episode"], [class*="saison"]')?.textContent || '');
  const episodeMatch = pageText.match(/(?:episode|ep\.?)\s*(\d+)/i);
  const seasonMatch = pageText.match(/(?:saison|season|s)\s*(\d+)/i);

  if (!episodeMatch) return null;

  return {
    animeId: slugify(title),
    title,
    season: seasonMatch ? parseInt(seasonMatch[1]) : 1,
    episode: parseInt(episodeMatch[1]),
    source: 'franime',
    url: window.location.href,
  };
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function unslugify(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function reportProgress() {
  const info = extractInfo();
  if (!info) return;
  chrome.runtime.sendMessage({ type: 'SAVE_PROGRESS', payload: info });
}

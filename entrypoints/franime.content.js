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
  const params = new URLSearchParams(window.location.search);

  // Primary: query params — e.g. /anime/hells-paradise?s=2&ep=7
  const slugMatch = path.match(/\/anime\/([^/?]+)/);
  const epParam = params.get('ep');
  if (slugMatch && epParam) {
    const slug = slugMatch[1];
    const title = document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim() || unslugify(slug);
    return {
      animeId: slug,
      title,
      season: parseInt(params.get('s') || '1'),
      episode: parseInt(epParam),
      source: 'franime',
      url: window.location.href,
    };
  }

  // Fallback: episode in path — e.g. /anime/slug/saison-2/episode-7
  const patterns = [
    /\/anime\/([^/]+)\/(?:saison|season)-?(\d+)\/(?:episode|ep)-?(\d+)/i,
    /\/anime\/([^/]+)\/(?:episode|ep)-?(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match) {
      const slug = match[1];
      const hasSeason = match.length === 4;
      const raw = document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim() || unslugify(slug);
      const title = raw.replace(/\s+saison\s*\d+/gi, '').trim();
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

  return null;
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
  try {
    chrome.runtime.sendMessage({ type: 'SAVE_PROGRESS', payload: info });
  } catch {
    // extension context invalidated (e.g. after reload)
  }
}

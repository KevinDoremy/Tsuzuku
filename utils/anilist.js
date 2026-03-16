const ENDPOINT = 'https://graphql.anilist.co';
const CACHE_KEY = 'tsuzuku_anilist_v2';
const TTL = 60 * 60 * 1000; // 1 hour

const QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      nextAiringEpisode { episode }
      episodes
      status
      relations {
        edges {
          relationType
          node {
            nextAiringEpisode { episode }
            episodes
            status
          }
        }
      }
    }
  }
`;

function normalizeTitle(title) {
  return title
    .replace(/saison\s*(\d+)/gi, 'Season $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function episodesAired(media) {
  if (media.nextAiringEpisode) return media.nextAiringEpisode.episode - 1;
  return media.episodes ?? 0;
}

async function fetchAired(title) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search: normalizeTitle(title) } }),
  });
  const json = await res.json();
  const media = json?.data?.Media;
  if (!media) return null;

  // Sum episodes from the main entry + any direct sequels (handles Part 1 / Part 2 splits)
  let total = episodesAired(media);
  for (const edge of media.relations?.edges ?? []) {
    if (edge.relationType === 'SEQUEL') {
      total += episodesAired(edge.node);
    }
  }

  return total > 0 ? total : null;
}

export async function getEpisodeCache() {
  const r = await chrome.storage.local.get(CACHE_KEY);
  return r[CACHE_KEY] || {};
}

export async function refreshCache(watchingItems) {
  const cache = await getEpisodeCache();
  const now = Date.now();
  let changed = false;

  await Promise.allSettled(
    watchingItems.map(async item => {
      const cached = cache[item.animeId];
      if (cached && now - cached.at < TTL) return;
      try {
        const aired = await fetchAired(item.title);
        cache[item.animeId] = { aired, at: now };
        changed = true;
      } catch {
        // network error, keep existing cache
      }
    })
  );

  if (changed) await chrome.storage.local.set({ [CACHE_KEY]: cache });
  return changed;
}

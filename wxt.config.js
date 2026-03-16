import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Tsuzuku',
    description: 'Track your anime progress on Franime and Crunchyroll.',
    permissions: ['storage'],
    host_permissions: ['https://graphql.anilist.co/*'],
    icons: {
      16: '/icon16.png',
      48: '/icon48.png',
      128: '/icon128.png',
    },
  },
});

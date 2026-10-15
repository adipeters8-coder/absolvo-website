// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.absolvo.shop',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      // Danke- und Fehlerseite gehören nicht in die Sitemap
      filter: (page) => !page.endsWith('/danke/') && !page.endsWith('/404/'),
    }),
  ],
});

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'KLANGKUENSTLER — Unofficial Fan Hub',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Unofficial KlangKuenstler fan hub — shows, recorded sets, IDs and the community. Independent project, not affiliated with the artist.',
        },
        { name: 'theme-color', content: '#040d0b' },
        { property: 'og:title', content: 'KLANGKUENSTLER — Unofficial Fan Hub' },
        {
          property: 'og:description',
          content: 'Every show, every recorded set, every ID. By fans, for fans.',
        },
        // TODO: prefix with the production domain once one exists (crawlers need an absolute URL)
        { property: 'og:image', content: '/og.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
        },
      ],
    },
  },
})

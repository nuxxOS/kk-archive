export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'KlangKuenstler Hub — The Unofficial Archive',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'The unofficial KlangKuenstler hub — every show since 2012, recorded sets, the whole discography. Independent project, not affiliated with the artist.',
        },
        { name: 'theme-color', content: '#040d0b' },
        { property: 'og:title', content: 'KlangKuenstler Hub — The Unofficial Archive' },
        {
          property: 'og:description',
          content: 'Every show since 2012, every recorded set, the whole discography. By the crowd, for the crowd.',
        },
        { property: 'og:image', content: 'https://kk-hub.vercel.app/og.png' },
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

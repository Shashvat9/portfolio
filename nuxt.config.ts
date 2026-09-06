// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@vercel/analytics/nuxt',
  ],

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // Only /dashboard routes require auth — the public site (/) is never redirected.
      include: ['/dashboard', '/dashboard/*'],
      exclude: [],
    },
  },

  colorMode: {
    // design-system.md tokens are role-based (bg/surface/text/...), applied via
    // [data-theme] attribute selectors in app/assets/css/main.css.
    classSuffix: '',
    dataValue: 'theme',
    preference: 'light',
    fallback: 'light',
    storageKey: 'portfolio-color-mode',
  },

  fonts: {
    families: [
      { name: 'Newsreader', provider: 'google' },
      { name: 'IBM Plex Mono', provider: 'google' },
    ],
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Shashvat Rajyaguru',
    },
  },
})

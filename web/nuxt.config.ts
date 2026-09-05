import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  // The whole app is a WebGL editor; nothing useful to server-render.
  ssr: false,
  modules: ['shadcn-nuxt', 'motion-v/nuxt'],
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: 'Vitrum',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Vitrum turns any logo, icon or image into a true-to-size 3D glass or metal object you can orbit and export.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['three', 'd3-contour'] },
  },
})

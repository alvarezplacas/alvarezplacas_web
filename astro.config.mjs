import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://alvarezplacas.com.ar',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  security: {
    checkOrigin: false
  },
  server: {
    host: '0.0.0.0',
    port: 4321,
    allowedHosts: ['alvarezplacas.com.ar', 'www.alvarezplacas.com.ar']
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['pg']
    }
  }
});
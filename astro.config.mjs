import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import path from 'path';

export default defineConfig({
  site: 'https://alvarezplacas.com.ar',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    host: '0.0.0.0',
    port: 4321
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@backend': path.resolve('./Backend'),
        '@frontend': path.resolve('./Frontend'),
        '@conexiones': path.resolve('./Backend/conexiones'),
        '@home': path.resolve('./Frontend/home')
      }
    },
    ssr: {
      external: ['pg']
    }
  }
});

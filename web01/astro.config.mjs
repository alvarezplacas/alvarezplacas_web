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
  // 🛡️ Seguridad Moderna (Astro 6)
  security: {
    checkOrigin: true
  },
  // 🖼️ Optimización de Imágenes
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.alvarezplacas.com.ar',
        port: '',
        pathname: '/assets/**',
      },
    ],
  },
  // 🚀 Rendimiento y Armonía
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },
  server: {
    host: '0.0.0.0',
    port: 4321,
    origin: 'https://alvarezplacas.com.ar',
    allowedHosts: ['alvarezplacas.com.ar']
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@backend': path.resolve('./Backend'),
        '@frontend': path.resolve('./Frontend'),
        '@conexiones': path.resolve('./Backend/conexiones'),
        '@home': path.resolve('./Frontend/home'),
        '@club': path.resolve('./Frontend/club'),
        '@components': path.resolve('./Frontend/shared/components'),
        '@layouts': path.resolve('./Frontend/home/layouts'),
        '@dashboard': path.resolve('./Backend/dashboard')
      }
    },
    build: {
      cssMinify: 'lightningcss'
    },
    ssr: {
      external: ['pg']
    }
  }
});

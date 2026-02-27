import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        login: resolve(__dirname, 'admin/login/index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'functions',
          dest: ''
        },
        {
          src: 'js/lib',
          dest: 'js/lib'
        },
        {
          src: 'css/lib',
          dest: 'css/lib'
        },
        {
          src: 'articles',
          dest: ''
        }
      ]
    })
  ]
});
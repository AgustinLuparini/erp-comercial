import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@layouts', replacement: path.resolve(__dirname, 'src/layouts') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks') },
      { find: '@context', replacement: path.resolve(__dirname, 'src/context') },
      { find: '@services', replacement: path.resolve(__dirname, 'src/services') },
      { find: '@routes', replacement: path.resolve(__dirname, 'src/routes') },
      { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') },
      { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
      { find: '@theme', replacement: path.resolve(__dirname, 'src/theme') }
    ]
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});

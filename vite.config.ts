import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite publicar a pasta dist em qualquer caminho (Azure Static Web Apps, IIS, subpasta).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 8080, strictPort: true }
});

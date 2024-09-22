import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';  // Import 'path' to help resolve alias paths

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),  // Set '@' to refer to the 'src' directory
    },
  },
});

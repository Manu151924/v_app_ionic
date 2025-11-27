import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@ionic/angular',
      '@ionic/core',
      '@ionic/core/dist/esm/ios.transition.js',
      '@ionic/core/dist/esm/md.transition.js'
    ],
  },
});

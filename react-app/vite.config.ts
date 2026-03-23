import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.join(__dirname), '');
    /** Root hosting (Firebase): use default `/`. GitHub Pages: set e.g. `/CSL-Step-Test-Calculator/` */
    const raw = env.VITE_BASE_PATH?.trim();
    const base =
        !raw || raw === '/'
            ? '/'
            : raw.endsWith('/')
              ? raw
              : `${raw}/`;

    return {
        plugins: [react(), tailwindcss()],
        base,
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:8787',
                    changeOrigin: true,
                },
            },
        },
    };
});

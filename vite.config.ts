import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      // Also refuses to build if credential/context .txt files are present in
      // public/ (they would be copied into dist/ and served publicly).
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        buildStart(): void {
          const publicLeakDir = path.resolve(__dirname, 'public/assets/aistudio');
          if (fs.existsSync(publicLeakDir)) {
            const leaks = fs.readdirSync(publicLeakDir).filter((f) => f.endsWith('.txt'));
            if (leaks.length > 0) {
              throw new Error(
                `Refusing to build: credential/context files found in public/assets/aistudio (${leaks.join(', ')}). ` +
                  'Files under public/ are copied into dist/ and served publicly. ' +
                  'Move them outside of public/ (e.g. .aistudio/credentials/) and rotate any secrets they contain.'
              );
            }
          }
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
          // Defense in depth: never ship stray .txt files from the asset pipeline.
          const distAistudio = path.resolve(distDir, 'assets/aistudio');
          if (fs.existsSync(distAistudio)) {
            const strays = fs.readdirSync(distAistudio).filter((f) => f.endsWith('.txt'));
            if (strays.length > 0) {
              strays.forEach((f) => fs.rmSync(path.resolve(distAistudio, f), {force: true}));
              throw new Error(
                `Build blocked: removed ${strays.length} .txt file(s) that were about to ship in dist/assets/aistudio. ` +
                  'Move them out of public/ and rotate any secrets they contain.'
              );
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

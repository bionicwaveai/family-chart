import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const input = {
  main: resolve(__dirname, 'index.html'),
  ...Object.fromEntries(
    findHtmlFiles(resolve(__dirname, 'examples')).map((file) => [
      file.replace(__dirname + '/', '').replace(/[\/.]/g, '_'),
      file
    ])
  )
};

function copyDataDir() {
  return {
    name: 'copy-examples-data',
    closeBundle() {
      const src = resolve(__dirname, 'examples/data');
      const dest = resolve(__dirname, 'dist/examples/data');
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input }
  },
  plugins: [copyDataDir()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@examples': resolve(__dirname, 'examples')
    }
  }
})

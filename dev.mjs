#!/usr/bin/env node
// Manual dev runner: builds main/preload, starts Vite renderer, then launches Electron
import { createServer, build } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import fsp from 'fs/promises';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_APP_NAME = 'MindBoard';
const DEV_APP_ICON = path.join(__dirname, 'build', 'icons', 'MindBoard.icns');

async function ensureDevAppBundle(electronBin) {
  const electronAppPath = path.resolve(electronBin, '..', '..', '..');
  const devAppPath = path.join(__dirname, '.vite', `${DEV_APP_NAME}.app`);
  const sourceInfoPlist = path.join(electronAppPath, 'Contents', 'Info.plist');
  const targetInfoPlist = path.join(devAppPath, 'Contents', 'Info.plist');
  const targetElectronExecutable = path.join(devAppPath, 'Contents', 'MacOS', 'Electron');
  const targetMindBoardExecutable = path.join(devAppPath, 'Contents', 'MacOS', DEV_APP_NAME);
  const targetIconPath = path.join(devAppPath, 'Contents', 'Resources', `${DEV_APP_NAME}.icns`);
  const sourceStat = await fsp.stat(sourceInfoPlist);

  let shouldCopy = true;
  try {
    const targetStat = await fsp.stat(targetInfoPlist);
    shouldCopy = targetStat.mtimeMs < sourceStat.mtimeMs;
  } catch {
    shouldCopy = true;
  }

  if (shouldCopy) {
    await fsp.rm(devAppPath, { recursive: true, force: true });
    await fsp.cp(electronAppPath, devAppPath, {
      recursive: true,
      verbatimSymlinks: true,
    });

    const infoPlist = await fsp.readFile(targetInfoPlist, 'utf8');
    const renamedPlist = infoPlist
      .replaceAll('<string>Electron</string>', `<string>${DEV_APP_NAME}</string>`)
      .replaceAll('<string>electron.icns</string>', `<string>${DEV_APP_NAME}.icns</string>`)
      .replaceAll('>com.github.Electron<', '>com.mindboard.app.dev<');
    await fsp.writeFile(targetInfoPlist, renamedPlist, 'utf8');
    await fsp.copyFile(DEV_APP_ICON, targetIconPath);
    await fsp.rename(targetElectronExecutable, targetMindBoardExecutable);
  }

  return targetMindBoardExecutable;
}

async function buildMainAndPreload(devServerUrl) {
  const define = {
    MAIN_WINDOW_VITE_DEV_SERVER_URL: JSON.stringify(devServerUrl),
    MAIN_WINDOW_VITE_NAME: JSON.stringify('main_window'),
  };

  const { builtinModules } = await import('node:module');
  const builtins = ['electron', 'electron/main', ...builtinModules.flatMap(m => [m, `node:${m}`])];
  const external = [...builtins, 'uiohook-napi'];

  // Build main
  await build({
    configFile: false,
    root: __dirname,
    mode: 'development',
    build: {
      outDir: '.vite/build',
      emptyOutDir: false,
      watch: null,
      minify: false,
      lib: {
        entry: 'src/main.js',
        fileName: () => 'main.js',
        formats: ['cjs'],
      },
      rollupOptions: { external },
    },
    define,
    resolve: {
      conditions: ['node'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
    clearScreen: false,
    logLevel: 'warn',
  });

  // Build preload
  await build({
    configFile: false,
    root: __dirname,
    mode: 'development',
    build: {
      outDir: '.vite/build',
      emptyOutDir: false,
      watch: null,
      minify: false,
      lib: {
        entry: 'src/preload.js',
        fileName: () => 'preload.js',
        formats: ['cjs'],
      },
      rollupOptions: { external },
    },
    define,
    clearScreen: false,
    logLevel: 'warn',
  });

  console.log('[dev] main + preload built');
}

async function startViteDevServer() {
  const { default: react } = await import('@vitejs/plugin-react');
  const server = await createServer({
    configFile: false,
    root: __dirname,
    mode: 'development',
    base: './',
    server: { host: '127.0.0.1', port: 5173 },
    plugins: [react()],
    optimizeDeps: {
      include: ['react', 'react-dom', '@excalidraw/excalidraw'],
      esbuildOptions: {
        supported: { 'top-level-await': true },
      },
    },
    build: {
      outDir: `.vite/renderer/main_window`,
      copyPublicDir: true,
    },
    clearScreen: false,
    logLevel: 'info',
  });
  await server.listen();
  const addr = server.httpServer.address();
  const url = `http://${addr.address}:${addr.port}`;
  console.log(`[dev] Vite running at ${url}`);
  server.devServerUrl = url;
  return server;
}

async function launchElectron() {
  const _require = createRequire(import.meta.url);
  const electronBin = _require('electron');
  const devAppExecutable = await ensureDevAppBundle(electronBin);
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(devAppExecutable, ['.'], {
    cwd: __dirname,
    stdio: 'inherit',
    env,
  });
  child.on('close', () => {
    console.log('[dev] Electron closed');
    process.exit(0);
  });
  return child;
}

(async () => {
  console.log('[dev] Starting MindBoard dev...');

  fs.mkdirSync('.vite/build', { recursive: true });

  const viteServer = await startViteDevServer();
  await buildMainAndPreload(viteServer.devServerUrl);
  await launchElectron();

  process.on('SIGINT', async () => {
    await viteServer.close();
    process.exit(0);
  });
})();

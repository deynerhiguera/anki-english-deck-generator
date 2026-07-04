import { app, BrowserWindow, Notification } from 'electron';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from './utils/logger';
import { createMainWindow } from './window';
import { registerIpcHandlers, registerSelectionCapture } from './ipc/register';
import { createTray, markQuitting } from './tray';

const candidates = [
  join(process.cwd(), '.env'),
  join(app.getAppPath(), '.env'),
];

for (const candidate of candidates) {
  if (existsSync(candidate)) {
    const result = loadDotenv({ path: candidate });
    logger.info(`Loaded .env from ${candidate} (parsed ${Object.keys(result.parsed ?? {}).length} keys)`);
    break;
  }
}

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', reason);
});

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  registerIpcHandlers(mainWindow);
  registerSelectionCapture();

  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  createTray(() => mainWindow);

  if (Notification.isSupported()) {
    new Notification({
      title: 'Anki Builder is running',
      body: 'Look for the Anki icon in your menu bar. Press ⌘⇧A anywhere to build a card.',
    }).show();
  }

  logger.info('Running in background. Click the tray icon to show the window or quit.');

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = createMainWindow();
      registerIpcHandlers(mainWindow);
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    registerSelectionCapture();
  });
});

app.on('before-quit', () => {
  markQuitting();
});

app.on('window-all-closed', () => {
  // Keep app alive in background; user quits via tray menu.
  // Window close events are intercepted in tray.ts and turned into hide().
});

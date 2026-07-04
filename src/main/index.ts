import { app, BrowserWindow } from 'electron';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from './utils/logger';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipc/register';

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

app.whenReady().then(() => {
  const win = createMainWindow();
  registerIpcHandlers(win);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createMainWindow();
      registerIpcHandlers(newWin);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

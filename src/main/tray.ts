import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './utils/logger';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let quittingExplicitly = false;

export function markQuitting(): void {
  quittingExplicitly = true;
}

export function isQuitting(): boolean {
  return quittingExplicitly;
}

function loadTrayIcon(): Electron.NativeImage {
  const candidates = [
    join(__dirname, '../../resources/tray-icon.png'),
    join(__dirname, '../../resources/tray-iconTemplate.png'),
    join(process.cwd(), 'resources/tray-icon.png'),
    join(process.cwd(), 'resources/tray-iconTemplate.png'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      logger.info(`[tray] loading icon from ${candidate}`);
      const image = nativeImage.createFromPath(candidate);
      if (candidate.endsWith('Template.png') && process.platform === 'darwin') {
        image.setTemplateImage(true);
      }
      if (!image.isEmpty()) {
        const size = image.getSize();
        logger.info(`[tray] icon loaded ${size.width}x${size.height}, template=${image.isTemplateImage()}`);
        return image;
      } else {
        logger.warn(`[tray] icon at ${candidate} loaded as empty image`);
      }
    }
  }
  if (process.platform === 'darwin') {
    const sys = nativeImage.createFromNamedImage('NSStatusAvailable', [0, 0, 0]);
    if (!sys.isEmpty()) {
      logger.info('[tray] using NSStatusAvailable system icon');
      return sys;
    }
  }
  logger.warn('[tray] falling back to empty icon');
  return nativeImage.createEmpty();
}

export function createTray(getWindow: () => BrowserWindow | null): Tray {
  const icon = loadTrayIcon();
  logger.info(`[tray] creating tray with icon isEmpty=${icon.isEmpty()}`);
  const tray = new Tray(icon);
  if (process.platform === 'darwin' || process.platform === 'linux') {
    tray.setTitle('Anki');
  }
  logger.info('[tray] tray created, title set to Anki');

  const updateMenu = (): void => {
    const win = getWindow();
    const isVisible = !!win && !win.isDestroyed() && win.isVisible();

    const menu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide Window' : 'Show Window',
        click: () => {
          const w = getWindow();
          if (!w || w.isDestroyed()) return;
          if (w.isVisible()) {
            w.hide();
          } else {
            w.show();
            w.focus();
          }
          updateMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Anki Builder',
        click: () => {
          markQuitting();
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(menu);
  };

  updateMenu();

  const win = getWindow();
  if (win) {
    win.on('show', updateMenu);
    win.on('hide', updateMenu);
    win.on('close', (e) => {
      if (!quittingExplicitly) {
        e.preventDefault();
        win.hide();
      }
    });
  }

  return tray;
}
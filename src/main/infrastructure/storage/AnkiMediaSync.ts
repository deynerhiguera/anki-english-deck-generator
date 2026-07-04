import { homedir } from 'node:os';
import { join } from 'node:path';
import { copyFile, stat } from 'node:fs/promises';

export interface AnkiMediaSyncOptions {
  mediaDir?: string;
}

export class AnkiMediaSync {
  private readonly mediaDir: string;

  constructor(opts: AnkiMediaSyncOptions = {}) {
    this.mediaDir = opts.mediaDir ?? this.defaultMediaDir();
  }

  private defaultMediaDir(): string {
    return join(homedir(), 'Library', 'Application Support', 'Anki2', 'User 1', 'collection.media');
  }

  resolvePath(filename: string): string {
    return join(this.mediaDir, filename);
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const s = await stat(this.resolvePath(filename));
      return s.isFile();
    } catch {
      return false;
    }
  }

  async copyFrom(srcPath: string, filename: string): Promise<void> {
    const target = this.resolvePath(filename);
    try {
      await copyFile(srcPath, target);
    } catch (err) {
      throw new Error(
        `Could not copy audio to Anki collection.media (${target}). ` +
          `Verify Anki is installed and the path is correct. Original error: ${
            (err as Error).message
          }`,
      );
    }
  }
}

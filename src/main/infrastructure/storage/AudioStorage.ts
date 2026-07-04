export interface AudioStorageOptions {
  mediaDir: string;
}

export class AudioStorageError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = 'AudioStorageError';
  }
}

export class AudioStorage {
  private readonly mediaDir: string;
  private ensured = false;

  constructor(opts: AudioStorageOptions) {
    this.mediaDir = opts.mediaDir;
  }

  async ensureDir(): Promise<void> {
    if (this.ensured) return;
    const { mkdir } = await import('node:fs/promises');
    try {
      await mkdir(this.mediaDir, { recursive: true });
      this.ensured = true;
    } catch (err) {
      throw new AudioStorageError(
        `Could not create media directory at ${this.mediaDir}`,
        err,
      );
    }
  }

  pathFor(filename: string): string {
    return `${this.mediaDir}/${filename}`;
  }

  async save(filename: string, buffer: Uint8Array): Promise<string> {
    await this.ensureDir();
    const { writeFile } = await import('node:fs/promises');
    const target = this.pathFor(filename);
    try {
      await writeFile(target, buffer);
    } catch (err) {
      throw new AudioStorageError(`Could not write audio file: ${target}`, err);
    }
    return target;
  }

  async read(filename: string): Promise<Uint8Array> {
    const { readFile } = await import('node:fs/promises');
    return readFile(this.pathFor(filename));
  }
}

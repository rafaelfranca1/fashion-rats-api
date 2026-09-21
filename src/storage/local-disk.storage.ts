import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export class LocalDiskStorage {
  constructor(private readonly root: string) {}

  async save(key: string, body: Buffer): Promise<void> {
    const path = join(this.root, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }
}

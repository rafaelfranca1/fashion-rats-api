import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalDiskStorage } from './local-disk.storage';

describe('LocalDiskStorage', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'outfit-upload-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should write nested key as a file whose bytes match the buffer', async () => {
    const storage = new LocalDiskStorage(dir);
    const body = Buffer.from('outfit-bytes');

    await storage.save('outfits/1/abc.jpg', body);

    const path = join(dir, 'outfits/1/abc.jpg');
    expect(statSync(path).isFile()).toBe(true);
    expect(readFileSync(path)).toEqual(body);
  });

  it('should create parent directories without turning the file path into a directory', async () => {
    const storage = new LocalDiskStorage(dir);
    await storage.save('outfits/1/abc.jpg', Buffer.from('x'));

    expect(statSync(join(dir, 'outfits/1')).isDirectory()).toBe(true);
    expect(statSync(join(dir, 'outfits/1/abc.jpg')).isFile()).toBe(true);
  });

  it('should not write under a different root when the repo uploads folder exists', async () => {
    const other = join(dir, 'not-repo-uploads');
    mkdirSync(other);
    const storage = new LocalDiskStorage(other);
    await storage.save('outfits/1/abc.jpg', Buffer.from('x'));

    expect(statSync(join(other, 'outfits/1/abc.jpg')).isFile()).toBe(true);
  });
});

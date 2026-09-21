export const STORAGE_PORT = 'STORAGE_PORT';

export interface StoragePort {
  save(key: string, body: Buffer): Promise<void>;
}

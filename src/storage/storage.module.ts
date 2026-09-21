import { Module } from '@nestjs/common';
import { LocalDiskStorage } from './local-disk.storage';
import { STORAGE_PORT } from './storage.port';
import { uploadsRoot } from './uploads-root';

@Module({
  providers: [
    {
      provide: STORAGE_PORT,
      useFactory: () => new LocalDiskStorage(uploadsRoot()),
    },
  ],
  exports: [STORAGE_PORT],
})
export class StorageModule {}

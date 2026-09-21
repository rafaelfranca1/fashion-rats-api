import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StorageModule } from '../storage/storage.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [StorageModule, PassportModule.register({})],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { OutfitsModule } from './outfits/outfits.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [UsersModule, OutfitsModule, UploadsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

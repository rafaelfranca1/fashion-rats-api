import { Module } from '@nestjs/common';
import { OutfitsController } from './outfits.controller.js';
import { OutfitsService } from './outfits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [OutfitsController],
  providers: [OutfitsService, PrismaService],
})
export class OutfitsModule {}

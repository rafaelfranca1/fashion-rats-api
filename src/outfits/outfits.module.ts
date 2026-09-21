import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PassportModule.register({})],
  controllers: [OutfitsController],
  providers: [OutfitsService, PrismaService],
})
export class OutfitsModule {}

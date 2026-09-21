import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OutfitsService } from './outfits.service';
import { CheckinDto } from './dto/checkin.dto';
import { FindAllOutfitsDto } from './dto/find-all-outfits.dto';

@ApiTags('outfits')
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Get()
  findAll(@Query() query: FindAllOutfitsDto) {
    return this.outfitsService.findAll({
      skip: query.skip != null ? +query.skip : undefined,
      take: query.take != null ? +query.take : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('checkin')
  checkin(@CurrentUser() user: AuthUser, @Body() dto: CheckinDto) {
    return this.outfitsService.checkin(user.userId, dto);
  }
}

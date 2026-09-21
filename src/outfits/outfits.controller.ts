import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  
  @Post('checkin')
  checkin(@Body() dto: CheckinDto) {
    return this.outfitsService.checkin(dto);
  }
}

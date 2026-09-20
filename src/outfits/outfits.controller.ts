import { Body, Controller, Post } from '@nestjs/common';
import { OutfitsService } from './outfits.service';
import { CheckinDto } from './dto/checkin.dto';

@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Post('checkin')
  checkin(@Body() dto: CheckinDto) {
    return this.outfitsService.checkin(dto);
  }
}

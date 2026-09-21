import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { MAX_UPLOAD_BYTES } from './upload.constants';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('prefix') prefix: string | undefined,
    @Body('ownerId') ownerId: string | undefined,
    @Req() req: Request,
  ) {
    const host = req.get('host');
    if (!host) {
      throw new BadRequestException('host header is required');
    }
    const publicBaseUrl = `${req.protocol}://${host}`;
    return this.uploadsService.upload(prefix, ownerId, file, publicBaseUrl);
  }
}

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let upload: jest.Mock;

  beforeEach(async () => {
    upload = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [{ provide: UploadsService, useValue: { upload } }],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    const file = {
      buffer: Buffer.from('x'),
      mimetype: 'image/jpeg',
      size: 1,
    } as Express.Multer.File;

    it('should delegate to service.upload with public base url', async () => {
      const expected = {
        url: 'http://localhost:3000/uploads/outfits/42/x.jpg',
      };
      upload.mockResolvedValue(expected);
      const req = {
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
      } as unknown as Request;

      await expect(
        controller.upload(file, 'outfits', '42', req),
      ).resolves.toEqual(expected);
      expect(upload).toHaveBeenCalledWith(
        'outfits',
        '42',
        file,
        'http://localhost:3000',
      );
    });

    it('should throw when host header is missing', () => {
      const req = {
        protocol: 'http',
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;

      expect(() => controller.upload(file, 'outfits', '42', req)).toThrow(
        new BadRequestException('host header is required'),
      );
      expect(upload).not.toHaveBeenCalled();
    });
  });
});

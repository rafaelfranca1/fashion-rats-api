import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { STORAGE_PORT } from '../storage/storage.port';
import { MAX_UPLOAD_BYTES } from './upload.constants';
import { UploadsService } from './uploads.service';

const JPEG_URL_WITH_OWNER =
  /^http:\/\/localhost:3000\/uploads\/outfits\/42\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

const JPEG_URL_WITHOUT_OWNER =
  /^http:\/\/localhost:3000\/uploads\/outfits\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

function jpegFile(size = 100) {
  return {
    buffer: Buffer.alloc(size, 1),
    mimetype: 'image/jpeg',
    size,
  };
}

describe('UploadsService', () => {
  let service: UploadsService;
  let save: jest.Mock;

  beforeEach(async () => {
    save = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: STORAGE_PORT, useValue: { save } },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should save jpeg under prefix/ownerId and match url to storage key', async () => {
      const file = jpegFile();
      const result = await service.upload(
        'outfits',
        '42',
        file,
        'http://localhost:3000',
      );

      expect(result.url).toMatch(JPEG_URL_WITH_OWNER);
      const uuid = result.url.split('/').pop()?.replace('.jpg', '');
      expect(save).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledWith(`outfits/42/${uuid}.jpg`, file.buffer);
    });

    it('should save jpeg under prefix only when ownerId is omitted', async () => {
      const file = jpegFile();
      const result = await service.upload(
        'outfits',
        undefined,
        file,
        'http://localhost:3000',
      );

      expect(result.url).toMatch(JPEG_URL_WITHOUT_OWNER);
      expect(result.url).not.toContain('/outfits/42/');
      const uuid = result.url.split('/').pop()?.replace('.jpg', '');
      expect(save).toHaveBeenCalledWith(`outfits/${uuid}.jpg`, file.buffer);
    });

    it.each(['', '   '])(
      'should treat blank ownerId %p as omitted',
      async (ownerId) => {
        const result = await service.upload(
          'outfits',
          ownerId,
          jpegFile(),
          'http://localhost:3000',
        );
        expect(result.url).toMatch(JPEG_URL_WITHOUT_OWNER);
      },
    );

    it('should treat trimmed ownerId as 42', async () => {
      const result = await service.upload(
        '  outfits ',
        ' 42 ',
        jpegFile(),
        'http://localhost:3000',
      );
      expect(result.url).toContain('/uploads/outfits/42/');
    });

    it('should prefix url with the given public base host and port', async () => {
      const result = await service.upload(
        'outfits',
        '42',
        jpegFile(),
        'http://127.0.0.1:4000',
      );
      expect(
        result.url.startsWith('http://127.0.0.1:4000/uploads/outfits/42/'),
      ).toBe(true);
    });

    it('should namespace users prefix with owner', async () => {
      const result = await service.upload(
        'users',
        '1',
        jpegFile(),
        'http://localhost:3000',
      );
      expect(result.url).toContain('/uploads/users/1/');
      expect(save).toHaveBeenCalledWith(
        expect.stringMatching(/^users\/1\//),
        expect.any(Buffer),
      );
    });

    it('should namespace wardrobe prefix without owner', async () => {
      const result = await service.upload(
        'wardrobe',
        undefined,
        jpegFile(),
        'http://localhost:3000',
      );
      expect(result.url).toContain('/uploads/wardrobe/');
      expect(save).toHaveBeenCalledWith(
        expect.stringMatching(/^wardrobe\/[0-9a-f-]+\.jpg$/),
        expect.any(Buffer),
      );
    });

    it('should throw when file is missing', async () => {
      await expect(
        service.upload('outfits', '42', undefined, 'http://localhost:3000'),
      ).rejects.toThrow(new BadRequestException('file is required'));
      expect(save).not.toHaveBeenCalled();
    });

    it.each([undefined, '', '   '])(
      'should reject missing prefix %p',
      async (prefix) => {
        await expect(
          service.upload(prefix, '42', jpegFile(), 'http://localhost:3000'),
        ).rejects.toThrow(new BadRequestException('prefix is required'));
      },
    );

    it.each(['foo', 'Outfits'])(
      'should reject unsupported prefix %p',
      async (prefix) => {
        await expect(
          service.upload(prefix, '42', jpegFile(), 'http://localhost:3000'),
        ).rejects.toThrow(new BadRequestException('unsupported prefix'));
      },
    );

    it.each(['abc', '0', '-1', '42abc', '1.5', '01'])(
      'should reject ownerId %p',
      async (ownerId) => {
        await expect(
          service.upload(
            'outfits',
            ownerId,
            jpegFile(),
            'http://localhost:3000',
          ),
        ).rejects.toThrow(
          new BadRequestException('ownerId must be a positive integer'),
        );
        expect(save).not.toHaveBeenCalled();
      },
    );

    it('should reject image/gif', async () => {
      await expect(
        service.upload(
          'outfits',
          '42',
          { ...jpegFile(), mimetype: 'image/gif' },
          'http://localhost:3000',
        ),
      ).rejects.toThrow(new BadRequestException('unsupported file type'));
    });

    it('should reject image/svg+xml', async () => {
      await expect(
        service.upload(
          'outfits',
          '42',
          { ...jpegFile(), mimetype: 'image/svg+xml' },
          'http://localhost:3000',
        ),
      ).rejects.toThrow(new BadRequestException('unsupported file type'));
    });

    it('should reject image/jpg', async () => {
      await expect(
        service.upload(
          'outfits',
          '42',
          { ...jpegFile(), mimetype: 'image/jpg' },
          'http://localhost:3000',
        ),
      ).rejects.toThrow(new BadRequestException('unsupported file type'));
    });

    it('should reject inherited Object.prototype mimetype names', async () => {
      await expect(
        service.upload(
          'outfits',
          '42',
          { ...jpegFile(), mimetype: 'constructor' },
          'http://localhost:3000',
        ),
      ).rejects.toThrow(new BadRequestException('unsupported file type'));
      expect(save).not.toHaveBeenCalled();
    });

    it('should throw PayloadTooLargeException when over max bytes', async () => {
      await expect(
        service.upload(
          'outfits',
          '42',
          jpegFile(MAX_UPLOAD_BYTES + 1),
          'http://localhost:3000',
        ),
      ).rejects.toBeInstanceOf(PayloadTooLargeException);
    });

    it('should use .png extension for image/png', async () => {
      const result = await service.upload(
        'outfits',
        '42',
        { ...jpegFile(), mimetype: 'image/png' },
        'http://localhost:3000',
      );
      expect(result.url.endsWith('.png')).toBe(true);
      expect(save).toHaveBeenCalledWith(
        expect.stringMatching(/\.png$/),
        expect.any(Buffer),
      );
    });

    it('should use .webp extension for image/webp', async () => {
      const result = await service.upload(
        'outfits',
        '42',
        { ...jpegFile(), mimetype: 'image/webp' },
        'http://localhost:3000',
      );
      expect(result.url.endsWith('.webp')).toBe(true);
      expect(save).toHaveBeenCalledWith(
        expect.stringMatching(/\.webp$/),
        expect.any(Buffer),
      );
    });
  });
});

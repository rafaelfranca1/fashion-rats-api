process.env.JWT_SECRET ??= 'test-jwt-secret-for-specs';

import { BadRequestException, INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let upload: jest.Mock;

  beforeEach(async () => {
    upload = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({})],
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
        controller.upload(file, 'outfits', { userId: 42, email: 'a@b.c' }, req),
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

      expect(() =>
        controller.upload(
          file,
          'outfits',
          { userId: 42, email: 'a@b.c' },
          req,
        ),
      ).toThrow(new BadRequestException('host header is required'));
      expect(upload).not.toHaveBeenCalled();
    });
  });
});

describe('UploadsController (http)', () => {
  let app: INestApplication;
  let upload: jest.Mock;
  let jwtService: JwtService;

  beforeEach(async () => {
    upload = jest.fn().mockResolvedValue({
      url: 'http://localhost:3000/uploads/outfits/42/x.jpg',
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [UploadsController],
      providers: [JwtStrategy, { provide: UploadsService, useValue: { upload } }],
    }).compile();

    jwtService = module.get(JwtService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('returns 401 without token', async () => {
    const res = await request(app.getHttpServer()).post('/uploads');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('uses token userId even if form sends another ownerId', async () => {
    const token = jwtService.sign({ sub: 42, email: 'rat@example.com' });

    const res = await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', `Bearer ${token}`)
      .field('prefix', 'outfits')
      .field('ownerId', '99')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff]), {
        filename: 'x.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(upload).toHaveBeenCalledWith(
      'outfits',
      '42',
      expect.objectContaining({ mimetype: 'image/jpeg' }),
      expect.any(String),
    );
  });
});

process.env.JWT_SECRET ??= 'test-jwt-secret-for-specs';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';

describe('OutfitsController', () => {
  let controller: OutfitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [OutfitsController],
      providers: [
        {
          provide: OutfitsService,
          useValue: { findAll: jest.fn(), checkin: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<OutfitsController>(OutfitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('OutfitsController checkin (http)', () => {
  let app: INestApplication;
  let checkin: jest.Mock;
  let jwtService: JwtService;

  beforeEach(async () => {
    checkin = jest.fn().mockResolvedValue({
      outfit: { id: 1 },
      currentStreak: 1,
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [OutfitsController],
      providers: [
        JwtStrategy,
        { provide: OutfitsService, useValue: { findAll: jest.fn(), checkin } },
      ],
    }).compile();

    jwtService = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('returns 401 without token', async () => {
    const res = await request(app.getHttpServer())
      .post('/outfits/checkin')
      .send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app.getHttpServer())
      .post('/outfits/checkin')
      .set('Authorization', 'Bearer not-a-jwt')
      .send({});
    expect(res.status).toBe(401);
  });

  it('calls checkin with userId from token, not body', async () => {
    const token = jwtService.sign({ sub: 42, email: 'rat@example.com' });

    await request(app.getHttpServer())
      .post('/outfits/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'ootd' })
      .expect(201);

    expect(checkin).toHaveBeenCalledWith(42, { note: 'ootd' });
  });

  it('rejects userId in body', async () => {
    const token = jwtService.sign({ sub: 42, email: 'rat@example.com' });

    await request(app.getHttpServer())
      .post('/outfits/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 99, note: 'ootd' })
      .expect(400);

    expect(checkin).not.toHaveBeenCalled();
  });
});

describe('OutfitsController /me (http)', () => {
  let app: INestApplication;
  let findAll: jest.Mock;
  let jwtService: JwtService;

  beforeEach(async () => {
    findAll = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [OutfitsController],
      providers: [
        JwtStrategy,
        { provide: OutfitsService, useValue: { findAll, checkin: jest.fn() } },
      ],
    }).compile();

    jwtService = module.get(JwtService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET /outfits/me without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/outfits/me');
    expect(res.status).toBe(401);
  });

  it('GET /outfits/me calls findAll with token userId', async () => {
    const token = jwtService.sign({ sub: 42, email: 'rat@example.com' });

    const res = await request(app.getHttpServer())
      .get('/outfits/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith({
      skip: undefined,
      take: undefined,
      where: { userId: 42 },
      orderBy: { checkedInAt: 'desc' },
    });
  });

  it('GET /outfits is gone', async () => {
    const res = await request(app.getHttpServer()).get('/outfits');
    expect(res.status).toBe(404);
  });
});

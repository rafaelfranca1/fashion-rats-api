process.env.JWT_SECRET ??= 'test-jwt-secret-for-specs';

import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('UsersController /me (http)', () => {
  let app: INestApplication;
  let findOne: jest.Mock;
  let update: jest.Mock;
  let jwtService: JwtService;

  beforeEach(async () => {
    findOne = jest.fn().mockResolvedValue({
      id: 42,
      email: 'rat@example.com',
      name: null,
      current_streak: 0,
    });
    update = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [UsersController],
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: { findOne, update, remove: jest.fn() },
        },
      ],
    }).compile();

    jwtService = module.get(JwtService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET /users/me without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('PATCH /users/me without token returns 401', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/me')
      .send({ name: 'Rat' });
    expect(res.status).toBe(401);
  });

  it('GET /users/me returns the user from the token', async () => {
    const token = jwtService.sign({ sub: 42, email: 'rat@example.com' });

    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(findOne).toHaveBeenCalledWith({ id: 42 });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /users is gone', async () => {
    const res = await request(app.getHttpServer()).get('/users');
    expect(res.status).toBe(404);
  });
});

process.env.JWT_SECRET ??= 'test-jwt-secret-for-specs';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';

describe('AuthController (http)', () => {
  let app: INestApplication;
  let findByEmail: jest.Mock;
  let create: jest.Mock;

  beforeEach(async () => {
    findByEmail = jest.fn();
    create = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        LocalStrategy,
        { provide: UsersService, useValue: { create, findByEmail } },
      ],
    }).compile();

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
    await app.close();
  });

  it('POST /auth/login returns access_token when password matches', async () => {
    const passwordHash = await bcrypt.hash('password1', 4);
    findByEmail.mockResolvedValue({
      id: 1,
      email: 'rat@example.com',
      passwordHash,
      name: null,
      current_streak: 0,
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'rat@example.com', password: 'password1' })
      .expect(200);

    expect(res.body.access_token).toEqual(expect.any(String));
  });

  it('POST /auth/login returns 401 when password is wrong', async () => {
    const passwordHash = await bcrypt.hash('password1', 4);
    findByEmail.mockResolvedValue({
      id: 1,
      email: 'rat@example.com',
      passwordHash,
      name: null,
      current_streak: 0,
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'rat@example.com', password: 'wrong-pass' })
      .expect(401);
  });

  it('POST /auth/register returns 409 when email already exists', async () => {
    const { Prisma } = await import('../../generated/prisma/client.js');
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'rat@example.com', password: 'password1' })
      .expect(409);
  });
});

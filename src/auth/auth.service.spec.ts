import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client.js';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let create: jest.Mock;
  let findByEmail: jest.Mock;
  let sign: jest.Mock;

  beforeEach(async () => {
    create = jest.fn();
    findByEmail = jest.fn();
    sign = jest.fn().mockReturnValue('signed.jwt');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { create, findByEmail } },
        { provide: JwtService, useValue: { sign } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('should hash password, create user, and return access_token', async () => {
      create.mockResolvedValue({
        id: 7,
        email: 'rat@example.com',
        name: null,
        current_streak: 0,
      });

      await expect(
        service.register({
          email: 'rat@example.com',
          password: 'password1',
        }),
      ).resolves.toEqual({ access_token: 'signed.jwt' });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'rat@example.com',
          passwordHash: expect.any(String),
        }),
      );
      const hash = create.mock.calls[0][0].passwordHash as string;
      await expect(bcrypt.compare('password1', hash)).resolves.toBe(true);
      expect(sign).toHaveBeenCalledWith({
        sub: 7,
        email: 'rat@example.com',
      });
    });

    it('should throw ConflictException on duplicate email', async () => {
      create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.10.0',
        }),
      );

      await expect(
        service.register({
          email: 'rat@example.com',
          password: 'password1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return AuthUser when password matches', async () => {
      const passwordHash = await bcrypt.hash('password1', 4);
      findByEmail.mockResolvedValue({
        id: 3,
        email: 'rat@example.com',
        name: 'Rat',
        passwordHash,
        current_streak: 0,
      });

      await expect(
        service.validateUser('rat@example.com', 'password1'),
      ).resolves.toEqual({ userId: 3, email: 'rat@example.com' });
    });

    it('should return null when password does not match', async () => {
      const passwordHash = await bcrypt.hash('password1', 4);
      findByEmail.mockResolvedValue({
        id: 3,
        email: 'rat@example.com',
        name: 'Rat',
        passwordHash,
        current_streak: 0,
      });

      await expect(
        service.validateUser('rat@example.com', 'wrong-pass'),
      ).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token', () => {
      expect(service.login({ userId: 3, email: 'rat@example.com' })).toEqual({
        access_token: 'signed.jwt',
      });
    });
  });
});

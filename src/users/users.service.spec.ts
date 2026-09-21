import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let user: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    user = {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: { user } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create omits passwordHash', async () => {
    user.create.mockResolvedValue({
      id: 1,
      email: 'rat@example.com',
      name: null,
      current_streak: 0,
    });

    const result = await service.create({
      email: 'rat@example.com',
      passwordHash: 'hashed',
    });

    expect(user.create).toHaveBeenCalledWith({
      data: { email: 'rat@example.com', passwordHash: 'hashed' },
      omit: { passwordHash: true },
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('findAll omits passwordHash', async () => {
    user.findMany.mockResolvedValue([
      { id: 1, email: 'rat@example.com', name: null, current_streak: 0 },
    ]);

    const result = await service.findAll({});

    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { passwordHash: true } }),
    );
    expect(result[0]).not.toHaveProperty('passwordHash');
  });
});

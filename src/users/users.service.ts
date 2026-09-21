import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../../generated/prisma/client.js';

export type PublicUser = Omit<User, 'passwordHash'>;

const omitPasswordHash = { passwordHash: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<PublicUser> {
    return this.prisma.user.create({
      data,
      omit: omitPasswordHash,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<PublicUser[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      omit: omitPasswordHash,
    });
  }

  async findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      omit: omitPasswordHash,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<PublicUser> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
      omit: omitPasswordHash,
    });
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<PublicUser> {
    return this.prisma.user.delete({
      where,
      omit: omitPasswordHash,
    });
  }
}

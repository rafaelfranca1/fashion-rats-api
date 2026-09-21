import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Outfit, Prisma } from '../../generated/prisma/client.js';
import { CheckinDto } from './dto/checkin.dto';

export type CheckinResponse = {
  outfit: Outfit;
  currentStreak: number;
};

@Injectable()
export class OutfitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OutfitWhereUniqueInput;
    where?: Prisma.OutfitWhereInput;
    orderBy?: Prisma.OutfitOrderByWithRelationInput;
  }): Promise<Outfit[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.outfit.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async checkin(userId: number, dto: CheckinDto): Promise<CheckinResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const startOfToday = startOfUtcDay(new Date());
    const startOfTomorrow = addUtcDays(startOfToday, 1);

    const outfitToday = await this.prisma.outfit.findFirst({
      where: {
        userId,
        checkedInAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    });

    if (outfitToday) {
      throw new ConflictException('Check-in already done for today');
    }

    const startOfYesterday = addUtcDays(startOfToday, -1);

    const lastOutfitBeforeToday = await this.prisma.outfit.findFirst({
      where: {
        userId,
        checkedInAt: { lt: startOfToday },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    const newStreak = computeStreak(
      user.current_streak,
      lastOutfitBeforeToday?.checkedInAt ?? null,
      startOfYesterday,
    );

    return this.prisma.$transaction(async (tx) => {
      const outfit = await tx.outfit.create({
        data: {
          userId,
          note: dto.note,
          imageUrl: dto.imageUrl,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { current_streak: newStreak },
      });

      return { outfit, currentStreak: newStreak };
    });
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function computeStreak(
  currentStreak: number,
  lastCheckedInAt: Date | null,
  startOfYesterday: Date,
): number {
  if (!lastCheckedInAt) {
    return 1;
  }

  if (lastCheckedInAt >= startOfYesterday) {
    return currentStreak + 1;
  }

  return 1;
}

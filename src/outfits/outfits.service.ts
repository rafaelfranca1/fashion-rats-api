import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Outfit } from '../../generated/prisma/client.js';
import { CheckinDto } from './dto/checkin.dto.js';

export type CheckinResponse = {
  outfit: Outfit;
  currentStreak: number;
};

@Injectable()
export class OutfitsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkin(dto: CheckinDto): Promise<CheckinResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    const startOfToday = startOfUtcDay(new Date());
    const startOfTomorrow = addUtcDays(startOfToday, 1);

    const outfitToday = await this.prisma.outfit.findFirst({
      where: {
        userId: dto.userId,
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
        userId: dto.userId,
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
          userId: dto.userId,
          note: dto.note,
          imageUrl: dto.imageUrl,
        },
      });

      await tx.user.update({
        where: { id: dto.userId },
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

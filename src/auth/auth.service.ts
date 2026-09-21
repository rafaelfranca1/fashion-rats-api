import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client.js';
import { UsersService } from '../users/users.service';
import { AuthUser } from './current-user.decorator';
import { RegisterDto } from './dto/register.dto';

export type TokenResponse = { access_token: string };

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.usersService.create({
        email: dto.email,
        name: dto.name,
        passwordHash,
      });
      return this.login({ userId: user.id, email: user.email });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return null;
    }
    return { userId: user.id, email: user.email };
  }

  login(user: AuthUser): TokenResponse {
    return {
      access_token: this.jwtService.sign({
        sub: user.userId,
        email: user.email,
      }),
    };
  }
}

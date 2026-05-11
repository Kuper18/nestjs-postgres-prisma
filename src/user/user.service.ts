import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/generated/prisma/client';
import { UpdatePasswordInterface } from './interface/update-password.interface';
import { UpdateRefreshTokenInterface } from './interface/update-refresh-token.interface';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateUserDto & { isVerified?: boolean }): Promise<User> {
    return await this.prismaService.user.create({ data: dto });
  }

  async updateRefreshToken(data: UpdateRefreshTokenInterface): Promise<User> {
    return await this.prismaService.user.update({
      where: { id: data.id },
      data: { refreshToken: data.refreshToken },
    });
  }

  findAll() {
    return `This action returns all user`;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async markAsVerified(id: string): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async updatePassword(data: UpdatePasswordInterface): Promise<User> {
    return await this.prismaService.user.update({
      where: { id: data.id },
      data: { password: data.password },
    });
  }
}

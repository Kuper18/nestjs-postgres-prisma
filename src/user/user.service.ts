import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateUserDto) {
    return await this.prismaService.user.create({ data: dto });
  }

  async updateRefreshToken({
    id,
    refreshToken,
  }: {
    id: string;
    refreshToken: string | null;
  }) {
    return await this.prismaService.user.update({
      where: { id },
      data: { refreshToken },
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
}

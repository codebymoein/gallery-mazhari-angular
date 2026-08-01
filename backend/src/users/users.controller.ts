import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class CreateManagedUserDto {
  @IsString() @MinLength(2) fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
}

class UpdateManagedUserDto {
  @IsOptional() @IsString() @MinLength(2) fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private publicUser(user: any) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listUsers() {
    return (await this.usersService.list()).map((user) =>
      this.publicUser(user),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() dto: CreateManagedUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash,
    });
    return this.publicUser(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateManagedUserDto,
  ) {
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;
    const user = await this.usersService.updateUser(req.user.userId, {
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });
    return this.publicUser(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateManagedUserDto,
  ) {
    if (id === req.user.userId && (dto.role || dto.isActive === false)) {
      throw new ForbiddenException('You cannot remove your own access');
    }
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;
    const user = await this.usersService.updateUser(id, {
      ...dto,
      passwordHash,
    });
    return this.publicUser(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeUser(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    if (id === req.user.userId)
      throw new ForbiddenException('You cannot delete your own account');
    return this.usersService.removeUser(id);
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  list() {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async hasAdminUser() {
    const adminsCount = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
    return adminsCount > 0;
  }

  createUser(input: {
    fullName: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    permissions?: string[];
    isActive?: boolean;
  }) {
    const user = this.usersRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.CUSTOMER,
      permissions: input.permissions ?? [],
      isActive: input.isActive ?? true,
    });

    return this.usersRepository.save(user);
  }

  async updateUser(
    userId: string,
    input: Partial<
      Pick<
        UserEntity,
        | 'fullName'
        | 'email'
        | 'passwordHash'
        | 'role'
        | 'permissions'
        | 'isActive'
      >
    >,
  ) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (input.email && input.email.toLowerCase() !== user.email.toLowerCase()) {
      const duplicate = await this.findByEmail(input.email.toLowerCase());
      if (duplicate) throw new ConflictException('Username is already in use');
    }
    Object.assign(user, input);
    if (input.email) user.email = input.email.toLowerCase();
    return this.usersRepository.save(user);
  }

  async removeUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.remove(user);
    return { deleted: true };
  }

  async setRole(userId: string, role: UserRole) {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    user.role = role;
    return this.usersRepository.save(user);
  }
}

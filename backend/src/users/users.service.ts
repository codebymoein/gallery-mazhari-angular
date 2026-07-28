import { Injectable } from '@nestjs/common';
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

  async hasAdminUser() {
    const adminsCount = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
    return adminsCount > 0;
  }

  createUser(input: { fullName: string; email: string; passwordHash: string; role?: UserRole }) {
    const user = this.usersRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.CUSTOMER,
    });

    return this.usersRepository.save(user);
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

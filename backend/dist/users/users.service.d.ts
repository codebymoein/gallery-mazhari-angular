import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<UserEntity>);
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
    hasAdminUser(): Promise<boolean>;
    createUser(input: {
        fullName: string;
        email: string;
        passwordHash: string;
        role?: UserRole;
    }): Promise<UserEntity>;
    setRole(userId: string, role: UserRole): Promise<UserEntity | null>;
}

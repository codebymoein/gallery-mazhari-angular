import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUserById(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        role: import("./entities/user.entity").UserRole;
        createdAt: Date;
    } | null>;
}

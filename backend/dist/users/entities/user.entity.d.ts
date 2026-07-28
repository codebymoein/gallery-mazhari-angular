export declare enum UserRole {
    ADMIN = "admin",
    CUSTOMER = "customer"
}
export declare class UserEntity {
    id: string;
    email: string;
    fullName: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

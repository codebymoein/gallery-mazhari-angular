"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/entities/user.entity");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.createUser({
            fullName: dto.fullName,
            email: dto.email,
            passwordHash,
        });
        return this.issueToken(user.id, user.email, user.role);
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            return null;
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            return null;
        }
        return this.issueToken(user.id, user.email, user.role);
    }
    async bootstrapAdmin(dto) {
        const configuredSetupKey = this.configService.get('ADMIN_SETUP_KEY');
        if (!configuredSetupKey) {
            throw new common_1.InternalServerErrorException('ADMIN_SETUP_KEY is not configured');
        }
        if (dto.setupKey !== configuredSetupKey) {
            throw new common_1.ForbiddenException('Invalid setup key');
        }
        const hasAdmin = await this.usersService.hasAdminUser();
        if (hasAdmin) {
            throw new common_1.ConflictException('Admin user already exists');
        }
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            const promoted = await this.usersService.setRole(existingUser.id, user_entity_1.UserRole.ADMIN);
            if (!promoted) {
                throw new common_1.InternalServerErrorException('Failed to promote existing user');
            }
            return this.issueToken(promoted.id, promoted.email, promoted.role);
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const admin = await this.usersService.createUser({
            fullName: dto.fullName,
            email: dto.email,
            passwordHash,
            role: user_entity_1.UserRole.ADMIN,
        });
        return this.issueToken(admin.id, admin.email, admin.role);
    }
    issueToken(userId, email, role) {
        return {
            accessToken: this.jwtService.sign({
                sub: userId,
                email,
                role,
            }),
            user: {
                id: userId,
                email,
                role,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
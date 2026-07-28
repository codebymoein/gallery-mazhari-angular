"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const typeorm_1 = require("@nestjs/typeorm");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const env_validation_1 = __importDefault(require("./config/env.validation"));
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const gallery_module_1 = require("./gallery/gallery.module");
const products_module_1 = require("./products/products.module");
const user_entity_1 = require("./users/entities/user.entity");
const gallery_item_entity_1 = require("./gallery/entities/gallery-item.entity");
const product_entity_1 = require("./products/entities/product.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: (config) => {
                    const validatedConfig = (0, class_transformer_1.plainToInstance)(env_validation_1.default, config, {
                        enableImplicitConversion: true,
                    });
                    const errors = (0, class_validator_1.validateSync)(validatedConfig, {
                        skipMissingProperties: false,
                    });
                    if (errors.length > 0) {
                        throw new Error(errors.toString());
                    }
                    return validatedConfig;
                },
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
            }),
            typeorm_1.TypeOrmModule.forRoot(process.env.DB_TYPE === 'sqlite'
                ? {
                    type: 'better-sqlite3',
                    database: process.env.DB_SQLITE_PATH ||
                        (0, path_1.join)(process.cwd(), 'data', 'gallery-mazhari.sqlite'),
                    entities: [user_entity_1.UserEntity, gallery_item_entity_1.GalleryItemEntity, product_entity_1.ProductEntity],
                    synchronize: true,
                }
                : {
                    type: 'postgres',
                    host: process.env.DB_HOST,
                    port: Number(process.env.DB_PORT ?? 5432),
                    username: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    entities: [user_entity_1.UserEntity, gallery_item_entity_1.GalleryItemEntity, product_entity_1.ProductEntity],
                    synchronize: true,
                }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            gallery_module_1.GalleryModule,
            products_module_1.ProductsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
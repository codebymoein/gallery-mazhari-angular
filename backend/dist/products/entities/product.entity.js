"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductEntity = void 0;
const typeorm_1 = require("typeorm");
let ProductEntity = class ProductEntity {
    id;
    code;
    name;
    category;
    parentCategory;
    parentCategorySlug;
    categorySlug;
    stock;
    isNewImport;
    status;
    photos;
    importedAt;
    processedAt;
    publishedAt;
    processedBy;
    publishedBy;
    notes;
    createdAt;
    updatedAt;
};
exports.ProductEntity = ProductEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, unique: true }),
    __metadata("design:type", String)
], ProductEntity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], ProductEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], ProductEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: '' }),
    __metadata("design:type", String)
], ProductEntity.prototype, "parentCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: '' }),
    __metadata("design:type", String)
], ProductEntity.prototype, "parentCategorySlug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: '' }),
    __metadata("design:type", String)
], ProductEntity.prototype, "categorySlug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ProductEntity.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductEntity.prototype, "isNewImport", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'waiting_photo' }),
    __metadata("design:type", String)
], ProductEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Array)
], ProductEntity.prototype, "photos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ProductEntity.prototype, "importedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ProductEntity.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ProductEntity.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], ProductEntity.prototype, "processedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], ProductEntity.prototype, "publishedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], ProductEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProductEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ProductEntity.prototype, "updatedAt", void 0);
exports.ProductEntity = ProductEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'staging_products' })
], ProductEntity);
//# sourceMappingURL=product.entity.js.map
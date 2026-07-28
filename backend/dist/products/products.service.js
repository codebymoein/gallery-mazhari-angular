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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = exports.MAX_PRODUCT_PHOTOS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const fs_1 = require("fs");
const path_1 = require("path");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
exports.MAX_PRODUCT_PHOTOS = 5;
const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;
const EXTENSION_BY_MIME = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
};
let ProductsService = class ProductsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    getQueue() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    getPublished() {
        return this.repo
            .createQueryBuilder('p')
            .where('p.status = :status', { status: 'published' })
            .andWhere('p.stock > 0')
            .orderBy('p.publishedAt', 'DESC')
            .getMany();
    }
    async applyImport(dto) {
        const removeCodes = [
            ...new Set(dto.removedOutOfStock.map((c) => c.trim().toUpperCase())),
        ].filter(Boolean);
        let removed = 0;
        if (removeCodes.length) {
            const result = await this.repo.delete({ code: (0, typeorm_2.In)(removeCodes) });
            removed = result.affected ?? 0;
        }
        const incomingCodes = dto.products.map((p) => p.code.trim().toUpperCase());
        const existing = incomingCodes.length
            ? await this.repo.find({ where: { code: (0, typeorm_2.In)(incomingCodes) } })
            : [];
        const existingByCode = new Map(existing.map((e) => [e.code.toUpperCase(), e]));
        let added = 0;
        let updated = 0;
        const now = new Date().toISOString();
        for (const row of dto.products) {
            const code = row.code.trim().toUpperCase();
            const current = existingByCode.get(code);
            if (current) {
                current.name = row.name.trim();
                current.category = row.category;
                current.parentCategory = row.parentCategory ?? current.parentCategory;
                current.parentCategorySlug =
                    row.parentCategorySlug ?? current.parentCategorySlug;
                current.categorySlug = row.categorySlug ?? current.categorySlug;
                current.stock = row.stock;
                current.isNewImport = row.isNewImport ?? current.isNewImport;
                await this.repo.save(current);
                updated += 1;
                continue;
            }
            const fresh = this.repo.create({
                code,
                name: row.name.trim(),
                category: row.category,
                parentCategory: row.parentCategory ?? '',
                parentCategorySlug: row.parentCategorySlug ?? '',
                categorySlug: row.categorySlug ?? '',
                stock: row.stock,
                isNewImport: row.isNewImport ?? false,
                status: 'waiting_photo',
                photos: [],
                importedAt: now,
            });
            await this.repo.save(fresh);
            added += 1;
        }
        return { added, updated, removed, queue: await this.getQueue() };
    }
    async attachPhotos(id, dto, uploadsBaseUrl) {
        const product = await this.getById(id);
        const existing = product.photos ?? [];
        const room = exports.MAX_PRODUCT_PHOTOS - existing.length;
        if (room <= 0) {
            throw new common_1.BadRequestException(`حداکثر ${exports.MAX_PRODUCT_PHOTOS} عکس برای هر محصول مجاز است.`);
        }
        const slice = dto.photos.slice(0, room).map((photo) => {
            return {
                url: this.persistPhotoUrl(photo.url, uploadsBaseUrl),
                fileName: photo.fileName,
                addedAt: new Date().toISOString(),
            };
        });
        product.photos = [...existing, ...slice];
        product.status = 'ready_for_approval';
        product.processedAt = new Date().toISOString();
        product.processedBy = dto.processedBy ?? null;
        return this.repo.save(product);
    }
    async removePhoto(id, index) {
        const product = await this.getById(id);
        const photos = [...(product.photos ?? [])];
        if (index < 0 || index >= photos.length) {
            throw new common_1.BadRequestException('ایندکس عکس نامعتبر است.');
        }
        photos.splice(index, 1);
        product.photos = photos;
        if (photos.length === 0 && product.status === 'ready_for_approval') {
            product.status = 'waiting_photo';
        }
        return this.repo.save(product);
    }
    async publish(id, dto) {
        const product = await this.getById(id);
        if (product.status !== 'ready_for_approval') {
            throw new common_1.BadRequestException('فقط محصولات آماده‌ی تایید قابل انتشار هستند.');
        }
        product.status = 'published';
        product.publishedAt = new Date().toISOString();
        product.publishedBy = dto.publishedBy ?? null;
        return this.repo.save(product);
    }
    async overrideStatus(id, dto) {
        const product = await this.getById(id);
        product.status = dto.status;
        product.notes = dto.actor ? `وضعیت توسط ${dto.actor} تغییر کرد` : product.notes;
        if (dto.status === 'published') {
            product.publishedAt = new Date().toISOString();
            product.publishedBy = dto.actor ?? null;
        }
        if (dto.status === 'ready_for_approval') {
            product.processedAt = new Date().toISOString();
            product.processedBy = dto.actor ?? null;
        }
        if (dto.status === 'waiting_photo') {
            product.photos = [];
        }
        return this.repo.save(product);
    }
    async getById(id) {
        const product = await this.repo.findOne({ where: { id } });
        if (!product) {
            throw new common_1.NotFoundException('محصول یافت نشد.');
        }
        return product;
    }
    persistPhotoUrl(url, uploadsBaseUrl) {
        const match = DATA_URL_PATTERN.exec(url);
        if (!match) {
            return url;
        }
        const [, mime, base64] = match;
        const buffer = Buffer.from(base64, 'base64');
        if (buffer.length > 8 * 1024 * 1024) {
            throw new common_1.BadRequestException('حجم عکس بیش از حد مجاز است.');
        }
        const destination = (0, path_1.join)(process.cwd(), 'uploads');
        if (!(0, fs_1.existsSync)(destination)) {
            (0, fs_1.mkdirSync)(destination, { recursive: true });
        }
        const ext = EXTENSION_BY_MIME[mime.toLowerCase()] ?? '.jpg';
        const fileName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        (0, fs_1.writeFileSync)((0, path_1.join)(destination, fileName), buffer);
        return `${uploadsBaseUrl}/uploads/${fileName}`;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.ProductEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map
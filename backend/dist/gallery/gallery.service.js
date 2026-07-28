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
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gallery_item_entity_1 = require("./entities/gallery-item.entity");
let GalleryService = class GalleryService {
    galleryRepository;
    constructor(galleryRepository) {
        this.galleryRepository = galleryRepository;
    }
    async getAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const search = query.search?.trim();
        const [items, total] = await this.galleryRepository.findAndCount({
            where: search
                ? [{ title: (0, typeorm_2.ILike)(`%${search}%`) }, { description: (0, typeorm_2.ILike)(`%${search}%`) }]
                : undefined,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getById(id) {
        const item = await this.galleryRepository.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Gallery item not found');
        }
        return item;
    }
    create(dto) {
        const entity = this.galleryRepository.create(dto);
        return this.galleryRepository.save(entity);
    }
    async update(id, dto) {
        const item = await this.getById(id);
        const merged = this.galleryRepository.merge(item, dto);
        return this.galleryRepository.save(merged);
    }
    async remove(id) {
        const item = await this.getById(id);
        await this.galleryRepository.remove(item);
        return item;
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gallery_item_entity_1.GalleryItemEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map
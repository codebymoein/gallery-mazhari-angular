"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGalleryItemDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_gallery_item_dto_1 = require("./create-gallery-item.dto");
class UpdateGalleryItemDto extends (0, mapped_types_1.PartialType)(create_gallery_item_dto_1.CreateGalleryItemDto) {
}
exports.UpdateGalleryItemDto = UpdateGalleryItemDto;
//# sourceMappingURL=update-gallery-item.dto.js.map
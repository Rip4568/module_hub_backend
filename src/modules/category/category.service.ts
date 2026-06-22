import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slug.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  private async resolveUniqueSlug(tenantId: string, name: string): Promise<string> {
    const baseSlug = slugify(name) || 'category';
    let slug = baseSlug;
    let suffix = 1;

    while (await this.categoryRepository.findOne({ where: { tenantId, slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    return slug;
  }

  async create(tenantId: string, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug = await this.resolveUniqueSlug(tenantId, createCategoryDto.name);
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      slug,
      type: createCategoryDto.type ?? 'product',
      tenantId,
      isActive: true,
      ...(createCategoryDto.color !== undefined ? { color: createCategoryDto.color } : {}),
    });
    return this.categoryRepository.save(category);
  }

  async findAll(
    tenantId: string,
    type?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Category>> {
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const where: Record<string, unknown> = { tenantId };
    if (type) {
      where.type = type;
    }
    const [data, total] = await this.categoryRepository.findAndCount({
      where,
      relations: ['children', 'parent'],
      skip,
      take: safeLimit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id, tenantId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    tenantId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(tenantId, id);
    const { name, ...rest } = updateCategoryDto;

    if (name && name !== category.name) {
      category.name = name;
      category.slug = await this.resolveUniqueSlug(tenantId, name);
    }

    this.categoryRepository.merge(category, rest);
    return this.categoryRepository.save(category);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const category = await this.findOne(tenantId, id);
    await this.categoryRepository.remove(category);
  }
}

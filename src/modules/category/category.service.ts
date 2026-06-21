import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(tenantId: string, createCategoryDto: any): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      tenantId,
    } as Category);
    return this.categoryRepository.save(category);
  }

  async findAll(tenantId: string, type?: string, page = 1, limit = 20): Promise<PaginatedResult<Category>> {
    const where: any = { tenantId };
    if (type) {
      where.type = type;
    }
    const [data, total] = await this.categoryRepository.findAndCount({
        where,
        relations: ['children', 'parent'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id, tenantId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(tenantId: string, id: string, updateCategoryDto: any): Promise<Category> {
    const category = await this.findOne(tenantId, id);
    this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const category = await this.findOne(tenantId, id);
    await this.categoryRepository.remove(category);
  }
}

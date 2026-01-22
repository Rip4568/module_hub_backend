import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

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

  async findAll(tenantId: string): Promise<Category[]> {
    return this.categoryRepository.find({
        where: { tenantId },
        relations: ['children', 'parent']
    });
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

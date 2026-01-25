import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categories, variants, ...productData } = createProductDto;

    const product = this.productRepository.create({
      ...productData,
    } as Product);
    const savedProduct = await this.productRepository.save(product);

    if (categories && categories.length > 0) {
      const productCategories = categories.map(catId =>
        this.productCategoryRepository.create({ productId: savedProduct.id, categoryId: catId } as ProductCategory)
      );
      await this.productCategoryRepository.save(productCategories);
    }

    if (variants && variants.length > 0) {
      const productVariants = variants.map(variant =>
        this.variantRepository.create({ ...variant, productId: savedProduct.id } as ProductVariant)
      );
      await this.variantRepository.save(productVariants);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(query: any = {}): Promise<Product[]> {
    // Basic query support
    const qb = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'pc')
      .leftJoinAndSelect('pc.category', 'category');

    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id } as any,
      relations: ['categories', 'categories.category', 'variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { categories, variants, ...productData } = updateProductDto;

    this.productRepository.merge(product, productData);
    await this.productRepository.save(product);

    if (categories) {
      await this.productCategoryRepository.delete({ productId: id });
      const productCategories = categories.map(catId =>
        this.productCategoryRepository.create({ productId: id, categoryId: catId } as ProductCategory)
      );
      await this.productCategoryRepository.save(productCategories);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async publish(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.status = ProductStatus.ACTIVE;
    product.publishedAt = new Date();
    return this.productRepository.save(product);
  }
}

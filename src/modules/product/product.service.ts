import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductEcommerceProfile, EcommerceStatus } from './entities/ecommerce-profile.entity';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductEcommerceProfile)
    private ecommerceRepository: Repository<ProductEcommerceProfile>,
    private readonly cls: ClsService,
  ) { }

  async create(createProductDto: any): Promise<Product> {
    const { categories, variants, ecommerce, ...productData } = createProductDto;

    const product = this.productRepository.create(productData as Product);
    const savedProduct = await this.productRepository.save(product);

    if (ecommerce) {
      const profile = this.ecommerceRepository.create({
        ...ecommerce,
        productId: savedProduct.id,
      });
      await this.ecommerceRepository.save(profile);
    }

    if (categories && categories.length > 0) {
      const productCategories = categories.map((catId: string) =>
        this.productCategoryRepository.create({ productId: savedProduct.id, categoryId: catId } as ProductCategory)
      );
      await this.productCategoryRepository.save(productCategories);
    }

    if (variants && variants.length > 0) {
      const productVariants = variants.map((variant: any) =>
        this.variantRepository.create({ ...variant, productId: savedProduct.id } as ProductVariant)
      );
      await this.variantRepository.save(productVariants);
    }

    return this.findOne(savedProduct.id, { withEcommerce: !!ecommerce });
  }

  async findAll(query: any = {}): Promise<Product[]> {
    const qb = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'pc')
      .leftJoinAndSelect('pc.category', 'category');

    if (query.withEcommerce === 'true') {
      qb.leftJoinAndSelect('product.ecommerceProfile', 'ecommerce');
    }

    if (query.status) {
      qb.andWhere('product.ecommerceProfile.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  async findOne(id: string, options: { withEcommerce?: boolean } = {}): Promise<Product> {
    const relations = ['categories', 'categories.category', 'variants'];
    if (options.withEcommerce) {
      relations.push('ecommerceProfile');
    }

    const product = await this.productRepository.findOne({
      where: { id } as any,
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: any): Promise<Product> {
    const product = await this.findOne(id, { withEcommerce: true });
    const { categories, variants, ecommerce, ...productData } = updateProductDto;

    this.productRepository.merge(product, productData);
    await this.productRepository.save(product);

    if (ecommerce) {
      if (product.ecommerceProfile) {
        this.ecommerceRepository.merge(product.ecommerceProfile, ecommerce);
        await this.ecommerceRepository.save(product.ecommerceProfile);
      } else {
        const profile = this.ecommerceRepository.create({
          ...ecommerce,
          productId: id,
        });
        await this.ecommerceRepository.save(profile);
      }
    }

    if (categories) {
      await this.productCategoryRepository.delete({ productId: id });
      const productCategories = categories.map((catId: string) =>
        this.productCategoryRepository.create({ productId: id, categoryId: catId } as ProductCategory)
      );
      await this.productCategoryRepository.save(productCategories);
    }

    return this.findOne(id, { withEcommerce: !!ecommerce || !!product.ecommerceProfile });
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async publish(id: string): Promise<Product> {
    const product = await this.findOne(id, { withEcommerce: true });
    if (!product.ecommerceProfile) {
      throw new Error('Cannot publish product without ecommerce profile');
    }
    product.ecommerceProfile.status = EcommerceStatus.PUBLISHED;
    product.ecommerceProfile.publishedAt = new Date();
    await this.ecommerceRepository.save(product.ecommerceProfile);
    return product;
  }
}

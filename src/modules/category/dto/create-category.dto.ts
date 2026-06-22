import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const CATEGORY_TYPES = ['product', 'user', 'other', 'vehicle'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(CATEGORY_TYPES)
  type?: CategoryType;

  @IsOptional()
  @IsString()
  color?: string;
}

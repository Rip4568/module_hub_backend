import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CompleteOnboardingDto {
  @ValidateIf((dto: CompleteOnboardingDto) => !dto.moduleIds?.length)
  @IsString()
  moduleId?: string;

  @ValidateIf((dto: CompleteOnboardingDto) => !dto.moduleId)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsString({ each: true })
  moduleIds?: string[];
}

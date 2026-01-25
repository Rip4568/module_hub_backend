import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsEmail } from 'class-validator';
import { OrganizationStatus, DocumentType } from '../entities/organization.entity';

export class CreateOrganizationDto {
    @IsString()
    legalName: string;

    @IsString()
    @IsOptional()
    tradeName?: string;

    @IsEnum(DocumentType)
    documentType: DocumentType;

    @IsString()
    documentNumber: string;

    @IsString()
    @IsOptional()
    stateRegistration?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    whatsapp?: string;

    @IsString()
    @IsOptional()
    responsibleName?: string;

    @IsNumber()
    @IsOptional()
    paymentTerm?: number;

    @IsNumber()
    @IsOptional()
    minimumPurchase?: number;

    @IsNumber()
    @IsOptional()
    commission?: number;

    @IsArray()
    @IsOptional()
    serviceRegions?: string[];

    @IsOptional()
    metadata?: any;
}

export class UpdateOrganizationDto extends CreateOrganizationDto {
    @IsEnum(OrganizationStatus)
    @IsOptional()
    status?: OrganizationStatus;
}

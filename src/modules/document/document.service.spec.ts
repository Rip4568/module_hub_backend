import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';
import { STORAGE_SERVICE } from '../../infrastructure/storage/interfaces/storage.service.interface';

describe('DocumentService', () => {
  let service: DocumentService;

  const documentRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const storageServiceMock = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: getRepositoryToken(Document), useValue: documentRepositoryMock },
        { provide: STORAGE_SERVICE, useValue: storageServiceMock },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  it('injects tenantId on create', async () => {
    documentRepositoryMock.create.mockImplementation((input) => input);
    documentRepositoryMock.save.mockImplementation(async (input) => input);

    const created = await service.create('tenant-1', {
      type: 'invoice',
      name: 'Invoice',
      fileUrl: 'https://file.local/invoice.pdf',
    });

    expect(created).toEqual({
      type: 'invoice',
      name: 'Invoice',
      fileUrl: 'https://file.local/invoice.pdf',
      tenantId: 'tenant-1',
    });
  });

  it('throws NotFoundException when document is outside tenant scope', async () => {
    documentRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'doc-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uploads file via storage service with tenant scope', async () => {
    storageServiceMock.upload.mockResolvedValue({
      key: 'uuid-invoice.pdf',
      url: '/uploads/tenant-1/uuid-invoice.pdf',
      size: 100,
    });

    const url = await service.uploadFile(
      { originalname: '../../../etc/passwd', buffer: Buffer.from('data'), mimetype: 'application/pdf' },
      'tenant-1',
    );

    expect(url).toBe('/uploads/tenant-1/uuid-invoice.pdf');
    expect(storageServiceMock.upload).toHaveBeenCalledWith(
      'tenant-1',
      '../../../etc/passwd',
      expect.any(Buffer),
      'application/pdf',
    );
  });

  it('throws when file buffer is missing', async () => {
    await expect(
      service.uploadFile({ originalname: 'file.pdf' }, 'tenant-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

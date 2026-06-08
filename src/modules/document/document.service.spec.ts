import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';

describe('DocumentService', () => {
  let service: DocumentService;

  const documentRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: getRepositoryToken(Document), useValue: documentRepositoryMock },
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
    expect(documentRepositoryMock.create).toHaveBeenCalledWith({
      type: 'invoice',
      name: 'Invoice',
      fileUrl: 'https://file.local/invoice.pdf',
      tenantId: 'tenant-1',
    });
  });

  it('throws NotFoundException when document is outside tenant scope', async () => {
    documentRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'doc-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(documentRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'doc-1', tenantId: 'tenant-1' },
    });
  });

  it('removes document only after tenant-scoped find', async () => {
    const document = { id: 'doc-1', tenantId: 'tenant-1' };
    jest.spyOn(service, 'findOne').mockResolvedValue(document as Document);
    documentRepositoryMock.remove.mockResolvedValue(undefined);

    await service.remove('tenant-1', 'doc-1');

    expect(service.findOne).toHaveBeenCalledWith('tenant-1', 'doc-1');
    expect(documentRepositoryMock.remove).toHaveBeenCalledWith(document);
  });
});

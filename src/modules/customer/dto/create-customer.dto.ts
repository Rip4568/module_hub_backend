export class CreateCustomerDto {
  name: string;
  email: string;
  phone?: string;
  document?: string;
  type?: 'person' | 'company';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  tenantId: string; // Typically injected by controller/guard
}

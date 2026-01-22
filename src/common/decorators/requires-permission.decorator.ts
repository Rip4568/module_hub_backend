import { SetMetadata } from '@nestjs/common';

export const RequiresPermission = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

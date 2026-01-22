import { SetMetadata } from '@nestjs/common';

export const RequiresModule = (moduleName: string) => SetMetadata('requiredModule', moduleName);

import { SetMetadata } from '@nestjs/common';

export const ALLOW_DURING_ONBOARDING_KEY = 'allowDuringOnboarding';
export const AllowDuringOnboarding = () => SetMetadata(ALLOW_DURING_ONBOARDING_KEY, true);

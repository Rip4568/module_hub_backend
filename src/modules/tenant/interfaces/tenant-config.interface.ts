export interface TenantConfig {
  timezone?: string;
  locale?: string;
  currency?: string;
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
  [key: string]: unknown;
}

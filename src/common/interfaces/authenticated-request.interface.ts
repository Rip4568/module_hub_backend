import { Request } from 'express';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  tenantId?: string;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUserPayload;
};

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks an endpoint as public (no authentication required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); 
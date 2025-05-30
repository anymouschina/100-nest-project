import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Check if the endpoint is public or requires authentication
   * 
   * @param context Execution context
   * @returns Whether to skip authentication check
   */
  canActivate(context: ExecutionContext) {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    // Use the parent class's canActivate method for JWT auth
    return super.canActivate(context);
  }

  /**
   * Handle unauthorized errors
   * 
   * @param err Error object
   * @returns Never - throws an UnauthorizedException
   */
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
} 
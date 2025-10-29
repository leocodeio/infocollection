import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { auth } from './auth';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';

@ApiExcludeController()
@Controller('api/auth')
@AllowAnonymous()
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(auth)(req, res);
  }
}

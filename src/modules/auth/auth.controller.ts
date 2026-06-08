import { Controller, Request, Post, UseGuards, Body, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // For now, simple validation. In real app, use LocalStrategy
    const user = await this.authService.validateUser(loginDto.email, loginDto.password, loginDto.tenantId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
        suggestedAction: 'RETRY_LOGIN',
      });
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/driver')
  async registerDriver(@Body() registerDto: RegisterDto) {
    return this.authService.registerDriver(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req: AuthenticatedRequest) {
    return this.authService.getCurrentUser(req.user.userId, req.user.tenantId);
  }
}

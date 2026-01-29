import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // For now, simple validation. In real app, use LocalStrategy
    const user = await this.authService.validateUser(loginDto.email, loginDto.password, loginDto.tenantId);
    if (!user) {
      throw new Error('Invalid credentials');
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
}

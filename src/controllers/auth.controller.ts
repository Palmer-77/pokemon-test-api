import { Body, Controller, Post, UseGuards, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../services/supabase.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from '../dto/auth.dto';
import { AdminGuard } from '../guards/admin.guard';
import { UserProfile } from '../interfaces/user.interface';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.supabaseService.signUp(
      signUpDto.email,
      signUpDto.password,
      signUpDto.firstName,
      signUpDto.lastName,
    );
    return user;
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    try {
      const result = await this.supabaseService.signIn(
        signInDto.email,
        signInDto.password,
      );
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  }

  @Post('signout')
  async signOut(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const userId = token.split('-')[0];
    await this.supabaseService.signOut(userId);
    return { message: 'Signed out successfully' };
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.supabaseService.refreshSession(
      refreshTokenDto.refreshToken,
    );
    return result;
  }

  @Post('verify-admin')
  @UseGuards(AdminGuard)
  verifyAdmin() {
    return { message: 'Admin access verified' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @Req() req: Request,
  ): Promise<Omit<UserProfile, 'auth_id'>> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      return await this.supabaseService.getUserByToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token or insufficient permissions');
    }
  }
}

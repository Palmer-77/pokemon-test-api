import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  SupabaseClient,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import {
  AuthUser,
  UserProfile,
  AuthResponse,
} from '../interfaces/user.interface';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public',
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  private generateToken(userId: string, expiresIn: string): string {
    const timestamp = Date.now();
    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    // Format: timestamp:expiresIn:userId:secret
    return `${timestamp}:${expiresIn}:${userId}:${secret}`;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const tokenParts = token.split(':');
      // Check if token has all required parts
      if (tokenParts.length < 4) return true;

      const timestamp = parseInt(tokenParts[0]);
      const expiresIn = tokenParts[1];
      const userId = tokenParts[2];
      const tokenSecret = tokenParts[3];

      // Validate timestamp
      if (isNaN(timestamp)) return true;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) return true;

      // Validate secret
      const actualSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');
      if (tokenSecret !== actualSecret) return true;

      // Check expiration
      const now = Date.now();
      const expirationTime = timestamp + this.getExpirationTimeInMs(expiresIn);
      return now > expirationTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return true;
    }
  }

  private getExpirationTimeInMs(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 'm': // minutes
        return value * 60 * 1000;
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    if (!token) return false;
    if (this.isTokenExpired(token)) return false;

    try {
      const tokenParts = token.split(':');
      const userId = tokenParts[2];
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) return false;

      const { data: authUser } = await this.supabase
        .from('auth')
        .select('refresh_token')
        .eq('id', userId)
        .single();

      return !!authUser;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async getUserByToken(token: string): Promise<Omit<UserProfile, 'auth_id'>> {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    if (this.isTokenExpired(token)) {
      throw new UnauthorizedException('Token has expired');
    }

    try {
      const tokenParts = token.split(':');
      const userId = tokenParts[2];

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new UnauthorizedException('Invalid token format');
      }

      return this.getUserById(userId);
    } catch (error) {
      console.error('Token validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async signUp(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<Omit<UserProfile, 'auth_id'>> {
    try {
      // 1. Check for existing user
      const { data: existingUser } = await this.supabase
        .from('auth')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new UnauthorizedException('Email already exists');
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      // 3. Create auth user
      const {
        data: authUser,
        error: authError,
      }: PostgrestSingleResponse<AuthUser> = await this.supabase
        .from('auth')
        .insert([
          {
            email,
            password: hashedPassword,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (authError) throw new Error(authError.message);

      // 4. Create profile
      const {
        data: profile,
        error: profileError,
      }: PostgrestSingleResponse<UserProfile> = await this.supabase
        .from('profiles')
        .insert([
          {
            auth_id: authUser.id,
            firstname: firstName,
            lastname: lastName,
            created_at: now,
            updated_at: now,
          },
        ])
        .select('id, firstname, lastname, created_at')
        .single();

      if (profileError) throw new Error(profileError.message);
      return profile;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to sign up',
      );
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // 1. Get auth user
      const {
        data: authUser,
        error: authError,
      }: PostgrestSingleResponse<AuthUser> = await this.supabase
        .from('auth')
        .select('*')
        .eq('email', email)
        .single();

      if (authError || !authUser) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // 2. Verify password
      const isValidPassword = await bcrypt.compare(password, authUser.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // 3. Generate tokens
      const accessToken = this.generateToken(authUser.id, '15m');
      const refreshToken = this.generateToken(authUser.id, '7d');

      // 4. Update auth user with refresh token and last login
      await this.supabase
        .from('auth')
        .update({
          refresh_token: refreshToken,
          last_sign_in: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      // 5. Get user profile directly
      const profile = await this.getUserById(authUser.id);

      return {
        user: profile,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to sign in',
      );
    }
  }

  async signOut(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('auth')
        .update({ refresh_token: null })
        .eq('id', userId);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to sign out',
      );
    }
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { data: authUser }: PostgrestSingleResponse<AuthUser> =
        await this.supabase
          .from('auth')
          .select('id, refresh_token')
          .eq('refresh_token', refreshToken)
          .single();

      if (!authUser) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.generateToken(authUser.id, '2h');
      const newRefreshToken = this.generateToken(authUser.id, '7d');

      await this.supabase
        .from('auth')
        .update({ refresh_token: newRefreshToken })
        .eq('id', authUser.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to refresh session',
      );
    }
  }

  async getUserById(userId: string): Promise<Omit<UserProfile, 'auth_id'>> {
    try {
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, firstname, lastname, created_at, updated_at, auth_id, status')
        .eq('auth_id', userId)
        .single();

      if (profileError) throw new Error(profileError.message);
      if (!profile) throw new Error('User not found');

      return profile;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get user',
      );
    }
  }

  async getUserProfileById(userId: string): Promise<Omit<UserProfile, 'id'>> {
    try {
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, firstname, lastname, created_at, updated_at, auth_id, status')
        .eq('id', userId)
        .single();

      if (profileError) throw new Error(profileError.message);
      if (!profile) throw new Error('User not found');

      return profile;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get user',
      );
    }
  }
}

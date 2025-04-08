import { Request } from 'express';
import { UserProfile } from './user.interface';

export interface RequestWithUser extends Request {
  user: Omit<UserProfile, 'auth_id'>;
} 
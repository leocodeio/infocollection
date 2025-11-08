import * as bcrypt from 'bcrypt';
import { authConstants } from '../constants/auth.constants';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, authConstants.bcryptSaltRounds);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = 12;

export const generateToken = (userId: string): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  // Default: 30 days in seconds
  const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '2592000', 10);
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: expiresInSeconds });
};

export const verifyToken = (token: string): { userId: string } | null => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
 
export const calculateLevel = (xp: number): string => {
  if (xp > 3000) return 'Професор';
  if (xp > 1500) return 'Магістр';
  if (xp > 500) return 'Бакалавр';
  return 'Студент';
};

export const updateStreak = (lastActiveDate?: Date): { streak: number; lastActiveDate: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!lastActiveDate) {
    return { streak: 1, lastActiveDate: now };
  }

  const lastActive = new Date(lastActiveDate);
  const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  
  const diffTime = today.getTime() - lastActiveDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, no change
    return { streak: 0, lastActiveDate }; // Will be handled by controller
  } else if (diffDays === 1) {
    // Consecutive day
    return { streak: 1, lastActiveDate: now };
  } else {
    // Streak broken
    return { streak: 1, lastActiveDate: now };
  }
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000); // Limit length
};

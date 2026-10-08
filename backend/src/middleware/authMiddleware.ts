import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../services/supabaseService.js';
import { storeService } from '../services/storeService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;
  const customUserEmail = req.headers['x-user-email'] as string;

  // Case 1: Supabase Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const sb = getSupabase();

    if (sb) {
      try {
        const { data, error } = await sb.auth.getUser(token);
        if (!error && data?.user) {
          req.user = {
            id: data.user.id,
            email: data.user.email || '',
            fullName: data.user.user_metadata?.full_name || '',
          };
          return next();
        }
      } catch (err) {
        // Fallback to checking local session
      }
    }

    // Try decoding JWT payload safely without verification if supabase client is not configured
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        if (payload.sub) {
          req.user = {
            id: payload.sub,
            email: payload.email || 'user@careerforge.local',
            fullName: payload.user_metadata?.full_name || 'Explorer',
          };
          return next();
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  // Case 2: Direct user ID header (Local session sync)
  if (customUserId) {
    const existing = storeService.getUser(customUserId);
    req.user = {
      id: customUserId,
      email: customUserEmail || (existing ? existing.profile.email : 'user@careerforge.local'),
      fullName: existing ? existing.profile.fullName : 'Explorer',
    };
    return next();
  }

  // If no auth provided, return 401
  res.status(401).json({
    error: 'Unauthorized: Authentication required',
    message: 'Please log in to access this resource.',
  });
}

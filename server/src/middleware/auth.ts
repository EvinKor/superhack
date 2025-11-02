import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        details: 'No token provided'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not defined');
      res.status(500).json({
        error: 'Server configuration error',
        details: 'Authentication service unavailable'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Fetch user from Supabase to ensure they still exist and get latest data
    const { data: user, error } = await supabase
      .from(Tables.USERS)
      .select('id, name, email, role, company, created_at, last_login')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user) {
      res.status(401).json({
        error: 'Access denied',
        details: 'User not found'
      });
      return;
    }

    req.user = user as User;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Access denied',
        details: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Access denied',
        details: 'Token expired'
      });
      return;
    }

    res.status(500).json({
      error: 'Authentication error',
      details: 'Internal server error'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Access denied',
        details: 'User not authenticated'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied',
        details: `Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
      return;
    }

    next();
  };
};

export const authorizeAdmin = authorize('Admin');
export const authorizeManagerOrAdmin = authorize('Admin', 'IT_Manager');
export const authorizeAllRoles = authorize('Admin', 'IT_Manager', 'Technician');

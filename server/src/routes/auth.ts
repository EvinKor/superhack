import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateUser } from '../middleware/validation';
import { User, UserInsert, UserUpdate } from '../models/User';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Register new user
router.post('/register', validateUser, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, company, password } = req.body;

  // Check if user already exists
  const { data: existingUsers, error: checkError } = await supabase
    .from(Tables.USERS)
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1);

  if (checkError) {
    throw checkError;
  }

  if (existingUsers && existingUsers.length > 0) {
    return res.status(400).json({
      error: 'User already exists',
      details: 'A user with this email already exists'
    });
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser: UserInsert = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role,
    company: company.trim(),
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  };

  const { data: user, error: insertError } = await supabase
    .from(Tables.USERS)
    .insert(newUser)
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info(`New user registered: ${email} (${role})`);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      created_at: user.created_at
    }
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      details: 'Email and password are required'
    });
  }

  // Find user
  const { data: users, error: queryError } = await supabase
    .from(Tables.USERS)
    .select('*')
    .eq('email', email.toLowerCase())
    .limit(1);

  if (queryError) {
    throw queryError;
  }

  if (!users || users.length === 0) {
    return res.status(401).json({
      error: 'Invalid credentials',
      details: 'Email or password is incorrect'
    });
  }

  const user = users[0] as User;

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
      details: 'Email or password is incorrect'
    });
  }

  // Update last login
  const { error: updateError } = await supabase
    .from(Tables.USERS)
    .update({ last_login: new Date().toISOString() } as UserUpdate)
    .eq('id', user.id);

  if (updateError) {
    logger.error('Failed to update last login:', updateError);
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info(`User logged in: ${email}`);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      last_login: new Date().toISOString()
    }
  });
}));

// Get current user profile
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    user: req.user
  });
}));

// Update user profile
router.put('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { name, company } = req.body;
  const updates: UserUpdate = {};

  if (name) updates.name = name.trim();
  if (company) updates.company = company.trim();

  const { data: user, error } = await supabase
    .from(Tables.USERS)
    .update(updates)
    .eq('id', req.user!.id)
    .select('id, name, email, role, company, created_at, last_login')
    .single();

  if (error) {
    throw error;
  }

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      details: 'User profile could not be updated'
    });
  }

  logger.info(`User profile updated: ${user.email}`);

  res.json({
    message: 'Profile updated successfully',
    user
  });
}));

// Change password
router.put('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Missing passwords',
      details: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'Invalid password',
      details: 'New password must be at least 6 characters long'
    });
  }

  // Get user with password hash
  const { data: users, error: queryError } = await supabase
    .from(Tables.USERS)
    .select('*')
    .eq('id', req.user!.id)
    .limit(1);

  if (queryError) {
    throw queryError;
  }

  if (!users || users.length === 0) {
    return res.status(404).json({
      error: 'User not found',
      details: 'User could not be found'
    });
  }

  const user = users[0] as User;

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({
      error: 'Invalid password',
      details: 'Current password is incorrect'
    });
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  const { error: updateError } = await supabase
    .from(Tables.USERS)
    .update({ password_hash: newPasswordHash } as UserUpdate)
    .eq('id', user.id);

  if (updateError) {
    throw updateError;
  }

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    message: 'Password changed successfully'
  });
}));

// Logout (client-side token removal)
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  logger.info(`User logged out: ${req.user!.email}`);
  
  res.json({
    message: 'Logout successful'
  });
}));

export default router;

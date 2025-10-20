import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateUser } from '../middleware/validation';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

// Register new user
router.post('/register', validateUser, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, company, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      error: 'User already exists',
      details: 'A user with this email already exists'
    });
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = new User({
    name,
    email,
    role,
    company,
    passwordHash
  });

  await user.save();

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info(`New user registered: ${email} (${role})`);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      createdAt: user.createdAt
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

  // Find user and include password hash
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      details: 'Email or password is incorrect'
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
      details: 'Email or password is incorrect'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info(`User logged in: ${email}`);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      lastLogin: user.lastLogin
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
  const updates: any = {};

  if (name) updates.name = name;
  if (company) updates.company = company;

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash');

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
  const user = await User.findById(req.user!._id).select('+passwordHash');
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      details: 'User could not be found'
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
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
  user.passwordHash = newPasswordHash;
  await user.save();

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



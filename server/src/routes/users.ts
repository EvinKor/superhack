import { Request, Response, Router } from 'express';
import { authenticate, authorizeAdmin, authorizeManagerOrAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateObjectId, validatePagination, validateUser, validateUserUpdate } from '../middleware/validation';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

// Get all users (Admin and IT_Manager only)
router.get('/', authenticate, authorizeManagerOrAdmin, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const role = req.query.role as string;
  const company = req.query.company as string;

  // Build filter object
  const filter: any = {};
  if (role) filter.role = role;
  if (company) filter.company = new RegExp(company, 'i');

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-passwordHash'),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    users,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get user by ID
router.get('/:id', authenticate, authorizeManagerOrAdmin, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      details: 'User with the specified ID does not exist'
    });
  }

  res.json({ user });
}));

// Create new user (Admin only)
router.post('/', authenticate, authorizeAdmin, validateUser, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, company, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      error: 'User already exists',
      details: 'A user with this email already exists'
    });
  }

  const user = new User({
    name,
    email,
    role,
    company,
    passwordHash: 'temp' // Will be set by pre-save hook or manually
  });

  // Hash password
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  user.passwordHash = await bcrypt.hash(password, saltRounds);

  await user.save();

  logger.info(`New user created by ${req.user!.email}: ${email} (${role})`);

  res.status(201).json({
    message: 'User created successfully',
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

// Update user (Admin and IT_Manager can update, but only Admin can change roles)
router.put('/:id', authenticate, authorizeManagerOrAdmin, validateObjectId, validateUserUpdate, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, company } = req.body;
  const updates: any = {};

  // Only Admin can change roles
  if (role && req.user!.role !== 'Admin') {
    return res.status(403).json({
      error: 'Access denied',
      details: 'Only Admin users can change user roles'
    });
  }

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (company) updates.company = company;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      details: 'User with the specified ID does not exist'
    });
  }

  logger.info(`User updated by ${req.user!.email}: ${user.email}`);

  res.json({
    message: 'User updated successfully',
    user
  });
}));

// Delete user (Admin only)
router.delete('/:id', authenticate, authorizeAdmin, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  // Prevent self-deletion
  if (req.params.id === req.user!._id.toString()) {
    return res.status(400).json({
      error: 'Cannot delete self',
      details: 'You cannot delete your own account'
    });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      details: 'User with the specified ID does not exist'
    });
  }

  logger.info(`User deleted by ${req.user!.email}: ${user.email}`);

  res.json({
    message: 'User deleted successfully'
  });
}));

// Get user statistics (Admin only)
router.get('/stats/overview', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const [totalUsers, roleStats, companyStats] = await Promise.all([
    User.countDocuments(),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    User.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role company createdAt');

  res.json({
    totalUsers,
    roleStats,
    companyStats,
    recentUsers
  });
}));

export default router;



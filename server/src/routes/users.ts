import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import { authenticate, authorizeAdmin, authorizeManagerOrAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validatePagination, validateUser, validateUserUpdate } from '../middleware/validation';
import { UserInsert, UserUpdate } from '../models/User';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Get all users (Admin and IT_Manager only)
router.get('/', authenticate, authorizeManagerOrAdmin, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const role = req.query.role as string;
  const company = req.query.company as string;

  // Build query
  let query = supabase.from(Tables.USERS).select('id, name, email, role, company, created_at, last_login', { count: 'exact' });

  // Apply filters
  if (role) {
    query = query.eq('role', role);
  }
  if (company) {
    query = query.ilike('company', `%${company}%`);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: users, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    users: users || [],
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
router.get('/:id', authenticate, authorizeManagerOrAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { data: user, error } = await supabase
    .from(Tables.USERS)
    .select('id, name, email, role, company, created_at, last_login')
    .eq('id', req.params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'User not found',
        details: 'User with the specified ID does not exist'
      });
    }
    throw error;
  }

  res.json({ user });
}));

// Create new user (Admin only)
router.post('/', authenticate, authorizeAdmin, validateUser, asyncHandler(async (req: Request, res: Response) => {
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
    .select('id, name, email, role, company, created_at')
    .single();

  if (insertError) {
    throw insertError;
  }

  logger.info(`New user created by ${req.user!.email}: ${email} (${role})`);

  res.status(201).json({
    message: 'User created successfully',
    user
  });
}));

// Update user (Admin and IT_Manager can update, but only Admin can change roles)
router.put('/:id', authenticate, authorizeManagerOrAdmin, validateUserUpdate, asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, company } = req.body;
  const updates: UserUpdate = {};

  // Only Admin can change roles
  if (role && req.user!.role !== 'Admin') {
    return res.status(403).json({
      error: 'Access denied',
      details: 'Only Admin users can change user roles'
    });
  }

  if (name) updates.name = name.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (role) updates.role = role;
  if (company) updates.company = company.trim();

  const { data: user, error } = await supabase
    .from(Tables.USERS)
    .update(updates)
    .eq('id', req.params.id)
    .select('id, name, email, role, company, created_at, last_login')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'User not found',
        details: 'User with the specified ID does not exist'
      });
    }
    throw error;
  }

  logger.info(`User updated by ${req.user!.email}: ${user.email}`);

  res.json({
    message: 'User updated successfully',
    user
  });
}));

// Delete user (Admin only)
router.delete('/:id', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  // Prevent self-deletion
  if (req.params.id === req.user!.id) {
    return res.status(400).json({
      error: 'Cannot delete self',
      details: 'You cannot delete your own account'
    });
  }

  const { data: user, error: selectError } = await supabase
    .from(Tables.USERS)
    .select('email')
    .eq('id', req.params.id)
    .single();

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'User not found',
        details: 'User with the specified ID does not exist'
      });
    }
    throw selectError;
  }

  const { error: deleteError } = await supabase
    .from(Tables.USERS)
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    throw deleteError;
  }

  logger.info(`User deleted by ${req.user!.email}: ${user.email}`);

  res.json({
    message: 'User deleted successfully'
  });
}));

// Get user statistics (Admin only)
router.get('/stats/overview', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  // Get total users count
  const { count: totalUsers, error: countError } = await supabase
    .from(Tables.USERS)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  // Get all users for aggregation
  const { data: allUsers, error: allError } = await supabase
    .from(Tables.USERS)
    .select('role, company');

  if (allError) {
    throw allError;
  }

  // Calculate role stats
  const roleMap = new Map<string, number>();
  const companyMap = new Map<string, number>();

  allUsers?.forEach((user: any) => {
    roleMap.set(user.role, (roleMap.get(user.role) || 0) + 1);
    companyMap.set(user.company, (companyMap.get(user.company) || 0) + 1);
  });

  const roleStats = Array.from(roleMap.entries())
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count);

  const companyStats = Array.from(companyMap.entries())
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent users
  const { data: recentUsers, error: recentError } = await supabase
    .from(Tables.USERS)
    .select('id, name, email, role, company, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) {
    throw recentError;
  }

  res.json({
    totalUsers: totalUsers || 0,
    roleStats,
    companyStats,
    recentUsers: recentUsers || []
  });
}));

export default router;

import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateActivityLog, validatePagination } from '../middleware/validation';
import { ActivityLogInsert, ActivityLogUpdate } from '../models/ActivityLog';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Get all activity logs
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'timestamp';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const userId = req.query.userId as string;
  const action = req.query.action as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  // Build query with user join
  let query = supabase
    .from(Tables.ACTIVITY_LOGS)
    .select(`
      *,
      user:user_id (
        id,
        name,
        email,
        role
      )
    `, { count: 'exact' });

  // Apply filters
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (action) {
    query = query.ilike('action', `%${action}%`);
  }
  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: logs, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    logs: logs || [],
    pagination: {
      currentPage: page,
      totalPages,
      totalLogs: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get activity log by ID
router.get('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: log, error } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .select(`
      *,
      user:user_id (
        id,
        name,
        email,
        role,
        company
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Activity log not found',
        details: 'Activity log with the specified ID does not exist'
      });
    }
    throw error;
  }

  res.json({ log });
}));

// Create new activity log
router.post('/', authenticate, authorizeAllRoles, validateActivityLog, asyncHandler(async (req: Request, res: Response) => {
  // Verify user exists
  const { data: user, error: userError } = await supabase
    .from(Tables.USERS)
    .select('id, email')
    .eq('id', req.body.userId)
    .single();

  if (userError || !user) {
    return res.status(400).json({
      error: 'User not found',
      details: 'The specified user does not exist'
    });
  }

  const newLog: ActivityLogInsert = {
    user_id: req.body.userId,
    action: req.body.action,
    details: req.body.details,
    timestamp: req.body.timestamp || new Date().toISOString(),
    ip_address: req.body.ipAddress
  };

  const { data: log, error: insertError } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .insert(newLog)
    .select(`
      *,
      user:user_id (
        name,
        email,
        role
      )
    `)
    .single();

  if (insertError) {
    throw insertError;
  }

  logger.info(`New activity log created: ${log.action} by ${user.email}`);

  res.status(201).json({
    message: 'Activity log created successfully',
    log
  });
}));

// Update activity log
router.put('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const updates: ActivityLogUpdate = {};

  if (req.body.userId) updates.user_id = req.body.userId;
  if (req.body.action) updates.action = req.body.action;
  if (req.body.details) updates.details = req.body.details;
  if (req.body.timestamp) updates.timestamp = req.body.timestamp;
  if (req.body.ipAddress) updates.ip_address = req.body.ipAddress;

  const { data: log, error } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .update(updates)
    .eq('id', req.params.id)
    .select(`
      *,
      user:user_id (
        name,
        email,
        role
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Activity log not found',
        details: 'Activity log with the specified ID does not exist'
      });
    }
    throw error;
  }

  logger.info(`Activity log updated by ${req.user!.email}: ${log.id}`);

  res.json({
    message: 'Activity log updated successfully',
    log
  });
}));

// Delete activity log
router.delete('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: log, error: selectError } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Activity log not found',
        details: 'Activity log with the specified ID does not exist'
      });
    }
    throw selectError;
  }

  const { error: deleteError } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    throw deleteError;
  }

  logger.info(`Activity log deleted by ${req.user!.email}: ${log.id}`);

  res.json({
    message: 'Activity log deleted successfully'
  });
}));

// Get recent activity feed
router.get('/feed/recent', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const userId = req.query.userId as string;

  let query = supabase
    .from(Tables.ACTIVITY_LOGS)
    .select(`
      *,
      user:user_id (
        name,
        email,
        role
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: recentActivity, error } = await query;

  if (error) {
    throw error;
  }

  res.json({
    recentActivity: recentActivity || [],
    limit
  });
}));

// Get user activity summary
router.get('/analytics/user-activity/:userId', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: activities, error } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString());

  if (error) {
    throw error;
  }

  // Group by action
  const actionMap = new Map();
  activities?.forEach((activity: any) => {
    const action = activity.action;
    if (!actionMap.has(action)) {
      actionMap.set(action, {
        _id: action,
        count: 0,
        lastActivity: activity.timestamp
      });
    }
    const actionData = actionMap.get(action);
    actionData.count++;
    if (new Date(activity.timestamp) > new Date(actionData.lastActivity)) {
      actionData.lastActivity = activity.timestamp;
    }
  });

  const userActivity = Array.from(actionMap.values()).sort((a, b) => b.count - a.count);
  const totalActivities = activities?.length || 0;

  const { data: user, error: userError } = await supabase
    .from(Tables.USERS)
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  if (userError) {
    throw userError;
  }

  res.json({
    user,
    userActivity,
    totalActivities,
    period: { days, startDate }
  });
}));

// Get activity statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: allLogs, error, count } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .select('*', { count: 'exact' });

  if (error) {
    throw error;
  }

  const totalLogs = count || 0;

  // Calculate action stats
  const actionMap = new Map();
  allLogs?.forEach((log: any) => {
    actionMap.set(log.action, (actionMap.get(log.action) || 0) + 1);
  });

  const actionStats = Array.from(actionMap.entries())
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate user activity
  const userMap = new Map();
  allLogs?.forEach((log: any) => {
    if (!userMap.has(log.user_id)) {
      userMap.set(log.user_id, {
        activityCount: 0,
        lastActivity: log.timestamp
      });
    }
    const userData = userMap.get(log.user_id);
    userData.activityCount++;
    if (new Date(log.timestamp) > new Date(userData.lastActivity)) {
      userData.lastActivity = log.timestamp;
    }
  });

  const topUserIds = Array.from(userMap.entries())
    .sort((a, b) => b[1].activityCount - a[1].activityCount)
    .slice(0, 10)
    .map(([id]) => id);

  let userActivity: any[] = [];
  if (topUserIds.length > 0) {
    const { data: users } = await supabase
      .from(Tables.USERS)
      .select('id, name, email')
      .in('id', topUserIds);

    userActivity = topUserIds.map(userId => {
      const user = users?.find((u: any) => u.id === userId);
      const stats = userMap.get(userId);
      return {
        _id: userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        activityCount: stats.activityCount,
        lastActivity: stats.lastActivity
      };
    });
  }

  // Get recent activity
  const { data: recentActivity, error: recentError } = await supabase
    .from(Tables.ACTIVITY_LOGS)
    .select(`
      id,
      action,
      details,
      timestamp,
      user:user_id (
        name,
        email,
        role
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (recentError) {
    throw recentError;
  }

  res.json({
    totalLogs,
    actionStats,
    userActivity,
    recentActivity: recentActivity || []
  });
}));

// Get activity trends
router.get('/analytics/trends', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const action = req.query.action as string;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from(Tables.ACTIVITY_LOGS)
    .select('action, timestamp')
    .gte('timestamp', startDate.toISOString());

  if (action) {
    query = query.ilike('action', `%${action}%`);
  }

  const { data: activities, error } = await query;

  if (error) {
    throw error;
  }

  // Group by date and action
  const trendMap = new Map();
  activities?.forEach((activity: any) => {
    const date = activity.timestamp.substring(0, 10); // YYYY-MM-DD
    const key = `${date}|${activity.action}`;
    
    if (!trendMap.has(key)) {
      trendMap.set(key, {
        _id: {
          date,
          action: activity.action
        },
        count: 0
      });
    }
    trendMap.get(key).count++;
  });

  const trends = Array.from(trendMap.values())
    .sort((a, b) => a._id.date.localeCompare(b._id.date));

  res.json({
    trends,
    period: { days, startDate }
  });
}));

export default router;

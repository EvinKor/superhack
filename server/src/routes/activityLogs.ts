import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateActivityLog, validateObjectId, validatePagination } from '../middleware/validation';
import { ActivityLog } from '../models/ActivityLog';
import { User } from '../models/User';
import { logger } from '../utils/logger';

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

  // Build filter object
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = new RegExp(action, 'i');
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    logs,
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
router.get('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const log = await ActivityLog.findById(req.params.id)
    .populate('userId', 'name email role company');
  
  if (!log) {
    return res.status(404).json({
      error: 'Activity log not found',
      details: 'Activity log with the specified ID does not exist'
    });
  }

  res.json({ log });
}));

// Create new activity log
router.post('/', authenticate, authorizeAllRoles, validateActivityLog, asyncHandler(async (req: Request, res: Response) => {
  // Verify user exists
  const user = await User.findById(req.body.userId);
  if (!user) {
    return res.status(400).json({
      error: 'User not found',
      details: 'The specified user does not exist'
    });
  }

  const log = new ActivityLog(req.body);
  await log.save();

  // Populate user information
  await log.populate('userId', 'name email role');

  logger.info(`New activity log created: ${log.action} by ${user.email}`);

  res.status(201).json({
    message: 'Activity log created successfully',
    log
  });
}));

// Update activity log
router.put('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const log = await ActivityLog.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('userId', 'name email role');

  if (!log) {
    return res.status(404).json({
      error: 'Activity log not found',
      details: 'Activity log with the specified ID does not exist'
    });
  }

  logger.info(`Activity log updated by ${req.user!.email}: ${log._id}`);

  res.json({
    message: 'Activity log updated successfully',
    log
  });
}));

// Delete activity log
router.delete('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const log = await ActivityLog.findByIdAndDelete(req.params.id);
  
  if (!log) {
    return res.status(404).json({
      error: 'Activity log not found',
      details: 'Activity log with the specified ID does not exist'
    });
  }

  logger.info(`Activity log deleted by ${req.user!.email}: ${log._id}`);

  res.json({
    message: 'Activity log deleted successfully'
  });
}));

// Get recent activity feed
router.get('/feed/recent', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const userId = req.query.userId as string;

  const filter: any = {};
  if (userId) filter.userId = userId;

  const recentActivity = await ActivityLog.find(filter)
    .populate('userId', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);

  res.json({
    recentActivity,
    limit
  });
}));

// Get user activity summary
router.get('/analytics/user-activity/:userId', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const userActivity = await ActivityLog.aggregate([
    { $match: { userId: new require('mongoose').Types.ObjectId(userId), timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const totalActivities = await ActivityLog.countDocuments({
    userId: new require('mongoose').Types.ObjectId(userId),
    timestamp: { $gte: startDate }
  });

  const user = await User.findById(userId).select('name email role');

  res.json({
    user,
    userActivity,
    totalActivities,
    period: { days, startDate }
  });
}));

// Get activity statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const [totalLogs, actionStats, userActivity, recentActivity] = await Promise.all([
    ActivityLog.countDocuments(),
    ActivityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    ActivityLog.aggregate([
      {
        $group: {
          _id: '$userId',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $addFields: {
          userName: { $arrayElemAt: ['$user.name', 0] },
          userEmail: { $arrayElemAt: ['$user.email', 0] }
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ]),
    ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action details timestamp userId')
  ]);

  res.json({
    totalLogs,
    actionStats,
    userActivity,
    recentActivity
  });
}));

// Get activity trends
router.get('/analytics/trends', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const action = req.query.action as string;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const filter: any = { timestamp: { $gte: startDate } };
  if (action) filter.action = new RegExp(action, 'i');

  const trends = await ActivityLog.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  res.json({
    trends,
    period: { days, startDate }
  });
}));

export default router;



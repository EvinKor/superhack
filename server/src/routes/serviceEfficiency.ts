import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateObjectId, validatePagination, validateServiceEfficiency } from '../middleware/validation';
import { Client } from '../models/Client';
import { ServiceEfficiency } from '../models/ServiceEfficiency';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

// Get all service efficiency records
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const technicianId = req.query.technicianId as string;
  const clientId = req.query.clientId as string;
  const week = req.query.week as string;

  // Build filter object
  const filter: any = {};
  if (technicianId) filter.technicianId = technicianId;
  if (clientId) filter.clientId = clientId;
  if (week) filter.week = week;

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [efficiencyRecords, total] = await Promise.all([
    ServiceEfficiency.find(filter)
      .populate('technicianId', 'name email role')
      .populate('clientId', 'clientName industry')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ServiceEfficiency.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    efficiencyRecords,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get service efficiency record by ID
router.get('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const efficiencyRecord = await ServiceEfficiency.findById(req.params.id)
    .populate('technicianId', 'name email role company')
    .populate('clientId', 'clientName industry contactPerson email');
  
  if (!efficiencyRecord) {
    return res.status(404).json({
      error: 'Service efficiency record not found',
      details: 'Service efficiency record with the specified ID does not exist'
    });
  }

  res.json({ efficiencyRecord });
}));

// Create new service efficiency record
router.post('/', authenticate, authorizeAllRoles, validateServiceEfficiency, asyncHandler(async (req: Request, res: Response) => {
  // Verify technician exists
  const technician = await User.findById(req.body.technicianId);
  if (!technician) {
    return res.status(400).json({
      error: 'Technician not found',
      details: 'The specified technician does not exist'
    });
  }

  // Verify client exists
  const client = await Client.findById(req.body.clientId);
  if (!client) {
    return res.status(400).json({
      error: 'Client not found',
      details: 'The specified client does not exist'
    });
  }

  // Check for duplicate week for this technician and client
  const existingRecord = await ServiceEfficiency.findOne({
    technicianId: req.body.technicianId,
    clientId: req.body.clientId,
    week: req.body.week
  });

  if (existingRecord) {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'Service efficiency record for this technician, client, and week already exists'
    });
  }

  const efficiencyRecord = new ServiceEfficiency(req.body);
  await efficiencyRecord.save();

  // Populate related information
  await efficiencyRecord.populate('technicianId', 'name email role');
  await efficiencyRecord.populate('clientId', 'clientName industry');

  logger.info(`New service efficiency record created by ${req.user!.email} for technician ${technician.name}`);

  res.status(201).json({
    message: 'Service efficiency record created successfully',
    efficiencyRecord
  });
}));

// Update service efficiency record
router.put('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const efficiencyRecord = await ServiceEfficiency.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('technicianId', 'name email role')
    .populate('clientId', 'clientName industry');

  if (!efficiencyRecord) {
    return res.status(404).json({
      error: 'Service efficiency record not found',
      details: 'Service efficiency record with the specified ID does not exist'
    });
  }

  logger.info(`Service efficiency record updated by ${req.user!.email}: ${efficiencyRecord._id}`);

  res.json({
    message: 'Service efficiency record updated successfully',
    efficiencyRecord
  });
}));

// Delete service efficiency record
router.delete('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const efficiencyRecord = await ServiceEfficiency.findByIdAndDelete(req.params.id);
  
  if (!efficiencyRecord) {
    return res.status(404).json({
      error: 'Service efficiency record not found',
      details: 'Service efficiency record with the specified ID does not exist'
    });
  }

  logger.info(`Service efficiency record deleted by ${req.user!.email}: ${efficiencyRecord._id}`);

  res.json({
    message: 'Service efficiency record deleted successfully'
  });
}));

// Get technician performance analytics
router.get('/analytics/technician-performance', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const technicianId = req.query.technicianId as string;
  const weeks = parseInt(req.query.weeks as string) || 12;

  const filter: any = {};
  if (technicianId) filter.technicianId = technicianId;

  const performance = await ServiceEfficiency.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$technicianId',
        totalTasks: { $sum: '$tasksCompleted' },
        avgResponseTime: { $avg: '$avgResponseTime' },
        avgResolutionTime: { $avg: '$avgResolutionTime' },
        totalWeeks: { $sum: 1 },
        efficiencyScore: { $avg: { $add: ['$avgResponseTime', '$avgResolutionTime'] } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'technician'
      }
    },
    {
      $addFields: {
        technicianName: { $arrayElemAt: ['$technician.name', 0] },
        technicianEmail: { $arrayElemAt: ['$technician.email', 0] },
        technicianRole: { $arrayElemAt: ['$technician.role', 0] }
      }
    },
    { $sort: { efficiencyScore: 1 } } // Lower is better
  ]);

  res.json({
    performance,
    period: { weeks }
  });
}));

// Get weekly performance trends
router.get('/analytics/weekly-trends', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const technicianId = req.query.technicianId as string;
  const clientId = req.query.clientId as string;
  const weeks = parseInt(req.query.weeks as string) || 12;

  const filter: any = {};
  if (technicianId) filter.technicianId = technicianId;
  if (clientId) filter.clientId = clientId;

  const trends = await ServiceEfficiency.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$week',
        totalTasks: { $sum: '$tasksCompleted' },
        avgResponseTime: { $avg: '$avgResponseTime' },
        avgResolutionTime: { $avg: '$avgResolutionTime' },
        recordCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    trends,
    period: { weeks }
  });
}));

// Get service efficiency overview statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const [totalRecords, performanceStats, topPerformers] = await Promise.all([
    ServiceEfficiency.countDocuments(),
    ServiceEfficiency.aggregate([
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$avgResponseTime' },
          avgResolutionTime: { $avg: '$avgResolutionTime' },
          totalTasks: { $sum: '$tasksCompleted' },
          avgTasksPerWeek: { $avg: '$tasksCompleted' }
        }
      }
    ]),
    ServiceEfficiency.aggregate([
      {
        $group: {
          _id: '$technicianId',
          totalTasks: { $sum: '$tasksCompleted' },
          avgResponseTime: { $avg: '$avgResponseTime' },
          avgResolutionTime: { $avg: '$avgResolutionTime' },
          efficiencyScore: { $avg: { $add: ['$avgResponseTime', '$avgResolutionTime'] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technician'
        }
      },
      {
        $addFields: {
          technicianName: { $arrayElemAt: ['$technician.name', 0] }
        }
      },
      { $sort: { efficiencyScore: 1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    totalRecords,
    performanceStats: performanceStats[0] || {},
    topPerformers
  });
}));

// Get client-specific efficiency metrics
router.get('/analytics/client-efficiency/:clientId', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const weeks = parseInt(req.query.weeks as string) || 12;

  const clientEfficiency = await ServiceEfficiency.aggregate([
    { $match: { clientId: new require('mongoose').Types.ObjectId(clientId) } },
    {
      $group: {
        _id: '$technicianId',
        totalTasks: { $sum: '$tasksCompleted' },
        avgResponseTime: { $avg: '$avgResponseTime' },
        avgResolutionTime: { $avg: '$avgResolutionTime' },
        weeksWorked: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'technician'
      }
    },
    {
      $addFields: {
        technicianName: { $arrayElemAt: ['$technician.name', 0] },
        technicianEmail: { $arrayElemAt: ['$technician.email', 0] }
      }
    },
    { $sort: { totalTasks: -1 } }
  ]);

  res.json({
    clientId,
    clientEfficiency,
    period: { weeks }
  });
}));

export default router;



import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateFinancialInsight, validateObjectId, validatePagination } from '../middleware/validation';
import { Client } from '../models/Client';
import { FinancialInsight } from '../models/FinancialInsight';
import { logger } from '../utils/logger';

const router = Router();

// Get all financial insights
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const clientId = req.query.clientId as string;
  const month = req.query.month as string;

  // Build filter object
  const filter: any = {};
  if (clientId) filter.clientId = clientId;
  if (month) filter.month = month;

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [insights, total] = await Promise.all([
    FinancialInsight.find(filter)
      .populate('clientId', 'clientName industry')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    FinancialInsight.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    insights,
    pagination: {
      currentPage: page,
      totalPages,
      totalInsights: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get financial insight by ID
router.get('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const insight = await FinancialInsight.findById(req.params.id)
    .populate('clientId', 'clientName industry contactPerson email');
  
  if (!insight) {
    return res.status(404).json({
      error: 'Financial insight not found',
      details: 'Financial insight with the specified ID does not exist'
    });
  }

  res.json({ insight });
}));

// Create new financial insight
router.post('/', authenticate, authorizeAllRoles, validateFinancialInsight, asyncHandler(async (req: Request, res: Response) => {
  // Verify client exists
  const client = await Client.findById(req.body.clientId);
  if (!client) {
    return res.status(400).json({
      error: 'Client not found',
      details: 'The specified client does not exist'
    });
  }

  // Check for duplicate month for this client
  const existingInsight = await FinancialInsight.findOne({
    clientId: req.body.clientId,
    month: req.body.month
  });

  if (existingInsight) {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'Financial insight for this client and month already exists'
    });
  }

  const insight = new FinancialInsight(req.body);
  await insight.save();

  // Populate client information
  await insight.populate('clientId', 'clientName industry');

  logger.info(`New financial insight created by ${req.user!.email} for client ${client.clientName}`);

  res.status(201).json({
    message: 'Financial insight created successfully',
    insight
  });
}));

// Update financial insight
router.put('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const insight = await FinancialInsight.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('clientId', 'clientName industry');

  if (!insight) {
    return res.status(404).json({
      error: 'Financial insight not found',
      details: 'Financial insight with the specified ID does not exist'
    });
  }

  logger.info(`Financial insight updated by ${req.user!.email}: ${insight._id}`);

  res.json({
    message: 'Financial insight updated successfully',
    insight
  });
}));

// Delete financial insight
router.delete('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const insight = await FinancialInsight.findByIdAndDelete(req.params.id);
  
  if (!insight) {
    return res.status(404).json({
      error: 'Financial insight not found',
      details: 'Financial insight with the specified ID does not exist'
    });
  }

  logger.info(`Financial insight deleted by ${req.user!.email}: ${insight._id}`);

  res.json({
    message: 'Financial insight deleted successfully'
  });
}));

// Get profit margin trends per client
router.get('/analytics/profit-trends', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.query.clientId as string;
  const months = parseInt(req.query.months as string) || 12;

  const filter: any = {};
  if (clientId) filter.clientId = clientId;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const trends = await FinancialInsight.aggregate([
    { $match: filter },
    {
      $addFields: {
        date: {
          $dateFromString: {
            dateString: { $concat: [{$toString: "$month"}, "-01"] },
            format: "%Y-%m-%d"
          }
        }
      }
    },
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$clientId',
        clientName: { $first: '$clientName' },
        months: {
          $push: {
            month: '$month',
            revenue: '$revenue',
            expenses: '$expenses',
            profitMargin: '$profitMargin',
            profitAmount: { $subtract: ['$revenue', '$expenses'] }
          }
        },
        avgProfitMargin: { $avg: '$profitMargin' },
        totalRevenue: { $sum: '$revenue' },
        totalExpenses: { $sum: '$expenses' }
      }
    },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client'
      }
    },
    {
      $addFields: {
        clientName: { $arrayElemAt: ['$client.clientName', 0] }
      }
    },
    { $sort: { avgProfitMargin: -1 } }
  ]);

  res.json({
    trends,
    period: {
      startDate,
      endDate,
      months
    }
  });
}));

// Get financial overview statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const [totalInsights, revenueStats, profitStats] = await Promise.all([
    FinancialInsight.countDocuments(),
    FinancialInsight.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          avgRevenue: { $avg: '$revenue' },
          maxRevenue: { $max: '$revenue' },
          minRevenue: { $min: '$revenue' }
        }
      }
    ]),
    FinancialInsight.aggregate([
      {
        $group: {
          _id: null,
          avgProfitMargin: { $avg: '$profitMargin' },
          maxProfitMargin: { $max: '$profitMargin' },
          minProfitMargin: { $min: '$profitMargin' }
        }
      }
    ])
  ]);

  const topClients = await FinancialInsight.aggregate([
    {
      $group: {
        _id: '$clientId',
        totalRevenue: { $sum: '$revenue' },
        avgProfitMargin: { $avg: '$profitMargin' }
      }
    },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client'
      }
    },
    {
      $addFields: {
        clientName: { $arrayElemAt: ['$client.clientName', 0] }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    totalInsights,
    revenueStats: revenueStats[0] || {},
    profitStats: profitStats[0] || {},
    topClients
  });
}));

// Get monthly financial summary
router.get('/analytics/monthly-summary', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const year = req.query.year as string || new Date().getFullYear().toString();
  const clientId = req.query.clientId as string;

  const filter: any = {
    month: { $regex: `^${year}` }
  };
  if (clientId) filter.clientId = clientId;

  const monthlyData = await FinancialInsight.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$month',
        totalRevenue: { $sum: '$revenue' },
        totalExpenses: { $sum: '$expenses' },
        avgProfitMargin: { $avg: '$profitMargin' },
        clientCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    year,
    monthlyData
  });
}));

export default router;



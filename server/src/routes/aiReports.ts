import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateAiReport, validateObjectId, validatePagination } from '../middleware/validation';
import { AiReport } from '../models/AiReport';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

// Get all AI reports
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const reportType = req.query.reportType as string;
  const generatedForType = req.query.generatedForType as string;
  const generatedForId = req.query.generatedForId as string;

  // Build filter object
  const filter: any = {};
  if (reportType) filter.reportType = reportType;
  if (generatedForType) filter.generatedForType = generatedForType;
  if (generatedForId) filter.generatedForId = generatedForId;

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    AiReport.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AiReport.countDocuments(filter)
  ]);

  // Populate target information based on generatedForType
  const populatedReports = await Promise.all(
    reports.map(async (report) => {
      let targetInfo = null;
      
      if (report.generatedForType === 'client') {
        const client = await Client.findById(report.generatedForId).select('clientName industry');
        targetInfo = client;
      } else if (report.generatedForType === 'user') {
        const user = await User.findById(report.generatedForId).select('name email role');
        targetInfo = user;
      }

      return {
        ...report.toObject(),
        target: targetInfo
      };
    })
  );

  const totalPages = Math.ceil(total / limit);

  res.json({
    reports: populatedReports,
    pagination: {
      currentPage: page,
      totalPages,
      totalReports: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get AI report by ID
router.get('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const report = await AiReport.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({
      error: 'AI report not found',
      details: 'AI report with the specified ID does not exist'
    });
  }

  // Populate target information
  let targetInfo = null;
  if (report.generatedForType === 'client') {
    targetInfo = await Client.findById(report.generatedForId).select('clientName industry contactPerson email');
  } else if (report.generatedForType === 'user') {
    targetInfo = await User.findById(report.generatedForId).select('name email role company');
  }

  res.json({ 
    report: {
      ...report.toObject(),
      target: targetInfo
    }
  });
}));

// Create new AI report
router.post('/', authenticate, authorizeAllRoles, validateAiReport, asyncHandler(async (req: Request, res: Response) => {
  // Verify target exists
  let targetExists = false;
  if (req.body.generatedForType === 'client') {
    const client = await Client.findById(req.body.generatedForId);
    targetExists = !!client;
  } else if (req.body.generatedForType === 'user') {
    const user = await User.findById(req.body.generatedForId);
    targetExists = !!user;
  }

  if (!targetExists) {
    return res.status(400).json({
      error: 'Target not found',
      details: `The specified ${req.body.generatedForType} does not exist`
    });
  }

  const report = new AiReport(req.body);
  await report.save();

  logger.info(`New AI report created by ${req.user!.email}: ${report.reportType}`);

  res.status(201).json({
    message: 'AI report created successfully',
    report
  });
}));

// Update AI report
router.put('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const report = await AiReport.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!report) {
    return res.status(404).json({
      error: 'AI report not found',
      details: 'AI report with the specified ID does not exist'
    });
  }

  logger.info(`AI report updated by ${req.user!.email}: ${report._id}`);

  res.json({
    message: 'AI report updated successfully',
    report
  });
}));

// Delete AI report
router.delete('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const report = await AiReport.findByIdAndDelete(req.params.id);
  
  if (!report) {
    return res.status(404).json({
      error: 'AI report not found',
      details: 'AI report with the specified ID does not exist'
    });
  }

  logger.info(`AI report deleted by ${req.user!.email}: ${report._id}`);

  res.json({
    message: 'AI report deleted successfully'
  });
}));

// Get AI reports by target (client or user)
router.get('/target/:type/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!['client', 'user'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid target type',
      details: 'Target type must be client or user'
    });
  }

  const filter = {
    generatedForType: type,
    generatedForId: id
  };

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    AiReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AiReport.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    reports,
    target: { type, id },
    pagination: {
      currentPage: page,
      totalPages,
      totalReports: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get AI reports analytics
router.get('/analytics/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const [totalReports, reportTypeStats, confidenceStats, recentReports] = await Promise.all([
    AiReport.countDocuments(),
    AiReport.aggregate([
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AiReport.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: '$confidenceScore' },
          maxConfidence: { $max: '$confidenceScore' },
          minConfidence: { $min: '$confidenceScore' }
        }
      }
    ]),
    AiReport.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reportType summary confidenceScore createdAt')
  ]);

  const confidenceDistribution = await AiReport.aggregate([
    {
      $bucket: {
        groupBy: '$confidenceScore',
        boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        default: 'Other',
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);

  res.json({
    totalReports,
    reportTypeStats,
    confidenceStats: confidenceStats[0] || {},
    confidenceDistribution,
    recentReports
  });
}));

// Get high-confidence recommendations
router.get('/analytics/recommendations', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const minConfidence = parseFloat(req.query.minConfidence as string) || 0.7;
  const reportType = req.query.reportType as string;

  const filter: any = {
    confidenceScore: { $gte: minConfidence }
  };
  if (reportType) filter.reportType = reportType;

  const recommendations = await AiReport.find(filter)
    .sort({ confidenceScore: -1, createdAt: -1 })
    .select('reportType summary recommendations confidenceScore createdAt generatedForType generatedForId');

  res.json({
    recommendations,
    filter: { minConfidence, reportType }
  });
}));

export default router;



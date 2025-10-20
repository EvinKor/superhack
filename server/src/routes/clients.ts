import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateClient, validateClientUpdate, validateObjectId, validatePagination } from '../middleware/validation';
import { Client } from '../models/Client';
import { logger } from '../utils/logger';

const router = Router();

// Get all clients
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const status = req.query.status as string;
  const industry = req.query.industry as string;
  const search = req.query.search as string;

  // Build filter object
  const filter: any = {};
  if (status) filter.status = status;
  if (industry) filter.industry = new RegExp(industry, 'i');
  if (search) {
    filter.$or = [
      { clientName: new RegExp(search, 'i') },
      { contactPerson: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { industry: new RegExp(search, 'i') }
    ];
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    Client.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Client.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    clients,
    pagination: {
      currentPage: page,
      totalPages,
      totalClients: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

// Get client by ID
router.get('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findById(req.params.id);
  
  if (!client) {
    return res.status(404).json({
      error: 'Client not found',
      details: 'Client with the specified ID does not exist'
    });
  }

  res.json({ client });
}));

// Create new client
router.post('/', authenticate, authorizeAllRoles, validateClient, asyncHandler(async (req: Request, res: Response) => {
  const client = new Client({
    ...req.body,
    createdBy: req.user!.email
  });

  await client.save();

  logger.info(`New client created by ${req.user!.email}: ${client.clientName}`);

  res.status(201).json({
    message: 'Client created successfully',
    client
  });
}));

// Update client
router.put('/:id', authenticate, authorizeAllRoles, validateObjectId, validateClientUpdate, asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!client) {
    return res.status(404).json({
      error: 'Client not found',
      details: 'Client with the specified ID does not exist'
    });
  }

  logger.info(`Client updated by ${req.user!.email}: ${client.clientName}`);

  res.json({
    message: 'Client updated successfully',
    client
  });
}));

// Delete client
router.delete('/:id', authenticate, authorizeAllRoles, validateObjectId, asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  
  if (!client) {
    return res.status(404).json({
      error: 'Client not found',
      details: 'Client with the specified ID does not exist'
    });
  }

  logger.info(`Client deleted by ${req.user!.email}: ${client.clientName}`);

  res.json({
    message: 'Client deleted successfully'
  });
}));

// Get client statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const [totalClients, statusStats, industryStats] = await Promise.all([
    Client.countDocuments(),
    Client.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Client.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const recentClients = await Client.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('clientName industry status contactPerson createdAt');

  res.json({
    totalClients,
    statusStats,
    industryStats,
    recentClients
  });
}));

// Get clients by industry
router.get('/industry/:industry', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { industry } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filter = { industry: new RegExp(industry, 'i') };
  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    clients,
    industry,
    pagination: {
      currentPage: page,
      totalPages,
      totalClients: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
}));

export default router;



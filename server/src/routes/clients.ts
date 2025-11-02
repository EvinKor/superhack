import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateClient, validateClientUpdate, validatePagination } from '../middleware/validation';
import { ClientInsert, ClientUpdate } from '../models/Client';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Get all clients
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const status = req.query.status as string;
  const industry = req.query.industry as string;
  const search = req.query.search as string;

  // Build query
  let query = supabase.from(Tables.CLIENTS).select('*', { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (industry) {
    query = query.ilike('industry', `%${industry}%`);
  }
  if (search) {
    query = query.or(`client_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,industry.ilike.%${search}%`);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: clients, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    clients: clients || [],
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
router.get('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: client, error } = await supabase
    .from(Tables.CLIENTS)
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Client not found',
        details: 'Client with the specified ID does not exist'
      });
    }
    throw error;
  }

  res.json({ client });
}));

// Create new client
router.post('/', authenticate, authorizeAllRoles, validateClient, asyncHandler(async (req: Request, res: Response) => {
  const newClient: ClientInsert = {
    client_name: req.body.clientName.trim(),
    industry: req.body.industry.trim(),
    contact_person: req.body.contactPerson.trim(),
    email: req.body.email.toLowerCase().trim(),
    phone: req.body.phone.trim(),
    status: req.body.status || 'active',
    created_by: req.user!.email,
    created_at: new Date().toISOString()
  };

  const { data: client, error } = await supabase
    .from(Tables.CLIENTS)
    .insert(newClient)
    .select()
    .single();

  if (error) {
    throw error;
  }

  logger.info(`New client created by ${req.user!.email}: ${client.client_name}`);

  res.status(201).json({
    message: 'Client created successfully',
    client
  });
}));

// Update client
router.put('/:id', authenticate, authorizeAllRoles, validateClientUpdate, asyncHandler(async (req: Request, res: Response) => {
  const updates: ClientUpdate = {};

  if (req.body.clientName) updates.client_name = req.body.clientName.trim();
  if (req.body.industry) updates.industry = req.body.industry.trim();
  if (req.body.contactPerson) updates.contact_person = req.body.contactPerson.trim();
  if (req.body.email) updates.email = req.body.email.toLowerCase().trim();
  if (req.body.phone) updates.phone = req.body.phone.trim();
  if (req.body.status) updates.status = req.body.status;

  const { data: client, error } = await supabase
    .from(Tables.CLIENTS)
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Client not found',
        details: 'Client with the specified ID does not exist'
      });
    }
    throw error;
  }

  logger.info(`Client updated by ${req.user!.email}: ${client.client_name}`);

  res.json({
    message: 'Client updated successfully',
    client
  });
}));

// Delete client
router.delete('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: client, error: selectError } = await supabase
    .from(Tables.CLIENTS)
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Client not found',
        details: 'Client with the specified ID does not exist'
      });
    }
    throw selectError;
  }

  const { error: deleteError } = await supabase
    .from(Tables.CLIENTS)
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    throw deleteError;
  }

  logger.info(`Client deleted by ${req.user!.email}: ${client.client_name}`);

  res.json({
    message: 'Client deleted successfully'
  });
}));

// Get client statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  // Get total clients count
  const { count: totalClients, error: countError } = await supabase
    .from(Tables.CLIENTS)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  // Get status stats - need to manually aggregate
  const { data: allClients, error: allError } = await supabase
    .from(Tables.CLIENTS)
    .select('status, industry');

  if (allError) {
    throw allError;
  }

  // Calculate status stats
  const statusMap = new Map<string, number>();
  const industryMap = new Map<string, number>();

  allClients?.forEach((client: any) => {
    // Status stats
    statusMap.set(client.status, (statusMap.get(client.status) || 0) + 1);
    // Industry stats
    industryMap.set(client.industry, (industryMap.get(client.industry) || 0) + 1);
  });

  const statusStats = Array.from(statusMap.entries())
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count);

  const industryStats = Array.from(industryMap.entries())
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent clients
  const { data: recentClients, error: recentError } = await supabase
    .from(Tables.CLIENTS)
    .select('id, client_name, industry, status, contact_person, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) {
    throw recentError;
  }

  res.json({
    totalClients: totalClients || 0,
    statusStats,
    industryStats,
    recentClients: recentClients || []
  });
}));

// Get clients by industry
router.get('/industry/:industry', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { industry } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: clients, error, count } = await supabase
    .from(Tables.CLIENTS)
    .select('*', { count: 'exact' })
    .ilike('industry', `%${industry}%`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    clients: clients || [],
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

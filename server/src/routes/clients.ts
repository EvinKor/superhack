import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validatePagination } from '../middleware/validation';
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

  // Transform snake_case to camelCase for frontend
  const transformedClients = clients?.map(client => ({
    _id: client.id,
    id: client.id,
    clientName: client.client_name,
    industry: client.industry,
    contactPerson: client.contact_person,
    email: client.email,
    phone: client.phone,
    status: client.status,
    tier: client.tier,
    contractValue: client.contract_value,
    contractStartDate: client.contract_start_date,
    contractEndDate: client.contract_end_date,
    address: client.address,
    primaryContact: client.primary_contact,
    notes: client.notes,
    createdBy: client.created_by,
    createdAt: client.created_at
  })) || [];

  res.json({
    clients: transformedClients,
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

  // Transform snake_case to camelCase for frontend
  const transformedClient = {
    _id: client.id,
    id: client.id,
    clientName: client.client_name,
    industry: client.industry,
    contactPerson: client.contact_person,
    email: client.email,
    phone: client.phone,
    status: client.status,
    tier: client.tier,
    contractValue: client.contract_value,
    contractStartDate: client.contract_start_date,
    contractEndDate: client.contract_end_date,
    address: client.address,
    primaryContact: client.primary_contact,
    notes: client.notes,
    createdBy: client.created_by,
    createdAt: client.created_at
  };

  res.json({ client: transformedClient });
}));

// Create new client
router.post('/', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  // Log incoming data for debugging
  logger.info('Received client creation request:', JSON.stringify(req.body, null, 2));
  
  // Support multiple frontend formats
  const clientName = req.body.clientName || req.body.company || req.body.name;
  const contactPerson = req.body.contactPerson || req.body.primaryContact?.name || req.body.name || 'Contact Person';
  const email = req.body.email || req.body.primaryContact?.email;
  const phone = req.body.phone || req.body.primaryContact?.phone || '000-000-0000';
  
  logger.info(`Parsed fields - clientName: ${clientName}, contactPerson: ${contactPerson}, email: ${email}, phone: ${phone}`);
  
  if (!clientName || !email) {
    logger.error('Missing required fields', { clientName, email });
    return res.status(400).json({
      error: 'Missing required fields',
      details: 'Company name and email are required',
      received: {
        hasClientName: !!clientName,
        hasEmail: !!email,
        hasPhone: !!phone,
        hasContactPerson: !!contactPerson
      }
    });
  }

  // Map frontend status values to Supabase values
  const statusMap: { [key: string]: 'active' | 'inactive' } = {
    'active': 'active',
    'inactive': 'inactive',
    'prospect': 'active',      // Map prospect to active
    'churned': 'inactive',     // Map churned to inactive
    'onboarding': 'active'     // Map onboarding to active
  };
  
  const mappedStatus = statusMap[req.body.status] || 'active';

  const newClient: ClientInsert = {
    client_name: clientName.trim(),
    industry: (req.body.industry || 'General').trim(),
    contact_person: contactPerson.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    status: mappedStatus,
    created_by: req.user!.email,
    created_at: new Date().toISOString(),
    // Additional fields from frontend
    tier: req.body.tier || 'bronze',
    contract_value: req.body.contractValue || 0,
    contract_start_date: req.body.contractStartDate || null,
    contract_end_date: req.body.contractEndDate || null,
    address: req.body.address || null,
    primary_contact: req.body.primaryContact || null,
    notes: req.body.notes || null
  };

  const { data: client, error } = await supabase
    .from(Tables.CLIENTS)
    .insert(newClient)
    .select()
    .single();

  if (error) {
    logger.error('Supabase insert error:', error);
    return res.status(500).json({
      error: 'Database error',
      details: error.message,
      hint: error.hint,
      code: error.code
    });
  }

  logger.info(`New client created by ${req.user!.email}: ${client.client_name}`);

  // Transform snake_case to camelCase for frontend
  const transformedClient = {
    _id: client.id,
    id: client.id,
    clientName: client.client_name,
    industry: client.industry,
    contactPerson: client.contact_person,
    email: client.email,
    phone: client.phone,
    status: client.status,
    tier: client.tier,
    contractValue: client.contract_value,
    contractStartDate: client.contract_start_date,
    contractEndDate: client.contract_end_date,
    address: client.address,
    primaryContact: client.primary_contact,
    notes: client.notes,
    createdBy: client.created_by,
    createdAt: client.created_at
  };

  res.status(201).json({
    message: 'Client created successfully',
    client: transformedClient
  });
}));

// Update client
router.put('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const updates: ClientUpdate = {};

  // Support both old and new frontend formats
  const clientName = req.body.clientName || req.body.company || req.body.name;
  const contactPerson = req.body.contactPerson || req.body.primaryContact?.name;
  const email = req.body.email || req.body.primaryContact?.email;
  const phone = req.body.phone || req.body.primaryContact?.phone;

  // Map frontend status values to Supabase values
  const statusMap: { [key: string]: 'active' | 'inactive' } = {
    'active': 'active',
    'inactive': 'inactive',
    'prospect': 'active',
    'churned': 'inactive',
    'onboarding': 'active'
  };

  if (clientName) updates.client_name = clientName.trim();
  if (req.body.industry) updates.industry = req.body.industry.trim();
  if (contactPerson) updates.contact_person = contactPerson.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (phone) updates.phone = phone.trim();
  if (req.body.status) updates.status = statusMap[req.body.status] || 'active';
  if (req.body.tier) updates.tier = req.body.tier;
  if (req.body.contractValue !== undefined) updates.contract_value = req.body.contractValue;
  if (req.body.contractStartDate) updates.contract_start_date = req.body.contractStartDate;
  if (req.body.contractEndDate) updates.contract_end_date = req.body.contractEndDate;
  if (req.body.address) updates.address = req.body.address;
  if (req.body.primaryContact) updates.primary_contact = req.body.primaryContact;
  if (req.body.notes) updates.notes = req.body.notes;

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

  // Transform snake_case to camelCase for frontend
  const transformedClient = {
    _id: client.id,
    id: client.id,
    clientName: client.client_name,
    industry: client.industry,
    contactPerson: client.contact_person,
    email: client.email,
    phone: client.phone,
    status: client.status,
    tier: client.tier,
    contractValue: client.contract_value,
    contractStartDate: client.contract_start_date,
    contractEndDate: client.contract_end_date,
    address: client.address,
    primaryContact: client.primary_contact,
    notes: client.notes,
    createdBy: client.created_by,
    createdAt: client.created_at
  };

  res.json({
    message: 'Client updated successfully',
    client: transformedClient
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

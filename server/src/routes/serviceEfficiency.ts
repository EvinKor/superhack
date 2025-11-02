import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validatePagination, validateServiceEfficiency } from '../middleware/validation';
import { ServiceEfficiencyInsert, ServiceEfficiencyUpdate } from '../models/ServiceEfficiency';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Get all service efficiency records
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const technicianId = req.query.technicianId as string;
  const clientId = req.query.clientId as string;
  const week = req.query.week as string;

  // Build query with joins
  let query = supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select(`
      *,
      technician:technician_id (
        id,
        name,
        email,
        role
      ),
      client:client_id (
        id,
        client_name,
        industry
      )
    `, { count: 'exact' });

  // Apply filters
  if (technicianId) {
    query = query.eq('technician_id', technicianId);
  }
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  if (week) {
    query = query.eq('week', week);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: efficiencyRecords, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    efficiencyRecords: efficiencyRecords || [],
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
router.get('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: efficiencyRecord, error } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select(`
      *,
      technician:technician_id (
        id,
        name,
        email,
        role,
        company
      ),
      client:client_id (
        id,
        client_name,
        industry,
        contact_person,
        email
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Service efficiency record not found',
        details: 'Service efficiency record with the specified ID does not exist'
      });
    }
    throw error;
  }

  res.json({ efficiencyRecord });
}));

// Create new service efficiency record
router.post('/', authenticate, authorizeAllRoles, validateServiceEfficiency, asyncHandler(async (req: Request, res: Response) => {
  // Verify technician exists
  const { data: technician, error: techError } = await supabase
    .from(Tables.USERS)
    .select('id, name')
    .eq('id', req.body.technicianId)
    .single();

  if (techError || !technician) {
    return res.status(400).json({
      error: 'Technician not found',
      details: 'The specified technician does not exist'
    });
  }

  // Verify client exists
  const { data: client, error: clientError } = await supabase
    .from(Tables.CLIENTS)
    .select('id')
    .eq('id', req.body.clientId)
    .single();

  if (clientError || !client) {
    return res.status(400).json({
      error: 'Client not found',
      details: 'The specified client does not exist'
    });
  }

  // Check for duplicate
  const { data: existing, error: checkError } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select('id')
    .eq('technician_id', req.body.technicianId)
    .eq('client_id', req.body.clientId)
    .eq('week', req.body.week)
    .limit(1);

  if (checkError) {
    throw checkError;
  }

  if (existing && existing.length > 0) {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'Service efficiency record for this technician, client, and week already exists'
    });
  }

  const newRecord: ServiceEfficiencyInsert = {
    technician_id: req.body.technicianId,
    client_id: req.body.clientId,
    tasks_completed: req.body.tasksCompleted,
    avg_response_time: req.body.avgResponseTime,
    avg_resolution_time: req.body.avgResolutionTime,
    ai_suggestions: req.body.aiSuggestions || [],
    week: req.body.week,
    created_at: new Date().toISOString()
  };

  const { data: efficiencyRecord, error: insertError } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .insert(newRecord)
    .select(`
      *,
      technician:technician_id (
        name,
        email,
        role
      ),
      client:client_id (
        client_name,
        industry
      )
    `)
    .single();

  if (insertError) {
    throw insertError;
  }

  logger.info(`New service efficiency record created by ${req.user!.email} for technician ${technician.name}`);

  res.status(201).json({
    message: 'Service efficiency record created successfully',
    efficiencyRecord
  });
}));

// Update service efficiency record
router.put('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const updates: ServiceEfficiencyUpdate = {};

  if (req.body.technicianId) updates.technician_id = req.body.technicianId;
  if (req.body.clientId) updates.client_id = req.body.clientId;
  if (req.body.tasksCompleted !== undefined) updates.tasks_completed = req.body.tasksCompleted;
  if (req.body.avgResponseTime !== undefined) updates.avg_response_time = req.body.avgResponseTime;
  if (req.body.avgResolutionTime !== undefined) updates.avg_resolution_time = req.body.avgResolutionTime;
  if (req.body.aiSuggestions) updates.ai_suggestions = req.body.aiSuggestions;
  if (req.body.week) updates.week = req.body.week;

  const { data: efficiencyRecord, error } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .update(updates)
    .eq('id', req.params.id)
    .select(`
      *,
      technician:technician_id (
        name,
        email,
        role
      ),
      client:client_id (
        client_name,
        industry
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Service efficiency record not found',
        details: 'Service efficiency record with the specified ID does not exist'
      });
    }
    throw error;
  }

  logger.info(`Service efficiency record updated by ${req.user!.email}: ${efficiencyRecord.id}`);

  res.json({
    message: 'Service efficiency record updated successfully',
    efficiencyRecord
  });
}));

// Delete service efficiency record
router.delete('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: record, error: selectError } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Service efficiency record not found',
        details: 'Service efficiency record with the specified ID does not exist'
      });
    }
    throw selectError;
  }

  const { error: deleteError } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    throw deleteError;
  }

  logger.info(`Service efficiency record deleted by ${req.user!.email}: ${record.id}`);

  res.json({
    message: 'Service efficiency record deleted successfully'
  });
}));

// Get technician performance analytics
router.get('/analytics/technician-performance', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const technicianId = req.query.technicianId as string;

  let query = supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select(`
      *,
      technician:technician_id (
        id,
        name,
        email,
        role
      )
    `);

  if (technicianId) {
    query = query.eq('technician_id', technicianId);
  }

  const { data: records, error } = await query;

  if (error) {
    throw error;
  }

  // Group and calculate stats
  const techMap = new Map();
  records?.forEach((record: any) => {
    const techId = record.technician_id;
    if (!techMap.has(techId)) {
      techMap.set(techId, {
        _id: techId,
        technicianName: record.technician?.name || 'Unknown',
        technicianEmail: record.technician?.email || '',
        technicianRole: record.technician?.role || '',
        totalTasks: 0,
        totalResponseTime: 0,
        totalResolutionTime: 0,
        totalWeeks: 0
      });
    }
    const tech = techMap.get(techId);
    tech.totalTasks += record.tasks_completed;
    tech.totalResponseTime += record.avg_response_time;
    tech.totalResolutionTime += record.avg_resolution_time;
    tech.totalWeeks++;
  });

  const performance = Array.from(techMap.values()).map(tech => ({
    ...tech,
    avgResponseTime: tech.totalResponseTime / tech.totalWeeks,
    avgResolutionTime: tech.totalResolutionTime / tech.totalWeeks,
    efficiencyScore: (tech.totalResponseTime + tech.totalResolutionTime) / tech.totalWeeks
  })).sort((a, b) => a.efficiencyScore - b.efficiencyScore);

  res.json({ performance });
}));

// Get weekly performance trends
router.get('/analytics/weekly-trends', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const technicianId = req.query.technicianId as string;
  const clientId = req.query.clientId as string;

  let query = supabase.from(Tables.SERVICE_EFFICIENCY).select('*');

  if (technicianId) {
    query = query.eq('technician_id', technicianId);
  }
  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: records, error } = await query;

  if (error) {
    throw error;
  }

  // Group by week
  const weekMap = new Map();
  records?.forEach((record: any) => {
    const week = record.week;
    if (!weekMap.has(week)) {
      weekMap.set(week, {
        _id: week,
        totalTasks: 0,
        totalResponseTime: 0,
        totalResolutionTime: 0,
        recordCount: 0
      });
    }
    const weekData = weekMap.get(week);
    weekData.totalTasks += record.tasks_completed;
    weekData.totalResponseTime += record.avg_response_time;
    weekData.totalResolutionTime += record.avg_resolution_time;
    weekData.recordCount++;
  });

  const trends = Array.from(weekMap.values())
    .map(week => ({
      _id: week._id,
      totalTasks: week.totalTasks,
      avgResponseTime: week.totalResponseTime / week.recordCount,
      avgResolutionTime: week.totalResolutionTime / week.recordCount,
      recordCount: week.recordCount
    }))
    .sort((a, b) => a._id.localeCompare(b._id));

  res.json({ trends });
}));

// Get service efficiency overview statistics
router.get('/stats/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: allRecords, error, count } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select('*', { count: 'exact' });

  if (error) {
    throw error;
  }

  const totalRecords = count || 0;

  // Calculate performance stats
  const performanceStats: any = {
    avgResponseTime: 0,
    avgResolutionTime: 0,
    totalTasks: 0,
    avgTasksPerWeek: 0
  };

  if (allRecords && allRecords.length > 0) {
    performanceStats.totalTasks = allRecords.reduce((sum, r: any) => sum + r.tasks_completed, 0);
    performanceStats.avgResponseTime = allRecords.reduce((sum, r: any) => sum + r.avg_response_time, 0) / allRecords.length;
    performanceStats.avgResolutionTime = allRecords.reduce((sum, r: any) => sum + r.avg_resolution_time, 0) / allRecords.length;
    performanceStats.avgTasksPerWeek = performanceStats.totalTasks / allRecords.length;
  }

  // Calculate top performers
  const techMap = new Map();
  allRecords?.forEach((record: any) => {
    const techId = record.technician_id;
    if (!techMap.has(techId)) {
      techMap.set(techId, {
        totalTasks: 0,
        responseTimes: [],
        resolutionTimes: []
      });
    }
    const tech = techMap.get(techId);
    tech.totalTasks += record.tasks_completed;
    tech.responseTimes.push(record.avg_response_time);
    tech.resolutionTimes.push(record.avg_resolution_time);
  });

  const topTechIds = Array.from(techMap.entries())
    .map(([id, stats]) => ({
      id,
      totalTasks: stats.totalTasks,
      avgResponseTime: stats.responseTimes.reduce((s: number, t: number) => s + t, 0) / stats.responseTimes.length,
      avgResolutionTime: stats.resolutionTimes.reduce((s: number, t: number) => s + t, 0) / stats.resolutionTimes.length,
      efficiencyScore: (stats.responseTimes.reduce((s: number, t: number) => s + t, 0) + stats.resolutionTimes.reduce((s: number, t: number) => s + t, 0)) / stats.responseTimes.length
    }))
    .sort((a, b) => a.efficiencyScore - b.efficiencyScore)
    .slice(0, 5);

  // Get technician names
  const techIds = topTechIds.map(t => t.id);
  let topPerformers: any[] = [];
  
  if (techIds.length > 0) {
    const { data: technicians } = await supabase
      .from(Tables.USERS)
      .select('id, name')
      .in('id', techIds);

    topPerformers = topTechIds.map(tech => {
      const technician = technicians?.find((t: any) => t.id === tech.id);
      return {
        _id: tech.id,
        technicianName: technician?.name || 'Unknown',
        totalTasks: tech.totalTasks,
        avgResponseTime: tech.avgResponseTime,
        avgResolutionTime: tech.avgResolutionTime,
        efficiencyScore: tech.efficiencyScore
      };
    });
  }

  res.json({
    totalRecords,
    performanceStats,
    topPerformers
  });
}));

// Get dashboard overview
router.get('/dashboard/overview', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period as string || 'monthly';
  
  // Calculate date ranges
  const now = new Date();
  let startDate = new Date();
  let previousStartDate = new Date();
  
  switch(period) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousStartDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      previousStartDate.setDate(previousStartDate.getDate() - 14);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      previousStartDate.setMonth(previousStartDate.getMonth() - 2);
      break;
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - 3);
      previousStartDate.setMonth(previousStartDate.getMonth() - 6);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
      break;
  }

  const { data: allRecords, error } = await supabase
    .from(Tables.SERVICE_EFFICIENCY)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  
  const currentRecords = allRecords?.filter(record => 
    new Date(record.created_at) >= startDate
  ) || [];
  
  const previousRecords = allRecords?.filter(record => 
    new Date(record.created_at) >= previousStartDate && 
    new Date(record.created_at) < startDate
  ) || [];

  const calculateStats = (records: any[]) => {
    if (records.length === 0) {
      return {
        tasksCompleted: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        totalRecords: 0
      };
    }
    
    return {
      tasksCompleted: records.reduce((sum, r) => sum + (r.tasks_completed || 0), 0),
      avgResponseTime: Math.round((records.reduce((sum, r) => sum + (r.avg_response_time || 0), 0) / records.length) * 10) / 10,
      avgResolutionTime: Math.round((records.reduce((sum, r) => sum + (r.avg_resolution_time || 0), 0) / records.length) * 10) / 10,
      totalRecords: records.length
    };
  };

  const current = calculateStats(currentRecords);
  const previous = calculateStats(previousRecords);

  const calculateTrend = (currentVal: number, previousVal: number) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const trends = {
    tasksCompleted: calculateTrend(current.tasksCompleted, previous.tasksCompleted),
    avgResponseTime: calculateTrend(current.avgResponseTime, previous.avgResponseTime),
    avgResolutionTime: calculateTrend(current.avgResolutionTime, previous.avgResolutionTime)
  };

  const aiSuggestions = currentRecords
    .filter(record => record.ai_suggestions && record.ai_suggestions.length > 0)
    .slice(0, 5)
    .flatMap(record => record.ai_suggestions)
    .slice(0, 5)
    .map((suggestion, index) => ({
      title: `Efficiency Improvement ${index + 1}`,
      description: suggestion,
      impact: 'medium',
      confidence: 70 + Math.floor(Math.random() * 25),
      status: 'pending'
    }));

  res.json({
    current: {
      ...current,
      aiSuggestions
    },
    trends,
    period
  });
}));

export default router;

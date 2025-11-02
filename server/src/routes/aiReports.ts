import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateAiReport, validatePagination } from '../middleware/validation';
import { AiReportInsert, AiReportUpdate } from '../models/AiReport';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Get all AI reports
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const reportType = req.query.reportType as string;
  const generatedForType = req.query.generatedForType as string;
  const generatedForId = req.query.generatedForId as string;

  // Build query
  let query = supabase.from(Tables.AI_REPORTS).select('*', { count: 'exact' });

  // Apply filters
  if (reportType) {
    query = query.eq('report_type', reportType);
  }
  if (generatedForType) {
    query = query.eq('generated_for_type', generatedForType);
  }
  if (generatedForId) {
    query = query.eq('generated_for_id', generatedForId);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: reports, error, count } = await query;

  if (error) {
    throw error;
  }

  // Populate target information
  const populatedReports = await Promise.all(
    (reports || []).map(async (report: any) => {
      let targetInfo = null;
      
      if (report.generated_for_type === 'client') {
        const { data: client } = await supabase
          .from(Tables.CLIENTS)
          .select('id, client_name, industry')
          .eq('id', report.generated_for_id)
          .single();
        targetInfo = client;
      } else if (report.generated_for_type === 'user') {
        const { data: user } = await supabase
          .from(Tables.USERS)
          .select('id, name, email, role')
          .eq('id', report.generated_for_id)
          .single();
        targetInfo = user;
      }

      return {
        ...report,
        target: targetInfo
      };
    })
  );

  const total = count || 0;
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
router.get('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: report, error } = await supabase
    .from(Tables.AI_REPORTS)
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'AI report not found',
        details: 'AI report with the specified ID does not exist'
      });
    }
    throw error;
  }

  // Populate target information
  let targetInfo = null;
  if (report.generated_for_type === 'client') {
    const { data: client } = await supabase
      .from(Tables.CLIENTS)
      .select('id, client_name, industry, contact_person, email')
      .eq('id', report.generated_for_id)
      .single();
    targetInfo = client;
  } else if (report.generated_for_type === 'user') {
    const { data: user } = await supabase
      .from(Tables.USERS)
      .select('id, name, email, role, company')
      .eq('id', report.generated_for_id)
      .single();
    targetInfo = user;
  }

  res.json({
    report: {
      ...report,
      target: targetInfo
    }
  });
}));

// Create new AI report
router.post('/', authenticate, authorizeAllRoles, validateAiReport, asyncHandler(async (req: Request, res: Response) => {
  // Verify target exists
  let targetExists = false;
  if (req.body.generatedForType === 'client') {
    const { data: client, error } = await supabase
      .from(Tables.CLIENTS)
      .select('id')
      .eq('id', req.body.generatedForId)
      .single();
    targetExists = !!client && !error;
  } else if (req.body.generatedForType === 'user') {
    const { data: user, error } = await supabase
      .from(Tables.USERS)
      .select('id')
      .eq('id', req.body.generatedForId)
      .single();
    targetExists = !!user && !error;
  }

  if (!targetExists) {
    return res.status(400).json({
      error: 'Target not found',
      details: `The specified ${req.body.generatedForType} does not exist`
    });
  }

  const newReport: AiReportInsert = {
    report_type: req.body.reportType,
    generated_for_id: req.body.generatedForId,
    generated_for_type: req.body.generatedForType,
    summary: req.body.summary,
    recommendations: req.body.recommendations || [],
    confidence_score: req.body.confidenceScore,
    created_at: new Date().toISOString()
  };

  const { data: report, error: insertError } = await supabase
    .from(Tables.AI_REPORTS)
    .insert(newReport)
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  logger.info(`New AI report created by ${req.user!.email}: ${report.report_type}`);

  res.status(201).json({
    message: 'AI report created successfully',
    report
  });
}));

// Update AI report
router.put('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const updates: AiReportUpdate = {};

  if (req.body.reportType) updates.report_type = req.body.reportType;
  if (req.body.generatedForId) updates.generated_for_id = req.body.generatedForId;
  if (req.body.generatedForType) updates.generated_for_type = req.body.generatedForType;
  if (req.body.summary) updates.summary = req.body.summary;
  if (req.body.recommendations) updates.recommendations = req.body.recommendations;
  if (req.body.confidenceScore !== undefined) updates.confidence_score = req.body.confidenceScore;

  const { data: report, error } = await supabase
    .from(Tables.AI_REPORTS)
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'AI report not found',
        details: 'AI report with the specified ID does not exist'
      });
    }
    throw error;
  }

  logger.info(`AI report updated by ${req.user!.email}: ${report.id}`);

  res.json({
    message: 'AI report updated successfully',
    report
  });
}));

// Delete AI report
router.delete('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: report, error: selectError } = await supabase
    .from(Tables.AI_REPORTS)
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'AI report not found',
        details: 'AI report with the specified ID does not exist'
      });
    }
    throw selectError;
  }

  const { error: deleteError } = await supabase
    .from(Tables.AI_REPORTS)
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    throw deleteError;
  }

  logger.info(`AI report deleted by ${req.user!.email}: ${report.id}`);

  res.json({
    message: 'AI report deleted successfully'
  });
}));

// Get AI reports by target
router.get('/target/:type/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!['client', 'user'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid target type',
      details: 'Target type must be client or user'
    });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: reports, error, count } = await supabase
    .from(Tables.AI_REPORTS)
    .select('*', { count: 'exact' })
    .eq('generated_for_type', type)
    .eq('generated_for_id', id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    reports: reports || [],
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
  const { data: allReports, error, count } = await supabase
    .from(Tables.AI_REPORTS)
    .select('*', { count: 'exact' });

  if (error) {
    throw error;
  }

  const totalReports = count || 0;

  // Calculate stats
  const reportTypeMap = new Map();
  let totalConfidence = 0;
  let maxConfidence = 0;
  let minConfidence = 1;
  const confidenceBuckets = { low: 0, medium: 0, high: 0, veryHigh: 0 };

  allReports?.forEach((report: any) => {
    // Report type stats
    reportTypeMap.set(report.report_type, (reportTypeMap.get(report.report_type) || 0) + 1);
    
    // Confidence stats
    totalConfidence += report.confidence_score;
    maxConfidence = Math.max(maxConfidence, report.confidence_score);
    minConfidence = Math.min(minConfidence, report.confidence_score);
    
    // Confidence distribution
    if (report.confidence_score < 0.2) confidenceBuckets.low++;
    else if (report.confidence_score < 0.4) confidenceBuckets.medium++;
    else if (report.confidence_score < 0.6) confidenceBuckets.medium++;
    else if (report.confidence_score < 0.8) confidenceBuckets.high++;
    else confidenceBuckets.veryHigh++;
  });

  const reportTypeStats = Array.from(reportTypeMap.entries()).map(([_id, count]) => ({ _id, count }));
  const avgConfidence = allReports && allReports.length > 0 ? totalConfidence / allReports.length : 0;

  // Get recent reports
  const { data: recentReports, error: recentError } = await supabase
    .from(Tables.AI_REPORTS)
    .select('id, report_type, summary, confidence_score, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) {
    throw recentError;
  }

  res.json({
    totalReports,
    reportTypeStats,
    confidenceStats: {
      avgConfidence,
      maxConfidence: allReports && allReports.length > 0 ? maxConfidence : 0,
      minConfidence: allReports && allReports.length > 0 ? minConfidence : 0
    },
    confidenceDistribution: Object.entries(confidenceBuckets).map(([key, count]) => ({ _id: key, count })),
    recentReports: recentReports || []
  });
}));

// Get high-confidence recommendations
router.get('/analytics/recommendations', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const minConfidence = parseFloat(req.query.minConfidence as string) || 0.7;
  const reportType = req.query.reportType as string;

  let query = supabase
    .from(Tables.AI_REPORTS)
    .select('id, report_type, summary, recommendations, confidence_score, created_at, generated_for_type, generated_for_id')
    .gte('confidence_score', minConfidence)
    .order('confidence_score', { ascending: false })
    .order('created_at', { ascending: false });

  if (reportType) {
    query = query.eq('report_type', reportType);
  }

  const { data: recommendations, error } = await query;

  if (error) {
    throw error;
  }

  res.json({
    recommendations: recommendations || [],
    filter: { minConfidence, reportType }
  });
}));

// Get dashboard insights
router.get('/dashboard/insights', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  // Get recent reports
  const { data: recentReports, error: recentError } = await supabase
    .from(Tables.AI_REPORTS)
    .select('id, report_type, summary, confidence_score, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentError) {
    throw recentError;
  }

  // Get all reports for aggregation
  const { data: allReports, error: allError } = await supabase
    .from(Tables.AI_REPORTS)
    .select('*');

  if (allError) {
    throw allError;
  }

  // Calculate reports by type
  const typeMap = new Map();
  let totalConfidence = 0;

  allReports?.forEach((report: any) => {
    typeMap.set(report.report_type, (typeMap.get(report.report_type) || 0) + 1);
    totalConfidence += report.confidence_score;
  });

  const reportsByType = Array.from(typeMap.entries()).map(([_id, count]) => ({
    _id,
    count,
    avgConfidence: allReports?.filter((r: any) => r.report_type === _id)
      .reduce((sum: number, r: any) => sum + r.confidence_score, 0) / count
  })).sort((a, b) => b.count - a.count);

  // Get high-priority insights
  const { data: highPriorityInsights, error: highError } = await supabase
    .from(Tables.AI_REPORTS)
    .select('id, report_type, summary, recommendations, confidence_score, created_at')
    .gte('confidence_score', 0.8)
    .order('confidence_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  if (highError) {
    throw highError;
  }

  const totalReports = allReports?.length || 0;
  const avgConfidence = totalReports > 0 ? totalConfidence / totalReports : 0;

  const formattedReports = recentReports?.map(report => ({
    _id: report.id,
    title: `${report.report_type} Report`,
    summary: report.summary,
    type: report.report_type,
    confidenceScore: report.confidence_score,
    createdAt: report.created_at
  })) || [];

  const formattedInsights = highPriorityInsights?.map(report => ({
    _id: report.id,
    title: `${report.report_type} - High Priority`,
    description: report.summary,
    recommendations: report.recommendations || [],
    confidence: Math.round(report.confidence_score * 100),
    priority: report.confidence_score >= 0.9 ? 'critical' : 'high',
    createdAt: report.created_at
  })) || [];

  res.json({
    totalReports,
    avgConfidence,
    recentReports: formattedReports,
    reportsByType,
    highPriorityInsights: formattedInsights
  });
}));

export default router;

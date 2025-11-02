import { Request, Response, Router } from 'express';
import { authenticate, authorizeAllRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateFinancialInsight, validatePagination } from '../middleware/validation';
import { FinancialInsightInsert, FinancialInsightUpdate } from '../models/FinancialInsight';
import { logger } from '../utils/logger';
import { supabase, Tables } from '../utils/supabase';

const router = Router();

// Get all financial insights
router.get('/', authenticate, authorizeAllRoles, validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as string) || 'desc';
  const clientId = req.query.clientId as string;
  const month = req.query.month as string;

  // Build query with client join
  let query = supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select(`
      *,
      clients:client_id (
        id,
        client_name,
        industry
      )
    `, { count: 'exact' });

  // Apply filters
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  if (month) {
    query = query.eq('month', month);
  }

  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: insights, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    insights: insights || [],
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
router.get('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: insight, error } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select(`
      *,
      clients:client_id (
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
        error: 'Financial insight not found',
        details: 'Financial insight with the specified ID does not exist'
      });
    }
    throw error;
  }

  res.json({ insight });
}));

// Create new financial insight
router.post('/', authenticate, authorizeAllRoles, validateFinancialInsight, asyncHandler(async (req: Request, res: Response) => {
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

  // Check for duplicate month for this client
  const { data: existingInsights, error: checkError } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select('id')
    .eq('client_id', req.body.clientId)
    .eq('month', req.body.month)
    .limit(1);

  if (checkError) {
    throw checkError;
  }

  if (existingInsights && existingInsights.length > 0) {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'Financial insight for this client and month already exists'
    });
  }

  const newInsight: FinancialInsightInsert = {
    client_id: req.body.clientId,
    month: req.body.month,
    revenue: req.body.revenue,
    expenses: req.body.expenses,
    profit_margin: req.body.profitMargin,
    spend_breakdown: {
      software_licenses: req.body.spendBreakdown.softwareLicenses,
      hardware_maintenance: req.body.spendBreakdown.hardwareMaintenance,
      cloud_services: req.body.spendBreakdown.cloudServices,
      labor_costs: req.body.spendBreakdown.laborCosts
    },
    ai_recommendations: req.body.aiRecommendations || [],
    created_at: new Date().toISOString()
  };

  const { data: insight, error: insertError } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .insert(newInsight)
    .select(`
      *,
      clients:client_id (
        client_name,
        industry
      )
    `)
    .single();

  if (insertError) {
    throw insertError;
  }

  logger.info(`New financial insight created by ${req.user!.email} for client ${req.body.clientId}`);

  res.status(201).json({
    message: 'Financial insight created successfully',
    insight
  });
}));

// Update financial insight
router.put('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const updates: FinancialInsightUpdate = {};

  if (req.body.clientId) updates.client_id = req.body.clientId;
  if (req.body.month) updates.month = req.body.month;
  if (req.body.revenue !== undefined) updates.revenue = req.body.revenue;
  if (req.body.expenses !== undefined) updates.expenses = req.body.expenses;
  if (req.body.profitMargin !== undefined) updates.profit_margin = req.body.profitMargin;
  if (req.body.spendBreakdown) {
    updates.spend_breakdown = {
      software_licenses: req.body.spendBreakdown.softwareLicenses,
      hardware_maintenance: req.body.spendBreakdown.hardwareMaintenance,
      cloud_services: req.body.spendBreakdown.cloudServices,
      labor_costs: req.body.spendBreakdown.laborCosts
    };
  }
  if (req.body.aiRecommendations) updates.ai_recommendations = req.body.aiRecommendations;

  const { data: insight, error } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .update(updates)
    .eq('id', req.params.id)
    .select(`
      *,
      clients:client_id (
        client_name,
        industry
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Financial insight not found',
        details: 'Financial insight with the specified ID does not exist'
      });
    }
    throw error;
  }

  logger.info(`Financial insight updated by ${req.user!.email}: ${insight.id}`);

  res.json({
    message: 'Financial insight updated successfully',
    insight
  });
}));

// Delete financial insight
router.delete('/:id', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const { data: insight, error: selectError } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Financial insight not found',
        details: 'Financial insight with the specified ID does not exist'
      });
    }
    throw selectError;
  }

  const { error: deleteError } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    throw deleteError;
  }

  logger.info(`Financial insight deleted by ${req.user!.email}: ${insight.id}`);

  res.json({
    message: 'Financial insight deleted successfully'
  });
}));

// Get profit margin trends per client
router.get('/analytics/profit-trends', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.query.clientId as string;
  const months = parseInt(req.query.months as string) || 12;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startMonth = startDate.toISOString().substring(0, 7);

  let query = supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select(`
      *,
      clients:client_id (
        id,
        client_name
      )
    `)
    .gte('month', startMonth)
    .order('month', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: insights, error } = await query;

  if (error) {
    throw error;
  }

  // Group by client
  const clientMap = new Map();
  insights?.forEach((insight: any) => {
    const cid = insight.client_id;
    if (!clientMap.has(cid)) {
      clientMap.set(cid, {
        _id: cid,
        clientName: insight.clients?.client_name || 'Unknown',
        months: [],
        totalRevenue: 0,
        totalExpenses: 0
      });
    }
    const client = clientMap.get(cid);
    client.months.push({
      month: insight.month,
      revenue: insight.revenue,
      expenses: insight.expenses,
      profitMargin: insight.profit_margin,
      profitAmount: insight.revenue - insight.expenses
    });
    client.totalRevenue += insight.revenue;
    client.totalExpenses += insight.expenses;
  });

  const trends = Array.from(clientMap.values()).map(client => ({
    ...client,
    avgProfitMargin: client.months.reduce((sum: number, m: any) => sum + m.profitMargin, 0) / client.months.length
  })).sort((a, b) => b.avgProfitMargin - a.avgProfitMargin);

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
  // Get all insights
  const { data: allInsights, error, count } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select('*', { count: 'exact' });

  if (error) {
    throw error;
  }

  const totalInsights = count || 0;

  // Calculate stats manually
  const revenueStats = {
    totalRevenue: 0,
    avgRevenue: 0,
    maxRevenue: 0,
    minRevenue: Infinity
  };

  const profitStats = {
    avgProfitMargin: 0,
    maxProfitMargin: -Infinity,
    minProfitMargin: Infinity
  };

  allInsights?.forEach((insight: any) => {
    revenueStats.totalRevenue += insight.revenue;
    revenueStats.maxRevenue = Math.max(revenueStats.maxRevenue, insight.revenue);
    revenueStats.minRevenue = Math.min(revenueStats.minRevenue, insight.revenue);
    profitStats.maxProfitMargin = Math.max(profitStats.maxProfitMargin, insight.profit_margin);
    profitStats.minProfitMargin = Math.min(profitStats.minProfitMargin, insight.profit_margin);
  });

  if (allInsights && allInsights.length > 0) {
    revenueStats.avgRevenue = revenueStats.totalRevenue / allInsights.length;
    profitStats.avgProfitMargin = allInsights.reduce((sum: number, i: any) => sum + i.profit_margin, 0) / allInsights.length;
  } else {
    revenueStats.minRevenue = 0;
  }

  // Get top clients by revenue
  const clientRevenueMap = new Map();
  allInsights?.forEach((insight: any) => {
    const cid = insight.client_id;
    if (!clientRevenueMap.has(cid)) {
      clientRevenueMap.set(cid, { totalRevenue: 0, profitMargins: [] });
    }
    const client = clientRevenueMap.get(cid);
    client.totalRevenue += insight.revenue;
    client.profitMargins.push(insight.profit_margin);
  });

  // Get client details for top clients
  const topClientIds = Array.from(clientRevenueMap.entries())
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
    .slice(0, 5)
    .map(([id]) => id);

  let topClients: any[] = [];
  if (topClientIds.length > 0) {
    const { data: clients } = await supabase
      .from(Tables.CLIENTS)
      .select('id, client_name')
      .in('id', topClientIds);

    topClients = topClientIds.map(id => {
      const client = clients?.find((c: any) => c.id === id);
      const stats = clientRevenueMap.get(id);
      return {
        _id: id,
        clientName: client?.client_name || 'Unknown',
        totalRevenue: stats.totalRevenue,
        avgProfitMargin: stats.profitMargins.reduce((sum: number, pm: number) => sum + pm, 0) / stats.profitMargins.length
      };
    });
  }

  res.json({
    totalInsights,
    revenueStats,
    profitStats,
    topClients
  });
}));

// Get monthly financial summary
router.get('/analytics/monthly-summary', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const year = req.query.year as string || new Date().getFullYear().toString();
  const clientId = req.query.clientId as string;

  let query = supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select('*')
    .like('month', `${year}%`);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: insights, error } = await query;

  if (error) {
    throw error;
  }

  // Group by month
  const monthMap = new Map();
  insights?.forEach((insight: any) => {
    const month = insight.month;
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        _id: month,
        totalRevenue: 0,
        totalExpenses: 0,
        profitMargins: [],
        clientCount: 0
      });
    }
    const monthData = monthMap.get(month);
    monthData.totalRevenue += insight.revenue;
    monthData.totalExpenses += insight.expenses;
    monthData.profitMargins.push(insight.profit_margin);
    monthData.clientCount++;
  });

  const monthlyData = Array.from(monthMap.values())
    .map(month => ({
      _id: month._id,
      totalRevenue: month.totalRevenue,
      totalExpenses: month.totalExpenses,
      avgProfitMargin: month.profitMargins.reduce((sum: number, pm: number) => sum + pm, 0) / month.profitMargins.length,
      clientCount: month.clientCount
    }))
    .sort((a, b) => a._id.localeCompare(b._id));

  res.json({
    year,
    monthlyData
  });
}));

// Get dashboard summary - comprehensive financial overview
router.get('/dashboard/summary', authenticate, authorizeAllRoles, asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period as string || 'monthly';
  
  // Calculate date ranges based on period
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

  // Get all insights
  const { data: allInsights, error } = await supabase
    .from(Tables.FINANCIAL_INSIGHTS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  
  // Calculate current period stats
  const currentInsights = allInsights?.filter(insight => 
    new Date(insight.created_at) >= startDate
  ) || [];
  
  const previousInsights = allInsights?.filter(insight => 
    new Date(insight.created_at) >= previousStartDate && 
    new Date(insight.created_at) < startDate
  ) || [];

  const calculateStats = (insights: any[]) => {
    if (insights.length === 0) {
      return {
        revenue: { total: 0 },
        expenses: { total: 0 },
        netProfit: 0,
        profitMargin: 0
      };
    }
    
    const totalRevenue = insights.reduce((sum, i) => sum + (i.revenue || 0), 0);
    const totalExpenses = insights.reduce((sum, i) => sum + (i.expenses || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
    
    return {
      revenue: { total: totalRevenue },
      expenses: { total: totalExpenses },
      netProfit,
      profitMargin
    };
  };

  const current = calculateStats(currentInsights);
  const previous = calculateStats(previousInsights);

  // Calculate trends (percentage change)
  const calculateTrend = (currentVal: number, previousVal: number) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const trends = {
    revenue: calculateTrend(current.revenue.total, previous.revenue.total),
    expenses: calculateTrend(current.expenses.total, previous.expenses.total),
    profit: calculateTrend(current.netProfit, previous.netProfit)
  };

  // Get AI recommendations from recent insights
  const aiSuggestions = currentInsights
    .filter(insight => insight.ai_recommendations && insight.ai_recommendations.length > 0)
    .slice(0, 5)
    .flatMap(insight => insight.ai_recommendations)
    .map((recommendation, index) => ({
      title: `Recommendation ${index + 1}`,
      description: recommendation,
      potentialImpact: 'medium',
      confidence: 75 + Math.floor(Math.random() * 20),
      status: 'pending',
      estimatedSavings: Math.floor(Math.random() * 5000) + 1000
    }));

  // Simple forecasts based on current trends
  const forecastMultiplier = trends.revenue > 0 ? 1 + (trends.revenue / 100) : 1;
  const forecasts = {
    nextMonth: {
      revenue: Math.round(current.revenue.total * forecastMultiplier),
      expenses: Math.round(current.expenses.total * forecastMultiplier),
      profit: Math.round(current.netProfit * forecastMultiplier)
    },
    nextQuarter: {
      revenue: Math.round(current.revenue.total * forecastMultiplier * 3),
      expenses: Math.round(current.expenses.total * forecastMultiplier * 3),
      profit: Math.round(current.netProfit * forecastMultiplier * 3)
    }
  };

  res.json({
    current: {
      ...current,
      aiSuggestions,
      forecasts
    },
    trends,
    period
  });
}));

export default router;
